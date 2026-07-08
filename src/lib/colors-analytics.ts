/**
 * Analytics client-side para o site Colors Saúde (FRONT-END).
 * Usa o wrapper unificado GA4 do core (`src/lib/analytics.ts`), que respeita
 * Consent Mode v2 e é inicializado no root. Nenhum backend envolvido.
 *
 * Cada evento carrega `session_id` + `visitor_id` para permitir rastrear a
 * jornada (cta_click → checkout_click → lead_submit) e calcular conversão
 * fim-a-fim no /colors/painel.
 */

import { trackEvent } from "./analytics";
import { getSessionId, getVisitorId } from "./session-id";

export type LocalEvent = {
  name: string;
  params: Record<string, unknown>;
  ts: number;
  session_id: string;
  visitor_id: string;
};
const BUFFER_KEY = "colors_ga_debug_buffer";
const BUFFER_MAX = 500;
const REMOTE_ENDPOINT = "/api/public/painel/funnel-hit";
const REMOTE_EVENTS = new Set([
  "cta_click",
  "checkout_click",
  "whatsapp_click",
  "ebook_download",
  "lead_submit",
]);

function currentHost(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname;
}
function currentPath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

function extractUtmFromHref(href: unknown): Record<string, string> {
  if (typeof href !== "string") return {};
  try {
    const u = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://colors.impulsionando.com.br");
    return {
      utm_source: u.searchParams.get("utm_source") ?? "",
      utm_medium: u.searchParams.get("utm_medium") ?? "",
      utm_campaign: u.searchParams.get("utm_campaign") ?? "",
      utm_content: u.searchParams.get("utm_content") ?? "",
      utm_term: u.searchParams.get("utm_term") ?? "",
    };
  } catch { return {}; }
}

function pushLocal(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    const list: LocalEvent[] = raw ? JSON.parse(raw) : [];
    list.push({
      name,
      params,
      ts: Date.now(),
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
    });
    while (list.length > BUFFER_MAX) list.shift();
    window.localStorage.setItem(BUFFER_KEY, JSON.stringify(list));
  } catch { /* ignore quota */ }
}

/** Fire-and-forget: envia o evento para persistência real no Supabase.
 *  Usa `sendBeacon` quando disponível (não bloqueia navegação em CTAs). */
function pushRemote(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!REMOTE_EVENTS.has(name)) return;
  try {
    const utm = extractUtmFromHref((params as Record<string, unknown>).href);
    const payload = {
      event_name: name,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      host: (params as Record<string, unknown>).host as string ?? currentHost(),
      path: (params as Record<string, unknown>).path as string ?? currentPath(),
      href: (params as Record<string, unknown>).href as string ?? undefined,
      utm_source: (params as Record<string, unknown>).utm_source as string ?? utm.utm_source ?? undefined,
      utm_medium: (params as Record<string, unknown>).utm_medium as string ?? utm.utm_medium ?? undefined,
      utm_campaign: (params as Record<string, unknown>).utm_campaign as string ?? utm.utm_campaign ?? undefined,
      utm_content: (params as Record<string, unknown>).utm_content as string ?? utm.utm_content ?? undefined,
      utm_term: (params as Record<string, unknown>).utm_term as string ?? utm.utm_term ?? undefined,
      params,
      ts: Date.now(),
    };
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(REMOTE_ENDPOINT, blob);
      return;
    }
    void fetch(REMOTE_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body,
    }).catch(() => { /* noop */ });
  } catch { /* noop */ }
}

export function readColorsEventBuffer(): LocalEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    const list = raw ? (JSON.parse(raw) as LocalEvent[]) : [];
    // Retrocompat: eventos antigos sem session_id/visitor_id.
    return list.map((e) => ({
      ...e,
      session_id: e.session_id ?? "legacy",
      visitor_id: e.visitor_id ?? "legacy",
    }));
  } catch { return []; }
}

export function clearColorsEventBuffer() {
  if (typeof window !== "undefined") window.localStorage.removeItem(BUFFER_KEY);
}

export function track(event: string, params: Record<string, unknown> = {}) {
  const full = {
    site: "colors",
    host: currentHost(),
    path: currentPath(),
    ...params,
  };
  trackEvent(event, full);
  pushLocal(event, full);
  pushRemote(event, full);
}

export const colorsEvents = {
  checkoutClick: (product: string, platform: string, href: string) =>
    track("checkout_click", { product, platform, href }),
  whatsappClick: (origin: string) =>
    track("whatsapp_click", { origin }),
  ebookDownload: (email: string) =>
    track("ebook_download", { has_email: Boolean(email) }),
  ctaClick: (label: string, target: string) =>
    track("cta_click", { label, target }),
  leadSubmit: (source: string) =>
    track("lead_submit", { source }),
};

// Compat: componentes antigos podem chamar ensureGaInstalled(); agora é no-op
// porque a inicialização acontece no root via initAnalytics().
export function ensureGaInstalled() {
  /* no-op: unified via src/lib/analytics.ts (initAnalytics in root) */
}

/* ----------------------- CSV export utilities ----------------------- */

const CSV_COLUMNS = [
  "ts",
  "iso",
  "session_id",
  "visitor_id",
  "event",
  "product",
  "platform",
  "origin",
  "label",
  "target",
  "source",
  "href",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "raw_params",
] as const;

function csvCell(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function extractUtm(href: unknown): Record<string, string> {
  if (typeof href !== "string") return {};
  try {
    const u = new URL(href, "https://colors.impulsionando.com.br");
    return {
      utm_source: u.searchParams.get("utm_source") ?? "",
      utm_medium: u.searchParams.get("utm_medium") ?? "",
      utm_campaign: u.searchParams.get("utm_campaign") ?? "",
      utm_content: u.searchParams.get("utm_content") ?? "",
      utm_term: u.searchParams.get("utm_term") ?? "",
    };
  } catch { return {}; }
}

export function eventsToCsv(events: LocalEvent[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = events.map((e) => {
    const utm = extractUtm(e.params.href);
    const row: Record<string, unknown> = {
      ts: e.ts,
      iso: new Date(e.ts).toISOString(),
      session_id: e.session_id,
      visitor_id: e.visitor_id,
      event: e.name,
      product: e.params.product ?? "",
      platform: e.params.platform ?? "",
      origin: e.params.origin ?? "",
      label: e.params.label ?? "",
      target: e.params.target ?? "",
      source: e.params.source ?? "",
      href: e.params.href ?? "",
      ...utm,
      raw_params: e.params,
    };
    return CSV_COLUMNS.map((c) => csvCell(row[c])).join(",");
  });
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
