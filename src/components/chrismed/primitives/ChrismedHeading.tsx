import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3 | 4;
type Variant = "editorial" | "italic";

const SIZE: Record<Level, string> = {
  1: "text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.02]",
  2: "text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.08]",
  3: "text-[clamp(1.4rem,2.4vw,1.85rem)] leading-[1.15]",
  4: "text-[clamp(1.1rem,1.6vw,1.35rem)] leading-[1.2]",
};

/**
 * ChrismedHeading — serifa editorial CHRISMED (Cormorant Garamond).
 * Escala fluida, sem peso pesado (300–400) para preservar sofisticação.
 */
export function ChrismedHeading({
  level = 2,
  variant = "editorial",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { level?: Level; variant?: Variant }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <Tag
      className={cn(
        "chrismed-serif font-light tracking-tight text-[var(--chrismed-ink)]",
        variant === "italic" && "italic",
        SIZE[level],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
