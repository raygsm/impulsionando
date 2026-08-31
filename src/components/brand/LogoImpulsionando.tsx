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
import { BRAND_ASSETS } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Variant = "auto" | "light" | "dark";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/** Heights tuned for the 224px lockup — text stays legible from `sm` upward. */
const SIZE: Record<Size, string> = {
  xs: "h-12",
  sm: "h-16",
  md: "h-20",
  lg: "h-24",
  xl: "h-28",
  "2xl": "h-32",
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

  const img = (
    <img
      src={BRAND_ASSETS.impulsionando.lockup}
      alt={alt}
      width={224}
      height={224}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      className={cn(SIZE[size], "w-auto shrink-0 object-contain object-left")}
      draggable={false}
    />
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
