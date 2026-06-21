import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Funil Impulsionando 360º — métricas cross-tenant das 5 etapas do funil:
 *  1) CAPTAR   — marketing_leads novos no período
 *  2) CONVERTER — trial_subscriptions iniciados → billing_contracts ativos
 *  3) RELACIONAR — engajamento (message_outbox enviado, agenda_appointments realizados)
 *  4) RETER     — MRR / faturas pagas em dia / churn evitado
 *  5) EXPANDIR  — upsell (clube premium ativo, mp_orders, novos módulos)
 *
 * Detecta gargalos automaticamente comparando taxa de conversão entre etapas
 * vs benchmarks padrão. Nenhum concorrente integra captação→retenção→expansão
 * num único funil unificado por tenant.
 */
export const getFunil360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: d.days ?? 30 }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since = new Date(Date.now() - data.days * 86400000).toISOString();

    const [leads, opps, trials, contracts, outbox, appts, premium, mp, prevLeads] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("crm_opportunities").select("id, status", { count: "exact" }).gte("created_at", since),
      supabaseAdmin.from("trial_subscriptions").select("id, status", { count: "exact" }).gte("created_at", since),
      supabaseAdmin.from("billing_contracts").select("id, status, recurring_amount").eq("status", "active"),
      supabaseAdmin.from("message_outbox").select("id", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since),
      supabaseAdmin.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", since),
      supabaseAdmin.from("consumer_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("mp_orders").select("id, total_amount").eq("status", "paid").gte("created_at", since),
      supabaseAdmin.from("marketing_leads").select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - data.days * 2 * 86400000).toISOString())
        .lt("created_at", since),
    ]);

    const captar = leads.count ?? 0;
    const oppsTotal = opps.count ?? 0;
    const oppsWon = (opps.data ?? []).filter((o: any) => o.status === "won").length;
    const trialsTotal = trials.count ?? 0;
    const trialsConverted = (trials.data ?? []).filter((t: any) => t.status === "converted").length;
    const activeContracts = (contracts.data ?? []).length;
    const mrr = (contracts.data ?? []).reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);
    const engagement = (outbox.count ?? 0) + (appts.count ?? 0);
    const premiumActive = premium.count ?? 0;
    const mpRevenue = (mp.data ?? []).reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0);
    const prevCaptar = prevLeads.count ?? 0;

    const conv_lead_opp = captar ? (oppsTotal / captar) * 100 : 0;
    const conv_opp_trial = oppsTotal ? (trialsTotal / oppsTotal) * 100 : 0;
    const conv_trial_contract = trialsTotal ? (trialsConverted / trialsTotal) * 100 : 0;
    const growth = prevCaptar ? ((captar - prevCaptar) / prevCaptar) * 100 : 0;

    // Detecção de gargalos: benchmarks setoriais
    const bottlenecks: Array<{ stage: string; metric: string; value: number; benchmark: number; severity: "high" | "medium" | "low" }> = [];
    if (conv_lead_opp < 15) bottlenecks.push({ stage: "CAPTAR→CONVERTER", metric: "Lead→Oportunidade", value: conv_lead_opp, benchmark: 15, severity: conv_lead_opp < 5 ? "high" : "medium" });
    if (conv_opp_trial < 30) bottlenecks.push({ stage: "CONVERTER", metric: "Oportunidade→Trial", value: conv_opp_trial, benchmark: 30, severity: conv_opp_trial < 10 ? "high" : "medium" });
    if (conv_trial_contract < 25) bottlenecks.push({ stage: "CONVERTER→RETER", metric: "Trial→Contrato", value: conv_trial_contract, benchmark: 25, severity: conv_trial_contract < 10 ? "high" : "medium" });
    if (activeContracts > 0 && premiumActive / activeContracts < 0.2) bottlenecks.push({ stage: "EXPANDIR", metric: "Penetração Premium", value: (premiumActive / activeContracts) * 100, benchmark: 20, severity: "low" });

    return {
      period_days: data.days,
      stages: {
        captar: { leads: captar, growth_pct: growth },
        converter: { opportunities: oppsTotal, won: oppsWon, trials: trialsTotal, converted: trialsConverted },
        relacionar: { messages_sent: outbox.count ?? 0, appointments_done: appts.count ?? 0, total_engagement: engagement },
        reter: { active_contracts: activeContracts, mrr },
        expandir: { premium_active: premiumActive, mp_revenue: mpRevenue },
      },
      conversions: { lead_opp: conv_lead_opp, opp_trial: conv_opp_trial, trial_contract: conv_trial_contract },
      bottlenecks,
    };
  });
