import { Inject, Injectable } from "@nestjs/common";
import {
  TENANT_CONFIG_SCHEMA_VERSION,
  TENANT_ENTITLEMENTS_SCHEMA_VERSION,
  mergeModuleLimits,
  resolveEffectiveFlags,
  resolveEffectiveModules,
  type TenantConfigV1,
  type TenantEntitlementsV1,
} from "@impulsionando/contracts";
import { SupabaseService } from "../supabase/supabase.service";

const DEFAULT_LOCALE = {
  country_code: "BR",
  locale: "pt-BR",
  currency_code: "BRL",
  phone_country_code: "+55",
  timezone: "America/Sao_Paulo",
};

/** Columns present on staging restore + prod. */
const COMPANY_CONFIG_BASE_COLUMNS = [
  "id",
  "name",
  "subdomain",
  "domain",
  "is_active",
  "logo_url",
  "primary_color",
  "secondary_color",
] as const;

/**
 * Cosmetic / locale columns present on fuller schemas (prod) but absent on
 * staging restore. Never hard-fail the API when these are missing (42703).
 */
const COMPANY_CONFIG_OPTIONAL_COLUMNS = [
  "tagline",
  "country_code",
  "locale",
  "currency_code",
  "phone_country_code",
  "timezone",
  "niche_id",
  "subnicho_slug",
  "segment",
  "release_channel",
] as const;

const COMPANY_ENTITLEMENTS_BASE_COLUMNS = ["id"] as const;
const COMPANY_ENTITLEMENTS_OPTIONAL_COLUMNS = ["status_financial"] as const;

type PostgrestLikeError = { code?: string; message?: string } | null;

function isMissingColumnError(error: PostgrestLikeError): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .* does not exist/i.test(error.message || "");
}

function missingColumnName(error: PostgrestLikeError): string | null {
  const msg = error?.message || "";
  const match =
    msg.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i) ||
    msg.match(/Could not find the '(\w+)' column/i);
  return match?.[1] ?? null;
}

@Injectable()
export class TenantEntitlementsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async getConfig(tenantId: string): Promise<TenantConfigV1 | null> {
    const { data, error } = await this.selectCompanyRow(
      tenantId,
      [...COMPANY_CONFIG_BASE_COLUMNS],
      [...COMPANY_CONFIG_OPTIONAL_COLUMNS],
      "TENANT_CONFIG_LOAD_FAILED",
    );
    if (!data) return null;

