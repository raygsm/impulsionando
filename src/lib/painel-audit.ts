/**
 * Utilitários de auditoria de analytics para o /colors/painel:
 *  - pingGa4()           → dispara um evento sintético `painel_ping` no GA4
 *                          e retorna um resumo com o que aconteceu.
 *  - parseGa4Csv()       → lê o CSV exportado do GA4 (Exploração) e devolve
 *                          linhas normalizadas por utm_campaign.
 *  - aggregateWeekly()   → agrega o buffer local por (semana ISO, utm_campaign)
 *                          calculando cliques em CTA/checkout/lead + taxa de
 *                          conversão. Serializa em CSV para auditoria.
 */

import type { LocalEvent } from "@/lib/colors-analytics";

/* ============================ GA4 ping ============================ */

export type Ga4PingResult = {
  ok: boolean;
  ga_id: string;
  gtag_ready: boolean;
  consent_analytics: boolean;
  network_hit: boolean;
  ping_id: string;
  message: string;
  details: string[];
};

export async function pingGa4(): Promise<Ga4PingResult> {
  const details: string[] = [];
  const ping_id = `ping_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { getAnalyticsDiagnostic, trackEvent } = await import("@/lib/analytics");
  const diag = getAnalyticsDiagnostic();
  details.push(`Measurement ID: ${diag.ga_id || "ausente"}`);
  details.push(`gtag.js pronto: ${diag.gtag_ready ? "sim" : "não"}`);
  details.push(`Consent analytics: ${diag.consent?.analytics ? "granted" : "denied"}`);

  // Detecta se um hit sai para o endpoint /g/collect do GA4 nos próximos 2s.
  let network_hit = false;
  const origFetch = window.fetch;
  const origSendBeacon = navigator.sendBeacon?.bind(navigator);
  const spy = (url: string | URL | Request) => {
    const s = typeof url === "string" ? url : url.toString();
    if (/google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/.test(s)) {
      network_hit = true;
    }
  };
  window.fetch = function patchedFetch(...args) {
    try { spy(args[0] as string); } catch { /* noop */ }
    return origFetch.apply(this, args as Parameters<typeof fetch>);
  };
  if (origSendBeacon) {
    navigator.sendBeacon = function patchedBeacon(url: string | URL, data?: BodyInit | null) {
      try { spy(url); } catch { /* noop */ }
      return origSendBeacon(url, data);
    };
  }

  trackEvent("painel_ping", { ping_id, at: new Date().toISOString() });

  await new Promise((r) => setTimeout(r, 2200));
  window.fetch = origFetch;
  if (origSendBeacon) navigator.sendBeacon = origSendBeacon;

  details.push(`Hit HTTP p/ GA4 detectado: ${network_hit ? "SIM ✅" : "NÃO ⚠️"}`);

  const ok = Boolean(diag.ga_id && diag.gtag_ready && diag.consent?.analytics && network_hit);
  const message = ok
    ? "GA4 recebeu o ping. Se o evento não aparecer no relatório em tempo real, verifique se o filtro por IP interno está desativado."
    : diag.blocking_reasons[0] ?? "Ping enviado ao dataLayer, mas nenhum hit HTTP foi detectado. Verifique adblock, extensões de privacidade ou consentimento LGPD.";

  return {
    ok,
    ga_id: diag.ga_id,
    gtag_ready: diag.gtag_ready,
    consent_analytics: Boolean(diag.consent?.analytics),
    network_hit,
    ping_id,
    message,
    details,
  };
}

/* ============================ GA4 CSV import ============================ */

export type Ga4CsvRow = {
  utm_campaign: string;
  sessions: number;
  users: number;
  events: number;
  conversions: number;
  conversion_rate: number;
};

/** Parser CSV tolerante — suporta o formato da UI do GA4 (com preâmbulo). */
export function parseGa4Csv(text: string): Ga4CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  // GA4 exporta um preâmbulo com "# Início:", "# Final:" etc. Pulamos até
  // achar uma linha que pareça cabeçalho (contém vírgula e um nome conhecido).
  const headerIdx = lines.findIndex((l) => /,/.test(l) && /utm|campaign|nome da campanha|sessions?|sess[õo]es|eventos?|events?/i.test(l));
  if (headerIdx < 0) return [];
  const header = splitCsvLine(lines[headerIdx]).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)));
  const iCampaign = idx(["utm_campaign", "campaign", "campanha"]);
  const iSessions = idx(["sessions", "sess"]);
  const iUsers = idx(["users", "usuários", "usuarios"]);
  const iEvents = idx(["events", "eventos", "contagem de eventos", "event count"]);
  const iConv = idx(["conversions", "conversões", "conversoes", "key events", "eventos principais"]);
  const iRate = idx(["conversion rate", "taxa de conversão", "taxa de conversao"]);

  const out: Ga4CsvRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (!cols.length) continue;
    const utm_campaign = (cols[iCampaign] ?? "").trim() || "(not set)";
    const sessions = parseNum(cols[iSessions]);
    const users = parseNum(cols[iUsers]);
    const events = parseNum(cols[iEvents]);
    const conversions = parseNum(cols[iConv]);
    const conversion_rate = iRate >= 0 ? parseNum(cols[iRate]) : (sessions > 0 ? (conversions / sessions) * 100 : 0);
    if (!utm_campaign && sessions === 0 && events === 0) continue;
    out.push({ utm_campaign, sessions, users, events, conversions, conversion_rate });
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { quoted = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') quoted = true;
      else if (ch === "," || ch === ";") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const s = v.replace(/["%\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/* ============================ Local aggregation ============================ */

export type LocalCampaignAgg = {
  utm_campaign: string;
  sessions: number;
  cta_click: number;
  checkout_click: number;
  whatsapp_click: number;
  ebook_download: number;
  lead_submit: number;
  conversion_rate: number; // checkout / cta
  lead_rate: number;       // lead / cta
};

function utmOf(e: LocalEvent): string {
  const p = e.params ?? {};
  const fromParam = (p as Record<string, unknown>).utm_campaign;
  if (typeof fromParam === "string" && fromParam) return fromParam;
  const href = (p as Record<string, unknown>).href;
  if (typeof href === "string") {
    try {
      const u = new URL(href, "https://colors.impulsionando.com.br");
      const c = u.searchParams.get("utm_campaign");
      if (c) return c;
    } catch { /* noop */ }
  }
  return "(none)";
}

export function aggregateByCampaign(events: LocalEvent[]): LocalCampaignAgg[] {
  const map = new Map<string, LocalCampaignAgg & { _sessions: Set<string> }>();
  const ensure = (k: string) => {
    let row = map.get(k);
    if (!row) {
      row = {
        utm_campaign: k, sessions: 0, cta_click: 0, checkout_click: 0,
        whatsapp_click: 0, ebook_download: 0, lead_submit: 0,
        conversion_rate: 0, lead_rate: 0, _sessions: new Set(),
      };
      map.set(k, row);
    }
    return row;
  };
  for (const e of events) {
    const row = ensure(utmOf(e));
    row._sessions.add(e.session_id);
    const key = e.name as keyof LocalCampaignAgg;
    if (key === "cta_click" || key === "checkout_click" || key === "whatsapp_click" || key === "ebook_download" || key === "lead_submit") {
      (row as unknown as Record<string, number>)[key] += 1;
    }
  }
  const out: LocalCampaignAgg[] = [];
  for (const row of map.values()) {
    row.sessions = row._sessions.size;
    row.conversion_rate = row.cta_click > 0 ? Math.round((row.checkout_click / row.cta_click) * 1000) / 10 : 0;
    row.lead_rate = row.cta_click > 0 ? Math.round((row.lead_submit / row.cta_click) * 1000) / 10 : 0;
    const { _sessions, ...clean } = row;
    void _sessions;
    out.push(clean);
  }
  out.sort((a, b) => b.checkout_click - a.checkout_click);
  return out;
}

/** ISO-week key (YYYY-Www) para agregação semanal. */
function isoWeek(ts: number): string {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type WeeklyRow = LocalCampaignAgg & { week: string };

export function aggregateWeekly(events: LocalEvent[]): WeeklyRow[] {
  const byWeek = new Map<string, LocalEvent[]>();
  for (const e of events) {
    const w = isoWeek(e.ts);
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(e);
  }
  const out: WeeklyRow[] = [];
  for (const [week, evs] of byWeek.entries()) {
    for (const row of aggregateByCampaign(evs)) {
      out.push({ week, ...row });
    }
  }
  out.sort((a, b) => a.week === b.week ? b.checkout_click - a.checkout_click : (a.week < b.week ? 1 : -1));
  return out;
}

function csvCell(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function weeklyToCsv(rows: WeeklyRow[]): string {
  const header = ["week", "utm_campaign", "sessions", "cta_click", "checkout_click", "whatsapp_click", "ebook_download", "lead_submit", "conversion_rate_%", "lead_rate_%"];
  const body = rows.map((r) => [
    r.week, r.utm_campaign, r.sessions, r.cta_click, r.checkout_click,
    r.whatsapp_click, r.ebook_download, r.lead_submit, r.conversion_rate, r.lead_rate,
  ].map(csvCell).join(","));
  return [header.join(","), ...body].join("\n");
}

/* ============================ Compare ============================ */

export type CompareRow = {
  utm_campaign: string;
  local_sessions: number;
  local_checkout: number;
  local_rate: number;
  ga_sessions: number;
  ga_conversions: number;
  ga_rate: number;
  delta_sessions: number;
  delta_rate: number;
};

export function compareLocalVsGa4(local: LocalCampaignAgg[], ga: Ga4CsvRow[]): CompareRow[] {
  const gaMap = new Map(ga.map((r) => [r.utm_campaign.toLowerCase(), r]));
  const keys = new Set<string>([
    ...local.map((r) => r.utm_campaign.toLowerCase()),
    ...ga.map((r) => r.utm_campaign.toLowerCase()),
  ]);
  const out: CompareRow[] = [];
  for (const k of keys) {
    const l = local.find((x) => x.utm_campaign.toLowerCase() === k);
    const g = gaMap.get(k);
    const local_sessions = l?.sessions ?? 0;
    const local_checkout = l?.checkout_click ?? 0;
    const local_rate = l?.conversion_rate ?? 0;
    const ga_sessions = g?.sessions ?? 0;
    const ga_conversions = g?.conversions ?? 0;
    const ga_rate = g?.conversion_rate ?? (ga_sessions > 0 ? (ga_conversions / ga_sessions) * 100 : 0);
    out.push({
      utm_campaign: l?.utm_campaign ?? g?.utm_campaign ?? k,
      local_sessions, local_checkout, local_rate,
      ga_sessions, ga_conversions,
      ga_rate: Math.round(ga_rate * 10) / 10,
      delta_sessions: local_sessions - ga_sessions,
      delta_rate: Math.round((local_rate - ga_rate) * 10) / 10,
    });
  }
  out.sort((a, b) => Math.abs(b.delta_sessions) - Math.abs(a.delta_sessions));
  return out;
}
