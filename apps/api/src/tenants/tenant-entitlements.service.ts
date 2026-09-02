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

@Injectable()
export class TenantEntitlementsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async getConfig(tenantId: string): Promise<TenantConfigV1 | null> {
    const { data, error } = await this.supabase
      .admin()
      .from("companies")
      .select(
        "id,name,subdomain,domain,is_active,logo_url,primary_color,secondary_color,tagline,country_code,locale,currency_code,phone_country_code,timezone,niche_id,subnicho_slug,segment,release_channel",
      )
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      throw new Error(`TENANT_CONFIG_LOAD_FAILED:${error.code || "unknown"}:${error.message || ""}`);
    }
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
        tagline: (data.tagline as string | null) ?? null,
      },
      locale: {
        country_code: (data.country_code as string | null) ?? DEFAULT_LOCALE.country_code,
        locale: (data.locale as string | null) ?? DEFAULT_LOCALE.locale,
        currency_code: (data.currency_code as string | null) ?? DEFAULT_LOCALE.currency_code,
        phone_country_code:
          (data.phone_country_code as string | null) ?? DEFAULT_LOCALE.phone_country_code,
        timezone: (data.timezone as string | null) ?? DEFAULT_LOCALE.timezone,
      },
      niche: {
        niche_id: (data.niche_id as string | null) ?? null,
        subnicho_slug: (data.subnicho_slug as string | null) ?? null,
        segment: (data.segment as string | null) ?? null,
      },
      releaseChannel: (data.release_channel as string | null) ?? null,
    };
  }

  async getEntitlements(tenantId: string): Promise<TenantEntitlementsV1 | null> {
    const { data: company, error: companyError } = await this.supabase
      .admin()
      .from("companies")
      .select("id,status_financial")
      .eq("id", tenantId)
      .maybeSingle();

    if (companyError) {
      throw new Error(
        `TENANT_ENTITLEMENTS_LOAD_FAILED:${companyError.code || "unknown"}:${companyError.message || ""}`,
      );
    }
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
      financialStatus: (company.status_financial as string | null) ?? null,
      flags,
    };
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
