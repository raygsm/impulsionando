import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Command Center — snapshot consolidado para a tela inicial da operação.
 * Em uma única chamada retorna: KPIs do dia, deltas vs 7d, top alertas,
 * pipeline de leads e MRR ativo. Substitui o "tour por 10 dashboards".
 */
export const getCommandCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const day = 86400000;
    const since24 = new Date(now - day).toISOString();
    const since7 = new Date(now - 7 * day).toISOString();
    const since14 = new Date(now - 14 * day).toISOString();

    const [leads24, leads7, leads14, demos7, quotes7, contracts, suspensions, tickets, runs] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", since24),
      supabaseAdmin.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", since14),
      supabaseAdmin.from("demo_leads").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("quotes").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("billing_contracts").select("recurring_amount, status, company_id"),
      supabaseAdmin.from("billing_suspensions").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("support_tickets").select("id, subject, company_id, priority, created_at, status").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("n8n_workflow_runs").select("status, finished_at").gte("finished_at", since7).limit(500),
    ]);

    const mrr = (contracts.data ?? [])
      .filter((c: any) => c.status === "active")
      .reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);
    const activeTenants = new Set((contracts.data ?? []).filter((c: any) => c.status === "active").map((c: any) => c.company_id)).size;

    const leads7d = leads7.count ?? 0;
    const leadsPrev7 = (leads14.count ?? 0) - leads7d;
    const leadsDelta = leadsPrev7 === 0 ? 0 : Math.round(((leads7d - leadsPrev7) / leadsPrev7) * 100);

    const openTickets = (tickets.data ?? []).filter((t: any) => !["closed", "resolved", "cancelled"].includes(String(t.status)));
    const urgentTickets = openTickets.filter((t: any) => ["urgent", "high"].includes(String(t.priority)));

    const runsTotal = runs.data?.length ?? 0;
    const runsFailed = (runs.data ?? []).filter((r: any) => r.status === "error" || r.status === "failed").length;
    const automationHealth = runsTotal ? Math.round(((runsTotal - runsFailed) / runsTotal) * 100) : 100;

    return {
      kpis: {
        mrr,
        activeTenants,
        leads24h: leads24.count ?? 0,
        leads7d,
        leadsDelta,
        demos7d: demos7.count ?? 0,
        quotes7d: quotes7.count ?? 0,
        suspensions: suspensions.count ?? 0,
        openTickets: openTickets.length,
        urgentTickets: urgentTickets.length,
        automationHealth,
        automationRuns: runsTotal,
        automationFailed: runsFailed,
      },
      urgentTickets: urgentTickets.slice(0, 5),
    };
  });
