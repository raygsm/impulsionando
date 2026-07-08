/**
 * Analytics client-side para o site Colors Saúde (FRONT-END).
 * Usa o wrapper unificado GA4 do core (`src/lib/analytics.ts`), que respeita
 * Consent Mode v2 e é inicializado no root. Nenhum backend envolvido.
 *
 * ENV: `VITE_GA4_MEASUREMENT_ID` (mesmo ID usado pelo site principal).
 */

import { trackEvent } from "./analytics";

type LocalEvent = { name: string; params: Record<string, unknown>; ts: number };
const BUFFER_KEY = "colors_ga_debug_buffer";
const BUFFER_MAX = 200;

function pushLocal(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    const list: LocalEvent[] = raw ? JSON.parse(raw) : [];
    list.push({ name, params, ts: Date.now() });
    while (list.length > BUFFER_MAX) list.shift();
    window.localStorage.setItem(BUFFER_KEY, JSON.stringify(list));
  } catch { /* ignore quota */ }
}

export function readColorsEventBuffer(): LocalEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as LocalEvent[]) : [];
  } catch { return []; }
}

export function clearColorsEventBuffer() {
  if (typeof window !== "undefined") window.localStorage.removeItem(BUFFER_KEY);
}

export function track(event: string, params: Record<string, unknown> = {}) {
  const full = { site: "colors", ...params };
  trackEvent(event, full);
  pushLocal(event, full);
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
