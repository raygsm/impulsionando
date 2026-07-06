/**
 * Event-tracking padronizado para CTAs do funil (Home → Diagnóstico → Demo).
 *
 * - Cada visita ganha um `traceId` (sessionStorage) que amarra quiz → nicho → demo.
 * - `trackFunnelCta` emite um evento estruturado com `alias_resolvido`,
 *   `isFallback` e `rotaDestino`, encaminhado para `window.dataLayer`
 *   (Analytics), `console.debug` (auditoria) e um rolling buffer local
 *   (`impulsionando:funnel-events`) para inspeção rápida em QA.
 *
 * Uso:
 *   const link = getDemoNichoLink(nicho);
 *   <Link
 *     to={link.to}
 *     params={link.params}
 *     onClick={() => trackFunnelCta({
 *       cta: "diag-ver-demo",
 *       nicho_pedido: nicho,
 *       alias_resolvido: link.slug,
 *       isFallback: link.isFallback,
 *       rotaDestino: `/demo/nicho/${link.slug}`,
 *     })}
 *   >
 */

const TRACE_KEY = "impulsionando:funnel-trace-id";
const BUFFER_KEY = "impulsionando:funnel-events";
const BUFFER_MAX = 60;

export type FunnelCtaEvent = {
  /** Identificador do CTA no funil (diag-ver-demo, showroom-abrir-demo, etc.) */
  cta: string;
  /** Origem opcional (home, showroom, nichos, hub-demo, quiz…) */
  origem?: string;
  /** Nicho pedido pelo usuário (bruto, sem normalizar) */
  nicho_pedido?: string;
  /** Slug após resolveDemoNicho */
  alias_resolvido: string;
  /** true quando o resolver caiu no default por não encontrar alias */
  isFallback: boolean;
  /** Rota TanStack de destino, ex.: /demo/nicho/saude */
  rotaDestino: string;
  /** Metadados extras (plan, dores, foco, etc.) */
  extra?: Record<string, unknown>;
};

export type FunnelEnvelope = FunnelCtaEvent & {
  event: "funnel_cta";
  traceId: string;
  at: string;
  path?: string;
};

export function getFunnelTraceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.sessionStorage.getItem(TRACE_KEY);
    if (existing) return existing;
    const fresh = `trc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(TRACE_KEY, fresh);
    return fresh;
  } catch {
    return "no-storage";
  }
}

export function trackFunnelCta(evt: FunnelCtaEvent): FunnelEnvelope {
  const envelope: FunnelEnvelope = {
    event: "funnel_cta",
    traceId: getFunnelTraceId(),
    at: new Date().toISOString(),
    path: typeof window !== "undefined" ? window.location?.pathname : undefined,
    ...evt,
  };
  if (typeof window !== "undefined") {
    // dataLayer (GTM/GA)
    const w = window as unknown as { dataLayer?: unknown[] };
    if (!Array.isArray(w.dataLayer)) w.dataLayer = [];
    w.dataLayer.push(envelope);

    // Buffer local para QA/inspeção
    try {
      const raw = window.localStorage.getItem(BUFFER_KEY);
      const arr: FunnelEnvelope[] = raw ? JSON.parse(raw) : [];
      arr.unshift(envelope);
      window.localStorage.setItem(BUFFER_KEY, JSON.stringify(arr.slice(0, BUFFER_MAX)));
    } catch { /* ignore */ }
  }
  // console.debug para observabilidade — sem poluir warn
  // eslint-disable-next-line no-console
  console.debug("[funnel-cta]", envelope);
  return envelope;
}

export function readFunnelEventsBuffer(): FunnelEnvelope[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as FunnelEnvelope[]) : [];
  } catch { return []; }
}