    return {
      schemaVersion: TENANT_CONFIG_SCHEMA_VERSION,
      id: data.id as string,
      name: data.name as string,
      subdomain: (data.subdomain as string | null) ?? null,
      domain: (data.domain as string | null) ?? null,
      is_active: (data.is_active as boolean | undefined) ?? true,
      branding: {
        logo_url: (data.logo_url as string | null) ?? null,
        primary_color: (data.primary_color as string | null) ?? null,
        secondary_color: (data.secondary_color as string | null) ?? null,
        tagline: (data.tagline as string | null | undefined) ?? null,
      },
      locale: {
        country_code: (data.country_code as string | null | undefined) ?? DEFAULT_LOCALE.country_code,
        locale: (data.locale as string | null | undefined) ?? DEFAULT_LOCALE.locale,
        currency_code:
          (data.currency_code as string | null | undefined) ?? DEFAULT_LOCALE.currency_code,
        phone_country_code:
          (data.phone_country_code as string | null | undefined) ??
          DEFAULT_LOCALE.phone_country_code,
        timezone: (data.timezone as string | null | undefined) ?? DEFAULT_LOCALE.timezone,
      },
      niche: {
        niche_id: (data.niche_id as string | null | undefined) ?? null,
        subnicho_slug: (data.subnicho_slug as string | null | undefined) ?? null,
        segment: (data.segment as string | null | undefined) ?? null,
      },
      releaseChannel: (data.release_channel as string | null | undefined) ?? null,
    };
  }

  async getEntitlements(tenantId: string): Promise<TenantEntitlementsV1 | null> {
    const { data: company } = await this.selectCompanyRow(
      tenantId,
      [...COMPANY_ENTITLEMENTS_BASE_COLUMNS],
      [...COMPANY_ENTITLEMENTS_OPTIONAL_COLUMNS],
      "TENANT_ENTITLEMENTS_LOAD_FAILED",
    );
    if (!company) return null;

    const [enabledModules, planContext, flagCatalog, flagOverrides] = await Promise.all([
      this.loadEnabledModules(tenantId),
      this.loadPlanContext(tenantId),
      this.loadFlagCatalog(),
      this.loadFlagOverrides(tenantId),
    ]);

    const modules = resolveEffectiveModules(enabledModules, planContext.planModules);
    const flags = resolveEffectiveFlags(flagCatalog, flagOverrides);

    return {
      schemaVersion: TENANT_ENTITLEMENTS_SCHEMA_VERSION,
      tenantId,
      planCode: planContext.planCode,
      contractStatus: planContext.contractStatus,
      modules,
      limits: planContext.limits,
      financialStatus: (company.status_financial as string | null | undefined) ?? null,
      flags,
    };
  }

  /**
   * Select company columns with graceful degradation for staging schema gaps.
   * Retries without optional columns when Postgres returns 42703.
   */
  private async selectCompanyRow(
    tenantId: string,
    required: string[],
    optional: string[],
    errorPrefix: string,
  ): Promise<{ data: Record<string, unknown> | null }> {
    let columns = [...required, ...optional];
    const maxAttempts = optional.length + 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data, error } = await this.supabase
        .admin()
        .from("companies")
        .select(columns.join(","))
        .eq("id", tenantId)
        .maybeSingle();

      if (!error) {
        return { data: (data as Record<string, unknown> | null) ?? null };
      }

      if (!isMissingColumnError(error)) {
        throw new Error(`${errorPrefix}:${error.code || "unknown"}:${error.message || ""}`);
      }

      const missing = missingColumnName(error);
      if (missing && columns.includes(missing)) {
        if (required.includes(missing)) {
          throw new Error(`${errorPrefix}:${error.code || "unknown"}:${error.message || ""}`);
        }
        columns = columns.filter((col) => col !== missing);
        continue;
      }

      // Unknown missing column name — drop all remaining optional and retry once.
      const withoutOptional = columns.filter((col) => required.includes(col));
      if (withoutOptional.length === columns.length) {
        throw new Error(`${errorPrefix}:${error.code || "unknown"}:${error.message || ""}`);
      }
      columns = withoutOptional;
    }

    throw new Error(`${errorPrefix}:unknown:exhausted_column_retries`);
  }

  private async loadEnabledModules(tenantId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .admin()
      .from("company_modules")
      .select("is_enabled, modules!inner(slug)")
      .eq("company_id", tenantId)
      .eq("is_enabled", true);

    if (error) {
      throw new Error(
        `TENANT_MODULES_LOAD_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }

    return (data ?? [])
      .map((row) => {
        const modules = row.modules as { slug?: string } | { slug?: string }[] | null;
        if (Array.isArray(modules)) return modules[0]?.slug;
        return modules?.slug;
      })
      .filter((slug): slug is string => typeof slug === "string");
  }

  private async loadPlanContext(tenantId: string): Promise<{
    planCode: string | null;
    contractStatus: string | null;
    planModules: string[];
    limits: Record<string, unknown>;
  }> {
    const { data: contract, error: contractError } = await this.supabase
      .admin()
      .from("billing_contracts")
      .select("status, plan_id, billing_plans(code, included_modules)")
      .eq("company_id", tenantId)
      .in("status", ["active", "past_due", "grace_period", "restricted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contractError) {
      // Staging may lack billing tables; treat as no plan rather than 503.
      if (
        contractError.code === "PGRST205" ||
        contractError.code === "42P01" ||
        /does not exist|Could not find the table/i.test(contractError.message || "")
      ) {
        return { planCode: null, contractStatus: null, planModules: [], limits: {} };
      }
      throw new Error(
        `TENANT_CONTRACT_LOAD_FAILED:${contractError.code || "unknown"}:${contractError.message || ""}`,
      );
    }

    if (!contract?.plan_id) {
      return { planCode: null, contractStatus: null, planModules: [], limits: {} };
    }

    const plan = contract.billing_plans as
      | { code?: string; included_modules?: string[] }
      | { code?: string; included_modules?: string[] }[]
      | null;
    const planRow = Array.isArray(plan) ? plan[0] : plan;
    const planCode = planRow?.code ?? null;
    const includedFromPlan = (planRow?.included_modules ?? []) as string[];

    const { data: planModuleRows, error: planModuleError } = await this.supabase
      .admin()
      .from("billing_plan_modules")
      .select("limits, modules!inner(slug)")
      .eq("plan_id", contract.plan_id)
      .eq("is_included", true);

    if (planModuleError) {
      if (
        planModuleError.code === "PGRST205" ||
        planModuleError.code === "42P01" ||
        /does not exist|Could not find the table/i.test(planModuleError.message || "")
      ) {
        return {
          planCode,
          contractStatus: (contract.status as string | null) ?? null,
          planModules: includedFromPlan,
          limits: {},
        };
      }
      throw new Error(
        `TENANT_PLAN_MODULES_LOAD_FAILED:${planModuleError.code || "unknown"}:${planModuleError.message || ""}`,
      );
    }

    const limitsRows = (planModuleRows ?? []).map((row) => {
      const modules = row.modules as { slug?: string } | { slug?: string }[] | null;
      const slug = Array.isArray(modules) ? modules[0]?.slug : modules?.slug;
      return {
        module_slug: slug ?? "unknown",
        limits: (row.limits as Record<string, unknown> | null) ?? {},
      };
    });

    const planModulesFromJoin = limitsRows
      .map((row) => row.module_slug)
      .filter((slug) => slug !== "unknown");
    const planModules =
      includedFromPlan.length > 0 ? includedFromPlan : planModulesFromJoin;

    return {
      planCode,
      contractStatus: (contract.status as string | null) ?? null,
      planModules,
      limits: mergeModuleLimits(limitsRows),
    };
  }

  private async loadFlagCatalog() {
    const { data, error } = await this.supabase
      .admin()
      .from("core_feature_flags")
      .select("key,module_slug,default_value")
      .eq("is_active", true);

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        /does not exist|Could not find the table/i.test(error.message || "")
      ) {
        return [];
      }
      throw new Error(
        `TENANT_FLAG_CATALOG_LOAD_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }

    return (data ?? []).map((row) => ({
      key: row.key as string,
      module_slug: (row.module_slug as string | null) ?? null,
      default_value: (row.default_value as boolean | undefined) ?? false,
    }));
  }

  private async loadFlagOverrides(tenantId: string) {
    const { data, error } = await this.supabase
      .admin()
      .from("core_company_feature_values")
      .select("flag_key,module_slug,value")
      .eq("company_id", tenantId);

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        /does not exist|Could not find the table/i.test(error.message || "")
      ) {
        return [];
      }
      throw new Error(
        `TENANT_FLAG_OVERRIDES_LOAD_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }

    return (data ?? []).map((row) => ({
      flag_key: row.flag_key as string,
      module_slug: (row.module_slug as string | null) ?? null,
      value: (row.value as boolean | undefined) ?? false,
    }));
  }
}
