import Image from "next/image";

import { cn } from "cn";

type ImpulsionandoMarkProps = {
  className?: string;
  size?: number;
  /** When true, expose the brand name to assistive tech (login hero). */
  labelled?: boolean;
  /** Prefer for above-the-fold login hero so the mark is not lazy-deferred. */
  priority?: boolean;
};

/** Brand mark — sidebar (16) or login hero (larger via `size`). */
export function ImpulsionandoMark({ className, size = 16, labelled = false, priority = false }: ImpulsionandoMarkProps) {
  return (
    <Image
      src="/brand/impulsionando/mark.svg"
      alt={labelled ? "Impulsionando" : ""}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      unoptimized
      priority={priority || labelled}
      aria-hidden={labelled ? undefined : true}
    />
  );
}
