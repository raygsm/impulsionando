import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Customer Success Cockpit — Fase 29.
 * Visão proativa por tenant combinando: tickets, SLA, onboarding, ratings (CSAT/NPS proxy),
 * MRR, runtime activity e sinais de expansão/risco.
 *
 * Saídas:
 *  - KPIs globais (CSAT, NPS-proxy, SLA atingido, tickets abertos, onboardings travados)
 *  - Ranking de tenants por "CS attention score" (0-100) — quanto maior, mais atenção
 *  - Sinais por tenant: stalled onboarding, ticket overdue, churn risk, expansion opp
 */
export const getCustomerSuccessCockpit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const d30 = new Date(now - 30 * 86400000).toISOString();
    const d90 = new Date(now - 90 * 86400000).toISOString();

    const [companiesRes, ticketsRes, onboardingRes, runtimeRes, contractsRes, suspensionsRes] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, is_active, is_demo, niche_code, created_at").limit(5000),
      supabaseAdmin
        .from("support_tickets")
        .select("id, company_id, status, priority, created_at, first_response_at, resolved_at, sla_due_at, rating")
        .gte("created_at", d90)
        .limit(20000),
      supabaseAdmin.from("onboarding_checklist").select("company_id, status, completed_at, created_at").limit(5000),
      supabaseAdmin.from("runtime_events").select("company_id, occurred_at").gte("occurred_at", d30).limit(20000),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status").eq("status", "active"),
      supabaseAdmin.from("billing_suspensions").select("company_id, resolved_at").is("resolved_at", null),
    ]);

    const companies = (companiesRes.data ?? []).filter((c: any) => c.is_demo !== true && c.is_active === true);
    const companyMap = new Map(companies.map((c: any) => [c.id, c]));
    const tickets = ticketsRes.data ?? [];
    const onboarding = onboardingRes.data ?? [];
    const runtime = runtimeRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const suspendedIds = new Set((suspensionsRes.data ?? []).map((s: any) => s.company_id));

    // MRR por tenant
    const mrrByCo = new Map<string, number>();
    for (const c of contracts) {
      mrrByCo.set(c.company_id, (mrrByCo.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
    }

    // Runtime activity 30d
    const activityByCo = new Map<string, number>();
    for (const r of runtime) {
      if (!r.company_id) continue;
      activityByCo.set(r.company_id, (activityByCo.get(r.company_id) ?? 0) + 1);
    }

    // Tickets agregados
    const ticketsByCo = new Map<string, { open: number; total: number; overdue: number; ratings: number[]; firstRespMin: number[]; resolveMin: number[] }>();
    let slaMet = 0, slaTotal = 0;
    const ratings: number[] = [];
    for (const t of tickets) {
      if (!t.company_id) continue;
      const row = ticketsByCo.get(t.company_id) ?? { open: 0, total: 0, overdue: 0, ratings: [], firstRespMin: [], resolveMin: [] };
      row.total += 1;
      const isOpen = !["resolved", "closed"].includes(t.status as string);
      if (isOpen) row.open += 1;
      if (t.sla_due_at) {
        slaTotal += 1;
        const dueMs = new Date(t.sla_due_at).getTime();
        const refMs = t.resolved_at ? new Date(t.resolved_at).getTime() : now;
        if (refMs <= dueMs) slaMet += 1;
        else if (isOpen) row.overdue += 1;
      }
      if (typeof t.rating === "number") { row.ratings.push(t.rating); ratings.push(t.rating); }
      if (t.first_response_at && t.created_at) {
        row.firstRespMin.push((new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60000);
      }
      if (t.resolved_at && t.created_at) {
        row.resolveMin.push((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000);
      }
      ticketsByCo.set(t.company_id, row);
    }

    // Onboarding stalled (created >14d, não completed)
    const onbByCo = new Map<string, { total: number; completed: number; stalled: number }>();
    for (const o of onboarding) {
      const row = onbByCo.get(o.company_id) ?? { total: 0, completed: 0, stalled: 0 };
      row.total += 1;
      if (o.completed_at || o.status === "completed") row.completed += 1;
      else if (o.created_at && now - new Date(o.created_at).getTime() > 14 * 86400000) row.stalled += 1;
      onbByCo.set(o.company_id, row);
    }

    // Score por tenant (0-100, quanto maior = mais atenção)
    const rows = companies.map((c: any) => {
      const t = ticketsByCo.get(c.id) ?? { open: 0, total: 0, overdue: 0, ratings: [], firstRespMin: [], resolveMin: [] };
      const o = onbByCo.get(c.id) ?? { total: 0, completed: 0, stalled: 0 };
      const mrr = mrrByCo.get(c.id) ?? 0;
      const activity = activityByCo.get(c.id) ?? 0;
      const csat = t.ratings.length > 0 ? t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length : null;
      const suspended = suspendedIds.has(c.id);

      let score = 0;
      const signals: string[] = [];
      if (t.overdue > 0) { score += 30; signals.push(`${t.overdue} ticket(s) SLA vencido`); }
      if (t.open >= 3) { score += 15; signals.push(`${t.open} tickets abertos`); }
      if (csat !== null && csat <= 3) { score += 25; signals.push(`CSAT ${csat.toFixed(1)}/5`); }
      if (o.stalled > 0) { score += 20; signals.push(`${o.stalled} onboarding(s) travado(s) >14d`); }
      if (activity === 0 && mrr > 0) { score += 25; signals.push("Sem atividade 30d (paga)"); }
      else if (activity < 10 && mrr > 0) { score += 10; signals.push("Atividade baixa"); }
      if (suspended) { score += 30; signals.push("Billing suspenso"); }
      if (mrr > 500 && (t.overdue > 0 || csat !== null && csat <= 3)) { score += 10; signals.push("Alto MRR em risco"); }

      // Expansion opp: alto uso + sem ticket negativo + sem suspensão
      let expansion = false;
      if (activity > 200 && t.overdue === 0 && (csat === null || csat >= 4) && !suspended) {
        expansion = true;
      }

      score = Math.min(100, score);
      return {
        company_id: c.id,
        company_name: c.name,
        niche: c.niche_code ?? "—",
        mrr: Math.round(mrr),
        activity30d: activity,
        csat: csat === null ? null : Number(csat.toFixed(2)),
        openTickets: t.open,
        overdueTickets: t.overdue,
        stalledOnboarding: o.stalled,
        suspended,
        signals,
        score,
        expansion,
      };
    });

    // KPIs globais
    const slaRate = slaTotal > 0 ? Math.round((slaMet / slaTotal) * 100) : null;
    const csatAvg = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : null;
    // NPS proxy (rating 5→promoter, 4→passive, ≤3→detractor) — escala 1-5
    let promoters = 0, detractors = 0;
    for (const r of ratings) {
      if (r >= 5) promoters += 1;
      else if (r <= 3) detractors += 1;
    }
    const npsProxy = ratings.length > 0 ? Math.round(((promoters - detractors) / ratings.length) * 100) : null;

    const atRisk = rows.filter((r) => r.score >= 60).length;
    const watch = rows.filter((r) => r.score >= 30 && r.score < 60).length;
    const healthy = rows.filter((r) => r.score < 30).length;
    const expansionCandidates = rows.filter((r) => r.expansion).length;

    rows.sort((a, b) => b.score - a.score);

    return {
      kpis: {
        tenants: rows.length,
        atRisk,
        watch,
        healthy,
        expansionCandidates,
        openTicketsTotal: rows.reduce((s, r) => s + r.openTickets, 0),
        overdueTicketsTotal: rows.reduce((s, r) => s + r.overdueTickets, 0),
        slaRate,
        csatAvg,
        npsProxy,
        stalledOnboardingTotal: rows.reduce((s, r) => s + r.stalledOnboarding, 0),
      },
      rows: rows.slice(0, 100),
      generatedAt: new Date().toISOString(),
    };
  });
