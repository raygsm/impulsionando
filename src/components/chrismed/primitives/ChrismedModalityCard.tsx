import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * ChrismedModalityCard — cartão de modalidade (Teleconsulta, Presencial,
 * Domiciliar, ASO, GMS). Estilo editorial: número ordinal + título serifado
 * + descrição + divisor animado no hover.
 */
export function ChrismedModalityCard({
  index,
  eyebrow,
  title,
  description,
  to,
  className,
}: {
  index: number;
  eyebrow?: string;
  title: string;
  description: string;
  to?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between border-b border-[var(--chrismed-sand)] pb-4">
        {eyebrow ? (
          <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
            {eyebrow}
          </span>
        ) : (
          <span />
        )}
        <span className="chrismed-sans text-xs font-light text-[var(--chrismed-mist)]">
          {String(index).padStart(2, "0")}
        </span>
      </div>
      <h3 className="chrismed-serif mt-5 text-2xl font-light text-[var(--chrismed-ink)]">
        {title}
      </h3>
      <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
        {description}
      </p>
    </>
  );

  const cls = cn(
    "group block p-1 transition-colors duration-500 ease-[var(--chrismed-ease)]",
    className,
  );

  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
