import { z } from "zod";

export const TENANT_CONFIG_SCHEMA_VERSION = 1 as const;
export const TENANT_ENTITLEMENTS_SCHEMA_VERSION = 1 as const;

export const TenantLocaleSchema = z.object({
  country_code: z.string(),
  locale: z.string(),
  currency_code: z.string(),
  phone_country_code: z.string().nullable(),
  timezone: z.string(),
});
export type TenantLocale = z.infer<typeof TenantLocaleSchema>;

export const TenantBrandingSchema = z.object({
  logo_url: z.string().nullable(),
  primary_color: z.string().nullable(),
  secondary_color: z.string().nullable(),
  tagline: z.string().nullable(),
});
export type TenantBranding = z.infer<typeof TenantBrandingSchema>;

export const TenantConfigV1Schema = z.object({
  schemaVersion: z.literal(TENANT_CONFIG_SCHEMA_VERSION),
  id: z.string().uuid(),
  name: z.string().min(1),
  subdomain: z.string().nullable(),
  domain: z.string().nullable(),
  is_active: z.boolean(),
  branding: TenantBrandingSchema,
  locale: TenantLocaleSchema,
  niche: z
    .object({
      niche_id: z.string().uuid().nullable(),
      subnicho_slug: z.string().nullable(),
      segment: z.string().nullable(),
    })
    .nullable(),
  releaseChannel: z.string().nullable(),
});
export type TenantConfigV1 = z.infer<typeof TenantConfigV1Schema>;

export const TenantEntitlementsV1Schema = z.object({
  schemaVersion: z.literal(TENANT_ENTITLEMENTS_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  planCode: z.string().nullable(),
  contractStatus: z.string().nullable(),
  modules: z.array(z.string()),
  limits: z.record(z.unknown()),
  financialStatus: z.string().nullable(),
  flags: z.record(z.boolean()),
});
export type TenantEntitlementsV1 = z.infer<typeof TenantEntitlementsV1Schema>;

export type FeatureFlagCatalogRow = {
  key: string;
  module_slug: string | null;
  default_value: boolean;
};

export type FeatureFlagOverrideRow = {
  flag_key: string;
  module_slug: string | null;
  value: boolean;
};

/** Canonical flag key: `module.key` when module-scoped, else bare key. */
export function featureFlagKey(moduleSlug: string | null, key: string): string {
  return moduleSlug ? `${moduleSlug}.${key}` : key;
}

/**
 * Resolve effective flags from catalog + overrides.
 * Unknown keys are omitted — consumers must default-deny via resolveFlagValue.
 */
export function resolveEffectiveFlags(
  catalog: FeatureFlagCatalogRow[],
  overrides: FeatureFlagOverrideRow[],
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const flag of catalog) {
    const compositeKey = featureFlagKey(flag.module_slug, flag.key);
    const override = overrides.find(
      (row) =>
        row.flag_key === flag.key &&
        (row.module_slug ?? null) === (flag.module_slug ?? null),
    );
    out[compositeKey] = override?.value ?? flag.default_value ?? false;
  }
  return out;
}

/** Default-deny for flags not in the resolved catalog. */
export function resolveFlagValue(flags: Record<string, boolean>, key: string): boolean {
  return flags[key] ?? false;
}

/** Intersect enabled modules with plan-included modules; plan empty → enabled only. */
export function resolveEffectiveModules(
  enabledModules: string[],
  planModules: string[],
): string[] {
  const enabled = [...new Set(enabledModules)];
  if (planModules.length === 0) return enabled.sort();
  const planSet = new Set(planModules);
  return enabled.filter((slug) => planSet.has(slug)).sort();
}

/** Merge per-module limits from billing_plan_modules (last wins on slug collision). */
export function mergeModuleLimits(
  rows: { module_slug: string; limits: Record<string, unknown> }[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    out[row.module_slug] = row.limits;
  }
  return out;
}
