import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Dashboard macro do Core cross-nicho.
 * Acesso restrito a staff Impulsionando.
 * Agrega: receita (billing_invoices), leads (marketing_leads), conversões (trial_subscriptions),
 * churn (subscriptions) e saúde N8N (n8n_workflow_runs), por empresa e por nicho.
 */

export const fetchMacroDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({
    days: Math.min(Math.max(z.number().int().parse(d?.days ?? 30), 1), 365),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, {
      _user: userId,
    } as never);
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando");

    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Empresas e nichos
    const [{ data: companies }, { data: niches }] = await Promise.all([
      supabaseAdmin.from("companies").select("id,name,niche_id,is_master,is_active"),
      supabaseAdmin.from("niches").select("id,name,slug"),
    ]);
    const companyById = new Map((companies ?? []).map((c) => [c.id as string, c]));
    const nichesById = new Map((niches ?? []).map((n) => [n.id as string, n]));

    // Receita por empresa (paid invoices)
    const { data: invoices } = await supabaseAdmin
      .from("billing_invoices")
      .select("amount,status,company_id,created_at")
      .gte("created_at", since);

    const revenueByCompany: Record<string, number> = {};
    let totalRevenueCents = 0;
    let totalOpen = 0, totalOverdue = 0, totalPaidCount = 0;
    for (const inv of (invoices ?? []) as Array<{ amount: number; status: string; company_id: string }>) {
      if (inv.status === "paid") {
        const cents = Math.round(Number(inv.amount ?? 0) * 100);
        totalRevenueCents += cents;
        totalPaidCount++;
        revenueByCompany[inv.company_id] = (revenueByCompany[inv.company_id] ?? 0) + cents;
      } else if (inv.status === "open") totalOpen++;
      else if (inv.status === "overdue") totalOverdue++;
    }

    // Leads (sem company_id ainda — agregado global do site)
    const { count: leadsCount } = await supabaseAdmin
      .from("marketing_leads").select("id", { count: "exact", head: true })
      .gte("created_at", since);

    // Trials
    const { data: trials } = await supabaseAdmin
      .from("trial_subscriptions").select("status,chosen_plan,created_at")
      .gte("created_at", since);
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
        .gte("updated_at", since).eq("status", "canceled"),
    ]);

    // N8N por empresa (tenant_id)
    const { data: n8nRows } = await supabaseAdmin
      .from("n8n_workflow_runs").select("tenant_id,regua,status,workflow_name,channel")
      .gte("created_at", since);
    const n8nByCompany: Record<string, { total: number; ok: number; failed: number }> = {};
    const n8nByRegua: Record<string, { total: number; ok: number; failed: number }> = {};
    for (const r of (n8nRows ?? []) as Array<{
      tenant_id: string | null; regua: string; status: string;
    }>) {
      const cid = r.tenant_id ?? "_orphan";
      n8nByCompany[cid] ??= { total: 0, ok: 0, failed: 0 };
      n8nByCompany[cid].total++;
      if (r.status === "ok") n8nByCompany[cid].ok++;
      if (r.status === "failed") n8nByCompany[cid].failed++;
      n8nByRegua[r.regua] ??= { total: 0, ok: 0, failed: 0 };
      n8nByRegua[r.regua].total++;
      if (r.status === "ok") n8nByRegua[r.regua].ok++;
      if (r.status === "failed") n8nByRegua[r.regua].failed++;
    }

    // Por nicho (receita + n8n)
    const byNiche: Record<string, {
      nicheName: string; companies: number; revenueCents: number;
      n8nTotal: number; n8nFailed: number;
    }> = {};
    for (const [cid, c] of companyById.entries()) {
      const niche = nichesById.get((c as { niche_id?: string }).niche_id ?? "");
      const key = niche?.slug ?? "_sem_nicho";
      byNiche[key] ??= {
        nicheName: niche?.name ?? "Sem nicho", companies: 0, revenueCents: 0,
        n8nTotal: 0, n8nFailed: 0,
      };
      byNiche[key].companies++;
      byNiche[key].revenueCents += revenueByCompany[cid] ?? 0;
      const n = n8nByCompany[cid];
      if (n) { byNiche[key].n8nTotal += n.total; byNiche[key].n8nFailed += n.failed; }
    }

    // Top empresas por receita
    const topCompanies = Object.entries(revenueByCompany)
      .map(([cid, cents]) => {
        const c = companyById.get(cid) as { name?: string } | undefined;
        const n = n8nByCompany[cid] ?? { total: 0, ok: 0, failed: 0 };
        return {
          companyId: cid, companyName: c?.name ?? "—",
          revenueCents: cents, n8nTotal: n.total, n8nFailed: n.failed,
        };
      })
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 20);

    return {
      windowDays: data.days,
      totals: {
        companies: companies?.length ?? 0,
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
      topCompanies,
    };
  });
