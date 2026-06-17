/**
 * RBAC ponta-a-ponta — testes conceituais
 *
 * Valida a matriz de visibilidade do menu (NAV_GROUPS + TOP_ITEMS) e os
 * predicados de segurança (is_super_admin, is_impulsionando_staff,
 * user_belongs_to_company, user_has_permission) para os 4 perfis:
 *  - Super Admin Impulsionando
 *  - White Label (staff master de outro tenant)
 *  - Cliente Empresa (perfil operacional vinculado a uma company)
 *  - Consumidor Final (login sem perfil em empresa)
 *
 * Reproduz a lógica de `SidebarNav.filterItem` sem depender do DOM.
 */
import { describe, it, expect } from "vitest";
import { NAV_GROUPS, TOP_ITEMS, type NavItem } from "@/components/app/nav-config";

interface Persona {
  name: string;
  isSuper: boolean;
  isStaff: boolean;
  companyIds: string[];
  permissions: Set<string>;
}

const SUPER: Persona = {
  name: "Super Admin",
  isSuper: true,
  isStaff: true,
  companyIds: [],
  permissions: new Set(),
};

const WHITE_LABEL: Persona = {
  name: "White Label",
  isSuper: false,
  isStaff: true,
  companyIds: ["wl-tenant"],
  permissions: new Set([
    "dashboard.read", "users.read", "profiles.read", "modules.read",
    "settings.read", "audit.read",
  ]),
};

const EMPRESA: Persona = {
  name: "Cliente Empresa",
  isSuper: false,
  isStaff: false,
  companyIds: ["empresa-a"],
  permissions: new Set([
    "dashboard.read",
    "crm.opportunity.read", "crm.lead.read", "crm.pipeline.read", "crm.activity.read",
    "customer.read",
    "agenda.appointment.read", "agenda.professional.read", "agenda.service.read",
    "realestate.interest.read", "realestate.message.read",
    "units.read", "sectors.read",
  ]),
};

const CONSUMIDOR: Persona = {
  name: "Consumidor Final",
  isSuper: false,
  isStaff: false,
  companyIds: [],
  permissions: new Set(),
};

function canSee(item: NavItem, p: Persona, isImpersonating = false): boolean {
  if (item.superOnly) return p.isSuper;
  if (isImpersonating) return true;
  if (!item.perm) return true;
  return p.permissions.has(item.perm);
}

function visibleLabels(p: Persona): string[] {
  const top = TOP_ITEMS.filter((i) => canSee(i, p)).map((i) => i.label);
  const grouped = NAV_GROUPS.flatMap((g) =>
    g.items.filter((i) => canSee(i, p)).map((i) => i.label),
  );
  return [...top, ...grouped];
}

// Simulação dos predicados SQL
function is_super_admin(p: Persona) { return p.isSuper; }
function is_impulsionando_staff(p: Persona) { return p.isStaff; }
function user_belongs_to_company(p: Persona, companyId: string) {
  return p.companyIds.includes(companyId);
}
function user_has_permission(p: Persona, _company: string, perm: string) {
  return p.isSuper || p.permissions.has(perm);
}

describe("RBAC — predicados de segurança", () => {
  it("is_super_admin: somente Super Admin retorna true", () => {
    expect(is_super_admin(SUPER)).toBe(true);
    expect(is_super_admin(WHITE_LABEL)).toBe(false);
    expect(is_super_admin(EMPRESA)).toBe(false);
    expect(is_super_admin(CONSUMIDOR)).toBe(false);
  });

  it("is_impulsionando_staff: Super Admin e WL retornam true", () => {
    expect(is_impulsionando_staff(SUPER)).toBe(true);
    expect(is_impulsionando_staff(WHITE_LABEL)).toBe(true);
    expect(is_impulsionando_staff(EMPRESA)).toBe(false);
    expect(is_impulsionando_staff(CONSUMIDOR)).toBe(false);
  });

  it("user_belongs_to_company: isola cada tenant", () => {
    expect(user_belongs_to_company(EMPRESA, "empresa-a")).toBe(true);
    expect(user_belongs_to_company(EMPRESA, "empresa-b")).toBe(false);
    expect(user_belongs_to_company(WHITE_LABEL, "empresa-a")).toBe(false);
    expect(user_belongs_to_company(CONSUMIDOR, "empresa-a")).toBe(false);
  });

  it("user_has_permission: super sempre true; empresa só do seu set", () => {
    expect(user_has_permission(SUPER, "x", "qualquer.perm.que.nao.existe")).toBe(true);
    expect(user_has_permission(EMPRESA, "empresa-a", "crm.lead.read")).toBe(true);
    expect(user_has_permission(EMPRESA, "empresa-a", "audit.read")).toBe(false);
    expect(user_has_permission(CONSUMIDOR, "empresa-a", "dashboard.read")).toBe(false);
  });
});

