import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Projetos Paralelos — consolida visão de todos os projetos Lovable
 * mapeados como tenants do Core (CHRISMED, Marocas, Garrido, Wagner Miller,
 * Plataforma Saúde, DQA Panini, Relacionamento) com status de migração,
 * URL externa atual, log de passos e atalhos de gerenciamento.
 */
export const getParallelProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const [companiesRes, logsRes, nichesRes, contractsRes] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, name, public_slug, niche_id, migration_status, migration_source_project_id, external_url, consolidation_started_at, consolidated_at, vitrine_show_external, vitrine_enabled, is_active, address_city, address_state, logo_url")
        .not("migration_source_project_id", "is", null)
        .order("name"),
      supabaseAdmin
        .from("companies_migration_log")
        .select("id, company_id, step, status, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("niches").select("id, name, slug"),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status"),
    ]);

    const nicheById = new Map((nichesRes.data ?? []).map((n: any) => [n.id, n]));
    const mrrBy = new Map<string, number>();
    (contractsRes.data ?? []).forEach((c: any) => {
      if (c.status === "active") mrrBy.set(c.company_id, (mrrBy.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
    });
    const logsByCompany = new Map<string, any[]>();
    (logsRes.data ?? []).forEach((l: any) => {
      const arr = logsByCompany.get(l.company_id) ?? [];
      arr.push(l);
      logsByCompany.set(l.company_id, arr);
    });

    const projects = (companiesRes.data ?? []).map((c: any) => {
      const niche: any = c.niche_id ? nicheById.get(c.niche_id) : null;
      const logs = logsByCompany.get(c.id) ?? [];
      const pendingSteps = logs.filter((l) => l.status === "pending").length;
      const doneSteps = logs.filter((l) => l.status === "done").length;
      return {
        ...c,
        nicheName: niche?.name ?? null,
        nicheSlug: niche?.slug ?? null,
        mrr: Math.round(mrrBy.get(c.id) ?? 0),
        logs: logs.slice(0, 6),
        pendingSteps,
        doneSteps,
      };
    });

    const summary = {
      total: projects.length,
      pending: projects.filter((p) => p.migration_status === "pending").length,
      inProgress: projects.filter((p) => p.migration_status === "in_progress").length,
      migrated: projects.filter((p) => p.migration_status === "migrated").length,
      vitrineActive: projects.filter((p) => p.vitrine_show_external).length,
      totalMRR: projects.reduce((a, p) => a + p.mrr, 0),
    };

    return { projects, summary, generatedAt: new Date().toISOString() };
  });

/** Avança o status de migração e registra no log. */
export const advanceParallelProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      companyId: z.string().uuid(),
      newStatus: z.enum(["native", "pending", "in_progress", "migrated", "archived"]),
      note: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const patch: Record<string, unknown> = { migration_status: data.newStatus };
    if (data.newStatus === "in_progress") patch.consolidation_started_at = new Date().toISOString();
    if (data.newStatus === "migrated" || data.newStatus === "archived") patch.consolidated_at = new Date().toISOString();

    const { error: upErr } = await supabaseAdmin.from("companies").update(patch).eq("id", data.companyId);
    if (upErr) throw upErr;

    const { error: logErr } = await supabaseAdmin.from("companies_migration_log").insert({
      company_id: data.companyId,
      step: `status:${data.newStatus}`,
      status: "done",
      notes: data.note ?? `Status alterado para ${data.newStatus}`,
      created_by: userId,
    });
    if (logErr) throw logErr;

    return { ok: true };
  });
