import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Lang } from "../ChrismedShell";

const LABELS: Record<Lang, { title: string; sub: string }> = {
  pt: { title: "Falar com Oliver", sub: "Concierge CHRISMED" },
  en: { title: "Talk to Oliver", sub: "CHRISMED concierge" },
  es: { title: "Hablar con Oliver", sub: "Concierge CHRISMED" },
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  lang?: Lang;
  variant?: "fab" | "inline";
}

/**
 * ChrismedOliverLauncher — botão do concierge Oliver.
 *
 * REGRA V1 (inegociável): este componente NUNCA aponta para WhatsApp.
 * É um <button> que abre o painel Oliver. O WhatsApp só aparece DENTRO
 * do painel, após triagem — jamais como CTA público direto.
 *
 * O `onClick` real (abrir painel, trocar idioma, transferência humana)
 * será conectado na Onda V8. Nesta V1 entregamos apenas a linguagem visual.
 */
export const ChrismedOliverLauncher = forwardRef<HTMLButtonElement, Props>(
  ({ lang = "pt", variant = "fab", className, onClick, ...rest }, ref) => {
    const { title, sub } = LABELS[lang];
    return (
      <button
        ref={ref}
        type="button"
        aria-label={title}
        onClick={onClick}
        data-oliver-launcher
        className={cn(
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
        )}
        {...rest}
      >
        <span className="chrismed-serif flex h-9 w-9 items-center justify-center rounded-full bg-[var(--chrismed-champagne)] text-[var(--chrismed-ink)] text-lg italic">
          O
        </span>
        <span className="text-left leading-tight">
          <span className="chrismed-sans block text-[11px] font-medium uppercase tracking-[0.2em]">
            {title}
          </span>
          <span className="chrismed-sans block text-[9px] uppercase tracking-[0.25em] text-[var(--chrismed-champagne)]">
            {sub}
          </span>
        </span>
      </button>
    );
  },
);
ChrismedOliverLauncher.displayName = "ChrismedOliverLauncher";
