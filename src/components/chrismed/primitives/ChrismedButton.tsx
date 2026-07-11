import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "quiet";
type Size = "md" | "lg";

const BASE =
  "chrismed-sans inline-flex items-center justify-center gap-2 " +
  "uppercase tracking-[0.2em] font-medium select-none " +
  "transition-colors duration-500 ease-[var(--chrismed-ease)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chrismed-ivory)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] hover:bg-[var(--chrismed-noir)]",
  ghost:
    "border border-[var(--chrismed-ink)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-ink)] hover:text-[var(--chrismed-ivory)]",
  quiet:
    "border border-[var(--chrismed-sand)] text-[var(--chrismed-graphite)] hover:border-[var(--chrismed-champagne)] hover:text-[var(--chrismed-ink)]",
};

const SIZES: Record<Size, string> = {
  md: "text-[11px] px-6 py-3",
  lg: "text-[12px] px-8 py-4",
};

export interface ChrismedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * ChrismedButton — botão editorial. Sem raio arredondado, tipografia uppercase
 * tracking amplo. Estados: default/hover/focus-visible/disabled.
 */
export const ChrismedButton = forwardRef<HTMLButtonElement, ChrismedButtonProps>(
  ({ variant = "primary", size = "md", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  ),
);
ChrismedButton.displayName = "ChrismedButton";
