import { describe, expect, it } from "vitest";
import {
  computeApprovalIntegrity,
  filterApprovalRows,
  type ApprovalRow,
} from "@/lib/approval-integrity";

const ROWS: ApprovalRow[] = [
  { status: "pending", mode: "demo", tenant_slug: "acme" },
  { status: "pending", mode: "demo", tenant_slug: "acme" },
  { status: "approved", mode: "producao", tenant_slug: "acme" },
  { status: "rejected", mode: "producao", tenant_slug: "acme" },
  { status: "registered", mode: "demo", tenant_slug: "acme" },
  // outro tenant / outros modos — precisam ficar de fora quando filtrados
  { status: "approved", mode: "demo", tenant_slug: "beta" },
  { status: "pending", mode: "producao", tenant_slug: "beta" },
  { status: "unknown-status", mode: "demo", tenant_slug: "acme" }, // não contável
];

describe("computeApprovalIntegrity", () => {
  it("sem filtros: conta todos os status conhecidos e sinaliza divergência quando existe status desconhecido", () => {
    const c = computeApprovalIntegrity(ROWS);
    expect(c.visible).toBe(8);
    expect(c.total).toBe(8);
    expect(c.pending).toBe(3);
    expect(c.approved).toBe(2);
    expect(c.rejected).toBe(1);
    expect(c.registered).toBe(1);
    expect(c.sumTracked).toBe(7);
    // 8 linhas visíveis vs 7 rastreadas ⇒ integridade quebrada
    expect(c.consistent).toBe(false);
  });

  it("filtra por tenant preservando somente linhas do slug informado", () => {
    const c = computeApprovalIntegrity(ROWS, { tenantSlug: "beta" });
    expect(c.visible).toBe(2);
    expect(c.pending).toBe(1);
    expect(c.approved).toBe(1);
    expect(c.rejected).toBe(0);
    expect(c.consistent).toBe(true);
  });

  it("filtra por modo demo apenas", () => {
    const c = computeApprovalIntegrity(ROWS, { mode: "demo" });
    // 4 acme (2 pending, 1 registered, 1 unknown) + 1 beta approved = 5 visíveis
    expect(c.visible).toBe(5);
    expect(c.pending).toBe(2);
    expect(c.approved).toBe(1);
    expect(c.registered).toBe(1);
    // 4 rastreadas vs 5 visíveis (unknown-status não conta)
    expect(c.consistent).toBe(false);
  });

  it("combina tenant + modo (acme + produção) e mantém integridade", () => {
    const c = computeApprovalIntegrity(ROWS, {
      tenantSlug: "acme",
      mode: "producao",
    });
    expect(c.visible).toBe(2);
    expect(c.approved).toBe(1);
    expect(c.rejected).toBe(1);
    expect(c.pending).toBe(0);
    expect(c.registered).toBe(0);
    expect(c.sumTracked).toBe(2);
    expect(c.consistent).toBe(true);
  });

  it("mode='all' e tenantSlug null equivalem a sem filtro", () => {
    const a = computeApprovalIntegrity(ROWS);
    const b = computeApprovalIntegrity(ROWS, { tenantSlug: null, mode: "all" });
    expect(a).toEqual(b);
  });

  it("lista vazia é consistente por definição", () => {
    const c = computeApprovalIntegrity([], { tenantSlug: "acme", mode: "demo" });
    expect(c.visible).toBe(0);
    expect(c.total).toBe(0);
    expect(c.consistent).toBe(true);
  });

  it("dataset só com status contáveis mantém consistent=true", () => {
    const rows: ApprovalRow[] = [
      { status: "pending", mode: "demo", tenant_slug: "x" },
      { status: "approved", mode: "demo", tenant_slug: "x" },
      { status: "rejected", mode: "demo", tenant_slug: "x" },
      { status: "registered", mode: "demo", tenant_slug: "x" },
    ];
    const c = computeApprovalIntegrity(rows);
    expect(c.sumTracked).toBe(4);
    expect(c.visible).toBe(4);
    expect(c.consistent).toBe(true);
  });
});

describe("filterApprovalRows — separação por tenant+mode", () => {
  it("nunca vaza linhas de tenants diferentes quando o tenant é passado", () => {
    const acme = filterApprovalRows(ROWS, { tenantSlug: "acme" });
    for (const r of acme) expect(r.tenant_slug).toBe("acme");
    const beta = filterApprovalRows(ROWS, { tenantSlug: "beta" });
    for (const r of beta) expect(r.tenant_slug).toBe("beta");
    expect(acme.length + beta.length).toBe(ROWS.length);
  });

  it("filtro por modo é ortogonal ao filtro por tenant", () => {
    const acmeDemo = filterApprovalRows(ROWS, {
      tenantSlug: "acme",
      mode: "demo",
    });
    for (const r of acmeDemo) {
      expect(r.tenant_slug).toBe("acme");
      expect(r.mode).toBe("demo");
    }
  });
});
