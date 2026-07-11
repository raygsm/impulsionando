import { cn } from "@/lib/utils";

/**
 * ChrismedStat — número editorial. Renderiza APENAS se `value` estiver
 * definido (regra V1: números não confirmados ficam ocultos, sem placeholder).
 */
export function ChrismedStat({
  value,
  label,
  suffix,
  className,
}: {
  value?: string | number | null;
  label: string;
  suffix?: string;
  className?: string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="chrismed-serif text-4xl md:text-5xl font-light leading-none text-[var(--chrismed-ink)]">
        {value}
        {suffix && (
          <span className="ml-1 text-2xl text-[var(--chrismed-champagne-deep)]">
            {suffix}
          </span>
        )}
      </span>
      <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
        {label}
      </span>
    </div>
  );
}
