import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Churn Risk Ranking — pontua todos os tenants ativos por risco de churn
 * combinando MRR, idade, tickets urgentes/abertos, suspensões e atividade
 * recente. Score 0-100 (maior = mais risco). Retorna ranking ordenado.
 */
export const getChurnRiskRanking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const [companies, contracts, tickets, suspensions, runtime] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, niche_id, created_at, is_active").eq("is_active", true).limit(500),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status"),
      supabaseAdmin.from("support_tickets").select("company_id, status, priority, created_at").gte("created_at", since30),
      supabaseAdmin.from("billing_suspensions").select("company_id, created_at, resolved_at").gte("created_at", since30),
      supabaseAdmin.from("runtime_events").select("company_id, created_at").gte("created_at", since30).limit(5000),
    ]);

    const mrrBy = new Map<string, number>();
    (contracts.data ?? []).forEach((c: any) => {
      if (c.status !== "active") return;
      mrrBy.set(c.company_id, (mrrBy.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
    });

    const ticketsOpenBy = new Map<string, number>();
    const ticketsUrgentBy = new Map<string, number>();
    (tickets.data ?? []).forEach((t: any) => {
      if (!["closed", "resolved", "cancelled"].includes(String(t.status))) {
        ticketsOpenBy.set(t.company_id, (ticketsOpenBy.get(t.company_id) ?? 0) + 1);
      }
      if (["urgent", "high"].includes(String(t.priority))) {
        ticketsUrgentBy.set(t.company_id, (ticketsUrgentBy.get(t.company_id) ?? 0) + 1);
      }
    });

    const suspBy = new Map<string, number>();
    (suspensions.data ?? []).forEach((s: any) => {
      suspBy.set(s.company_id, (suspBy.get(s.company_id) ?? 0) + 1);
    });

    const runtimeBy = new Map<string, number>();
    (runtime.data ?? []).forEach((e: any) => {
      runtimeBy.set(e.company_id, (runtimeBy.get(e.company_id) ?? 0) + 1);
    });

    const ranking = (companies.data ?? []).map((c: any) => {
      const mrr = mrrBy.get(c.id) ?? 0;
      const ageDays = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
      const open = ticketsOpenBy.get(c.id) ?? 0;
      const urgent = ticketsUrgentBy.get(c.id) ?? 0;
      const susp = suspBy.get(c.id) ?? 0;
      const events = runtimeBy.get(c.id) ?? 0;

      let score = 0;
      if (events === 0) score += 35; else if (events < 10) score += 20; else if (events < 50) score += 8;
      if (susp > 0) score += 25 + Math.min(15, susp * 5);
      if (urgent > 0) score += Math.min(20, urgent * 7);
      if (open > 3) score += Math.min(10, open);
      if (ageDays < 30) score += 8;
      if (mrr === 0) score += 12;
      score = Math.min(100, score);

      const reasons: string[] = [];
      if (events === 0) reasons.push("sem atividade 30d");
      else if (events < 10) reasons.push("baixíssima atividade");
      if (susp > 0) reasons.push(`${susp} suspensão(ões) recentes`);
      if (urgent > 0) reasons.push(`${urgent} ticket(s) urgente(s)`);
      if (open > 3) reasons.push(`${open} tickets abertos`);
      if (mrr === 0) reasons.push("sem MRR ativo");
      if (ageDays < 30) reasons.push("conta nova (<30d)");

      return {
        company_id: c.id,
        name: c.name,
        niche_id: c.niche_id,
        mrr,
        age_days: ageDays,
        tickets_open: open,
        tickets_urgent: urgent,
        suspensions_30d: susp,
        events_30d: events,
        score,
        band: score >= 70 ? "alto" : score >= 40 ? "médio" : "baixo",
        reasons,
      };
    });

    ranking.sort((a, b) => b.score - a.score || b.mrr - a.mrr);

    const summary = {
      total: ranking.length,
      high: ranking.filter((r) => r.band === "alto").length,
      medium: ranking.filter((r) => r.band === "médio").length,
      low: ranking.filter((r) => r.band === "baixo").length,
      mrr_at_risk: ranking.filter((r) => r.band === "alto").reduce((s, r) => s + r.mrr, 0),
    };

    return { summary, ranking };
  });
