/**
 * Analytics client-side para o site Colors Saúde (FRONT-END).
 * Usa o wrapper unificado GA4 do core (`src/lib/analytics.ts`), que respeita
 * Consent Mode v2 e é inicializado no root. Nenhum backend envolvido.
 *
 * ENV: `VITE_GA4_MEASUREMENT_ID` (mesmo ID usado pelo site principal).
 */

import { trackEvent } from "./analytics";

export function track(event: string, params: Record<string, unknown> = {}) {
  trackEvent(event, { site: "colors", ...params });
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
