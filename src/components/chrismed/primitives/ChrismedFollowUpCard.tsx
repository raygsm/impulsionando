import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ChrismedButton } from "./ChrismedButton";
import { ChrismedEyebrow } from "./ChrismedEyebrow";

/**
 * ChrismedFollowUpCard — Onda 6.
 *
 * Cartão para escada de relacionamento pós-consulta / re-agendamento /
 * lembrete. Estrutura consciente: eyebrow (momento), título editorial,
 * corpo curto, CTA único (regra V1: nunca dois CTAs de peso igual).
 *
 * Guardrails:
 *  - CTA aponta apenas para rotas oficiais (nunca WhatsApp direto).
 *  - Sem preços fixos, sem contagem regressiva simulada.
 */
export function ChrismedFollowUpCard({
  eyebrow,
  title,
  body,
  cta,
  to,
  tone = "ivory",
  className,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  tone?: "ivory" | "bone" | "noir";
  className?: string;
}) {
  const dark = tone === "noir";
  return (
    <article
      className={cn(
        "flex flex-col gap-5 border-l-2 px-6 py-8 md:px-8 md:py-10",
        dark
          ? "border-[var(--chrismed-champagne)] bg-[var(--chrismed-noir)] text-[var(--chrismed-ivory)]"
          : "border-[var(--chrismed-champagne-deep)] bg-[var(--chrismed-bone)]/60",
        className,
      )}
    >
      <ChrismedEyebrow className={dark ? "text-[var(--chrismed-champagne)]" : undefined}>
        {eyebrow}
      </ChrismedEyebrow>
      <h3
        className={cn(
          "chrismed-serif text-2xl font-light leading-tight md:text-3xl",
          dark ? "text-[var(--chrismed-ivory)]" : "text-[var(--chrismed-ink)]",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "chrismed-sans max-w-[52ch] text-sm leading-relaxed md:text-base",
          dark ? "text-[var(--chrismed-sand)]" : "text-[var(--chrismed-graphite)]",
        )}
      >
        {body}
      </p>
      <div className="pt-2">
        <Link to={to as never} className="inline-flex">
          <ChrismedButton
            variant={dark ? "primary" : "ghost"}
            className={
              dark
                ? "bg-[var(--chrismed-champagne)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)]"
                : undefined
            }
          >
            {cta}
          </ChrismedButton>
        </Link>
      </div>
    </article>
  );
}
