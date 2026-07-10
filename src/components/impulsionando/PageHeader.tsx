import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Título principal da página (h1). */
  title: string;
  /** Descrição/subtítulo opcional. */
  description?: string;
  /** Eyebrow/kicker exibido acima do título (categoria da área). */
  eyebrow?: string;
  /** Ações à direita (botões, menus, filtros). */
  actions?: ReactNode;
  /** Slot inferior (breadcrumbs, abas, filtros, toolbar). */
  toolbar?: ReactNode;
  /** Classe extra aplicada ao wrapper. */
  className?: string;
}

/**
 * Cabeçalho padrão de página do Core Impulsionando.
 *
 * Substitui os `<div><h1>...</h1></div>` inconsistentes espalhados
 * em rotas administrativas. Consolidação da Fase P6.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  toolbar,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`space-y-3 ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
      {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
    </header>
  );
}
