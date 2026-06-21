import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const fetchCatalogMatrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {} = {}) => d)
  .handler(async ({ context }) => {
    await ensureAdmin(context);

    const [modRes, nicheRes, nicheModRes, planTierRes, billingPlansRes, companyPlansRes] = await Promise.all([
      context.supabase
        .from("core_module_catalog" as any)
        .select("slug,name,category,niches,base_price_cents,active")
        .order("name"),
      context.supabase
        .from("niches" as any)
        .select("id,slug,name,macro_slug,is_active")
        .order("name"),
      context.supabase
        .from("core_niche_modules" as any)
        .select("niche_id,module_slug,is_recommended,is_optional"),
      context.supabase
        .from("core_niche_plan_modules" as any)
        .select("macro_slug,plan_tier,modules,choose_limit"),
      context.supabase
        .from("billing_plans" as any)
        .select("id,code,name,recurring_amount,is_active,included_modules,included_module_count,extra_module_price")
        .order("recurring_amount"),
      context.supabase
        .from("core_company_plans" as any)
        .select("id,slug,nome,preco_sm,max_modulos,ativo")
        .order("ordem"),
    ]);

    const modules = (modRes.data ?? []) as any[];
    const niches = (nicheRes.data ?? []) as any[];
    const nicheModules = (nicheModRes.data ?? []) as any[];
    const planTiers = (planTierRes.data ?? []) as any[];
    const billingPlans = (billingPlansRes.data ?? []) as any[];
    const companyPlans = (companyPlansRes.data ?? []) as any[];

    const moduleSlugs = new Set(modules.map((m) => m.slug));
    const nicheSlugs = new Set(niches.map((n) => n.slug));
    const nicheById = new Map(niches.map((n) => [n.id, n]));
    const macroSlugs = new Set(niches.map((n) => n.macro_slug).filter(Boolean));

    // Inconsistências
    const issues: Array<{ severity: "error" | "warn"; source: string; message: string; ref?: string }> = [];

    // 1. core_module_catalog.niches referencia slug que não existe em niches
    for (const m of modules) {
      const ns: string[] = m.niches ?? [];
      for (const ns_ of ns) {
        if (ns_ && !nicheSlugs.has(ns_) && !macroSlugs.has(ns_)) {
          issues.push({ severity: "warn", source: "core_module_catalog", message: `Módulo ${m.slug} referencia nicho inexistente "${ns_}"`, ref: m.slug });
        }
      }
      if (!m.active) issues.push({ severity: "warn", source: "core_module_catalog", message: `Módulo ${m.slug} inativo`, ref: m.slug });
    }

    // 2. core_niche_modules.module_slug não existe no catálogo
    for (const nm of nicheModules) {
      if (!moduleSlugs.has(nm.module_slug)) {
        issues.push({
          severity: "error",
          source: "core_niche_modules",
          message: `Nicho ${nicheById.get(nm.niche_id)?.slug ?? nm.niche_id} amarrado a módulo inexistente "${nm.module_slug}"`,
          ref: nm.module_slug,
        });
      }
    }

    // 3. core_niche_plan_modules.modules referencia slug inexistente
    for (const pt of planTiers) {
      const mods: string[] = pt.modules ?? [];
      for (const slug of mods) {
        if (!moduleSlugs.has(slug)) {
          issues.push({
            severity: "error",
            source: "core_niche_plan_modules",
            message: `Tier ${pt.macro_slug}/${pt.plan_tier} referencia módulo inexistente "${slug}"`,
            ref: slug,
          });
        }
      }
      if (!macroSlugs.has(pt.macro_slug)) {
        issues.push({
          severity: "warn",
          source: "core_niche_plan_modules",
          message: `Tier referencia macro "${pt.macro_slug}" sem nichos vinculados`,
          ref: pt.macro_slug,
        });
      }
    }

    // 4. billing_plans.included_modules referenciando slug inexistente
    for (const bp of billingPlans) {
      const mods: string[] = bp.included_modules ?? [];
      for (const slug of mods) {
        if (!moduleSlugs.has(slug)) {
          issues.push({
            severity: "error",
            source: "billing_plans",
            message: `Plano ${bp.code} inclui módulo inexistente "${slug}"`,
            ref: slug,
          });
        }
      }
      if (mods.length > 0 && bp.included_module_count != null && mods.length !== bp.included_module_count) {
        issues.push({
          severity: "warn",
          source: "billing_plans",
          message: `Plano ${bp.code}: included_modules tem ${mods.length} itens mas included_module_count=${bp.included_module_count}`,
          ref: bp.code,
        });
      }
    }

    // 5. Nichos sem nenhum módulo vinculado
    const nichesWithModules = new Set(nicheModules.map((nm) => nm.niche_id));
    for (const n of niches) {
      if (n.is_active && !nichesWithModules.has(n.id)) {
        issues.push({
          severity: "warn",
          source: "niches",
          message: `Nicho ativo "${n.slug}" não tem módulos amarrados`,
          ref: n.slug,
        });
      }
    }

    // Matriz módulo × nicho
    const moduleNicheMatrix: Record<string, Record<string, "recommended" | "optional" | "linked">> = {};
    for (const nm of nicheModules) {
      const niche = nicheById.get(nm.niche_id);
      if (!niche) continue;
      moduleNicheMatrix[nm.module_slug] = moduleNicheMatrix[nm.module_slug] ?? {};
      moduleNicheMatrix[nm.module_slug][niche.slug] = nm.is_recommended
        ? "recommended"
        : nm.is_optional
        ? "optional"
        : "linked";
    }

    return {
      counts: {
        modules: modules.length,
        modulesActive: modules.filter((m) => m.active).length,
        niches: niches.length,
        nichesActive: niches.filter((n) => n.is_active).length,
        nicheModules: nicheModules.length,
        planTiers: planTiers.length,
        billingPlans: billingPlans.length,
        billingPlansActive: billingPlans.filter((b) => b.is_active).length,
        companyPlans: companyPlans.length,
        issues: issues.length,
        errors: issues.filter((i) => i.severity === "error").length,
      },
      modules: modules.map((m) => ({
        slug: m.slug,
        name: m.name,
        category: m.category,
        priceCents: m.base_price_cents,
        active: m.active,
        niches: m.niches ?? [],
      })),
      niches: niches.map((n) => ({ id: n.id, slug: n.slug, name: n.name, macro: n.macro_slug, active: n.is_active })),
      billingPlans: billingPlans.map((bp) => ({
        code: bp.code,
        name: bp.name,
        recurring: Number(bp.recurring_amount ?? 0),
        active: bp.is_active,
        modules: bp.included_modules ?? [],
        moduleCount: bp.included_module_count,
        extraPrice: Number(bp.extra_module_price ?? 0),
      })),
      planTiers: planTiers.map((pt) => ({
        macro: pt.macro_slug,
        tier: pt.plan_tier,
        chooseLimit: pt.choose_limit,
        modules: pt.modules ?? [],
      })),
      moduleNicheMatrix,
      issues: issues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1)),
    };
  });
