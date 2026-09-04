import type { TenantConfigV1, TenantEntitlementsV1 } from "@impulsionando/contracts";
import type { RoleFixture } from "./catalog";

const uuid = (n: string) => `00000000-0000-4000-8000-${n.padStart(12, "0")}`;

function config(id: string, name: string, color: string | null, logo: string | null, niche: string): TenantConfigV1 {
  return {
    schemaVersion: 1,
    id,
    name,
    subdomain: niche,
    domain: null,
    is_active: true,
    branding: {
      logo_url: logo,
      primary_color: color,
      secondary_color: "#0f172a",
      tagline: null,
    },
    locale: {
      country_code: "BR",
      locale: "pt-BR",
      currency_code: "BRL",
      phone_country_code: "+55",
      timezone: "America/Sao_Paulo",
    },
    niche: { niche_id: uuid("9"), subnicho_slug: niche, segment: niche },
    releaseChannel: "staging",
  };
}

function entitlements(tenantId: string, modules: string[], flags: Record<string, boolean> = {}): TenantEntitlementsV1 {
  return {
    schemaVersion: 1,
    tenantId,
    planCode: "completo",
    contractStatus: "active",
    modules,
    limits: {},
    financialStatus: "ok",
    flags,
  };
}

const RESTAURANT_ID = uuid("11");
const CLINIC_ID = uuid("12");
const REALESTATE_ID = uuid("13");
const EMPTY_ID = uuid("14");

export const FIXTURES: Record<
  string,
  { config: TenantConfigV1; entitlements: TenantEntitlementsV1; role: RoleFixture; label: string }
> = {
  restaurant: {
    label: "Restaurante (muitos módulos)",
    role: "owner_admin",
    config: config(RESTAURANT_ID, "Cantina Oliveira", "#c2410c", null, "restaurante"),
    entitlements: entitlements(RESTAURANT_ID, ["crm", "marketing", "agenda", "ops", "finance", "inventory", "sales", "whatsapp", "ai"]),
  },
  clinic: {
    label: "Clínica (agenda + CRM, financeiro limitado)",
    role: "finance_limited",
    config: config(CLINIC_ID, "Clínica Horizonte", "#0f766e", "https://example.invalid/logo.svg", "clinica"),
    entitlements: entitlements(CLINIC_ID, ["crm", "agenda", "ops", "finance", "ai"], { "finance.degraded": true }),
  },
  realestate: {
    label: "Imobiliária (CRM ativo, estoque não contratado)",
    role: "manager_operator",
    config: config(REALESTATE_ID, "Vértice Imóveis com Nome Corporativo Muito Longo Ltda", "#1d4ed8", null, "imobiliaria"),
    entitlements: entitlements(REALESTATE_ID, ["crm", "marketing"], { "marketing.configuring": true }),
  },
  empty: {
    label: "Tenant vazio",
    role: "owner_admin",
    config: config(EMPTY_ID, "Empresa Nova", "#64748b", null, "geral"),
    entitlements: entitlements(EMPTY_ID, []),
  },
};

export function getFixture(id: string) {
  return FIXTURES[id] ?? null;
}
