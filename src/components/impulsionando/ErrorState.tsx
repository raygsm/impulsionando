import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export interface ErrorStateProps {
  /** Título curto do erro. */
  title: string;
  /** Descrição orientativa. Explique o que aconteceu e o próximo passo. */
  description?: string;
  /** Ícone opcional. Default: AlertTriangle. */
  icon?: ReactNode;
  /** Ações (retry, contatar suporte, etc). */
  action?: ReactNode;
  /** Detalhes técnicos (código, mensagem) exibidos em <details>. */
  detail?: string;
  /** Variante de densidade. */
  variant?: "default" | "compact";
  /** Classe extra. */
  className?: string;
}

/**
 * Estado de erro padrão do Core Impulsionando.
 * Fecha a tríade com LoadingState e EmptyState.
 *
 * Anuncia via `role="alert" aria-live="assertive"` para leitores de tela.
 */
export function ErrorState({
  title,
  description,
  icon,
  action,
  detail,
  variant = "default",
  className = "",
}: ErrorStateProps) {
  const pad = variant === "compact" ? "p-6" : "p-8";
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border border-destructive/30 bg-destructive/5 ${pad} ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"
          aria-hidden="true"
        >
          {icon ?? <AlertTriangle className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
          {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
          {detail && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Ver detalhes técnicos
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-background p-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                {detail}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
