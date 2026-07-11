import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChrismedContainer } from "./ChrismedContainer";

type Tone = "ivory" | "bone" | "noir";

/**
 * ChrismedSection — banda vertical editorial. Ritmo respirável (py-20/py-28).
 * Tons semânticos: ivory (padrão), bone (contraste sutil), noir (autoridade).
 */
export function ChrismedSection({
  className,
  tone = "ivory",
  contained = true,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { tone?: Tone; contained?: boolean }) {
  const toneCls: Record<Tone, string> = {
    ivory: "bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)]",
    bone: "bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)]",
    noir: "bg-[var(--chrismed-noir)] text-[var(--chrismed-ivory)]",
  };
  return (
    <section
      className={cn("w-full py-20 md:py-28", toneCls[tone], className)}
      {...rest}
    >
      {contained ? <ChrismedContainer>{children}</ChrismedContainer> : children}
    </section>
  );
}
