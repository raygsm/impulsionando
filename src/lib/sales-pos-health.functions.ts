import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sales & POS Cockpit — Fase 70.
 * Consolida pedidos (sales_orders), itens, pagamentos e sessões de caixa.
 */
export const getSalesPosHealth = createServerFn({ method: "POST" })
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

    const [ordersRes, itemsRes, paysRes, cashRes, countsRes] = await Promise.all([
      supabaseAdmin
        .from("sales_orders")
        .select("id, company_id, status, total, discount, channel, customer_id, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("sales_order_items")
        .select("id, order_id, product_id, product_name, qty, unit_price, total")
        .limit(100000),
      supabaseAdmin
        .from("sales_payments")
        .select("id, order_id, method, amount, status, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("sales_cash_sessions")
        .select("id, company_id, opened_at, closed_at, opening_amount, closing_amount, expected_amount, difference, status")
        .gte("opened_at", sinceIso)
        .limit(5000),
      supabaseAdmin
        .from("sales_cash_session_counts")
        .select("id, session_id, denomination, qty, total")
        .limit(20000),
    ]);

    const orders = ordersRes.data ?? [];
    const items = itemsRes.data ?? [];
    const pays = paysRes.data ?? [];
    const cash = cashRes.data ?? [];
    const counts = countsRes.data ?? [];

    const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "completed");
    const canceledOrders = orders.filter((o) => o.status === "canceled" || o.status === "cancelled");
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "open");
    const gmv = paidOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const discount = paidOrders.reduce((s, o) => s + Number(o.discount ?? 0), 0);
    const avgTicket = paidOrders.length ? gmv / paidOrders.length : 0;

    const byChannel: Record<string, { count: number; total: number }> = {};
    for (const o of paidOrders) {
      const c = o.channel ?? "unknown";
      byChannel[c] ??= { count: 0, total: 0 };
      byChannel[c].count++;
      byChannel[c].total += Number(o.total ?? 0);
    }

    const byMethod: Record<string, { count: number; amount: number }> = {};
    const paidPays = pays.filter((p) => p.status === "paid" || p.status === "approved" || p.status === "completed");
    for (const p of paidPays) {
      const m = p.method ?? "unknown";
      byMethod[m] ??= { count: 0, amount: 0 };
      byMethod[m].count++;
      byMethod[m].amount += Number(p.amount ?? 0);
    }

    const productAgg: Record<string, { name: string; qty: number; total: number }> = {};
    for (const it of items) {
      const k = String(it.product_id ?? it.product_name ?? "n/a");
      productAgg[k] ??= { name: it.product_name ?? "—", qty: 0, total: 0 };
      productAgg[k].qty += Number(it.qty ?? 0);
      productAgg[k].total += Number(it.total ?? 0);
    }
    const topProducts = Object.values(productAgg)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const openCash = cash.filter((c) => c.status === "open").length;
    const closedCash = cash.filter((c) => c.status === "closed").length;
    const diffSum = cash.reduce((s, c) => s + Number(c.difference ?? 0), 0);
    const diffAbs = cash.reduce((s, c) => s + Math.abs(Number(c.difference ?? 0)), 0);

    return {
      orders: {
        total: orders.length,
        paid: paidOrders.length,
        pending: pendingOrders.length,
        canceled: canceledOrders.length,
        gmv,
        discount,
        avgTicket,
      },
      channels: Object.entries(byChannel)
        .map(([channel, v]) => ({ channel, ...v }))
        .sort((a, b) => b.total - a.total),
      payments: {
        total: pays.length,
        paid: paidPays.length,
        amount: paidPays.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        byMethod: Object.entries(byMethod)
          .map(([method, v]) => ({ method, ...v }))
          .sort((a, b) => b.amount - a.amount),
      },
      topProducts,
      cash: {
        total: cash.length,
        open: openCash,
        closed: closedCash,
        differenceSum: diffSum,
        differenceAbs: diffAbs,
        counts: counts.length,
      },
    };
  });
