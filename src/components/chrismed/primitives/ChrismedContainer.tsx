import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * ChrismedContainer — largura editorial contida (max 1200px).
 * Uso apenas dentro de escopo [data-tenant="chrismed"].
 */
export function ChrismedContainer({
  className,
  as,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={cn("mx-auto w-full max-w-[1200px] px-6 md:px-10", className)}
      {...rest}
    />
  );
}

