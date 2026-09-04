/**
 * TRANSITIONAL — not a Nest authorization document.
 *
 * Composes DashboardManifest from existing tenant config + entitlements.
 * UI checks are cosmetic. Nest remains authoritative.
 */
import type {
  DashboardManifest,
  ModuleLifecycleState,
  NavigationItem,
  WidgetDefinition,
} from "@impulsionando/contracts";
import type { TenantConfigV1, TenantEntitlementsV1 } from "@impulsionando/contracts";
import type { AiTenantAgentConfig } from "@impulsionando/contracts";
import { AREA_MODULE_SLUGS, moduleStateFromEntitlements, roleAllowsFinance, type RoleFixture } from "./catalog";

export const INVARIANT_NAV: NavigationItem[] = [
  { id: "home", label: "Início", href: "/dashboard", enabled: true, requiredModule: null },
  { id: "growth", label: "Crescimento", href: "/growth", enabled: true, requiredModule: "crm" },
  { id: "customers", label: "Clientes", href: "/customers", enabled: true, requiredModule: "crm" },
  { id: "operations", label: "Operações", href: "/operations", enabled: true, requiredModule: "ops" },
  { id: "management", label: "Gestão", href: "/management", enabled: true, requiredModule: null },
  { id: "help", label: "Ajuda", href: "/help", enabled: true, requiredModule: null },
  { id: "settings", label: "Configurações", href: "/settings", enabled: true, requiredModule: null },
];

export type ManifestInput = {
  config: TenantConfigV1;
  entitlements: TenantEntitlementsV1;
  agent?: AiTenantAgentConfig | null;
  /** Cosmetic only — Nest still authorizes finance reads. */
  role?: RoleFixture;
};

function navEnabled(required: string | null, modules: ModuleLifecycleState | "always"): boolean {
  if (!required) return true;
  return modules !== "NOT_ENTITLED" && modules !== "DISABLED" && modules !== "SUSPENDED";
}

export function composeDashboardManifest(input: ManifestInput): DashboardManifest {
  const { config, entitlements, agent } = input;
  const role: RoleFixture = input.role ?? "owner_admin";
  const slugs = entitlements.modules;
  const flags = entitlements.flags;

  const growth = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.growth, flags);
  const customers = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.customers, flags);
  const operations = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.operations, flags);
  const finance = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.finance, flags);
  const inventory = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.inventory, flags);
  const communications = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.communications, flags);
  const ai = moduleStateFromEntitlements(slugs, AREA_MODULE_SLUGS.ai, flags);

  const financeState: ModuleLifecycleState = roleAllowsFinance(role) ? finance : "NOT_ENTITLED";

  const navigation = INVARIANT_NAV.map((item) => {
    const state =
      item.id === "growth"
        ? growth
        : item.id === "customers"
          ? customers
          : item.id === "operations"
            ? operations
            : "ACTIVE";
    return {
      ...item,
      enabled: navEnabled(item.requiredModule, item.requiredModule ? state : "always"),
    };
  });

  const widgets: WidgetDefinition[] = [
    {
      id: "briefing",
      area: "home",
      title: "Briefing do dia",
      moduleId: null,
      state: "ACTIVE",
      dataAvailability: "UNKNOWN",
    },
    {
      id: "acquisition",
      area: "home",
      title: "Captação",
      moduleId: "crm",
      state: growth,
      dataAvailability: growth === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
    {
      id: "followups",
      area: "home",
      title: "Follow-ups",
      moduleId: "crm",
      state: customers,
      dataAvailability: customers === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
    {
      id: "campaign-cost",
      area: "growth",
      title: "Custo de campanha",
      moduleId: "marketing",
      state: growth,
      dataAvailability: "UNKNOWN",
    },
    {
      id: "pipeline",
      area: "customers",
      title: "Pipeline",
      moduleId: "crm",
      state: customers,
      dataAvailability: customers === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
    {
      id: "agenda-today",
      area: "operations",
      title: "Agenda de hoje",
      moduleId: "agenda",
      state: operations,
      dataAvailability: operations === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
    {
      id: "finance-ap",
      area: "management",
      title: "Contas a pagar",
      moduleId: "finance",
      state: financeState,
      dataAvailability: financeState === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
    {
      id: "inventory",
      area: "management",
      title: "Estoque",
      moduleId: "inventory",
      state: inventory,
      dataAvailability: inventory === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
    {
      id: "comms-whatsapp",
      area: "management",
      title: "WhatsApp",
      moduleId: "communications",
      state: communications,
      dataAvailability: communications === "ACTIVE" ? "UNKNOWN" : "UNAVAILABLE",
    },
  ];

  const agentAvailable = Boolean(agent?.enabled) && ai !== "NOT_ENTITLED" && ai !== "SUSPENDED";

  return {
    tenant: {
      name: config.name,
      logo_url: config.branding.logo_url,
      primary_color: config.branding.primary_color,
      secondary_color: config.branding.secondary_color,
      tagline: config.branding.tagline,
    },
    navigation,
    widgets,
    dailyActions: [
      {
        id: "open-tickets",
        label: "Tickets de suporte",
        href: "/help",
        urgency: "attention",
        state: "ACTIVE",
      },
    ],
    modules: [
      { id: "crm", label: "CRM", state: customers },
      { id: "ops", label: "Operações", state: operations },
      { id: "finance", label: "Financeiro", state: financeState },
      { id: "inventory", label: "Estoque", state: inventory },
      { id: "communications", label: "Comunicações", state: communications },
      { id: "ai", label: "Agente interno", state: ai },
    ],
    agent: {
      agentId: agent?.agentId ?? null,
      name: agent?.agentId === "impulsionito" ? "Impulsionito" : agent?.agentId ?? "Agente interno",
      available: agentAvailable,
      riskCeiling: agent?.riskCeiling ?? "READ",
      degradedReason: agentAvailable ? null : "Agente indisponível ou não configurado neste tenant",
    },
    transitional: true,
  };
}
