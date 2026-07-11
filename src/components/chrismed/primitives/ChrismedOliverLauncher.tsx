import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Lang } from "../ChrismedShell";
import { CHRISMED_CONTACT } from "@/data/chrismed-contact";

/**
 * Rótulos 100% no idioma respectivo. Em PT o botão abre o painel Oliver
 * (concierge com triagem). Em EN/ES o balão encurta a jornada e leva
 * direto ao WhatsApp GMS — pacientes estrangeiros procuram a CHRISMED
 * majoritariamente em urgência, e não devem passar por triagem extra.
 */
const LABELS: Record<Lang, { title: string; sub: string; avatar: string }> = {
  pt: { title: "Falar com Oliver", sub: "Concierge CHRISMED", avatar: "O" },
  en: { title: "WhatsApp GMS", sub: "24/7 medical assistance", avatar: "W" },
  es: { title: "WhatsApp GMS", sub: "Asistencia médica 24/7", avatar: "W" },
};

const WA_MESSAGE: Record<Lang, string> = {
  pt: "",
  en: "Hello CHRISMED GMS, I am a foreign patient and I need medical assistance.",
  es: "Hola CHRISMED GMS, soy paciente extranjero y necesito asistencia médica.",
};

function waUrl(lang: Lang) {
  const base = CHRISMED_CONTACT.channels.whatsapp;
  const msg = WA_MESSAGE[lang];
  return msg ? `${base}&text=${encodeURIComponent(msg)}` : base;
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  lang?: Lang;
  variant?: "fab" | "inline";
}

export const ChrismedOliverLauncher = forwardRef<HTMLButtonElement, Props>(
  ({ lang = "pt", variant = "fab", className, onClick, ...rest }, ref) => {
    const { title, sub, avatar } = LABELS[lang];
    const isDirectWhatsapp = lang === "en" || lang === "es";

    const commonClass = cn(
      "group inline-flex items-center gap-3 select-none",
      "bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]",
      "border border-[var(--chrismed-champagne-deep)]/60",
      "shadow-[0_18px_40px_-12px_rgba(15,15,15,0.45)]",
      "transition-colors duration-500 ease-[var(--chrismed-ease)]",
      "hover:bg-[var(--chrismed-noir)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)]",
      variant === "fab"
        ? "fixed bottom-6 right-6 z-40 pl-3 pr-5 py-3"
        : "px-6 py-3",
      className,
    );

    const inner = (
      <>
        <span className="chrismed-serif flex h-9 w-9 items-center justify-center rounded-full bg-[var(--chrismed-champagne)] text-[var(--chrismed-ink)] text-lg italic">
          {avatar}
        </span>
        <span className="text-left leading-tight">
          <span className="chrismed-sans block text-[11px] font-medium uppercase tracking-[0.2em]">
            {title}
          </span>
          <span className="chrismed-sans block text-[9px] uppercase tracking-[0.25em] text-[var(--chrismed-champagne)]">
            {sub}
          </span>
        </span>
      </>
    );

    if (isDirectWhatsapp) {
      return (
        <a
          href={waUrl(lang)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={title}
          data-oliver-launcher="whatsapp"
          data-lang={lang}
          className={commonClass}
        >
          {inner}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-label={title}
        onClick={onClick}
        data-oliver-launcher
        data-lang={lang}
        className={commonClass}
        {...rest}
      >
        {inner}
      </button>
    );
  },
);
ChrismedOliverLauncher.displayName = "ChrismedOliverLauncher";
