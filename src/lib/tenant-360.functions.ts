import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Tenant 360 — consolida tudo sobre um tenant numa única chamada:
 * identidade, contrato/MRR, módulos, tickets, leads, atividade CRM,
 * eventos de runtime recentes e nicho. Base para a tela de drill-down
 * que conecta Health Score, Inbox, Expansion Radar, Attribution e
 * Peer Benchmark num único contexto.
 */
export const getTenant360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const companyId = data.companyId;
    const since = new Date(Date.now() - 90 * 86400000).toISOString();

    const [company, modules, contracts, tickets, crm, runtime, leads] = await Promise.all([
      supabaseAdmin.from("companies").select("*").eq("id", companyId).maybeSingle(),
      supabaseAdmin.from("company_modules").select("module_id, is_enabled, created_at").eq("company_id", companyId),
      supabaseAdmin.from("billing_contracts").select("*").eq("company_id", companyId),
      supabaseAdmin.from("support_tickets").select("id, subject, status, priority, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("crm_activities").select("id, type, subject, occurred_at").eq("company_id", companyId).gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(20),
      supabaseAdmin.from("runtime_events").select("id, event_type, created_at, payload").eq("company_id", companyId).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("marketing_leads").select("id, email, origin, niche, created_at").eq("email", (await supabaseAdmin.from("companies").select("email").eq("id", companyId).maybeSingle()).data?.email ?? "__none__").limit(5),
    ]);

    const activeMrr = (contracts.data ?? [])
      .filter((c: any) => c.status === "active")
      .reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);

    const openTickets = (tickets.data ?? []).filter((t: any) => ["open", "pending", "in_progress"].includes(String(t.status))).length;
    const enabledModules = (modules.data ?? []).filter((m: any) => m.is_enabled !== false);

    return {
      company: company.data,
      mrr: { active: activeMrr, contracts: contracts.data ?? [] },
      modules: { total: enabledModules.length, all: modules.data ?? [] },
      tickets: { open: openTickets, recent: tickets.data ?? [] },
      crm: crm.data ?? [],
      runtime: runtime.data ?? [],
      leads: leads.data ?? [],
    };
  });
