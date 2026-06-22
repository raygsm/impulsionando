import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI Projects & Pages Cockpit — Fase 74.
 * Geração IA de projetos, biblioteca de prompts, páginas geradas e templates.
 */
export const getAiProjectsHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({
    days: Math.max(7, Math.min(180, d?.days ?? 30)),
  }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [genRes, filesRes, promptsRes, pagesRes, versRes, tplRes] = await Promise.all([
      supabaseAdmin.from("ai_project_generations")
        .select("id, company_id, status, ai_model, error_message, approved_at, provisioned_at, provisioning_started_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin.from("ai_project_files")
        .select("id, generation_id, kind, mime_type, size_bytes, created_at")
        .gte("created_at", sinceIso)
        .limit(100000),
      supabaseAdmin.from("ai_prompt_library")
        .select("id, name, category, niche, status, usage_count, version, created_at")
        .limit(5000),
      supabaseAdmin.from("generated_pages")
        .select("id, company_id, template_id, status, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin.from("generated_page_versions")
        .select("id, page_id, status, created_at")
        .gte("created_at", sinceIso)
        .limit(100000),
      supabaseAdmin.from("site_templates")
        .select("id, name, niche, status, created_at")
        .limit(5000),
    ]);

    const gens = genRes.data ?? [];
    const files = filesRes.data ?? [];
    const prompts = promptsRes.data ?? [];
    const pages = pagesRes.data ?? [];
    const vers = versRes.data ?? [];
    const tpls = tplRes.data ?? [];

    const genByStatus: Record<string, number> = {};
    const genByModel: Record<string, number> = {};
    let provLagSum = 0, provLagN = 0;
    for (const g of gens) {
      genByStatus[g.status ?? "—"] = (genByStatus[g.status ?? "—"] ?? 0) + 1;
      genByModel[g.ai_model ?? "—"] = (genByModel[g.ai_model ?? "—"] ?? 0) + 1;
      if (g.provisioned_at && g.provisioning_started_at) {
        provLagSum += (new Date(g.provisioned_at).getTime() - new Date(g.provisioning_started_at).getTime()) / 60000;
        provLagN++;
      }
    }
    const approvedGens = gens.filter((g: any) => g.approved_at).length;
    const provisionedGens = gens.filter((g: any) => g.provisioned_at).length;
    const failedGens = gens.filter((g: any) => g.status === "failed" || g.error_message).length;
    const avgProvMin = provLagN ? Math.round(provLagSum / provLagN) : 0;

    const fileByKind: Record<string, { count: number; bytes: number }> = {};
    for (const f of files) {
      const k = f.kind ?? "—";
      fileByKind[k] ??= { count: 0, bytes: 0 };
      fileByKind[k].count++;
      fileByKind[k].bytes += Number(f.size_bytes ?? 0);
    }
    const totalBytes = files.reduce((s: number, f: any) => s + Number(f.size_bytes ?? 0), 0);

    const promptByCategory: Record<string, number> = {};
    const promptByNiche: Record<string, number> = {};
    const topPrompts = [...prompts]
      .sort((a: any, b: any) => Number(b.usage_count ?? 0) - Number(a.usage_count ?? 0))
      .slice(0, 10)
      .map((p: any) => ({ name: p.name, niche: p.niche, version: p.version, usage: Number(p.usage_count ?? 0) }));
    for (const p of prompts) {
      promptByCategory[p.category ?? "—"] = (promptByCategory[p.category ?? "—"] ?? 0) + 1;
      promptByNiche[p.niche ?? "—"] = (promptByNiche[p.niche ?? "—"] ?? 0) + 1;
    }
    const activePrompts = prompts.filter((p: any) => p.status === "active" || p.status === "published").length;

    const pageByStatus: Record<string, number> = {};
    for (const p of pages) pageByStatus[p.status ?? "—"] = (pageByStatus[p.status ?? "—"] ?? 0) + 1;
    const publishedPages = pages.filter((p: any) => p.status === "published" || p.status === "live").length;

    const versByStatus: Record<string, number> = {};
    for (const v of vers) versByStatus[v.status ?? "—"] = (versByStatus[v.status ?? "—"] ?? 0) + 1;

    const tplByNiche: Record<string, number> = {};
    for (const t of tpls) tplByNiche[t.niche ?? "—"] = (tplByNiche[t.niche ?? "—"] ?? 0) + 1;
    const activeTpls = tpls.filter((t: any) => t.status === "active" || t.status === "published").length;

    return {
      generations: {
        total: gens.length,
        approved: approvedGens,
        provisioned: provisionedGens,
        failed: failedGens,
        avgProvMin,
        byStatus: Object.entries(genByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
        byModel: Object.entries(genByModel).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count),
      },
      files: {
        total: files.length,
        totalBytes,
        byKind: Object.entries(fileByKind).map(([kind, v]) => ({ kind, ...v })).sort((a, b) => b.bytes - a.bytes),
      },
      prompts: {
        total: prompts.length,
        active: activePrompts,
        byCategory: Object.entries(promptByCategory).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        byNiche: Object.entries(promptByNiche).map(([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        top: topPrompts,
      },
      pages: {
        total: pages.length,
        published: publishedPages,
        byStatus: Object.entries(pageByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
      versions: {
        total: vers.length,
        byStatus: Object.entries(versByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
      templates: {
        total: tpls.length,
        active: activeTpls,
        byNiche: Object.entries(tplByNiche).map(([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count),
      },
    };
  });
