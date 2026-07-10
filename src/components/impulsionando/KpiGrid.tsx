import type { ReactNode } from "react";

export interface KpiGridProps {
  children: ReactNode;
  /** Número máximo de colunas em desktop (default 4). */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const COLS: Record<NonNullable<KpiGridProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

/**
 * Grade responsiva padrão para KPIs / MetricCards.
 * Consolidação da Fase P6.
 */
export function KpiGrid({ children, columns = 4, className = "" }: KpiGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${COLS[columns]} ${className}`.trim()}>
      {children}
    </div>
  );
}
