import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Adoption & Feature Usage — Fase 39.
 * Adoção de módulos por tenant, uso de feature flags, IA e N8N.
 */
export const getAdoptionUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(365, d?.days ?? 30)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [companiesRes, cmRes, modulesRes, ffvRes, ffRes, n8nRes, aiGenRes] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, name, is_active, is_demo, status, niche_id, created_at")
        .eq("is_active", true)
        .neq("is_demo", true)
        .limit(5000),
      supabaseAdmin
        .from("company_modules")
        .select("company_id, module_id, is_enabled, enabled_at, installed_at")
        .limit(50000),
      supabaseAdmin
        .from("modules")
        .select("id, slug, name, category, is_core, is_active")
        .limit(500),
      supabaseAdmin
        .from("core_company_feature_values")
        .select("company_id, flag_key, value, updated_at")
        .limit(20000),
      supabaseAdmin
        .from("core_feature_flags")
        .select("key, label, category, default_value, is_active")
        .eq("is_active", true)
        .limit(500),
      supabaseAdmin
        .from("n8n_workflow_runs")
        .select("tenant_id, workflow_name, status, regua, started_at, latency_ms")
        .gte("started_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("ai_project_generations")
        .select("company_id, status, ai_model, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
    ]);

    const companies = companiesRes.data ?? [];
    const cms = cmRes.data ?? [];
    const modules = modulesRes.data ?? [];
    const ffv = ffvRes.data ?? [];
    const flags = ffRes.data ?? [];
    const n8n = n8nRes.data ?? [];
    const aiGen = aiGenRes.data ?? [];

    const totalTenants = companies.length;
    const moduleMap = new Map(modules.map((m) => [m.id, m]));

    // ---- Adoção por módulo ----
    const enabledByModule = new Map<string, Set<string>>();
    for (const cm of cms) {
      if (!cm.is_enabled || !cm.module_id || !cm.company_id) continue;
      let s = enabledByModule.get(cm.module_id);
      if (!s) { s = new Set(); enabledByModule.set(cm.module_id, s); }
      s.add(cm.company_id);
    }
    const moduleAdoption = modules
      .filter((m) => m.is_active)
      .map((m) => {
        const tenants = enabledByModule.get(m.id)?.size ?? 0;
        return {
          slug: m.slug,
          name: m.name,
          category: m.category,
          isCore: !!m.is_core,
          tenants,
          adoptionPct: totalTenants ? (tenants / totalTenants) * 100 : 0,
        };
      })
      .sort((a, b) => b.tenants - a.tenants);

    const avgModulesPerTenant = totalTenants
      ? cms.filter((c) => c.is_enabled).length / totalTenants
      : 0;

    // ---- Tenants sem nenhum módulo ----
    const tenantsWithModules = new Set(cms.filter((c) => c.is_enabled).map((c) => c.company_id));
    const tenantsWithoutModules = companies.filter((c) => !tenantsWithModules.has(c.id)).length;

    // ---- Feature flags adoção ----
    const flagAdoption = new Map<string, number>();
    for (const v of ffv) {
      const val = v.value as unknown;
      const truthy = val === true || val === "true" || (typeof val === "object" && val !== null && (val as any).enabled === true);
      if (truthy && v.flag_key) flagAdoption.set(v.flag_key, (flagAdoption.get(v.flag_key) ?? 0) + 1);
    }
    const flagsUsage = flags
      .map((f) => ({
        key: f.key,
        label: f.label,
        category: f.category,
        tenants: flagAdoption.get(f.key) ?? 0,
        adoptionPct: totalTenants ? ((flagAdoption.get(f.key) ?? 0) / totalTenants) * 100 : 0,
      }))
      .sort((a, b) => b.tenants - a.tenants)
      .slice(0, 20);

    // ---- N8N por tenant ----
    const n8nByTenant = new Map<string, { runs: number; failures: number; latencySum: number; latencyN: number }>();
    const n8nByWorkflow = new Map<string, { runs: number; failures: number }>();
    for (const r of n8n) {
      const t = r.tenant_id ?? "—";
      const cur = n8nByTenant.get(t) ?? { runs: 0, failures: 0, latencySum: 0, latencyN: 0 };
      cur.runs++;
      if (r.status === "error" || r.status === "failed") cur.failures++;
      if (typeof r.latency_ms === "number") { cur.latencySum += r.latency_ms; cur.latencyN++; }
      n8nByTenant.set(t, cur);

      const wf = r.workflow_name ?? "—";
      const w = n8nByWorkflow.get(wf) ?? { runs: 0, failures: 0 };
      w.runs++;
      if (r.status === "error" || r.status === "failed") w.failures++;
      n8nByWorkflow.set(wf, w);
    }
    const n8nTotalRuns = n8n.length;
    const n8nTotalFailures = n8n.filter((r) => r.status === "error" || r.status === "failed").length;
    const n8nFailureRate = n8nTotalRuns ? (n8nTotalFailures / n8nTotalRuns) * 100 : 0;
    const n8nActiveTenants = n8nByTenant.size;
    const topWorkflows = Array.from(n8nByWorkflow.entries())
      .map(([wf, v]) => ({ workflow: wf, runs: v.runs, failures: v.failures, failureRate: v.runs ? (v.failures / v.runs) * 100 : 0 }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 10);

    // ---- IA usage ----
    const aiByModel = aiGen.reduce<Record<string, number>>((acc, r) => {
      const k = r.ai_model ?? "—";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const aiByStatus = aiGen.reduce<Record<string, number>>((acc, r) => {
      const k = r.status ?? "—";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const aiActiveTenants = new Set(aiGen.map((r) => r.company_id).filter(Boolean)).size;

    // ---- Top tenants por engajamento (módulos + n8n runs) ----
    const enabledByTenant = new Map<string, number>();
    for (const cm of cms) {
      if (!cm.is_enabled || !cm.company_id) continue;
      enabledByTenant.set(cm.company_id, (enabledByTenant.get(cm.company_id) ?? 0) + 1);
    }
    const topTenants = companies
      .map((c) => {
        const n = n8nByTenant.get(c.id);
        return {
          id: c.id,
          name: c.name,
          modules: enabledByTenant.get(c.id) ?? 0,
          n8nRuns: n?.runs ?? 0,
          n8nFailures: n?.failures ?? 0,
          avgLatencyMs: n && n.latencyN ? Math.round(n.latencySum / n.latencyN) : null,
        };
      })
      .sort((a, b) => (b.modules * 100 + b.n8nRuns) - (a.modules * 100 + a.n8nRuns))
      .slice(0, 20);

    return {
      windowDays: data.days,
      totals: {
        tenants: totalTenants,
        modules: modules.filter((m) => m.is_active).length,
        avgModulesPerTenant,
        tenantsWithoutModules,
        flagsActive: flags.length,
        n8nRuns: n8nTotalRuns,
        n8nFailureRate,
        n8nActiveTenants,
        aiGenerations: aiGen.length,
        aiActiveTenants,
      },
      moduleAdoption: moduleAdoption.slice(0, 30),
      flagsUsage,
      topWorkflows,
      aiByModel,
      aiByStatus,
      topTenants,
    };
  });
