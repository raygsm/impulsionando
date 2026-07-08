import { useEffect } from "react";
import { appendUtm } from "./utm";

const CHECKOUT_DOMAINS = [
  "hotmart.com", "monetizze.com.br", "perfectpay.com.br", "eduzz.com",
  "maisfy.com.br", "pay.kiwify.com", "kiwify.com.br", "kiwify.app",
  "checkout.grupocolors.com.br", "grupocolors.com.br",
];
const WHATSAPP_DOMAINS = ["wa.me", "api.whatsapp.com", "chat.whatsapp.com"];

function classify(href: string): { medium: string; content?: string } | null {
  try {
    const u = new URL(href, window.location.origin);
    const host = u.hostname.replace(/^www\./, "");
    if (CHECKOUT_DOMAINS.some((d) => host === d || host.endsWith("." + d))) {
      return { medium: "checkout", content: host };
    }
    if (WHATSAPP_DOMAINS.some((d) => host === d || host.endsWith("." + d))) {
      return { medium: "whatsapp", content: host };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Rehidrata todos os links de checkout e WhatsApp da página atual com UTMs
 * padrão Colors. Não sobrescreve UTMs já presentes no href original.
 */
export function useColorsUtmHydration(campaign: string, extra?: Record<string, string>) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const anchors = document.querySelectorAll<HTMLAnchorElement>("a[href]");
    anchors.forEach((a) => {
      const raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
      const kind = classify(raw);
      if (!kind) return;
      const next = appendUtm(raw, {
        source: "colors_site",
        medium: kind.medium,
        campaign,
        content: extra?.content ?? kind.content,
        term: extra?.term,
      });
      if (next && next !== raw) a.setAttribute("href", next);
    });
  }, [campaign, extra?.content, extra?.term]);
}
