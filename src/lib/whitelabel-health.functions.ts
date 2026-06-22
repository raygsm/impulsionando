import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * White-Label & Vitrine Cockpit — Fase 60.
 * Planos WL, assinaturas, links de empresas, páginas geradas, vitrine pública e exports.
 */
export const getWhitelabelHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [plansRes, subsRes, linksRes, pagesRes, versRes, tplRes, vitrineRes, expRes] = await Promise.all([
      supabaseAdmin.from("wl_plans").select("id, slug, nome").limit(2000),
      supabaseAdmin.from("wl_subscriptions").select("id, created_at").limit(20000),
      supabaseAdmin.from("wl_company_links").select("id, wl_owner_id, plan_slug, status, pontos_consumidos, created_at").limit(50000),
      supabaseAdmin.from("generated_pages").select("id, company_id, template_id, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("generated_page_versions").select("id, page_id, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("site_templates").select("id, name, niche, status").limit(2000),
      supabaseAdmin.from("companies_vitrine_public").select("id, segment, address_state, rating_avg, rating_count, updated_at").limit(50000),
      supabaseAdmin.from("vitrine_export_logs").select("id, dataset, format, status, total_exported, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(20000),
    ]);

    const err = plansRes.error || subsRes.error || linksRes.error || pagesRes.error || versRes.error || tplRes.error || vitrineRes.error || expRes.error;
    if (err) throw new Error(err.message);

    const plans = plansRes.data ?? [];
    const subs = subsRes.data ?? [];
    const links = linksRes.data ?? [];
    const pages = pagesRes.data ?? [];
    const versions = versRes.data ?? [];
    const templates = tplRes.data ?? [];
    const vitrine = vitrineRes.data ?? [];
    const exports_ = expRes.data ?? [];

    const linksActive = links.filter((l) => l.status === "active" || l.status === "ativo").length;
    const totalPontos = links.reduce((s, l) => s + Number(l.pontos_consumidos || 0), 0);

    const ownerMap = new Map<string, { links: number; pontos: number }>();
    for (const l of links) {
      const k = l.wl_owner_id || "—";
      const cur = ownerMap.get(k) ?? { links: 0, pontos: 0 };
      cur.links++;
      cur.pontos += Number(l.pontos_consumidos || 0);
      ownerMap.set(k, cur);
    }
    const topOwners = Array.from(ownerMap, ([owner_id, v]) => ({ owner_id, ...v })).sort((a, b) => b.links - a.links).slice(0, 15);

    const planLinkMap = new Map<string, number>();
    for (const l of links) { const k = l.plan_slug || "—"; planLinkMap.set(k, (planLinkMap.get(k) ?? 0) + 1); }
    const planDist = Array.from(planLinkMap, ([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);

    const pagesPublished = pages.filter((p) => p.status === "published" || p.status === "active").length;
    const versionsPublished = versions.filter((v) => v.status === "published").length;

    const templatesActive = templates.filter((t) => t.status === "active" || t.status === "published").length;
    const tplNicheMap = new Map<string, number>();
    for (const t of templates) { const k = t.niche || "—"; tplNicheMap.set(k, (tplNicheMap.get(k) ?? 0) + 1); }
    const templateNiches = Array.from(tplNicheMap, ([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count);

    const vitrineSegMap = new Map<string, number>();
    for (const v of vitrine) { const k = v.segment || "—"; vitrineSegMap.set(k, (vitrineSegMap.get(k) ?? 0) + 1); }
    const vitrineSegs = Array.from(vitrineSegMap, ([segment, count]) => ({ segment, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const vitrineStateMap = new Map<string, number>();
    for (const v of vitrine) { const k = v.address_state || "—"; vitrineStateMap.set(k, (vitrineStateMap.get(k) ?? 0) + 1); }
    const vitrineStates = Array.from(vitrineStateMap, ([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const ratedVitrine = vitrine.filter((v) => Number(v.rating_count || 0) > 0);
    const avgRating = ratedVitrine.length ? ratedVitrine.reduce((s, v) => s + Number(v.rating_avg || 0), 0) / ratedVitrine.length : 0;

    const expDone = exports_.filter((e) => e.status === "completed" || e.status === "done").length;
    const expFailed = exports_.filter((e) => e.status === "failed" || e.status === "error").length;
    const expTotalRows = exports_.reduce((s, e) => s + Number(e.total_exported || 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      wl: {
        plans: plans.length,
        subscriptions: subs.length,
        links: links.length,
        activeLinks: linksActive,
        consumedPoints: totalPontos,
        planDistribution: planDist,
        topOwners,
      },
      pages: { total: pages.length, published: pagesPublished, versions: versions.length, versionsPublished, templates: templates.length, activeTemplates: templatesActive, templateNiches },
      vitrine: { total: vitrine.length, ratedCount: ratedVitrine.length, avgRating, segments: vitrineSegs, states: vitrineStates },
      exports: { total: exports_.length, done: expDone, failed: expFailed, totalRows: expTotalRows },
    };
  });
