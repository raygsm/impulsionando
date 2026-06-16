import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Dashboard macro do Core cross-nicho.
 * Acesso restrito a staff Impulsionando.
 * Agrega: receita (billing_invoices), leads (marketing_leads), conversões (trial_subscriptions),
 * churn (subscriptions) e saúde N8N (n8n_workflow_runs), por empresa e por nicho.
 *
 * Filtros (todos opcionais):
 *  - days / from / to: janela temporal (from/to têm prioridade sobre days).
 *  - companyId: focar uma única empresa (usado pelo relatório mensal).
 *  - nicheSlug: filtra companies/nichos.
 *  - regua: filtra n8n_workflow_runs por régua.
 *  - workflow: filtra n8n_workflow_runs por workflow_name (módulo).
 *  - orderBy: "revenue" | "n8nFailures" | "name" (default revenue).
 */

const FilterInput = z.object({
  days: z.number().int().min(1).max(365).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  companyId: z.string().uuid().optional(),
  nicheSlug: z.string().min(1).max(60).optional(),
  regua: z.string().min(1).max(60).optional(),
  workflow: z.string().min(1).max(120).optional(),
  orderBy: z.enum(["revenue", "n8nFailures", "name"]).default("revenue"),
});

export const fetchMacroDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FilterInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, {
      _user: userId,
    } as never);
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando");

    const days = data.days ?? 30;
    const to = data.to ?? new Date().toISOString();
    const from = data.from ?? new Date(Date.now() - days * 86400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Empresas e nichos
    const [{ data: companiesAll }, { data: niches }] = await Promise.all([
      supabaseAdmin.from("companies").select("id,name,niche_id,is_master,is_active"),
      supabaseAdmin.from("niches").select("id,name,slug"),
    ]);
    const nichesById = new Map((niches ?? []).map((n) => [n.id as string, n]));
    const nicheBySlug = new Map((niches ?? []).map((n) => [(n as { slug: string }).slug, n]));

    // Aplica filtros de companyId / nicheSlug à lista de empresas considerada
    let companies = (companiesAll ?? []) as Array<{ id: string; name: string; niche_id: string | null }>;
    if (data.companyId) companies = companies.filter((c) => c.id === data.companyId);
    if (data.nicheSlug) {
      const n = nicheBySlug.get(data.nicheSlug);
      const nid = (n as { id?: string } | undefined)?.id ?? null;
      companies = companies.filter((c) => c.niche_id === nid);
    }
    const allowedCompanyIds = new Set(companies.map((c) => c.id));
    const companyById = new Map(companies.map((c) => [c.id, c]));

    // Receita por empresa (paid invoices) — filtro por janela e empresas permitidas
    let invQ = supabaseAdmin
      .from("billing_invoices")
      .select("amount,status,company_id,created_at")
      .gte("created_at", from)
      .lte("created_at", to);
    if (data.companyId) invQ = invQ.eq("company_id", data.companyId);
    const { data: invoices } = await invQ;

    const revenueByCompany: Record<string, number> = {};
    let totalRevenueCents = 0;
    let totalOpen = 0, totalOverdue = 0, totalPaidCount = 0;
    for (const inv of (invoices ?? []) as Array<{ amount: number; status: string; company_id: string }>) {
      if (allowedCompanyIds.size > 0 && !allowedCompanyIds.has(inv.company_id)) continue;
      if (inv.status === "paid") {
        const cents = Math.round(Number(inv.amount ?? 0) * 100);
        totalRevenueCents += cents;
        totalPaidCount++;
        revenueByCompany[inv.company_id] = (revenueByCompany[inv.company_id] ?? 0) + cents;
      } else if (inv.status === "open") totalOpen++;
      else if (inv.status === "overdue") totalOverdue++;
    }

    // Leads
    const { count: leadsCount } = await supabaseAdmin
      .from("marketing_leads").select("id", { count: "exact", head: true })
      .gte("created_at", from).lte("created_at", to);

    // Trials
    const { data: trials } = await supabaseAdmin
      .from("trial_subscriptions").select("status,chosen_plan,created_at")
      .gte("created_at", from).lte("created_at", to);
    const trialsStarted = trials?.length ?? 0;
    const trialsConverted = (trials ?? []).filter((t) => (t as { status: string }).status === "convertido").length;
    const trialsLost = (trials ?? []).filter((t) =>
      ["cancelado", "suspenso"].includes((t as { status: string }).status),
    ).length;

    // Assinaturas
    const [{ count: activeSubs }, { count: cancelledSubs }] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .in("status", ["active", "trialing", "past_due"]),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true })
        .gte("updated_at", from).lte("updated_at", to).eq("status", "canceled"),
    ]);

    // N8N por empresa
    let n8nQ = supabaseAdmin
      .from("n8n_workflow_runs").select("tenant_id,regua,status,workflow_name,channel")
      .gte("created_at", from).lte("created_at", to);
    if (data.regua) n8nQ = n8nQ.eq("regua", data.regua);
    if (data.workflow) n8nQ = n8nQ.eq("workflow_name", data.workflow);
    if (data.companyId) n8nQ = n8nQ.eq("tenant_id", data.companyId);
    const { data: n8nRows } = await n8nQ;

    const n8nByCompany: Record<string, { total: number; ok: number; failed: number }> = {};
    const n8nByRegua: Record<string, { total: number; ok: number; failed: number }> = {};
    const n8nByWorkflow: Record<string, { total: number; ok: number; failed: number }> = {};
    for (const r of (n8nRows ?? []) as Array<{
      tenant_id: string | null; regua: string; status: string; workflow_name: string;
    }>) {
      const cid = r.tenant_id ?? "_orphan";
      if (allowedCompanyIds.size > 0 && cid !== "_orphan" && !allowedCompanyIds.has(cid)) continue;
      n8nByCompany[cid] ??= { total: 0, ok: 0, failed: 0 };
      n8nByCompany[cid].total++;
      if (r.status === "ok") n8nByCompany[cid].ok++;
      if (r.status === "failed") n8nByCompany[cid].failed++;
      const rkey = r.regua ?? "_n";
      n8nByRegua[rkey] ??= { total: 0, ok: 0, failed: 0 };
      n8nByRegua[rkey].total++;
      if (r.status === "ok") n8nByRegua[rkey].ok++;
      if (r.status === "failed") n8nByRegua[rkey].failed++;
      const wkey = r.workflow_name ?? "_w";
      n8nByWorkflow[wkey] ??= { total: 0, ok: 0, failed: 0 };
      n8nByWorkflow[wkey].total++;
      if (r.status === "ok") n8nByWorkflow[wkey].ok++;
      if (r.status === "failed") n8nByWorkflow[wkey].failed++;
    }

    // Por nicho (receita + n8n)
    const byNiche: Record<string, {
      nicheName: string; companies: number; revenueCents: number;
      n8nTotal: number; n8nFailed: number;
    }> = {};
    for (const c of companies) {
      const niche = nichesById.get(c.niche_id ?? "");
      const key = (niche as { slug?: string } | undefined)?.slug ?? "_sem_nicho";
      byNiche[key] ??= {
        nicheName: (niche as { name?: string } | undefined)?.name ?? "Sem nicho",
        companies: 0, revenueCents: 0, n8nTotal: 0, n8nFailed: 0,
      };
      byNiche[key].companies++;
      byNiche[key].revenueCents += revenueByCompany[c.id] ?? 0;
      const n = n8nByCompany[c.id];
      if (n) { byNiche[key].n8nTotal += n.total; byNiche[key].n8nFailed += n.failed; }
    }

    // Top empresas
    const sortFn = data.orderBy === "n8nFailures"
      ? (a: { n8nFailed: number }, b: { n8nFailed: number }) => b.n8nFailed - a.n8nFailed
      : data.orderBy === "name"
        ? (a: { companyName: string }, b: { companyName: string }) => a.companyName.localeCompare(b.companyName)
        : (a: { revenueCents: number }, b: { revenueCents: number }) => b.revenueCents - a.revenueCents;

    const allCompanies = companies.map((c) => {
      const n = n8nByCompany[c.id] ?? { total: 0, ok: 0, failed: 0 };
      return {
        companyId: c.id, companyName: c.name ?? "—",
        revenueCents: revenueByCompany[c.id] ?? 0,
        n8nTotal: n.total, n8nFailed: n.failed,
      };
    }).sort(sortFn as never);

    const topCompanies = allCompanies.slice(0, 20);

    return {
      window: { from, to, days },
      filters: {
        companyId: data.companyId ?? null,
        nicheSlug: data.nicheSlug ?? null,
        regua: data.regua ?? null,
        workflow: data.workflow ?? null,
        orderBy: data.orderBy,
      },
      totals: {
        companies: companies.length,
        revenueCents: totalRevenueCents,
        invoicesPaid: totalPaidCount,
        invoicesOpen: totalOpen,
        invoicesOverdue: totalOverdue,
        leads: leadsCount ?? 0,
        trialsStarted, trialsConverted, trialsLost,
        trialConvRate: trialsStarted > 0
          ? Math.round((trialsConverted / trialsStarted) * 1000) / 10 : 0,
        activeSubs: activeSubs ?? 0,
        cancelledSubs: cancelledSubs ?? 0,
        churnRate: (activeSubs ?? 0) + (cancelledSubs ?? 0) > 0
          ? Math.round(((cancelledSubs ?? 0) /
              ((activeSubs ?? 0) + (cancelledSubs ?? 0))) * 1000) / 10
          : 0,
        n8nEvents: n8nRows?.length ?? 0,
        n8nFailures: Object.values(n8nByCompany).reduce((s, n) => s + n.failed, 0),
      },
      byNiche,
      n8nByRegua,
      n8nByWorkflow,
      topCompanies,
      allCompanies,
    };
  });

/** Lista enxuta de empresas + nichos + réguas/workflows para popular filtros do dashboard. */
export const fetchMacroFiltersMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff" as never, {
      _user: context.userId,
    } as never);
    if (!isStaff) throw new Error("Acesso restrito");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: companies }, { data: niches }, { data: workflows }] = await Promise.all([
      supabaseAdmin.from("companies").select("id,name").eq("is_active", true).order("name"),
      supabaseAdmin.from("niches").select("slug,name").order("name"),
      supabaseAdmin
        .from("n8n_workflow_runs")
        .select("regua,workflow_name")
        .gte("created_at", new Date(Date.now() - 90 * 86400_000).toISOString())
        .limit(2000),
    ]);
    const reguas = Array.from(new Set((workflows ?? []).map((w) => (w as { regua: string }).regua).filter(Boolean))).sort();
    const wfs = Array.from(new Set((workflows ?? []).map((w) => (w as { workflow_name: string }).workflow_name).filter(Boolean))).sort();
    return {
      companies: companies ?? [],
      niches: niches ?? [],
      reguas, workflows: wfs,
    };
  });
