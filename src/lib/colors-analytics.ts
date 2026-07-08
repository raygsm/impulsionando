/**
 * Analytics client-side para o site Colors Saúde (FRONT-END).
 * Usa GA4 via gtag se `VITE_GA_MEASUREMENT_ID` estiver definido.
 * Sem env, os eventos viram no-op (com console.debug) — nenhum backend envolvido.
 */

type GaWindow = Window & {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
};


const GA_ID =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_GA_MEASUREMENT_ID) ||
  "";

let installed = false;

export function ensureGaInstalled() {
  if (typeof window === "undefined") return;
  if (installed || !GA_ID) return;
  installed = true;
  const w = window as unknown as GaWindow;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag(...args: unknown[]) {
    w.dataLayer.push(args);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID, { anonymize_ip: true });
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  ensureGaInstalled();
  const w = window as unknown as Partial<GaWindow>;
  if (w.gtag) {
    w.gtag("event", event, params);
  } else if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[colors-analytics]", event, params);
  }
}


export const colorsEvents = {
  checkoutClick: (product: string, platform: string, href: string) =>
    track("checkout_click", { product, platform, href, site: "colors" }),
  whatsappClick: (origin: string) =>
    track("whatsapp_click", { origin, site: "colors" }),
  ebookDownload: (email: string) =>
    track("ebook_download", { has_email: Boolean(email), site: "colors" }),
  ctaClick: (label: string, target: string) =>
    track("cta_click", { label, target, site: "colors" }),
  leadSubmit: (source: string) =>
    track("lead_submit", { source, site: "colors" }),
};
