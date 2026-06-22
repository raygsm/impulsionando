import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Expansion & Upsell Engine — Fase 31.
 * Radar de oportunidades de expansão para tenants ativos:
 *  - Upsell de plano: tenants saturando módulos inclusos + alta atividade
 *  - Cross-sell de módulos: recomendados do nicho ainda não habilitados
 *  - MRR potencial extra (delta para o próximo tier de plano)
 *
 * Score 0-100 (quanto maior, mais quente):
 *  +35 saturação de módulos (enabled ≥ included_module_count)
 *  +25 alta atividade (eventos 30d acima da mediana)
 *  +20 múltiplos módulos recomendados não habilitados (≥ 2)
 *  +10 contrato com idade ≥ 90 dias (maduro p/ upgrade)
 *  +10 nicho com plano superior disponível
 */
export const getExpansionEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { minScore?: number }) => ({ minScore: Math.max(0, Math.min(100, d?.minScore ?? 0)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const [companiesRes, contractsRes, plansRes, modulesRes, catalogRes, nicheModRes, eventsRes, nichesRes] =
      await Promise.all([
        supabaseAdmin
          .from("companies")
          .select("id, name, niche_id, status, is_active, is_demo, is_master, created_at")
          .eq("is_active", true)
          .eq("is_demo", false)
          .eq("is_master", false)
          .limit(5000),
        supabaseAdmin
          .from("billing_contracts")
          .select("id, company_id, plan_id, status, recurring_amount, created_at")
          .eq("status", "active")
          .limit(5000),
        supabaseAdmin
          .from("billing_plans")
          .select("id, code, name, recurring_amount, included_module_count, extra_module_price, is_active")
          .eq("is_active", true)
          .limit(500),
        supabaseAdmin
          .from("company_modules")
          .select("company_id, module_id, is_enabled")
          .eq("is_enabled", true)
          .limit(20000),
        supabaseAdmin
          .from("core_module_catalog")
          .select("id, slug, name, category, base_price_cents, niches")
          .eq("active", true)
          .limit(2000),
        supabaseAdmin
          .from("core_niche_modules")
          .select("niche_id, module_slug, is_recommended, is_optional")
          .eq("is_recommended", true)
          .limit(5000),
        supabaseAdmin
          .from("runtime_events")
          .select("company_id, occurred_at")
          .gte("occurred_at", since30)
          .limit(50000),
        supabaseAdmin.from("niches").select("id, slug, name").limit(500),
      ]);

    const companies = companiesRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const plans = plansRes.data ?? [];
    const modules = modulesRes.data ?? [];
    const catalog = catalogRes.data ?? [];
    const nicheMods = nicheModRes.data ?? [];
    const events = eventsRes.data ?? [];
    const niches = nichesRes.data ?? [];

    const planById = new Map(plans.map((p) => [p.id, p]));
    const moduleBySlug = new Map(catalog.map((m) => [m.slug, m]));
    const moduleById = new Map(catalog.map((m) => [m.id, m]));
    const nicheById = new Map(niches.map((n) => [n.id, n]));

    // Atividade por tenant (30d)
    const activityByCompany = new Map<string, number>();
    for (const e of events) {
      if (!e.company_id) continue;
      activityByCompany.set(e.company_id, (activityByCompany.get(e.company_id) ?? 0) + 1);
    }
    const activityValues = Array.from(activityByCompany.values()).sort((a, b) => a - b);
    const medianActivity = activityValues.length
      ? activityValues[Math.floor(activityValues.length / 2)]
      : 0;

    // Módulos habilitados por tenant
    const enabledByCompany = new Map<string, Set<string>>();
    for (const m of modules) {
      const slug = moduleById.get(m.module_id)?.slug;
      if (!slug) continue;
      if (!enabledByCompany.has(m.company_id)) enabledByCompany.set(m.company_id, new Set());
      enabledByCompany.get(m.company_id)!.add(slug);
    }

    // Recomendações por nicho
    const recommendedByNiche = new Map<string, string[]>();
    for (const nm of nicheMods) {
      if (!recommendedByNiche.has(nm.niche_id)) recommendedByNiche.set(nm.niche_id, []);
      recommendedByNiche.get(nm.niche_id)!.push(nm.module_slug);
    }

    // Próximo tier por preço
    const plansSortedByPrice = [...plans].sort(
      (a, b) => Number(a.recurring_amount ?? 0) - Number(b.recurring_amount ?? 0),
    );

    type Opportunity = {
      companyId: string;
      companyName: string;
      nicheName: string;
      score: number;
      currentPlan: string | null;
      currentMrr: number;
      enabledCount: number;
      includedCount: number;
      saturation: boolean;
      activity30d: number;
      contractAgeDays: number;
      missingRecommended: { slug: string; name: string; basePriceCents: number }[];
      suggestedPlan: { code: string; name: string; recurring: number } | null;
      mrrUpliftEstimate: number;
      signals: string[];
    };

    const opportunities: Opportunity[] = [];
    let totalMrrPotential = 0;

    for (const c of companies) {
      const contract = contracts.find((x) => x.company_id === c.id);
      const plan = contract?.plan_id ? planById.get(contract.plan_id) : null;
      const enabled = enabledByCompany.get(c.id) ?? new Set();
      const enabledCount = enabled.size;
      const includedCount = plan?.included_module_count ?? 0;
      const extraPrice = Number(plan?.extra_module_price ?? 0);
      const recurring = Number(contract?.recurring_amount ?? plan?.recurring_amount ?? 0);
      const extras = Math.max(0, enabledCount - includedCount);
      const currentMrr = recurring + extras * extraPrice;

      const activity = activityByCompany.get(c.id) ?? 0;
      const contractAgeDays = contract
        ? Math.floor((Date.now() - new Date(contract.created_at).getTime()) / 86400000)
        : 0;

      const recommended = recommendedByNiche.get(c.niche_id ?? "") ?? [];
      const missing = recommended
        .filter((slug) => !enabled.has(slug))
        .map((slug) => {
          const m = moduleBySlug.get(slug);
          return { slug, name: m?.name ?? slug, basePriceCents: Number(m?.base_price_cents ?? 0) };
        });

      const saturation = includedCount > 0 && enabledCount >= includedCount;
      const highActivity = activity > medianActivity && activity > 0;

      // Sugerir próximo plano (recurring maior que o atual)
      const nextPlan = plansSortedByPrice.find(
        (p) => Number(p.recurring_amount ?? 0) > recurring,
      );
      const mrrUplift = nextPlan ? Number(nextPlan.recurring_amount ?? 0) - recurring : 0;

      let score = 0;
      const signals: string[] = [];
      if (saturation) {
        score += 35;
        signals.push("Módulos saturados");
      }
      if (highActivity) {
        score += 25;
        signals.push("Alta atividade");
      }
      if (missing.length >= 2) {
        score += 20;
        signals.push(`${missing.length} módulos recomendados`);
      }
      if (contractAgeDays >= 90) {
        score += 10;
        signals.push("Contrato maduro");
      }
      if (nextPlan && mrrUplift > 0) {
        score += 10;
        signals.push("Plano superior disponível");
      }

      if (score <= 0) continue;

      const opp: Opportunity = {
        companyId: c.id,
        companyName: c.name,
        nicheName: c.niche_id ? nicheById.get(c.niche_id)?.name ?? "—" : "—",
        score,
        currentPlan: plan?.name ?? null,
        currentMrr,
        enabledCount,
        includedCount,
        saturation,
        activity30d: activity,
        contractAgeDays,
        missingRecommended: missing.slice(0, 5),
        suggestedPlan: nextPlan
          ? {
              code: nextPlan.code ?? "",
              name: nextPlan.name ?? "",
              recurring: Number(nextPlan.recurring_amount ?? 0),
            }
          : null,
        mrrUpliftEstimate: mrrUplift,
        signals,
      };
      opportunities.push(opp);
      totalMrrPotential += mrrUplift;
    }

    opportunities.sort((a, b) => b.score - a.score);

    const filtered = opportunities.filter((o) => o.score >= data.minScore);

    const kpis = {
      totalCompanies: companies.length,
      withContract: contracts.length,
      opportunities: filtered.length,
      upsellReady: filtered.filter((o) => o.saturation && o.suggestedPlan).length,
      crossSellReady: filtered.filter((o) => o.missingRecommended.length >= 2).length,
      hotLeads: filtered.filter((o) => o.score >= 70).length,
      mrrPotentialEstimate: Math.round(totalMrrPotential),
      medianActivity30d: medianActivity,
    };

    // Top módulos recomendados em falta no portfólio
    const missingAggregate = new Map<string, number>();
    for (const o of filtered) {
      for (const m of o.missingRecommended) {
        missingAggregate.set(m.slug, (missingAggregate.get(m.slug) ?? 0) + 1);
      }
    }
    const topMissingModules = Array.from(missingAggregate.entries())
      .map(([slug, count]) => ({
        slug,
        name: moduleBySlug.get(slug)?.name ?? slug,
        category: moduleBySlug.get(slug)?.category ?? "—",
        tenants: count,
      }))
      .sort((a, b) => b.tenants - a.tenants)
      .slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      kpis,
      opportunities: filtered.slice(0, 200),
      topMissingModules,
    };
  });
