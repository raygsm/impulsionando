import { describe, expect, it } from "vitest";
import {
  APPROVAL_CSV_COLUMNS,
  buildApprovalCsvFilename,
  toApprovalCsvRow,
} from "@/lib/approval-csv";

/**
 * Contrato do CSV exportado em /core/automacao/aprovacoes:
 *  - Nome do arquivo carrega tenant e mode (ambos essenciais para o E2E
 *    e para o usuário reconhecer o escopo do export).
 *  - As colunas seguem uma ordem canônica: qualquer mudança de ordem/nome
 *    quebra o parser do E2E `e2e/automacao-aprovacoes-csv.spec.ts`.
 */

const FIXED = new Date("2026-07-07T12:34:56Z");

describe("approval CSV — cabeçalho e ordem das colunas", () => {
  it("expõe exatamente 8 colunas na ordem canônica", () => {
    expect(APPROVAL_CSV_COLUMNS).toEqual([
      "created_at",
      "tenant_slug",
      "mode",
      "regua",
      "action",
      "status",
      "files",
      "note",
    ]);
  });

  it("serializa uma linha respeitando a ordem e nomes das colunas", () => {
    const row = toApprovalCsvRow({
      created_at: "2026-07-07T12:00:00Z",
      tenant_slug: "acme",
      mode: "demo",
      regua: "captacao",
      action: "download",
      status: "pending",
      files: ["/a.json", "/b.json"],
      note: "n1",
    });
    // Chaves na mesma ordem das colunas.
    expect(Object.keys(row)).toEqual([...APPROVAL_CSV_COLUMNS]);
    expect(row.files).toBe("/a.json | /b.json");
    expect(row.tenant_slug).toBe("acme");
    expect(row.mode).toBe("demo");
  });

  it("normaliza nulos e files ausente", () => {
    const row = toApprovalCsvRow({
      created_at: "2026-07-07T12:00:00Z",
      tenant_slug: null,
      mode: "producao",
      regua: null,
      action: "activate",
      status: "pending",
      files: null,
      note: null,
    });
    expect(row.tenant_slug).toBe("");
    expect(row.regua).toBe("");
    expect(row.files).toBe("");
    expect(row.note).toBe("");
  });
});

describe("approval CSV — nome do arquivo", () => {
  it("inclui tenant, mode e timestamp determinístico", () => {
    const name = buildApprovalCsvFilename({
      tenantSlug: "acme",
      mode: "demo",
      now: FIXED,
    });
    expect(name).toBe(
      "automation-approvals_tenant-acme_mode-demo_2026-07-07-12-34-56.csv",
    );
  });

  it("usa 'all-tenants' quando não há tenant filtrado", () => {
    const name = buildApprovalCsvFilename({
      tenantSlug: null,
      mode: "all",
      now: FIXED,
    });
    expect(name).toBe(
      "automation-approvals_all-tenants_mode-all_2026-07-07-12-34-56.csv",
    );
  });

  it("preserva mode=producao no nome", () => {
    const name = buildApprovalCsvFilename({
      tenantSlug: "beta",
      mode: "producao",
      now: FIXED,
    });
    expect(name).toContain("tenant-beta");
    expect(name).toContain("mode-producao");
    expect(name.endsWith(".csv")).toBe(true);
  });
});
