/**
 * Tracking padronizado do balão Impulsionito.
 *
 * Substitui usos históricos de `whatsapp_fab_click` quando a origem é o
 * assistente Impulsionito (não o WhatsApp comercial). Mantém compatibilidade
 * com o buffer usado por `whatsapp-cta.ts` gravando o evento como
 * `impulsionito_open` no localStorage.
 */

export type ImpulsionitoOrigin =
  | "home"
  | "planos"
  | "header"
  | "footer"
  | "contato-atalho"
  | "contato-sent"
  | "abrir-ticket"
  | "onboarding-help"
  | "central-ajuda"
  | "fab"
  | "impulsionito"
  | "unknown";

const KEY = "impulsionito_open_events_v1";
const MAX = 500;

export interface ImpulsionitoEvent {
  ts: number;
  origin: ImpulsionitoOrigin | string;
  path: string;
  ctx?: string;
}

export function trackImpulsionitoOpen(
  origin: ImpulsionitoOrigin | string,
  extra?: { path?: string; ctx?: string },
) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: ImpulsionitoEvent[] = raw ? JSON.parse(raw) : [];
    list.push({
      ts: Date.now(),
      origin,
      path: extra?.path ?? window.location.pathname,
      ctx: extra?.ctx,
    });
    if (list.length > MAX) list.splice(0, list.length - MAX);
    window.localStorage.setItem(KEY, JSON.stringify(list));
    // Dispatch para trackers externos (GA/PostHog) via evento custom.
    window.dispatchEvent(
      new CustomEvent("analytics:impulsionito_open", {
        detail: { origin, path: extra?.path, ctx: extra?.ctx },
      }),
    );
  } catch {
    /* storage cheia — ignora */
  }
}

/** Dispara o balão Impulsionito com origem padronizada. */
export function openImpulsionito(origin: ImpulsionitoOrigin | string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("impulsionito:open", { detail: { origin } }),
  );
}