describe("RBAC — visibilidade do menu (Sidebar) por persona", () => {
  it("Super Admin enxerga todos os itens superOnly", () => {
    const labels = visibleLabels(SUPER);
    expect(labels).toContain("/adm — Central Impulsionando");
    expect(labels).toContain("Empresas");
    expect(labels).toContain("Nichos");
    expect(labels).toContain("Trials (7 dias)");
    expect(labels).toContain("Billing");
    expect(labels).toContain("Permissões");
  });

  it("White Label NÃO enxerga itens superOnly da central Impulsionando", () => {
    const labels = visibleLabels(WHITE_LABEL);
    expect(labels).not.toContain("/adm — Central Impulsionando");
    expect(labels).not.toContain("Empresas");
    expect(labels).not.toContain("Nichos");
    expect(labels).not.toContain("Trials (7 dias)");
    expect(labels).not.toContain("Billing");
  });

  it("White Label vê apenas o que sua permissão concede", () => {
    const labels = visibleLabels(WHITE_LABEL);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Usuários");
    expect(labels).toContain("Configurações");
    expect(labels).toContain("Auditoria");
  });

  it("Cliente Empresa vê módulos do tenant mas não a central", () => {
    const labels = visibleLabels(EMPRESA);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Kanban");
    expect(labels).toContain("Leads");
    expect(labels).toContain("Clientes");
    expect(labels).toContain("Hoje"); // agenda
    expect(labels).not.toContain("/adm — Central Impulsionando");
    expect(labels).not.toContain("Empresas");
    expect(labels).not.toContain("Auditoria");
    expect(labels).not.toContain("Trials (7 dias)");
  });

  it("Consumidor Final vê apenas itens públicos (sem perm e sem superOnly)", () => {
    const labels = visibleLabels(CONSUMIDOR);
    // Não pode ver nada que exija permissão ou seja superOnly
    expect(labels).not.toContain("Dashboard");
    expect(labels).not.toContain("/adm — Central Impulsionando");
    expect(labels).not.toContain("Auditoria");
    // Pode ver páginas neutras (ex.: Minha Assinatura / Privacidade)
    expect(labels).toContain("Minha Assinatura");
    expect(labels).toContain("Privacidade & Notificações");
  });
});

describe("RBAC — RLS / isolamento entre empresas", () => {
  it("Empresa A não enxerga dados da Empresa B (user_belongs_to_company)", () => {
    const empresaB = "empresa-b";
    expect(user_belongs_to_company(EMPRESA, empresaB)).toBe(false);
  });

  it("Super Admin bypassa filtro de empresa em policies USING(is_super_admin(uid) OR belongs)", () => {
    const canSelect = (p: Persona, companyId: string) =>
      is_super_admin(p) || user_belongs_to_company(p, companyId);
    expect(canSelect(SUPER, "empresa-a")).toBe(true);
    expect(canSelect(SUPER, "qualquer")).toBe(true);
    expect(canSelect(EMPRESA, "empresa-a")).toBe(true);
    expect(canSelect(EMPRESA, "empresa-b")).toBe(false);
    expect(canSelect(CONSUMIDOR, "empresa-a")).toBe(false);
  });

  it("Impersonation: staff impersonando vê tudo do tenant sem checagem granular", () => {
    const labels = TOP_ITEMS.filter((i) => canSee(i, EMPRESA, true)).map((i) => i.label);
    expect(labels).toContain("Dashboard"); // perm liberado pelo bypass
  });
});

describe("RBAC — itens superOnly não vazam para perfis não-master", () => {
  const superOnlyLabels = [...TOP_ITEMS, ...NAV_GROUPS.flatMap((g) => g.items)]
    .filter((i) => i.superOnly)
    .map((i) => i.label);

  it("listou pelo menos os itens críticos como superOnly", () => {
    expect(superOnlyLabels).toContain("Empresas");
    expect(superOnlyLabels).toContain("Trials (7 dias)");
    expect(superOnlyLabels).toContain("Billing");
    expect(superOnlyLabels.length).toBeGreaterThan(5);
  });

  it("nenhum item superOnly aparece para White Label, Empresa ou Consumidor", () => {
    for (const persona of [WHITE_LABEL, EMPRESA, CONSUMIDOR]) {
      const visible = visibleLabels(persona);
      for (const lbl of superOnlyLabels) {
        expect(visible, `${persona.name} viu superOnly: ${lbl}`).not.toContain(lbl);
      }
    }
  });
});
