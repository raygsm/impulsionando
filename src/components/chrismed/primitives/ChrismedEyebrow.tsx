import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * ChrismedEyebrow — micro-label acima de títulos. Uppercase, tracking amplo.
 */
export function ChrismedEyebrow({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "chrismed-sans block text-[10px] font-medium uppercase tracking-[0.3em]",
        "text-[var(--chrismed-champagne-deep)]",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
