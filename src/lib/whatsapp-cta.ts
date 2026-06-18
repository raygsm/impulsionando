/**
 * Canal oficial único — utilitários compartilhados.
 *
 * Mantém em um único lugar:
 *  - número/URL oficial do WhatsApp (21) 99307-5000
 *  - rastreamento de cliques e submissões (GA + console.debug)
 *  - validação de mensagens que tentem desviar a conversa para canais
 *    não oficiais (outros telefones, e-mails, redes sociais).
 */
import { trackEvent } from "@/lib/analytics";

export const OFFICIAL_WHATSAPP_PHONE_DISPLAY = "(21) 99307-5000";
export const OFFICIAL_WHATSAPP_PHONE_E164 = "+5521993075000";
export const OFFICIAL_WHATSAPP_DIGITS = "5521993075000";
export const OFFICIAL_EMAIL_DOMAIN = "impulsionando.com.br";

export function buildOfficialWhatsAppUrl(message?: string): string {
  const text = message?.trim() || "Olá! Vim pelo site oficial da Impulsionando.";
  return `https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(text)}`;
}

export type WhatsAppCTAEvent =
  | "whatsapp_cta_click"
  | "whatsapp_form_submit"
  | "whatsapp_fab_click"
  | "whatsapp_notice_click";

export function trackWhatsAppCTA(
  event: WhatsAppCTAEvent,
  params: { origin: string; [key: string]: unknown } = { origin: "unknown" },
) {
  try {
    trackEvent(event, {
      channel: "whatsapp_official",
      phone: OFFICIAL_WHATSAPP_PHONE_DISPLAY,
      ...params,
    });
  } catch {
    /* analytics opt-out ou falha — silencioso */
  }
}

/**
 * Bloqueia mensagens que tentem desviar a conversa para canais não oficiais.
 * Retorna `null` se ok, ou uma string com o motivo da rejeição.
 */
export function validateOfficialChannelMessage(text: string): string | null {
  const lower = text.toLowerCase();

  // 1) telefones alternativos (qualquer número longo que não termine
  //    nos 9 últimos dígitos do oficial — 993075000)
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
 * link/elemento apontando para o WhatsApp oficial — útil para cobrir landings
 * antigas sem precisar refatorar uma a uma.
 *
 * Deve ser chamado apenas no cliente, uma única vez.
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
      trackWhatsAppCTA("whatsapp_cta_click", {
        origin: cta,
        path: window.location.pathname,
        href: anchor.href,
      });
    },
    { capture: true },
  );
}
