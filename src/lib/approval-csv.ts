// Helpers puros para o export CSV de /core/automacao/aprovacoes.
// Extraídos para permitir testes unitários do nome do arquivo e do
// cabeçalho (colunas e ordem), sem depender do DOM.

export const APPROVAL_CSV_COLUMNS = [
  "created_at",
  "tenant_slug",
  "mode",
  "regua",
  "action",
  "status",
  "files",
  "note",
] as const;

export type ApprovalCsvColumn = (typeof APPROVAL_CSV_COLUMNS)[number];

export interface ApprovalCsvFilenameInput {
  tenantSlug?: string | null;
  mode: "all" | "demo" | "producao";
  /** Data ISO opcional (para testes determinísticos). Default: agora. */
  now?: Date;
}

/**
 * Gera o nome canônico do arquivo CSV, no formato:
 *   automation-approvals_{tenant-<slug>|all-tenants}_mode-<mode>_<YYYY-MM-DD-HH-MM-SS>.csv
 */
export function buildApprovalCsvFilename(input: ApprovalCsvFilenameInput): string {
  const stamp = (input.now ?? new Date())
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-");
  const tenantPart = input.tenantSlug ? `tenant-${input.tenantSlug}` : "all-tenants";
  const modePart = `mode-${input.mode}`;
  return `automation-approvals_${tenantPart}_${modePart}_${stamp}.csv`;
}

/** Serializa uma linha de aprovação nas colunas canônicas do CSV. */
export function toApprovalCsvRow(row: {
  created_at: string;
  tenant_slug?: string | null;
  mode: string;
  regua?: string | null;
  action: string;
  status: string;
  files?: unknown;
  note?: string | null;
}): Record<ApprovalCsvColumn, string> {
  return {
    created_at: row.created_at,
    tenant_slug: row.tenant_slug ?? "",
    mode: row.mode,
    regua: row.regua ?? "",
    action: row.action,
    status: row.status,
    files: Array.isArray(row.files) ? (row.files as string[]).join(" | ") : "",
    note: row.note ?? "",
  };
}
