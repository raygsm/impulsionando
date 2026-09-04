import type { ModuleLifecycleState } from "@impulsionando/contracts";

/** Known entitlement slugs → dashboard areas. Unknown slugs are ignored (default-deny). */
export const AREA_MODULE_SLUGS = {
  growth: ["crm", "marketing"],
  customers: ["crm"],
  operations: ["agenda", "ops", "operations"],
  finance: ["finance", "erp-financeiro", "billing"],
  inventory: ["inventory", "sales"],
  communications: ["whatsapp", "email", "communications"],
  ai: ["ai", "impulsionito"],
} as const;

export type RoleFixture = "owner_admin" | "manager_operator" | "finance_limited";

export function moduleStateFromEntitlements(
  entitledSlugs: string[],
  slugCandidates: readonly string[],
  flags: Record<string, boolean>,
): ModuleLifecycleState {
  const entitled = entitledSlugs.some((s) => slugCandidates.includes(s));
  if (!entitled) return "NOT_ENTITLED";
  const degraded = slugCandidates.some((s) => flags[`${s}.degraded`] === true);
  if (degraded) return "DEGRADED";
  const configuring = slugCandidates.some((s) => flags[`${s}.configuring`] === true);
  if (configuring) return "CONFIGURING";
  const suspended = slugCandidates.some((s) => flags[`${s}.suspended`] === true);
  if (suspended) return "SUSPENDED";
  return "ACTIVE";
}

export function roleAllowsFinance(role: RoleFixture): boolean {
  return role !== "finance_limited";
}
