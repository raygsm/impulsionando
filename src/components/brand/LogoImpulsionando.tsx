/**
 * LogoImpulsionando — componente único da marca.
 *
 * Regras de identidade (não negociáveis):
 *  - Fundos claros: logo transparente, sem caixa, sem borda.
 *  - Fundos escuros: logo OBRIGATORIAMENTE dentro de um cartão branco
 *    com padding e cantos levemente arredondados, para preservar
 *    o azul e o laranja originais da marca.
 *
 * Use `variant="auto"` (padrão) quando o componente puder herdar o tom do
 * pai via `data-bg-tone="dark"` em qualquer ancestral; caso contrário passe
 * `variant="light"` ou `variant="dark"` explicitamente.
 */
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Variant = "auto" | "light" | "dark";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE: Record<Size, { icon: string; name: string; tagline: string; gap: string }> = {
  xs: { icon: "h-6 w-6", name: "text-sm", tagline: "hidden", gap: "gap-1.5" },
  sm: { icon: "h-8 w-8", name: "text-base", tagline: "hidden", gap: "gap-2" },
  md: { icon: "h-10 w-10", name: "text-lg", tagline: "text-[8px]", gap: "gap-2.5" },
  lg: { icon: "h-12 w-12", name: "text-xl", tagline: "text-[9px]", gap: "gap-3" },
  xl: { icon: "h-16 w-16", name: "text-2xl", tagline: "text-[10px]", gap: "gap-3.5" },
  "2xl": { icon: "h-20 w-20", name: "text-3xl", tagline: "text-xs", gap: "gap-4" },
};

export interface LogoImpulsionandoProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Texto alternativo. Padrão atende SEO/a11y. */
  alt?: string;
  /** Padding interno do cartão branco no modo escuro. */
  padded?: boolean;
  /** Quando true (padrão) envolve a logo num link para a home Impulsionando. */
  asLink?: boolean;
  /** URL de destino do link (default: home institucional). */
  href?: string;
}

export function LogoImpulsionando({
  variant = "auto",
  size = "md",
  className,
  alt = "Impulsionando Tecnologia",
  padded = true,
  asLink = true,
  href = "https://impulsionando.com.br",
}: LogoImpulsionandoProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [detected, setDetected] = useState<"light" | "dark" | null>(null);

  // Auto-detecção: lê a luminância do background do ancestral mais próximo
  // que tenha cor de fundo resolvida. Roda apenas no cliente, uma vez por mount.
  useEffect(() => {
    if (variant !== "auto" || !wrapRef.current) return;
    // Permite override declarativo via data-bg-tone="dark"|"light"
    const tag = wrapRef.current.closest("[data-bg-tone]") as HTMLElement | null;
    if (tag) {
      const tone = tag.getAttribute("data-bg-tone");
      if (tone === "dark" || tone === "light") {
        setDetected(tone);
        return;
      }
    }
    let el: HTMLElement | null = wrapRef.current;
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
        const r = parts[0] ?? 255,
          g = parts[1] ?? 255,
          b = parts[2] ?? 255;
        const a = parts[3] ?? 1;
        if (a > 0.1) {
          const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setDetected(L < 0.55 ? "dark" : "light");
          return;
        }
      }
      el = el.parentElement;
    }
    setDetected("light");
  }, [variant]);

  const effective: "light" | "dark" = variant === "auto" ? (detected ?? "light") : variant;
  const dimensions = SIZE[size];

  const img = (
    <span className={cn("inline-flex items-center", dimensions.gap)}>
      <img
        src="/pwa-icon-192.png"
        alt={alt}
        width={192}
        height={192}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={cn(dimensions.icon, "shrink-0 rounded-[22%] object-contain")}
        draggable={false}
      />
      <span aria-hidden="true" className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            dimensions.name,
            "whitespace-nowrap font-bold tracking-tight text-slate-950",
          )}
        >
          Impulsionando
        </span>
        <span
          className={cn(
            dimensions.tagline,
            "mt-1 whitespace-nowrap font-semibold uppercase tracking-[0.22em] text-blue-700",
          )}
        >
          Tecnologia
        </span>
      </span>
    </span>
  );

  const inner =
    effective === "dark" ? (
      <span
        ref={wrapRef}
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-white shadow-sm",
          padded ? "px-3 py-2" : "p-1",
          className,
        )}
      >
        {img}
      </span>
    ) : (
      <span ref={wrapRef} className={cn("inline-flex items-center", className)}>
        {img}
      </span>
    );

  if (!asLink) return inner;
  return (
    <a
      href={href}
      aria-label="Ir para a home Impulsionando"
      className="inline-flex items-center hover:opacity-90 transition-opacity"
    >
      {inner}
    </a>
  );
}
