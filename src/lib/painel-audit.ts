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

/* ============================ Ping history ============================ */

const PING_HISTORY_KEY = "imp_painel_ping_history";
const PING_HISTORY_MAX = 200;

export type PingHistoryEntry = Ga4PingResult & {
  ts: number;
  host: string;
  path: string;
};

export function readPingHistory(): PingHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PING_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as PingHistoryEntry[]) : [];
  } catch { return []; }
}
export function clearPingHistory() {
  if (typeof window !== "undefined") window.localStorage.removeItem(PING_HISTORY_KEY);
}
function persistPing(entry: PingHistoryEntry) {
  if (typeof window === "undefined") return;
  try {
    const list = readPingHistory();
    list.push(entry);
    while (list.length > PING_HISTORY_MAX) list.shift();
    window.localStorage.setItem(PING_HISTORY_KEY, JSON.stringify(list));
  } catch { /* quota */ }
}

/* ============================ Legacy subdomain access log ============================ */

const LEGACY_LOG_KEY = "imp_legacy_subdomain_hits";
const LEGACY_LOG_MAX = 100;

export type LegacyHit = {
  ts: number;
  from_host: string;
  to_host: string;
  path: string;
  search: string;
  hash: string;
  ua: string;
};

export function logLegacySubdomainHit(hit: Omit<LegacyHit, "ts" | "ua"> & { ua?: string }) {
  if (typeof window === "undefined") return;
  const entry: LegacyHit = { ts: Date.now(), ua: hit.ua ?? navigator.userAgent, ...hit };
  try {
    const raw = window.localStorage.getItem(LEGACY_LOG_KEY);
    const list = raw ? (JSON.parse(raw) as LegacyHit[]) : [];
    list.push(entry);
    while (list.length > LEGACY_LOG_MAX) list.shift();
    window.localStorage.setItem(LEGACY_LOG_KEY, JSON.stringify(list));
  } catch { /* quota */ }
  // Também dispara evento GA4 para consolidação multi-usuário.
  import("@/lib/analytics").then(({ trackEvent }) => {
    trackEvent("legacy_subdomain_hit", entry as unknown as Record<string, unknown>);
  }).catch(() => { /* noop */ });
  // Persistência real no Supabase (fire-and-forget) — consolida hits de
  // qualquer navegador em `painel_legacy_hits`. Usa sendBeacon quando possível
  // para não bloquear o redirect subsequente.
  try {
    const payload = JSON.stringify({
      from_host: entry.from_host,
      to_host: entry.to_host,
      path: entry.path,
      search: entry.search,
      hash: entry.hash,
      ua: entry.ua,
      referer: typeof document !== "undefined" ? document.referrer : undefined,
      ts: entry.ts,
    });
    const url = "/api/public/painel/legacy-hit";
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      void fetch(url, {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: payload,
      }).catch(() => { /* noop */ });
    }
  } catch { /* noop */ }
}
export function readLegacyHits(): LegacyHit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_LOG_KEY);
    return raw ? (JSON.parse(raw) as LegacyHit[]) : [];
  } catch { return []; }
}
export function clearLegacyHits() {
  if (typeof window !== "undefined") window.localStorage.removeItem(LEGACY_LOG_KEY);
}

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

  const result: Ga4PingResult = {
    ok,
    ga_id: diag.ga_id,
    gtag_ready: diag.gtag_ready,
    consent_analytics: Boolean(diag.consent?.analytics),
    network_hit,
    ping_id,
    message,
    details,
  };
  try {
    persistPing({
      ...result,
      ts: Date.now(),
      host: typeof window !== "undefined" ? window.location.hostname : "",
      path: typeof window !== "undefined" ? window.location.pathname : "",
    });
  } catch { /* noop */ }
  return result;
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

/* ============================ Funnel + Legacy combined export ============================ */

export type CombinedExportRow = {
  kind: "funnel_event" | "legacy_hit";
  ts: number;
  iso: string;
  host: string;
  path: string;
  session_id: string;
  visitor_id: string;
  event: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  href: string;
  ua: string;
  extra: string;
};

function utmFromHref(href: string | undefined): Record<string, string> {
  const empty = { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "" };
  if (!href || typeof href !== "string") return empty;
  try {
    const u = new URL(href, "https://colors.impulsionando.com.br");
    return {
      utm_source: u.searchParams.get("utm_source") ?? "",
      utm_medium: u.searchParams.get("utm_medium") ?? "",
      utm_campaign: u.searchParams.get("utm_campaign") ?? "",
      utm_content: u.searchParams.get("utm_content") ?? "",
      utm_term: u.searchParams.get("utm_term") ?? "",
    };
  } catch { return empty; }
}

/** Junta eventos de funil (localStorage) + hits ao subdomínio legado num único
 *  CSV, filtrando por período e host, com colunas UTM já explodidas. */
