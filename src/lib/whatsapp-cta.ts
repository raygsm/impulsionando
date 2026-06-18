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
  | "whatsapp_cta_impression";

const METRICS_KEY = "wa_official_metrics_v1";
const MAX_BUFFER = 500;

interface BufferedEvent {
  ts: number;
  event: WhatsAppCTAEvent;
  origin: string;
  path: string;
  variant?: string;
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
  } catch {
    /* noop */
  }
}

export function trackWhatsAppCTA(
  event: WhatsAppCTAEvent,
  params: { origin: string; variant?: WhatsAppCTAVariant; [key: string]: unknown } = {
    origin: "unknown",
  },
) {
  const path =
    (params.path as string | undefined) ??
    (typeof window !== "undefined" ? window.location.pathname : "ssr");
  const variant = params.variant as string | undefined;
  try {
    trackEvent(event, {
      channel: "whatsapp_official",
      phone: OFFICIAL_WHATSAPP_PHONE_DISPLAY,
      path,
      variant,
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
      trackWhatsAppCTA("whatsapp_cta_click", {
        origin: cta,
        variant,
        path: window.location.pathname,
        href: anchor.href,
      });
    },
    { capture: true },
  );
}
