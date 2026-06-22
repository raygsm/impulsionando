import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Churn Prevention Radar — Fase 32.
 * Detecta tenants em risco de cancelamento ANTES da suspensão/downgrade.
 *
 * Score 0-100 (quanto maior, maior o risco):
 *  +30 inatividade (eventos 30d < 30% da janela 60-30d anterior, ou zero)
 *  +25 inadimplência (fatura vencida > 7 dias OU suspensão ativa)
 *  +20 tickets críticos (priority high/critical abertos OU CSAT ≤ 2)
 *  +15 onboarding travado >30d sem completar
 *  +10 contrato recente (<60d) com baixíssima atividade (cold start)
 *
 * Saída: KPIs globais + lista de tenants em risco com top sinais e ação sugerida.
 */
export const getChurnRadar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { minScore?: number }) => ({ minScore: Math.max(0, Math.min(100, d?.minScore ?? 0)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const since30 = new Date(now - 30 * 86400000).toISOString();
    const sincePrev60 = new Date(now - 60 * 86400000).toISOString();
    const today = new Date().toISOString().slice(0, 10);

    const [companiesRes, contractsRes, invoicesRes, suspensionsRes,
           ticketsRes, onboardingRes, eventsRecentRes, eventsPrevRes] =
      await Promise.all([
        supabaseAdmin
          .from("companies")
          .select("id, name, niche_id, created_at")
          .eq("is_active", true).eq("is_demo", false).eq("is_master", false)
          .limit(5000),
        supabaseAdmin
          .from("billing_contracts")
          .select("id, company_id, status, recurring_amount, created_at, next_due_date, last_paid_at")
          .in("status", ["active", "suspended"])
          .limit(5000),
        supabaseAdmin
          .from("billing_invoices")
          .select("id, company_id, status, due_date, amount")
          .in("status", ["open", "overdue", "pending"])
          .limit(10000),
        supabaseAdmin
          .from("billing_suspensions")
          .select("company_id, suspended_at, reactivated_at")
          .is("reactivated_at", null)
          .limit(5000),
        supabaseAdmin
          .from("support_tickets")
          .select("company_id, status, priority, rating, created_at, resolved_at")
          .gte("created_at", sincePrev60)
          .limit(10000),
        supabaseAdmin
          .from("onboarding_checklist")
          .select("company_id, completed, created_at")
          .limit(10000),
        supabaseAdmin
          .from("runtime_events")
          .select("company_id, occurred_at")
          .gte("occurred_at", since30)
          .limit(80000),
        supabaseAdmin
          .from("runtime_events")
          .select("company_id, occurred_at")
          .gte("occurred_at", sincePrev60).lt("occurred_at", since30)
          .limit(80000),
      ]);

    const companies = companiesRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const invoices = invoicesRes.data ?? [];
    const suspensions = suspensionsRes.data ?? [];
    const tickets = ticketsRes.data ?? [];
    const onboarding = onboardingRes.data ?? [];
    const eventsRecent = eventsRecentRes.data ?? [];
    const eventsPrev = eventsPrevRes.data ?? [];

    const countBy = <T extends { company_id: string | null }>(arr: T[]) => {
      const m = new Map<string, number>();
      for (const x of arr) {
        if (!x.company_id) continue;
        m.set(x.company_id, (m.get(x.company_id) ?? 0) + 1);
      }
      return m;
    };

    const recentByCo = countBy(eventsRecent);
    const prevByCo = countBy(eventsPrev);
    const suspendedSet = new Set(suspensions.map((s) => s.company_id));

    // Onboarding: pega último checklist por company; incompleto + >30d = travado
    const onbByCo = new Map<string, { completed: boolean; ageDays: number }>();
    for (const o of onboarding) {
      if (!o.company_id) continue;
      const age = Math.floor((now - new Date(o.created_at).getTime()) / 86400000);
      const prev = onbByCo.get(o.company_id);
      if (!prev || age < prev.ageDays) onbByCo.set(o.company_id, { completed: !!o.completed, ageDays: age });
    }

    type Risk = {
      companyId: string;
      companyName: string;
      score: number;
      band: "alto" | "medio" | "baixo";
      mrr: number;
      contractStatus: string | null;
      contractAgeDays: number;
      events30d: number;
      eventsPrev30d: number;
      activityDropPct: number;
      overdueInvoices: number;
      overdueAmount: number;
      isSuspended: boolean;
      openCriticalTickets: number;
      lowCsatTickets: number;
      onboardingStalled: boolean;
      signals: string[];
      suggestedAction: string;
    };

    const risks: Risk[] = [];
    let mrrAtRisk = 0;

    for (const c of companies) {
      const contract = contracts.find((x) => x.company_id === c.id);
      const mrr = Number(contract?.recurring_amount ?? 0);
      const ageDays = contract
        ? Math.floor((now - new Date(contract.created_at).getTime()) / 86400000)
        : Math.floor((now - new Date(c.created_at).getTime()) / 86400000);

      const ev30 = recentByCo.get(c.id) ?? 0;
      const evPrev = prevByCo.get(c.id) ?? 0;
      const drop = evPrev > 0 ? Math.round(((evPrev - ev30) / evPrev) * 100) : ev30 === 0 ? 100 : 0;

      const coInvoices = invoices.filter(
        (i) => i.company_id === c.id && i.due_date && i.due_date < today,
      );
      const overdueAmount = coInvoices.reduce((s, i) => s + Number(i.amount ?? 0), 0);
      const isSuspended = suspendedSet.has(c.id) || contract?.status === "suspended";

      const coTickets = tickets.filter((t) => t.company_id === c.id);
      const openCritical = coTickets.filter(
        (t) => ["high", "critical", "urgent"].includes((t.priority ?? "").toLowerCase())
          && !["resolved", "closed"].includes((t.status ?? "").toLowerCase()),
      ).length;
      const lowCsat = coTickets.filter((t) => (t.rating ?? 5) <= 2).length;

      const onb = onbByCo.get(c.id);
      const onbStalled = !!onb && !onb.completed && onb.ageDays > 30;

      let score = 0;
      const signals: string[] = [];

      const inactive = ev30 === 0 || (evPrev >= 10 && drop >= 70);
      if (inactive) { score += 30; signals.push(ev30 === 0 ? "Zero atividade 30d" : `Queda ${drop}% uso`); }

      if (coInvoices.length > 0 || isSuspended) {
        score += 25;
        signals.push(isSuspended ? "Suspenso" : `${coInvoices.length} fatura(s) vencidas`);
      }

      if (openCritical > 0 || lowCsat > 0) {
        score += 20;
        if (openCritical > 0) signals.push(`${openCritical} tickets críticos`);
        if (lowCsat > 0) signals.push(`${lowCsat} CSAT ≤ 2`);
      }

      if (onbStalled) { score += 15; signals.push("Onboarding travado >30d"); }

      if (ageDays < 60 && ev30 < 5 && contract) {
        score += 10;
        signals.push("Cold start (<60d)");
      }

      if (score <= 0) continue;

      const band: Risk["band"] = score >= 60 ? "alto" : score >= 35 ? "medio" : "baixo";
      let action = "Monitorar";
      if (isSuspended) action = "Reativar com CS";
      else if (coInvoices.length > 0) action = "Cobrar + dunning manual";
      else if (inactive && mrr > 0) action = "Reunião de save (CS)";
      else if (openCritical > 0) action = "Escalar suporte";
      else if (onbStalled) action = "Retomar onboarding";
      else if (band === "alto") action = "Outreach proativo";

      risks.push({
        companyId: c.id,
        companyName: c.name,
        score, band, mrr,
        contractStatus: contract?.status ?? null,
        contractAgeDays: ageDays,
        events30d: ev30, eventsPrev30d: evPrev, activityDropPct: drop,
        overdueInvoices: coInvoices.length, overdueAmount,
        isSuspended, openCriticalTickets: openCritical, lowCsatTickets: lowCsat,
        onboardingStalled: onbStalled, signals, suggestedAction: action,
      });

      if (band !== "baixo") mrrAtRisk += mrr;
    }

    risks.sort((a, b) => b.score - a.score);
    const filtered = risks.filter((r) => r.score >= data.minScore);

    const kpis = {
      totalCompanies: companies.length,
      atRisk: filtered.length,
      highRisk: filtered.filter((r) => r.band === "alto").length,
      mediumRisk: filtered.filter((r) => r.band === "medio").length,
      suspended: filtered.filter((r) => r.isSuspended).length,
      inactive30d: filtered.filter((r) => r.events30d === 0).length,
      overdueTenants: filtered.filter((r) => r.overdueInvoices > 0).length,
      mrrAtRiskEstimate: Math.round(mrrAtRisk),
    };

    // Agrega top motivos
    const reasonAgg = new Map<string, number>();
    for (const r of filtered) for (const s of r.signals) reasonAgg.set(s, (reasonAgg.get(s) ?? 0) + 1);
    const topReasons = Array.from(reasonAgg.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      generatedAt: new Date().toISOString(),
      kpis,
      topReasons,
      risks: filtered.slice(0, 200),
    };
  });
