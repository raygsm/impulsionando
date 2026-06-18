/**
 * Canal oficial único — utilitários compartilhados.
 *
 * Mantém em um único lugar:
 *  - número/URL oficial do WhatsApp (21) 99307-5000
 *  - construção de links com UTM + origem + variante (A/B) para rastreio
 *  - rastreamento de cliques e submissões (GA + buffer local p/ painel)
 *  - validação de mensagens que tentem desviar a conversa para canais
 *    não oficiais (outros telefones, e-mails, redes sociais).
 */
import { trackEvent } from "@/lib/analytics";

export const OFFICIAL_WHATSAPP_PHONE_DISPLAY = "(21) 99307-5000";
export const OFFICIAL_WHATSAPP_PHONE_E164 = "+5521993075000";
export const OFFICIAL_WHATSAPP_DIGITS = "5521993075000";
export const OFFICIAL_EMAIL_DOMAIN = "impulsionando.com.br";

export type WhatsAppCTAVariant = "A" | "B" | "control" | string;

export interface WhatsAppLinkOptions {
  /** Onde o link aparece — usado em data-cta, GA e utm_content. */
  origin?: string;
  /** Rota/página onde o CTA está sendo renderizado. */
  path?: string;
  /** Variante para experimentos A/B. */
  variant?: WhatsAppCTAVariant;
  /** Campanha de marketing (utm_campaign). */
  campaign?: string;
  /** Mídia (utm_medium). Default: "whatsapp". */
  medium?: string;
  /** Fonte (utm_source). Default: "site_oficial". */
  source?: string;
}

function appendUTM(message: string, opts: WhatsAppLinkOptions): string {
  const utm = [
    `utm_source=${opts.source ?? "site_oficial"}`,
    `utm_medium=${opts.medium ?? "whatsapp"}`,
    opts.campaign ? `utm_campaign=${encodeURIComponent(opts.campaign)}` : `utm_campaign=canal_oficial`,
    opts.origin ? `utm_content=${encodeURIComponent(opts.origin)}` : undefined,
    opts.variant ? `utm_term=${encodeURIComponent(`v_${opts.variant}`)}` : undefined,
    opts.path ? `utm_path=${encodeURIComponent(opts.path)}` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");
  return `${message}\n\n— ${utm}`;
}

export function buildOfficialWhatsAppUrl(
  message?: string,
  opts: WhatsAppLinkOptions = {},
): string {
  const base = message?.trim() || "Olá! Vim pelo site oficial da Impulsionando.";
  const withUtm = appendUTM(base, opts);
  const url = new URL(`https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}`);
  url.searchParams.set("text", withUtm);
  // UTM também como query no link (alguns trackers leem só da URL).
  url.searchParams.set("utm_source", opts.source ?? "site_oficial");
  url.searchParams.set("utm_medium", opts.medium ?? "whatsapp");
  url.searchParams.set("utm_campaign", opts.campaign ?? "canal_oficial");
  if (opts.origin) url.searchParams.set("utm_content", opts.origin);
  if (opts.variant) url.searchParams.set("utm_term", `v_${opts.variant}`);
  return url.toString();
}

export type WhatsAppCTAEvent =
  | "whatsapp_cta_click"
  | "whatsapp_form_submit"
  | "whatsapp_fab_click"
  | "whatsapp_notice_click"
  | "whatsapp_cta_impression"
  | "whatsapp_cta_sent"; // retorno do WhatsApp (presumido envio)

const METRICS_KEY = "wa_official_metrics_v1";
const ALERTS_KEY = "wa_official_alerts_v1";
const PENDING_KEY = "wa_official_pending_v1";
const MAX_BUFFER = 1000;

export interface BufferedEvent {
  ts: number;
  event: WhatsAppCTAEvent;
  origin: string;
  path: string;
  variant?: string;
  campaign?: string;
  ctaText?: string;
  ctaHash?: string;
}

export interface AlertConfig {
  /** CTR mínimo (%). 0 desativa. */
  minCtr: number;
  /** Taxa de envio mínima (%). 0 desativa. */
  minSendRate: number;
  /** Janela em horas para o cálculo. */
  windowHours: number;
  /** Mínimo de amostras antes de validar. */
  minSamples: number;
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  minCtr: 5,
  minSendRate: 30,
  windowHours: 24,
  minSamples: 20,
};

/** Hash curto e determinístico do texto do CTA (versionamento automático). */
export function hashCtaText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).slice(0, 8);
}

