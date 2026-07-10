import type { ReactNode } from "react";

export type MetricTone = "default" | "positive" | "warning" | "critical" | "info";

export interface MetricCardProps {
  /** Rótulo do indicador. */
  label: string;
  /** Valor principal (já formatado). */
  value: ReactNode;
  /** Sub-informação opcional (comparação, período). */
  hint?: ReactNode;
  /** Ícone opcional exibido ao lado do rótulo (decorativo). */
  icon?: ReactNode;
  /** Ação/CTA opcional (link, botão). */
  action?: ReactNode;
  /** Ênfase semântica. Usa tokens do Design System. */
  tone?: MetricTone;
  /** Classe extra. */
  className?: string;
}

const TONE_RING: Record<MetricTone, string> = {
  default: "",
  positive: "ring-1 ring-inset ring-emerald-500/20",
  warning: "ring-1 ring-inset ring-amber-500/20",
  critical: "ring-1 ring-inset ring-destructive/30",
  info: "ring-1 ring-inset ring-primary/20",
};

const TONE_VALUE: Record<MetricTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-destructive",
  info: "text-primary",
};

/**
 * Card de métrica padronizado do Core Impulsionando.
 * Substitui KPI cards duplicados em dashboards administrativos.
 * Consolidação da Fase P6.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  action,
  tone = "default",
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${TONE_RING[tone]} ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className="text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${TONE_VALUE[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
