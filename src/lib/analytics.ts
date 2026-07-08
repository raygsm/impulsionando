// GA4 + Consent Mode v2, respeitando opt-in LGPD do Bloco 4.
// Eventos só são enviados quando o usuário aceitou "analytics" (e/ou "marketing").

import { readConsent, onConsentChange, type ConsentState } from "./consent";
import { getSessionId, getVisitorId } from "./session-id";

// ID público do GA4 do grupo Impulsionando — pode ficar em código.
// Sobrescreva definindo `VITE_GA4_MEASUREMENT_ID` em Workspace Settings → Build Secrets.
const GA_ID = ((import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined) ?? "G-TGG4HG3JDJ").trim();

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}


let initialized = false;
let scriptInjected = false;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // GA4 espera o `arguments` object — usamos array equivalente
  window.dataLayer.push(args);
}

function applyConsentMode(c: ConsentState | null) {
  if (typeof window === "undefined") return;
  const analytics = c?.analytics ? "granted" : "denied";
  const marketing = c?.marketing ? "granted" : "denied";
  // Consent Mode v2 — Google exige estes 6 signals
  gtag("consent", "update", {
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
    analytics_storage: analytics,
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

function injectGtagScript(id: string) {
  if (scriptInjected || typeof document === "undefined") return;
  scriptInjected = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  if (!GA_ID) {
    // Sem ID configurado: mantemos no-op silencioso (não bloqueia o app).
    initialized = true;
    return;
  }
  initialized = true;

  // 1) Defaults DENIED antes de qualquer hit — exigência do Consent Mode v2.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtagWrapper() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as unknown as unknown[]);
  };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    anonymize_ip: true,
    send_page_view: false, // disparamos manualmente em cada navegação
  });

  // 2) Carrega o gtag.js
  injectGtagScript(GA_ID);

  // 3) Aplica consentimento atual + reage a mudanças
  applyConsentMode(readConsent());
  onConsentChange((c) => applyConsentMode(c));
}

export function trackPageView(path: string, title?: string) {
  if (!GA_ID || typeof window === "undefined") return;
  const c = readConsent();
  if (!c?.analytics) return; // respeita opt-out
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const enriched = {
    ...params,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
  };
  // Sempre espelha no dataLayer — permite que GTM/Segment/tests capturem o evento
  // mesmo antes do consentimento GA4 ser aceito (o hit para o GA4 continua gated).
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...enriched });
  } catch { /* ignore */ }
  if (!GA_ID) return;
  const c = readConsent();
  if (!c?.analytics) return;
  window.gtag?.("event", name, enriched);
}

export const analyticsEnabled = Boolean(GA_ID);

/**
 * Diagnóstico do estado atual de analytics — usado no /colors/painel para
 * explicar por que eventos podem não aparecer no GA4.
 */
export function getAnalyticsDiagnostic() {
  const c = readConsent();
  const gaLoaded = typeof window !== "undefined"
    && typeof (window as unknown as { gtag?: unknown }).gtag === "function";
  const gaScriptTag = typeof document !== "undefined"
    && Boolean(document.querySelector('script[src*="googletagmanager.com/gtag/js"]'));
  const reasons: string[] = [];
  if (!GA_ID) reasons.push("VITE_GA4_MEASUREMENT_ID ausente");
  if (!c) reasons.push("Consentimento LGPD ainda não decidido pelo visitante");
  if (c && !c.analytics) reasons.push("Categoria 'analytics' negada pelo visitante");
  if (!gaLoaded) reasons.push("gtag.js ainda não carregou (verifique adblock / rede)");
  if (!gaScriptTag) reasons.push("Tag <script> do GA4 não foi injetada");
  return {
    ga_id: GA_ID,
    initialized,
    ga_script_injected: gaScriptTag,
    gtag_ready: gaLoaded,
    consent: c,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    events_will_reach_ga4: reasons.length === 0,
    blocking_reasons: reasons,
  };
}