function pushLocalBuffer(entry: BufferedEvent) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    const arr: BufferedEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > MAX_BUFFER) arr.splice(0, arr.length - MAX_BUFFER);
    window.localStorage.setItem(METRICS_KEY, JSON.stringify(arr));
  } catch {
    /* quota / privado — ignorar */
  }
}

export function readWhatsAppLocalMetrics(): BufferedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    return raw ? (JSON.parse(raw) as BufferedEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearWhatsAppLocalMetrics() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(METRICS_KEY);
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}

export function readAlertConfig(): AlertConfig {
  if (typeof window === "undefined") return DEFAULT_ALERT_CONFIG;
  try {
    const raw = window.localStorage.getItem(ALERTS_KEY);
    return raw ? { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(raw) } : DEFAULT_ALERT_CONFIG;
  } catch {
    return DEFAULT_ALERT_CONFIG;
  }
}

export function saveAlertConfig(cfg: AlertConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ALERTS_KEY, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

export interface AlertEval {
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  triggered: boolean;
}

export function evaluateAlerts(
  rows: BufferedEvent[],
  cfg: AlertConfig = readAlertConfig(),
): AlertEval {
  const since = Date.now() - cfg.windowHours * 3_600_000;
  const win = rows.filter((r) => r.ts >= since);
  const impressions = win.filter((r) => r.event === "whatsapp_cta_impression").length;
  const clicks = win.filter((r) =>
    ["whatsapp_cta_click", "whatsapp_fab_click", "whatsapp_notice_click"].includes(r.event),
  ).length;
  const sends = win.filter(
    (r) => r.event === "whatsapp_form_submit" || r.event === "whatsapp_cta_sent",
  ).length;
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const sendRate = clicks ? (sends / clicks) * 100 : 0;
  const ctrBelow = cfg.minCtr > 0 && impressions >= cfg.minSamples && ctr < cfg.minCtr;
  const sendBelow = cfg.minSendRate > 0 && clicks >= cfg.minSamples && sendRate < cfg.minSendRate;
  return { ctr, sendRate, impressions, clicks, sends, ctrBelow, sendBelow, triggered: ctrBelow || sendBelow };
}

export function trackWhatsAppCTA(
  event: WhatsAppCTAEvent,
  params: {
    origin: string;
    variant?: WhatsAppCTAVariant;
    campaign?: string;
    ctaText?: string;
    [key: string]: unknown;
  } = { origin: "unknown" },
) {
  const path =
    (params.path as string | undefined) ??
    (typeof window !== "undefined" ? window.location.pathname : "ssr");
  const variant = params.variant as string | undefined;
  const campaign = params.campaign as string | undefined;
  const ctaText = params.ctaText as string | undefined;
  const ctaHash = ctaText ? hashCtaText(ctaText) : (params.ctaHash as string | undefined);
  try {
    trackEvent(event, {
      channel: "whatsapp_official",
      phone: OFFICIAL_WHATSAPP_PHONE_DISPLAY,
      path,
      variant,
      campaign,
      cta_hash: ctaHash,
      ...params,
    });
  } catch {
    /* analytics opt-out ou falha — silencioso */
  }
  pushLocalBuffer({
    ts: Date.now(),
    event,
    origin: String(params.origin ?? "unknown"),
    path,
    variant,
    campaign,
    ctaText,
    ctaHash,
  });
  // Marca cliques como pendentes p/ confirmar envio quando o usuário voltar.
  if (
    event === "whatsapp_cta_click" ||
    event === "whatsapp_fab_click" ||
    event === "whatsapp_notice_click"
  ) {
    markPendingSend({ origin: String(params.origin ?? "unknown"), path, variant, campaign, ctaText, ctaHash });
  }
}

function markPendingSend(meta: Omit<BufferedEvent, "ts" | "event">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const arr: Array<Omit<BufferedEvent, "event">> = raw ? JSON.parse(raw) : [];
    arr.push({ ts: Date.now(), ...meta });
    if (arr.length > 20) arr.splice(0, arr.length - 20);
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

/**
 * Listener global de visibilidade: se o usuário sai da aba logo após clicar
 * no link oficial e demora >= 8s para voltar, presumimos que enviou e
 * registramos `whatsapp_cta_sent` no GA4 e no buffer local.
 */
export function installWhatsAppReturnTracking() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __waReturnInstalled?: boolean };
  if (w.__waReturnInstalled) return;
  w.__waReturnInstalled = true;

  let hiddenAt: number | null = null;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }
    const away = hiddenAt ? Date.now() - hiddenAt : 0;
    hiddenAt = null;
    if (away < 8_000) return;
    try {
      const raw = window.localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const pending: Array<Omit<BufferedEvent, "event">> = JSON.parse(raw);
      const fresh = pending.filter((p) => Date.now() - p.ts < 30 * 60_000);
      if (fresh.length === 0) {
        window.localStorage.setItem(PENDING_KEY, JSON.stringify([]));
        return;
      }
      const last = fresh[fresh.length - 1];
      trackWhatsAppCTA("whatsapp_cta_sent", {
        origin: last.origin,
        path: last.path,
        variant: last.variant,
        campaign: last.campaign,
        ctaText: last.ctaText,
        ctaHash: last.ctaHash,
        away_ms: away,
      });
      window.localStorage.setItem(PENDING_KEY, JSON.stringify([]));
    } catch {
      /* noop */
    }
  });
}

