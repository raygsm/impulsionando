import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * ChrismedCard — superfície editorial sem raio arredondado.
 * Borda sutil sand, hover eleva borda para champagne.
 */
export function ChrismedCard({
  className,
  interactive = false,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "bg-[var(--chrismed-ivory)] border border-[var(--chrismed-sand)] p-8 md:p-10",
        "transition-colors duration-500 ease-[var(--chrismed-ease)]",
        interactive && "hover:border-[var(--chrismed-champagne)] cursor-pointer",
        className,
      )}
      {...rest}
    />
  );
}
