import type { ReactNode } from "react";

/**
 * Cabeçalho padrão de seção. Substitui o boilerplate repetido em
 * praticamente toda rota pública (chip + h2 + p opcional).
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  const cls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${cls} max-w-3xl mb-10`}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] opacity-90 mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-3xl md:text-4xl mb-3">{title}</h2>
      {description && <p className="opacity-75 text-base md:text-lg">{description}</p>}
    </div>
  );
}
