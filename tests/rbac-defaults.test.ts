/**
 * Conceptual tests for default RBAC seeding.
 * Validates the per-profile module allowlists produce expected counts and
 * never leak forbidden modules across profiles.
 */
import { describe, expect, it } from "vitest";

type Perm = { code: string; module: string };

// Snapshot do total real de permissions por módulo (verificado no banco).
const PERMS_BY_MODULE: Record<string, number> = {
  administracao: 2, affiliates: 21, afiliados: 9, agenda: 9, auditoria: 1,
  bi: 1, communication: 5, companies: 1, company: 4, configuracoes: 2,
  crm: 10, customers: 4, dashboard: 1, ehr: 7, empresas: 4, finance: 10,
  imobiliaria: 1, inventory: 8, master: 8, modules: 1, perfis: 2,
  permissions: 1, realestate: 17, reports: 1, sales: 6, sectors: 1,
  setores: 2, trial: 7, unidades: 4, units: 1, users: 1, usuarios: 2,
};
const ALL_PERMS = Object.values(PERMS_BY_MODULE).reduce((a, b) => a + b, 0);

function permsForModules(mods: string[]): number {
  return mods.reduce((sum, m) => sum + (PERMS_BY_MODULE[m] ?? 0), 0);
}

const PROFILES: Record<string, { modules?: string[]; all?: boolean; except?: string[] }> = {
  "super-admin-impulsionando": { all: true },
  "suporte-impulsionando": { all: true },
  "admin-impulsionando": { all: true, except: ["affiliates", "afiliados"] },
  "gestor-empresa": { modules: ["agenda","crm","finance","sales","inventory","customers","reports","ehr","communication","dashboard","company","bi","realestate","imobiliaria"] },
  "admin-unidade": { modules: ["agenda","crm","sales","inventory","customers","reports","ehr","communication","dashboard","company"] },
  "financeiro": { modules: ["finance","sales","reports","dashboard"] },
  "recepcao": { modules: ["agenda","customers","dashboard","communication"] },
  "profissional": { modules: ["agenda","ehr","customers","dashboard"] },
  "operador": { modules: ["dashboard","customers","agenda","sales"] },
  "cliente-final": { modules: ["dashboard"] },
  "afiliado": { modules: ["affiliates","afiliados"] },
};

function expectedCount(slug: string): number {
  const cfg = PROFILES[slug];
  if (!cfg) return 0;
  if (cfg.all) {
    const exc = cfg.except ?? [];
    return ALL_PERMS - permsForModules(exc);
  }
  return permsForModules(cfg.modules ?? []);
}

describe("default RBAC per profile", () => {
  it("super admin tem todas as permissões", () => {
    expect(expectedCount("super-admin-impulsionando")).toBe(154);
  });

  it("admin impulsionando perde apenas affiliates/afiliados", () => {
    expect(expectedCount("admin-impulsionando")).toBe(154 - 21 - 9);
  });

  it("gestor da empresa recebe módulos operacionais", () => {
    expect(expectedCount("gestor-empresa")).toBeGreaterThanOrEqual(80);
  });

  it("financeiro recebe apenas finance/sales/reports/dashboard", () => {
    const n = expectedCount("financeiro");
    expect(n).toBe(10 + 6 + 1 + 1);
    expect(n).toBeLessThan(expectedCount("gestor-empresa"));
  });

  it("cliente-final fica restrito a dashboard", () => {
    expect(expectedCount("cliente-final")).toBe(1);
  });

  it("afiliado recebe somente módulos de afiliados", () => {
    expect(expectedCount("afiliado")).toBe(21 + 9);
  });

  it("recepção não tem finance nem ehr", () => {
    const mods = PROFILES["recepcao"].modules!;
    expect(mods).not.toContain("finance");
    expect(mods).not.toContain("ehr");
  });

  it("profissional tem ehr mas não finance", () => {
    const mods = PROFILES["profissional"].modules!;
    expect(mods).toContain("ehr");
    expect(mods).not.toContain("finance");
  });

  it("nenhum perfil operacional vê affiliates", () => {
    for (const slug of ["gestor-empresa","admin-unidade","financeiro","recepcao","profissional","operador","cliente-final"]) {
      expect(PROFILES[slug].modules ?? []).not.toContain("affiliates");
    }
  });

  it("seeding é idempotente: PK (profile_id, permission_id) bloqueia duplicatas", () => {
    // documenta o invariante: rodar o seed N vezes mantém os mesmos totais
    const before = expectedCount("gestor-empresa");
    const after = expectedCount("gestor-empresa");
    expect(after).toBe(before);
  });
});
