/**
 * Conceptual tests for auto-configured menus per audience/niche.
 * Validates the seed structure and `get_menu_for_audience` behavior.
 */
import { describe, expect, it } from "vitest";

type MenuItem = {
  seed_key: string;
  label: string;
  scope: string;
  audience: string[];
  niche_slugs: string[];
};

const SEEDED: MenuItem[] = [
  // Super admin (9)
  { seed_key: "sa.dashboard", label: "Visão geral", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.empresas", label: "Empresas", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.modulos", label: "Módulos", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.planos", label: "Planos", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.trials", label: "Trials", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.billing", label: "Cobrança", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.bi", label: "BI Master", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.uptime", label: "Uptime", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  { seed_key: "sa.audit", label: "Auditoria", scope: "core", audience: ["super_admin"], niche_slugs: [] },
  // White label (6)
  { seed_key: "wl.dashboard", label: "Visão geral", scope: "wl", audience: ["white_label"], niche_slugs: [] },
  { seed_key: "wl.clientes", label: "Clientes", scope: "wl", audience: ["white_label"], niche_slugs: [] },
  { seed_key: "wl.implantacoes", label: "Implantações", scope: "wl", audience: ["white_label"], niche_slugs: [] },
  { seed_key: "wl.financeiro", label: "Financeiro", scope: "wl", audience: ["white_label"], niche_slugs: [] },
  { seed_key: "wl.bi", label: "BI da rede", scope: "wl", audience: ["white_label"], niche_slugs: [] },
  { seed_key: "wl.marketing", label: "Marketing", scope: "wl", audience: ["white_label"], niche_slugs: [] },
  // Empresa base (5)
  { seed_key: "co.dashboard", label: "Visão geral", scope: "company", audience: ["company"], niche_slugs: [] },
  { seed_key: "co.financeiro", label: "Financeiro", scope: "company", audience: ["company"], niche_slugs: [] },
  { seed_key: "co.bi", label: "Relatórios", scope: "company", audience: ["company"], niche_slugs: [] },
  { seed_key: "co.crm", label: "CRM", scope: "company", audience: ["company"], niche_slugs: [] },
  { seed_key: "co.settings", label: "Configurações", scope: "company", audience: ["company"], niche_slugs: [] },
  // Empresa por nicho (15)
  { seed_key: "co.clinicas.agenda", label: "Agenda", scope: "company", audience: ["company"], niche_slugs: ["clinicas"] },
  { seed_key: "co.clinicas.pacientes", label: "Pacientes", scope: "company", audience: ["company"], niche_slugs: ["clinicas"] },
  { seed_key: "co.clinicas.prontuario", label: "Prontuários", scope: "company", audience: ["company"], niche_slugs: ["clinicas"] },
  { seed_key: "co.bares.pdv", label: "PDV", scope: "company", audience: ["company"], niche_slugs: ["bares"] },
  { seed_key: "co.bares.estoque", label: "Estoque", scope: "company", audience: ["company"], niche_slugs: ["bares"] },
  { seed_key: "co.bares.reservas", label: "Reservas", scope: "company", audience: ["company"], niche_slugs: ["bares"] },
  { seed_key: "co.brew.producao", label: "Produção", scope: "company", audience: ["company"], niche_slugs: ["microcervejarias"] },
  { seed_key: "co.brew.estoque", label: "Estoque", scope: "company", audience: ["company"], niche_slugs: ["microcervejarias"] },
  { seed_key: "co.brew.b2b", label: "Vendas B2B", scope: "company", audience: ["company"], niche_slugs: ["microcervejarias"] },
  { seed_key: "co.serv.os", label: "Ordens de Serviço", scope: "company", audience: ["company"], niche_slugs: ["servicos"] },
  { seed_key: "co.serv.tecnicos", label: "Técnicos", scope: "company", audience: ["company"], niche_slugs: ["servicos"] },
  { seed_key: "co.serv.orcamentos", label: "Orçamentos", scope: "company", audience: ["company"], niche_slugs: ["servicos"] },
  { seed_key: "co.ec.pedidos", label: "Pedidos", scope: "company", audience: ["company"], niche_slugs: ["ecommerce"] },
  { seed_key: "co.ec.catalogo", label: "Catálogo", scope: "company", audience: ["company"], niche_slugs: ["ecommerce"] },
  { seed_key: "co.ec.marketing", label: "Marketing", scope: "company", audience: ["company"], niche_slugs: ["ecommerce"] },
  // Consumidor (6)
  { seed_key: "cn.dashboard", label: "Início", scope: "consumer", audience: ["consumer"], niche_slugs: [] },
  { seed_key: "cn.clinicas.consultas", label: "Minhas consultas", scope: "consumer", audience: ["consumer"], niche_slugs: ["clinicas"] },
  { seed_key: "cn.bares.fidelidade", label: "Fidelidade", scope: "consumer", audience: ["consumer"], niche_slugs: ["bares"] },
  { seed_key: "cn.brew.clube", label: "Clube da cervejaria", scope: "consumer", audience: ["consumer"], niche_slugs: ["microcervejarias"] },
  { seed_key: "cn.serv.os", label: "Minhas OS", scope: "consumer", audience: ["consumer"], niche_slugs: ["servicos"] },
  { seed_key: "cn.ec.pedidos", label: "Meus pedidos", scope: "consumer", audience: ["consumer"], niche_slugs: ["ecommerce"] },
];

function getMenuForAudience(audience: string, niche: string | null): MenuItem[] {
  return SEEDED.filter(
    (m) =>
      m.audience.includes(audience) &&
      (m.niche_slugs.length === 0 || (niche !== null && m.niche_slugs.includes(niche))),
  );
}

describe("auto-configured menus", () => {
  it("seed_keys são todos únicos (idempotência)", () => {
    const keys = SEEDED.map((m) => m.seed_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("super admin recebe pelo menos 9 itens, todos sem nicho", () => {
    const menu = getMenuForAudience("super_admin", null);
    expect(menu.length).toBeGreaterThanOrEqual(9);
    expect(menu.every((m) => m.niche_slugs.length === 0)).toBe(true);
  });

  it("white label recebe pelo menos 6 itens, todos sem nicho", () => {
    const menu = getMenuForAudience("white_label", null);
    expect(menu.length).toBeGreaterThanOrEqual(6);
    expect(menu.every((m) => m.niche_slugs.length === 0)).toBe(true);
  });

  it.each(["clinicas", "bares", "microcervejarias", "servicos", "ecommerce"])(
    "empresa do nicho %s recebe base + específicos do nicho",
    (nicho) => {
      const menu = getMenuForAudience("company", nicho);
      // 5 base + 3 específicos
      expect(menu.length).toBeGreaterThanOrEqual(8);
      expect(menu.some((m) => m.niche_slugs.includes(nicho))).toBe(true);
      // não vaza itens de outros nichos
      expect(
        menu.every((m) => m.niche_slugs.length === 0 || m.niche_slugs.includes(nicho)),
      ).toBe(true);
    },
  );

  it("empresa sem nicho recebe apenas itens base", () => {
    const menu = getMenuForAudience("company", null);
    expect(menu.every((m) => m.niche_slugs.length === 0)).toBe(true);
    expect(menu.length).toBe(5);
  });

  it.each(["clinicas", "bares", "microcervejarias", "servicos", "ecommerce"])(
    "consumidor do nicho %s recebe início + item específico",
    (nicho) => {
      const menu = getMenuForAudience("consumer", nicho);
      expect(menu.length).toBe(2);
      expect(menu.find((m) => m.seed_key === "cn.dashboard")).toBeTruthy();
      expect(menu.find((m) => m.niche_slugs.includes(nicho))).toBeTruthy();
    },
  );

  it("não há vazamento entre audiências", () => {
    const sa = getMenuForAudience("super_admin", "clinicas");
    expect(sa.every((m) => m.audience.includes("super_admin"))).toBe(true);
    expect(sa.some((m) => m.audience.includes("company"))).toBe(false);
  });

  it("todos os itens de empresa por nicho usam scope=company", () => {
    const nicheItems = SEEDED.filter((m) => m.niche_slugs.length > 0 && m.audience.includes("company"));
    expect(nicheItems.every((m) => m.scope === "company")).toBe(true);
  });
});
