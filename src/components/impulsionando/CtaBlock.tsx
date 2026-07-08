import type { ReactNode } from "react";

/**
 * CTA final ("Pronto para começar?") reutilizável em toda rota
 * pública de tenant. Neutro em cor — usa `--primary` do escopo.
 */
export function CtaBlock({
  eyebrow,
  title,
  description,
  actions,
  variant = "surface",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions: ReactNode;
  /** "surface" = card com border; "primary" = fundo primário sólido */
  variant?: "surface" | "primary";
}) {
  const isPrimary = variant === "primary";
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div
        className={
          isPrimary
            ? "rounded-2xl p-10 md:p-14 text-center bg-primary text-primary-foreground"
            : "rounded-2xl p-10 md:p-14 text-center border-2 border-primary bg-card/60 backdrop-blur-sm"
        }
      >
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] opacity-90 mb-4">
            {eyebrow}
          </div>
        )}
        <h2 className="font-serif text-3xl md:text-5xl mb-4">{title}</h2>
        {description && (
          <p className="opacity-85 max-w-xl mx-auto mb-8 text-base md:text-lg">{description}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>
      </div>
    </section>
  );
}
