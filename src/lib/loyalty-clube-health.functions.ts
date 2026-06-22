import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Loyalty & Clube Cockpit — Fase 75.
 * Assinaturas de consumidor, visitas, consumo, pontos, indicações, polls, alertas.
 */
export const getLoyaltyClubeHealth = createServerFn({ method: "POST" })
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

    const [memRes, visRes, consRes, ledRes, refRes, recRes, alertsRes, pollsRes, votesRes] =
      await Promise.all([
        supabaseAdmin.from("consumer_memberships")
          .select("id, user_id, plan, status, amount_cents, created_at")
          .limit(50000),
        supabaseAdmin.from("clube_visits")
          .select("id, user_id, company_id, source, rating, created_at")
          .gte("created_at", sinceIso)
          .limit(100000),
        supabaseAdmin.from("clube_consumption")
          .select("id, user_id, company_id, total_cents, payment_method, source, consumed_at, created_at")
          .gte("created_at", sinceIso)
          .limit(100000),
        supabaseAdmin.from("clube_rewards_ledger")
          .select("id, user_id, kind, delta, reason, created_at")
          .gte("created_at", sinceIso)
          .limit(100000),
        supabaseAdmin.from("clube_referrals")
          .select("id, referrer_user_id, status, reward_points, reward_cents, source, created_at, converted_at")
          .gte("created_at", sinceIso)
          .limit(50000),
        supabaseAdmin.from("clube_receipts")
          .select("id, user_id, company_id, kind, amount_cents, status, issued_at, created_at")
          .gte("created_at", sinceIso)
          .limit(50000),
        supabaseAdmin.from("clube_alerts")
          .select("id, user_id, kind, tag, city, active, created_at")
          .limit(50000),
        supabaseAdmin.from("clube_polls")
          .select("id, company_id, kind, active, opens_at, closes_at, created_at")
          .limit(5000),
        supabaseAdmin.from("clube_poll_votes")
          .select("id, poll_id, user_id, created_at")
          .gte("created_at", sinceIso)
          .limit(100000),
      ]);

    const mems = memRes.data ?? [];
    const vis = visRes.data ?? [];
    const cons = consRes.data ?? [];
    const led = ledRes.data ?? [];
    const refs = refRes.data ?? [];
    const recs = recRes.data ?? [];
    const alerts = alertsRes.data ?? [];
    const polls = pollsRes.data ?? [];
    const votes = votesRes.data ?? [];

    const activeMems = mems.filter((m: any) => m.status === "active").length;
    const memByPlan: Record<string, number> = {};
    let mrrCents = 0;
    for (const m of mems) {
      if (m.status === "active") {
        memByPlan[m.plan ?? "—"] = (memByPlan[m.plan ?? "—"] ?? 0) + 1;
        mrrCents += Number(m.amount_cents ?? 0);
      }
    }

    const uniqueVisitors = new Set(vis.map((v: any) => v.user_id)).size;
    const rated = vis.filter((v: any) => v.rating != null);
    const avgRating = rated.length ? rated.reduce((s: number, v: any) => s + Number(v.rating), 0) / rated.length : 0;
    const visBySource: Record<string, number> = {};
    for (const v of vis) visBySource[v.source ?? "—"] = (visBySource[v.source ?? "—"] ?? 0) + 1;

    const consTotalCents = cons.reduce((s: number, c: any) => s + Number(c.total_cents ?? 0), 0);
    const avgTicketCents = cons.length ? Math.round(consTotalCents / cons.length) : 0;
    const consByMethod: Record<string, { count: number; cents: number }> = {};
    for (const c of cons) {
      const k = c.payment_method ?? "—";
      consByMethod[k] ??= { count: 0, cents: 0 };
      consByMethod[k].count++;
      consByMethod[k].cents += Number(c.total_cents ?? 0);
    }

    let earned = 0, spent = 0;
    for (const l of led) {
      const d = Number(l.delta ?? 0);
      if (d > 0) earned += d;
      else spent += -d;
    }
    const ledByKind: Record<string, number> = {};
    for (const l of led) ledByKind[l.kind ?? "—"] = (ledByKind[l.kind ?? "—"] ?? 0) + 1;

    const refConverted = refs.filter((r: any) => r.converted_at || r.status === "converted").length;
    const refRewardCents = refs.reduce((s: number, r: any) => s + Number(r.reward_cents ?? 0), 0);
    const refConvRate = refs.length ? Math.round((refConverted / refs.length) * 1000) / 10 : 0;

    const recByStatus: Record<string, number> = {};
    let recCents = 0;
    for (const r of recs) {
      recByStatus[r.status ?? "—"] = (recByStatus[r.status ?? "—"] ?? 0) + 1;
      recCents += Number(r.amount_cents ?? 0);
    }

    const activeAlerts = alerts.filter((a: any) => a.active).length;
    const alertsByKind: Record<string, number> = {};
    for (const a of alerts) alertsByKind[a.kind ?? "—"] = (alertsByKind[a.kind ?? "—"] ?? 0) + 1;

    const activePolls = polls.filter((p: any) => p.active).length;
    const votesByPoll: Record<string, number> = {};
    for (const v of votes) votesByPoll[v.poll_id] = (votesByPoll[v.poll_id] ?? 0) + 1;
    const topPolls = Object.entries(votesByPoll)
      .map(([poll_id, count]) => ({ poll_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const brl = (cents: number) => cents / 100;

    return {
      memberships: {
        total: mems.length,
        active: activeMems,
        mrr: brl(mrrCents),
        byPlan: Object.entries(memByPlan).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count),
      },
      visits: {
        total: vis.length,
        unique: uniqueVisitors,
        avgRating: Math.round(avgRating * 10) / 10,
        bySource: Object.entries(visBySource).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      },
      consumption: {
        total: cons.length,
        amount: brl(consTotalCents),
        avgTicket: brl(avgTicketCents),
        byMethod: Object.entries(consByMethod)
          .map(([method, v]) => ({ method, count: v.count, amount: brl(v.cents) }))
          .sort((a, b) => b.amount - a.amount),
      },
      rewards: {
        total: led.length,
        earned,
        spent,
        net: earned - spent,
        byKind: Object.entries(ledByKind).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
      },
      referrals: {
        total: refs.length,
        converted: refConverted,
        convRate: refConvRate,
        rewardAmount: brl(refRewardCents),
      },
      receipts: {
        total: recs.length,
        amount: brl(recCents),
        byStatus: Object.entries(recByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      },
      alerts: {
        total: alerts.length,
        active: activeAlerts,
        byKind: Object.entries(alertsByKind).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
      },
      polls: {
        total: polls.length,
        active: activePolls,
        votes: votes.length,
        topPolls,
      },
    };
  });
