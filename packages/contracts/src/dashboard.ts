/**
 * Authenticated dashboard composition contracts.
 * The Nest manifest endpoint does not exist yet — UI adapters must stay transitional.
 */
import { z } from "zod";
import { TenantBrandingSchema } from "./tenant";

export const ModuleLifecycleStateSchema = z.enum([
  "NOT_ENTITLED",
  "CONFIGURING",
  "READY",
  "ACTIVE",
  "DEGRADED",
  "SUSPENDED",
  "DISABLED",
]);
export type ModuleLifecycleState = z.infer<typeof ModuleLifecycleStateSchema>;

export const DashboardAreaIdSchema = z.enum([
  "home",
  "growth",
  "customers",
  "operations",
  "management",
  "help",
  "settings",
]);
export type DashboardAreaId = z.infer<typeof DashboardAreaIdSchema>;

export const NavigationItemSchema = z.object({
  id: DashboardAreaIdSchema,
  label: z.string().min(1),
  href: z.string().min(1),
  enabled: z.boolean(),
  requiredModule: z.string().nullable(),
});
export type NavigationItem = z.infer<typeof NavigationItemSchema>;

export const WidgetDefinitionSchema = z.object({
  id: z.string().min(1),
  area: DashboardAreaIdSchema,
  title: z.string().min(1),
  moduleId: z.string().nullable(),
  state: ModuleLifecycleStateSchema,
  /** Missing metrics (cost, attribution) must be UNKNOWN — never coerced to zero. */
  dataAvailability: z.enum(["LIVE", "UNKNOWN", "UNAVAILABLE"]),
});
export type WidgetDefinition = z.infer<typeof WidgetDefinitionSchema>;

export const ActionDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  urgency: z.enum(["info", "attention", "critical"]),
  state: ModuleLifecycleStateSchema,
});
export type ActionDefinition = z.infer<typeof ActionDefinitionSchema>;

export const ModuleStatusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  state: ModuleLifecycleStateSchema,
});
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export const AgentSummarySchema = z.object({
  agentId: z.string().nullable(),
  name: z.string(),
  available: z.boolean(),
  riskCeiling: z.string().nullable(),
  degradedReason: z.string().nullable(),
});
export type AgentSummary = z.infer<typeof AgentSummarySchema>;

export const DashboardTenantBrandingSchema = TenantBrandingSchema.extend({
  name: z.string().min(1),
});
export type DashboardTenantBranding = z.infer<typeof DashboardTenantBrandingSchema>;

export const DashboardManifestSchema = z.object({
  tenant: DashboardTenantBrandingSchema,
  navigation: z.array(NavigationItemSchema),
  widgets: z.array(WidgetDefinitionSchema),
  dailyActions: z.array(ActionDefinitionSchema),
  modules: z.array(ModuleStatusSchema),
  agent: AgentSummarySchema,
  /** True when composed in the frontend from config+entitlements, not Nest. */
  transitional: z.literal(true),
});
export type DashboardManifest = z.infer<typeof DashboardManifestSchema>;
