import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { formatInt } from "@/lib/format";

export interface KeyCountRow {
  /** Rótulo (chave) exibido na primeira coluna. */
  k: string;
  /** Valor numérico exibido na segunda coluna. */
  count: number;
}

export interface KeyCountTableProps {
  /** Linhas — cada linha é um par chave/contagem. */
  rows: ReadonlyArray<KeyCountRow>;
  /** Rótulo da coluna-chave. */
  keyLabel?: string;
  /** Rótulo da coluna de contagem. */
  countLabel?: string;
  /** Formatador da contagem. Default: formatInt (pt-BR). */
  formatCount?: (n: number) => string;
  /** Título acessível para leitores de tela (caption oculto). */
  ariaLabel?: string;
  /** Estado vazio customizável. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Renderização opcional customizada da coluna-chave. */
  renderKey?: (row: KeyCountRow) => ReactNode;
  className?: string;
}

/**
 * Tabela chave/contagem — primitivo compartilhado do Core Impulsionando.
 *
 * Promovido na Subonda P6.5 após reaparecer em >2 dashboards de saúde
 * (comms-health, notification-deliverability-health, jobs-queues, integrations).
 * Substitui o padrão local `SimpleTable` / tabelas manuais `k/count`.
 *
 * Acessibilidade:
 *  - `<th scope="col">` explícito nas duas colunas.
 *  - `caption` acessível via `ariaLabel` (visualmente oculto).
 *  - Coluna de contagem com `tabular-nums`.
 */
export function KeyCountTable({
  rows,
  keyLabel = "Item",
  countLabel = "Total",
  formatCount = formatInt,
  ariaLabel,
  emptyTitle = "Sem dados nesta janela",
  emptyDescription,
  renderKey,
  className = "",
}: KeyCountTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }
  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className="w-full text-sm">
        {ariaLabel && <caption className="sr-only">{ariaLabel}</caption>}
        <thead className="text-xs text-muted-foreground border-b">
          <tr>
            <th scope="col" className="text-left py-2 font-medium">
              {keyLabel}
            </th>
            <th scope="col" className="text-right py-2 font-medium">
              {countLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 break-words">
                {renderKey ? renderKey(row) : row.k}
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatCount(row.count)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
