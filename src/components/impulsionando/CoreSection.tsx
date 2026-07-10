import type { ReactNode } from "react";

export interface CoreSectionProps {
  /** Título da seção. */
  title: string;
  /** Descrição opcional exibida sob o título. */
  description?: string;
  /** Ações à direita do cabeçalho (botões, filtros, etc.). */
  actions?: ReactNode;
  /** Conteúdo da seção. */
  children: ReactNode;
  /** Nível semântico do título (default h2). */
  as?: "h2" | "h3";
  /** Classe extra aplicada ao wrapper `<section>`. */
  className?: string;
}

/**
 * Seção padrão do Core Impulsionando — cabeçalho + conteúdo.
 *
 * Substitui as dezenas de `function Section(...)` locais espalhadas em
 * `core.hub-*`, `core.automacao.*`, `adm.master.tsx` etc. Promovido na
 * Fase P1 da Homologação Premium.
 */
export function CoreSection({
  title,
  description,
  actions,
  children,
  as: Heading = "h2",
  className = "",
}: CoreSectionProps) {
  return (
    <section className={`space-y-3 ${className}`.trim()}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <Heading className="text-lg font-semibold tracking-tight truncate">{title}</Heading>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
