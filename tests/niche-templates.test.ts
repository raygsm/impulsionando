import { describe, it, expect } from "vitest";

/**
 * Conceptual tests for `apply_niche_template`.
 *
 * Mirrors the SQL function in
 * supabase/migrations/20260617012311_niche_templates.sql without hitting the DB.
 *
 * Goals:
 *  - Garante que cada nicho premium tem um conjunto mínimo de módulos.
 *  - Idempotência: rodar duas vezes não duplica company_modules.
 *  - Autorização: staff e gestor da empresa OK; outsider bloqueado.
 *  - companies.niche_id é atualizado.
 */

type ModuleSlug = string;
type NicheSlug = "saude" | "bares" | "cervejarias" | "servicos" | "ecommerce";

const TEMPLATES: Record<NicheSlug, ModuleSlug[]> = {
  saude: ["crm", "agenda", "financeiro", "area_cliente", "automacao", "bi", "fidelizacao"],
  bares: ["pdv", "estoque", "delivery", "fidelizacao", "financeiro", "bi", "automacao"],
  cervejarias: ["erp", "estoque", "commerce", "financeiro", "crm", "bi"],
  servicos: ["crm", "agenda", "financeiro", "automacao", "bi", "area_cliente"],
  ecommerce: ["commerce", "estoque", "crm", "financeiro", "automacao", "fidelizacao", "bi"],
};

type CompanyModule = { company_id: string; module_slug: string; is_enabled: boolean };
type Company = { id: string; niche_id: string | null };

function applyTemplate(
  caller: { id: string; isStaff: boolean; belongsTo: string[] },
  company: Company,
  niche: NicheSlug,
  existing: CompanyModule[],
): { installed: string[]; rows: CompanyModule[]; company: Company } {
  if (!caller.isStaff && !caller.belongsTo.includes(company.id)) {
    throw new Error("not_authorized");
  }
  const slugs = TEMPLATES[niche];
  const next = [...existing];
  const installed: string[] = [];
  for (const slug of slugs) {
    const idx = next.findIndex((r) => r.company_id === company.id && r.module_slug === slug);
    if (idx === -1) {
      next.push({ company_id: company.id, module_slug: slug, is_enabled: true });
    } else {
      next[idx] = { ...next[idx], is_enabled: true };
    }
    installed.push(slug);
  }
  return {
    installed: installed.sort(),
    rows: next,
    company: { ...company, niche_id: `niche-${niche}` },
  };
}

describe("apply_niche_template — niche templates", () => {
  const staff = { id: "u-staff", isStaff: true, belongsTo: [] };
  const manager = { id: "u-mgr", isStaff: false, belongsTo: ["co-1"] };
  const outsider = { id: "u-out", isStaff: false, belongsTo: ["co-9"] };
  const company: Company = { id: "co-1", niche_id: null };

  it.each(Object.keys(TEMPLATES) as NicheSlug[])(
    "instala módulos esperados para %s",
    (niche) => {
      const r = applyTemplate(staff, company, niche, []);
      expect(r.installed).toEqual([...TEMPLATES[niche]].sort());
      expect(r.rows.every((row) => row.is_enabled)).toBe(true);
      expect(r.company.niche_id).toBe(`niche-${niche}`);
    },
  );

  it("é idempotente — segunda execução não duplica linhas", () => {
    const first = applyTemplate(staff, company, "saude", []);
    const second = applyTemplate(staff, first.company, "saude", first.rows);
    expect(second.rows.length).toBe(first.rows.length);
  });

  it("reativa módulos previamente desativados", () => {
    const seeded: CompanyModule[] = [
      { company_id: "co-1", module_slug: "crm", is_enabled: false },
    ];
    const r = applyTemplate(staff, company, "saude", seeded);
    expect(r.rows.find((x) => x.module_slug === "crm")?.is_enabled).toBe(true);
  });

  it("gestor da própria empresa pode aplicar", () => {
    expect(() => applyTemplate(manager, company, "servicos", [])).not.toThrow();
  });

  it("usuário de outra empresa é bloqueado", () => {
    expect(() => applyTemplate(outsider, company, "servicos", [])).toThrow("not_authorized");
  });

  it("anon (sem caller) é bloqueado", () => {
    const anon = { id: "", isStaff: false, belongsTo: [] };
    expect(() => applyTemplate(anon, company, "servicos", [])).toThrow("not_authorized");
  });

  it("cada template tem pelo menos 6 módulos (operação mínima viável)", () => {
    for (const slugs of Object.values(TEMPLATES)) {
      expect(slugs.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("todo template inclui financeiro e bi (auditoria + cobrança)", () => {
    for (const slugs of Object.values(TEMPLATES)) {
      expect(slugs).toContain("financeiro");
      expect(slugs).toContain("bi");
    }
  });
});
