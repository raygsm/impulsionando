import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

const toReais = (cents: number | null | undefined) => Math.round((Number(cents ?? 0) / 100) * 100) / 100;

export const fetchFinancialDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const days = Math.min(Math.max(data.days ?? 30, 7), 365);
    const sinceISO = new Date(Date.now() - days * 86400_000).toISOString();
    const sinceDate = sinceISO.slice(0, 10);

    const [revRes, invRes, payRes, memRes, prevRevRes] = await Promise.all([
      context.supabase
        .from("core_revenue_calculations" as any)
        .select("company_id,status,method,gross_cents,impulsionando_fee_cents,gateway_fee_cents,net_cents,captured_at,source_table")
        .gte("captured_at", sinceISO)
        .limit(5000),
      context.supabase
        .from("billing_invoices" as any)
        .select("company_id,amount,status,due_date,paid_at,created_at")
        .gte("created_at", sinceISO)
        .limit(5000),
      context.supabase
        .from("core_payout_ledger" as any)
        .select("company_id,gross_cents,fee_cents,net_cents,status,paid_at,period_end")
        .gte("period_end", sinceISO)
        .limit(5000),
      context.supabase
        .from("consumer_memberships" as any)
        .select("status,amount_cents,cycle,canceled_at,started_at")
        .limit(5000),
      context.supabase
        .from("core_revenue_calculations" as any)
        .select("net_cents,captured_at")
        .gte("captured_at", new Date(Date.now() - days * 2 * 86400_000).toISOString())
        .lt("captured_at", sinceISO)
        .limit(5000),
    ]);

    const rev = (revRes.data ?? []) as any[];
    const inv = (invRes.data ?? []) as any[];
    const pay = (payRes.data ?? []) as any[];
    const mem = (memRes.data ?? []) as any[];
    const prevRev = (prevRevRes.data ?? []) as any[];

    // KPIs
    const grossCents = rev.reduce((s, r) => s + Number(r.gross_cents ?? 0), 0);
    const netCents = rev.reduce((s, r) => s + Number(r.net_cents ?? 0), 0);
    const feeCents = rev.reduce((s, r) => s + Number(r.impulsionando_fee_cents ?? 0), 0);
    const gatewayFeeCents = rev.reduce((s, r) => s + Number(r.gateway_fee_cents ?? 0), 0);
    const prevNetCents = prevRev.reduce((s, r) => s + Number(r.net_cents ?? 0), 0);
    const netDeltaPct = prevNetCents > 0 ? ((netCents - prevNetCents) / prevNetCents) * 100 : null;

    // Invoices
    const invTotal = inv.reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const invPaid = inv.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const invOpen = inv.filter((i) => ["open", "pending", "issued"].includes(String(i.status))).reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const invOverdue = inv
      .filter((i) => i.status !== "paid" && i.due_date && i.due_date < today)
      .reduce((s, i) => s + Number(i.amount ?? 0), 0);

    // Payouts
    const payoutPending = pay.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.net_cents ?? 0), 0);
    const payoutPaid = pay.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_cents ?? 0), 0);

    // MRR / churn (memberships)
    const active = mem.filter((m) => m.status === "active");
    const mrrCents = active.reduce((s, m) => {
      const amt = Number(m.amount_cents ?? 0);
      const c = String(m.cycle ?? "monthly");
      if (c === "yearly" || c === "annual") return s + amt / 12;
      if (c === "weekly") return s + amt * 4.33;
      return s + amt;
    }, 0);
    const arrCents = mrrCents * 12;
    const canceledInWindow = mem.filter((m) => m.canceled_at && m.canceled_at >= sinceISO).length;
    const activeCount = active.length;
    const churnPct = activeCount + canceledInWindow > 0 ? (canceledInWindow / (activeCount + canceledInWindow)) * 100 : 0;
    const ticketCents = active.length > 0 ? mrrCents / active.length : 0;

    // Breakdown by method
    const byMethod: Record<string, { gross: number; net: number; count: number }> = {};
    for (const r of rev) {
      const k = String(r.method ?? "unknown");
      byMethod[k] = byMethod[k] ?? { gross: 0, net: 0, count: 0 };
      byMethod[k].gross += Number(r.gross_cents ?? 0);
      byMethod[k].net += Number(r.net_cents ?? 0);
      byMethod[k].count += 1;
    }
    // Breakdown by source_table (monetization model proxy)
    const bySource: Record<string, { gross: number; net: number; count: number }> = {};
    for (const r of rev) {
      const k = String(r.source_table ?? "unknown");
      bySource[k] = bySource[k] ?? { gross: 0, net: 0, count: 0 };
      bySource[k].gross += Number(r.gross_cents ?? 0);
      bySource[k].net += Number(r.net_cents ?? 0);
      bySource[k].count += 1;
    }

    // Daily series (net R$)
    const daily: Record<string, number> = {};
    for (const r of rev) {
      const d = String(r.captured_at ?? "").slice(0, 10);
      if (!d) continue;
      daily[d] = (daily[d] ?? 0) + Number(r.net_cents ?? 0);
    }
    const series = Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cents]) => ({ date, netBRL: toReais(cents) }));

    // Top tenants by net
    const byTenant: Record<string, number> = {};
    for (const r of rev) {
      if (!r.company_id) continue;
      byTenant[r.company_id] = (byTenant[r.company_id] ?? 0) + Number(r.net_cents ?? 0);
    }
    const topTenantIds = Object.entries(byTenant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    let topTenants: Array<{ id: string; name: string; netBRL: number }> = [];
    if (topTenantIds.length > 0) {
      const { data: comps } = await context.supabase
        .from("companies" as any)
        .select("id,name,trade_name")
        .in("id", topTenantIds.map(([id]) => id));
      const nameOf = new Map((comps ?? []).map((c: any) => [c.id, c.trade_name || c.name]));
      topTenants = topTenantIds.map(([id, cents]) => ({
        id,
        name: (nameOf.get(id) as string) ?? id.slice(0, 8),
        netBRL: toReais(cents),
      }));
    }

    return {
      windowDays: days,
      kpis: {
        grossBRL: toReais(grossCents),
        netBRL: toReais(netCents),
        feeBRL: toReais(feeCents),
        gatewayFeeBRL: toReais(gatewayFeeCents),
        netDeltaPct,
        mrrBRL: toReais(mrrCents),
        arrBRL: toReais(arrCents),
        churnPct: Math.round(churnPct * 100) / 100,
        ticketBRL: toReais(ticketCents),
        activeSubscribers: activeCount,
        canceledInWindow,
      },
      invoices: {
        totalBRL: invTotal,
        paidBRL: invPaid,
        openBRL: invOpen,
        overdueBRL: invOverdue,
        count: inv.length,
      },
      payouts: {
        pendingBRL: toReais(payoutPending),
        paidBRL: toReais(payoutPaid),
        count: pay.length,
      },
      byMethod: Object.entries(byMethod).map(([k, v]) => ({
        method: k,
        grossBRL: toReais(v.gross),
        netBRL: toReais(v.net),
        count: v.count,
      })),
      bySource: Object.entries(bySource).map(([k, v]) => ({
        source: k,
        grossBRL: toReais(v.gross),
        netBRL: toReais(v.net),
        count: v.count,
      })),
      series,
      topTenants,
    };
  });