export function buildCombinedFunnelLegacyCsv(opts: {
  events: LocalEvent[];
  hits: LegacyHit[];
  hostFilter?: string; // "" = todos
  periodStart?: number; // epoch ms, inclusive
  periodEnd?: number;   // epoch ms, inclusive
}): { csv: string; count: number } {
  const { events, hits, hostFilter = "", periodStart = 0, periodEnd = Number.POSITIVE_INFINITY } = opts;
  const rows: CombinedExportRow[] = [];

  for (const e of events) {
    if (e.ts < periodStart || e.ts > periodEnd) continue;
    const p = (e.params ?? {}) as Record<string, unknown>;
    const href = typeof p.href === "string" ? p.href : "";
    const utm = utmFromHref(href);
    const host = (typeof p.host === "string" && p.host)
      ? p.host
      : (typeof window !== "undefined" ? window.location.hostname : "");
    if (hostFilter && host !== hostFilter) continue;
    rows.push({
      kind: "funnel_event",
      ts: e.ts,
      iso: new Date(e.ts).toISOString(),
      host,
      path: typeof p.path === "string" ? p.path : "",
      session_id: e.session_id,
      visitor_id: e.visitor_id,
      event: e.name,
      utm_source: (typeof p.utm_source === "string" ? p.utm_source : "") || utm.utm_source,
      utm_medium: (typeof p.utm_medium === "string" ? p.utm_medium : "") || utm.utm_medium,
      utm_campaign: (typeof p.utm_campaign === "string" ? p.utm_campaign : "") || utm.utm_campaign,
      utm_content: (typeof p.utm_content === "string" ? p.utm_content : "") || utm.utm_content,
      utm_term: (typeof p.utm_term === "string" ? p.utm_term : "") || utm.utm_term,
      href,
      ua: "",
      extra: JSON.stringify(p),
    });
  }

  for (const h of hits) {
    if (h.ts < periodStart || h.ts > periodEnd) continue;
    if (hostFilter && h.from_host !== hostFilter && h.to_host !== hostFilter) continue;
    const utm = utmFromHref(`https://${h.to_host}${h.path}${h.search}${h.hash}`);
    rows.push({
      kind: "legacy_hit",
      ts: h.ts,
      iso: new Date(h.ts).toISOString(),
      host: h.from_host,
      path: `${h.path}${h.search}${h.hash}`,
      session_id: "",
      visitor_id: "",
      event: "legacy_subdomain_hit",
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      href: `https://${h.to_host}${h.path}${h.search}${h.hash}`,
      ua: h.ua,
      extra: "",
    });
  }

  rows.sort((a, b) => a.ts - b.ts);

  const cols: (keyof CombinedExportRow)[] = [
    "kind", "iso", "ts", "host", "path", "session_id", "visitor_id", "event",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "href", "ua", "extra",
  ];
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(","));
  return { csv: [header, ...body].join("\n"), count: rows.length };
}

/* ============================ Simulated consolidation (placeholder) ============================ */

/** Consolida — em memória, apenas com dados locais — uma prévia do que virá
 *  quando os endpoints server-side existirem: funil por tenant + hits legados
 *  por host. Enquanto não há persistência, tudo vem do localStorage deste
 *  navegador. */
export type SimulatedConsolidation = {
  generated_at: number;
  source: "localStorage (simulado)";
  tenants: Array<{
    tenant: string;
    sessions: number;
    cta_click: number;
    checkout_click: number;
    lead_submit: number;
    conversion_rate: number;
  }>;
  legacy_by_host: Array<{ host: string; hits: number; last_hit: number }>;
};

export function buildSimulatedConsolidation(events: LocalEvent[], hits: LegacyHit[]): SimulatedConsolidation {
  // Tenant é inferido do host atual (localStorage é por origem). Placeholder até
  // o endpoint server-side agregar de todos os navegadores por company_id.
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "unknown";
  const tenant = currentHost.split(".")[0] || currentHost;
  const sessions = new Set<string>();
  let cta = 0, co = 0, lead = 0;
  const bySession = new Map<string, Set<string>>();
  for (const e of events) {
    sessions.add(e.session_id);
    if (!bySession.has(e.session_id)) bySession.set(e.session_id, new Set());
    bySession.get(e.session_id)!.add(e.name);
  }
  for (const set of bySession.values()) {
    if (set.has("cta_click")) cta++;
    if (set.has("checkout_click")) co++;
    if (set.has("lead_submit")) lead++;
  }
  const legacyMap = new Map<string, { hits: number; last_hit: number }>();
  for (const h of hits) {
    const row = legacyMap.get(h.from_host) ?? { hits: 0, last_hit: 0 };
    row.hits += 1;
    if (h.ts > row.last_hit) row.last_hit = h.ts;
    legacyMap.set(h.from_host, row);
  }
  return {
    generated_at: Date.now(),
    source: "localStorage (simulado)",
    tenants: [{
      tenant,
      sessions: sessions.size,
      cta_click: cta,
      checkout_click: co,
      lead_submit: lead,
      conversion_rate: cta > 0 ? Math.round((co / cta) * 1000) / 10 : 0,
    }],
    legacy_by_host: Array.from(legacyMap.entries())
      .map(([host, v]) => ({ host, ...v }))
      .sort((a, b) => b.hits - a.hits),
  };
}