/**
 * Bloqueia mensagens que tentem desviar a conversa para canais não oficiais.
 * Retorna `null` se ok, ou uma string com o motivo da rejeição.
 */
export function validateOfficialChannelMessage(text: string): string | null {
  const lower = text.toLowerCase();

  // 1) telefones alternativos
  const phoneMatches = lower.match(/(?:\+?\d[\s\-().]*){10,}/g) ?? [];
  const hasForeignPhone = phoneMatches.some((m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 10 && !digits.endsWith("993075000");
  });
  if (hasForeignPhone) {
    return "Identificamos outro número de telefone na mensagem. Use somente o WhatsApp oficial (21) 99307-5000.";
  }

  // 2) e-mails de domínios não oficiais
  const emailMatches = lower.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
  const hasForeignEmail = emailMatches.some(
    (e) => !e.endsWith(`@${OFFICIAL_EMAIL_DOMAIN}`),
  );
  if (hasForeignEmail) {
    return "Identificamos um e-mail de terceiros na mensagem. Comunique-se apenas pelo WhatsApp oficial (21) 99307-5000 ou pelo domínio @impulsionando.com.br.";
  }

  // 3) redes sociais e mensageiros alternativos
  const forbidden = [
    "t.me/", "telegram", "instagram.com/", "facebook.com/", "fb.me/",
    "tiktok.com/", "discord.gg/", "skype:", "viber", "signal.me",
    "linkedin.com/in/", "twitter.com/", "x.com/",
  ];
  if (forbidden.some((p) => lower.includes(p))) {
    return "Removemos canais alternativos por segurança. Use somente o WhatsApp oficial (21) 99307-5000.";
  }

  // 4) menções a outro número de WhatsApp
  const hasForeignWhatsapp =
    (lower.includes("wa.me/") || lower.includes("whatsapp")) &&
    !lower.includes(OFFICIAL_WHATSAPP_DIGITS) &&
    !lower.includes("99307-5000") &&
    !lower.includes("993075000");
  if (hasForeignWhatsapp) {
    return "Para sua segurança, o único WhatsApp aceito é o (21) 99307-5000.";
  }

  return null;
}

/**
 * Instala um listener global delegado que registra TODO clique em qualquer
 * link/elemento apontando para o WhatsApp oficial.
 */
export function installGlobalWhatsAppClickTracking() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __waOfficialTrackingInstalled?: boolean };
  if (w.__waOfficialTrackingInstalled) return;
  w.__waOfficialTrackingInstalled = true;

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest<HTMLAnchorElement>(
        `a[href*="${OFFICIAL_WHATSAPP_DIGITS}"], a[href*="993075000"]`,
      );
      if (!anchor) return;
      const cta = anchor.dataset.cta || "anchor";
      const variant = anchor.dataset.variant;
      const campaign = anchor.dataset.campaign;
      const ctaText = anchor.dataset.ctaText || (anchor.textContent || "").trim().slice(0, 120);
      trackWhatsAppCTA("whatsapp_cta_click", {
        origin: cta,
        variant,
        campaign,
        ctaText,
        path: window.location.pathname,
        href: anchor.href,
      });
    },
    { capture: true },
  );
}
