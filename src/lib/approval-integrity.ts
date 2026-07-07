// Helpers puros para conferir integridade das contagens exibidas em
// /core/automacao/aprovacoes. Extraídos para permitir testes unitários
// isolados do componente React.

export type ApprovalRow = {
  status: string;
  mode: string;
  tenant_slug: string | null;
};

export type IntegrityCounts = {
  pending: number;
  approved: number;
  rejected: number;
  registered: number;
  visible: number;
  total: number;
  sumTracked: number;
  consistent: boolean;
};

export type IntegrityFilters = {
  tenantSlug?: string | null;
  mode?: "all" | "demo" | "producao";
};

/**
 * Filtra as linhas pelo par (tenant, mode) exatamente como a UI faz:
 *   - `tenantSlug` null/undefined ou vazio ⇒ não filtra por tenant
 *   - `mode` "all" ou ausente ⇒ não filtra por modo
 * A comparação de tenant é estrita (case-sensitive) porque o slug é o
 * mesmo que vem do banco e do querystring da rota.
 */
export function filterApprovalRows<T extends ApprovalRow>(
  rows: T[],
  filters: IntegrityFilters = {},
): T[] {
  const tenant = filters.tenantSlug || null;
  const mode = filters.mode ?? "all";
  return rows.filter((r) => {
    if (tenant && r.tenant_slug !== tenant) return false;
    if (mode !== "all" && r.mode !== mode) return false;
    return true;
  });
}

/**
 * Calcula as contagens exibidas no header (Pendentes/Aprovadas/Recusadas)
 * a partir das linhas visíveis e informa se a soma bate com o total.
 *
 * Contrato: pending + approved + rejected + registered === visible.
 * Qualquer divergência devolve `consistent = false`, o que a UI usa para
 * mostrar o alerta vermelho de integridade.
 */
export function computeApprovalIntegrity<T extends ApprovalRow>(
  rows: T[],
  filters: IntegrityFilters = {},
): IntegrityCounts {
  const visibleRows = filterApprovalRows(rows, filters);
  const counts = { pending: 0, approved: 0, rejected: 0, registered: 0 };
  for (const r of visibleRows) {
    if (r.status === "pending") counts.pending++;
    else if (r.status === "approved") counts.approved++;
    else if (r.status === "rejected") counts.rejected++;
    else if (r.status === "registered") counts.registered++;
  }
  const sumTracked =
    counts.pending + counts.approved + counts.rejected + counts.registered;
  return {
    ...counts,
    visible: visibleRows.length,
    total: rows.length,
    sumTracked,
    consistent: sumTracked === visibleRows.length,
  };
}
