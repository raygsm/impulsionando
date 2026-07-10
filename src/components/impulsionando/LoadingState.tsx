import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  /** Texto exibido ao lado do spinner. */
  label?: string;
  /** Padding do container. */
  compact?: boolean;
  /** Classe extra. */
  className?: string;
}

/**
 * Estado de carregamento padrão do Core Impulsionando.
 * Anuncia mudança de estado via `aria-live="polite"` para screen readers.
 */
export function LoadingState({ label = "Carregando…", compact = false, className = "" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground ${
        compact ? "p-4" : "p-8"
      } ${className}`.trim()}
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
