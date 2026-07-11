import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * ChrismedContainer — largura editorial contida (max 1200px).
 * Uso apenas dentro de escopo [data-tenant="chrismed"].
 */
export function ChrismedContainer({
  className,
  as: Tag = "div",
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: keyof JSX.IntrinsicElements }) {
  const Component = Tag as "div";
  return (
    <Component
      className={cn("mx-auto w-full max-w-[1200px] px-6 md:px-10", className)}
      {...rest}
    />
  );
}
