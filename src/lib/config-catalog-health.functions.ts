import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Configuration, Catalog & Feature Flags Cockpit — Fase 79.
 * Catálogo de módulos, niches, planos, feature flags, settings,
 * dashboard widgets, menu items, compliance e SLOs.
 */
export const getConfigCatalogHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const [modsRes, modCatRes, macroRes, subRes, nichesRes, nichModRes, nichPlanRes, ffRes, setRes, defRes, wdgRes, menRes, compRes, sloRes] = await Promise.all([
      supabaseAdmin.from("modules").select("id, slug, category, is_active, is_core, status, readiness_status, status_tecnico, status_comercial, monthly_price, show_in_checkout, allow_white_label").limit(2000),
      supabaseAdmin.from("core_module_catalog").select("id, slug, category, active, base_price_cents").limit(2000),
      supabaseAdmin.from("core_macro_nichos").select("id, slug").limit(500),
      supabaseAdmin.from("core_subnichos").select("id, macro_id, slug").limit(2000),
      supabaseAdmin.from("niches").select("id, slug, macro_slug, is_active").limit(500),
      supabaseAdmin.from("core_niche_modules").select("id, niche_id, module_slug, is_recommended, is_optional").limit(5000),
      supabaseAdmin.from("core_niche_plan_modules").select("id, macro_slug, plan_tier, choose_limit, modules").limit(2000),
      supabaseAdmin.from("core_feature_flags").select("id, module_slug, key, default_value, category, is_active").limit(5000),
      supabaseAdmin.from("core_settings").select("key, category, is_editable, updated_at").limit(2000),
      supabaseAdmin.from("setting_definitions").select("id, key, category, value_type, is_company_editable").limit(2000),
      supabaseAdmin.from("core_dashboard_widgets").select("id, dashboard_key, widget_type, is_visible, niche_slugs").limit(5000),
      supabaseAdmin.from("core_menu_items").select("id, scope, audience, is_visible, is_system, required_plan_codes").limit(5000),
      supabaseAdmin.from("core_compliance_requirements").select("id, scope, requirement_key, document_kind, blocking, applies_to, active").limit(2000),
      supabaseAdmin.from("core_slo_targets").select("id, scope, name, availability_target_bps, latency_p95_target_ms, active").limit(2000),
    ]);

    const err = modsRes.error || modCatRes.error || macroRes.error || subRes.error || nichesRes.error || nichModRes.error || nichPlanRes.error || ffRes.error || setRes.error || defRes.error || wdgRes.error || menRes.error || compRes.error || sloRes.error;
    if (err) throw new Error(err.message);

    const mods = modsRes.data ?? [];
    const cat = modCatRes.data ?? [];
    const macros = macroRes.data ?? [];
    const subs = subRes.data ?? [];
    const niches = nichesRes.data ?? [];
    const nichMods = nichModRes.data ?? [];
    const nichPlans = nichPlanRes.data ?? [];
    const flags = ffRes.data ?? [];
    const settings = setRes.data ?? [];
    const defs = defRes.data ?? [];
    const widgets = wdgRes.data ?? [];
    const menus = menRes.data ?? [];
    const compliance = compRes.data ?? [];
    const slos = sloRes.data ?? [];

    // Modules
    const modsActive = mods.filter((m) => m.is_active).length;
    const modsCore = mods.filter((m) => m.is_core).length;
    const modsCheckout = mods.filter((m) => m.show_in_checkout).length;
    const modsWL = mods.filter((m) => m.allow_white_label).length;
    const modCatMap = new Map<string, number>();
    for (const m of mods) { const k = m.category || "—"; modCatMap.set(k, (modCatMap.get(k) ?? 0) + 1); }
    const modCategories = Array.from(modCatMap, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
    const readinessMap = new Map<string, number>();
    for (const m of mods) { const k = m.readiness_status || m.status || "—"; readinessMap.set(k, (readinessMap.get(k) ?? 0) + 1); }
    const readiness = Array.from(readinessMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const techStatusMap = new Map<string, number>();
    for (const m of mods) { const k = m.status_tecnico || "—"; techStatusMap.set(k, (techStatusMap.get(k) ?? 0) + 1); }
    const techStatus = Array.from(techStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    // Module catalog
    const catActive = cat.filter((c) => c.active).length;
    const avgPrice = cat.length ? cat.reduce((s, c) => s + Number(c.base_price_cents || 0), 0) / cat.length / 100 : 0;

    // Niches
    const nichesActive = niches.filter((n) => n.is_active).length;
    const macroNicheMap = new Map<string, number>();
    for (const n of niches) { const k = n.macro_slug || "—"; macroNicheMap.set(k, (macroNicheMap.get(k) ?? 0) + 1); }
    const nichesByMacro = Array.from(macroNicheMap, ([macro, count]) => ({ macro, count })).sort((a, b) => b.count - a.count);

    // Niche-module mappings
    const nichModRecommended = nichMods.filter((n) => n.is_recommended).length;
    const nichModOptional = nichMods.filter((n) => n.is_optional).length;

    // Plans
    const planTierMap = new Map<string, number>();
    for (const p of nichPlans) { const k = p.plan_tier || "—"; planTierMap.set(k, (planTierMap.get(k) ?? 0) + 1); }
    const planTiers = Array.from(planTierMap, ([tier, count]) => ({ tier, count })).sort((a, b) => b.count - a.count);
    const avgChooseLimit = nichPlans.length ? nichPlans.reduce((s, p) => s + Number(p.choose_limit || 0), 0) / nichPlans.length : 0;
    const avgPlanModules = nichPlans.length ? nichPlans.reduce((s, p) => s + (Array.isArray(p.modules) ? p.modules.length : 0), 0) / nichPlans.length : 0;

    // Feature flags
    const flagsActive = flags.filter((f) => f.is_active).length;
    const flagsDefaultTrue = flags.filter((f) => f.default_value === true).length;
    const flagCatMap = new Map<string, number>();
    for (const f of flags) { const k = f.category || "—"; flagCatMap.set(k, (flagCatMap.get(k) ?? 0) + 1); }
    const flagCategories = Array.from(flagCatMap, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
    const flagModMap = new Map<string, number>();
    for (const f of flags) { const k = f.module_slug || "—"; flagModMap.set(k, (flagModMap.get(k) ?? 0) + 1); }
    const flagsByModule = Array.from(flagModMap, ([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    // Settings & definitions
    const settingsEditable = settings.filter((s) => s.is_editable).length;
    const defsCompEditable = defs.filter((d) => d.is_company_editable).length;
    const setCatMap = new Map<string, number>();
    for (const s of settings) { const k = s.category || "—"; setCatMap.set(k, (setCatMap.get(k) ?? 0) + 1); }
    const settingCategories = Array.from(setCatMap, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

    // Widgets
    const widgetsVisible = widgets.filter((w) => w.is_visible).length;
    const wdgDashMap = new Map<string, number>();
    for (const w of widgets) { const k = w.dashboard_key || "—"; wdgDashMap.set(k, (wdgDashMap.get(k) ?? 0) + 1); }
    const widgetsByDashboard = Array.from(wdgDashMap, ([dashboard, count]) => ({ dashboard, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    // Menus
    const menusVisible = menus.filter((m) => m.is_visible).length;
    const menusSystem = menus.filter((m) => m.is_system).length;
    const scopeMap = new Map<string, number>();
    for (const m of menus) { const k = m.scope || "—"; scopeMap.set(k, (scopeMap.get(k) ?? 0) + 1); }
    const menuScopes = Array.from(scopeMap, ([scope, count]) => ({ scope, count })).sort((a, b) => b.count - a.count);

    // Compliance
    const compActive = compliance.filter((c) => c.active).length;
    const compBlocking = compliance.filter((c) => c.blocking).length;
    const compKindMap = new Map<string, number>();
    for (const c of compliance) { const k = c.document_kind || "—"; compKindMap.set(k, (compKindMap.get(k) ?? 0) + 1); }
    const complianceKinds = Array.from(compKindMap, ([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);

    // SLOs
    const sloActive = slos.filter((s) => s.active).length;
    const avgAvail = slos.length ? slos.reduce((s, x) => s + Number(x.availability_target_bps || 0), 0) / slos.length / 100 : 0;
    const avgP95 = slos.length ? slos.reduce((s, x) => s + Number(x.latency_p95_target_ms || 0), 0) / slos.length : 0;

    return {
      modules: {
        total: mods.length,
        active: modsActive,
        core: modsCore,
        inCheckout: modsCheckout,
        whiteLabel: modsWL,
        categories: modCategories,
        readiness,
        techStatus,
        catalogTotal: cat.length,
        catalogActive: catActive,
        catalogAvgPrice: avgPrice,
      },
      niches: {
        macros: macros.length,
        subs: subs.length,
        total: niches.length,
        active: nichesActive,
        byMacro: nichesByMacro,
        moduleMappings: nichMods.length,
        recommendedMappings: nichModRecommended,
        optionalMappings: nichModOptional,
      },
      plans: {
        configurations: nichPlans.length,
        tiers: planTiers,
        avgChooseLimit,
        avgModulesPerPlan: avgPlanModules,
      },
      flags: {
        total: flags.length,
        active: flagsActive,
        defaultTrue: flagsDefaultTrue,
        categories: flagCategories,
        byModule: flagsByModule,
      },
      settings: {
        total: settings.length,
        editable: settingsEditable,
        definitions: defs.length,
        companyEditable: defsCompEditable,
        categories: settingCategories,
      },
      widgets: {
        total: widgets.length,
        visible: widgetsVisible,
        byDashboard: widgetsByDashboard,
      },
      menus: {
        total: menus.length,
        visible: menusVisible,
        system: menusSystem,
        scopes: menuScopes,
      },
      compliance: {
        total: compliance.length,
        active: compActive,
        blocking: compBlocking,
        kinds: complianceKinds,
      },
      slos: {
        total: slos.length,
        active: sloActive,
        avgAvailabilityPct: avgAvail,
        avgP95Ms: avgP95,
      },
      generatedAt: new Date().toISOString(),
    };
  });
