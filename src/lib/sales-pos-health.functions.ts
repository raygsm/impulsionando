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

    const [ordersRes, itemsRes, paysRes, cashRes, countsRes, methodsRes] = await Promise.all([
      supabaseAdmin
        .from("sales_orders")
        .select("id, company_id, unit_id, status, subtotal, discount, total, customer_id, confirmed_at, cancelled_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("sales_order_items")
        .select("id, order_id, product_id, description, quantity, unit_price, discount, total, kitchen_status")
        .limit(100000),
      supabaseAdmin
        .from("sales_payments")
        .select("id, order_id, payment_method_id, amount, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("sales_cash_sessions")
        .select("id, company_id, unit_id, opened_at, closed_at, opening_amount, closing_amount, expected_total, difference_total, status")
        .gte("opened_at", sinceIso)
        .limit(5000),
      supabaseAdmin
        .from("sales_cash_session_counts")
        .select("id, session_id, payment_method_id, expected_amount, counted_amount, difference")
        .limit(20000),
      supabaseAdmin
        .from("fin_payment_methods")
        .select("id, name")
        .limit(5000),
    ]);

    const orders = ordersRes.data ?? [];
    const items = itemsRes.data ?? [];
    const pays = paysRes.data ?? [];
    const cash = cashRes.data ?? [];
    const counts = countsRes.data ?? [];
    const methods = methodsRes.data ?? [];
    const methodMap = new Map(methods.map((m: any) => [m.id, m.name ?? "—"]));

    const paidOrders = orders.filter((o: any) => o.status === "paid" || o.status === "completed" || o.status === "confirmed");
    const canceledOrders = orders.filter((o: any) => o.status === "canceled" || o.status === "cancelled");
    const pendingOrders = orders.filter((o: any) => o.status === "pending" || o.status === "open" || o.status === "draft");
    const gmv = paidOrders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const discount = paidOrders.reduce((s: number, o: any) => s + Number(o.discount ?? 0), 0);
    const avgTicket = paidOrders.length ? gmv / paidOrders.length : 0;

    const byStatus: Record<string, number> = {};
    for (const o of orders) {
      const k = o.status ?? "unknown";
      byStatus[k] = (byStatus[k] ?? 0) + 1;
    }

    const byMethod: Record<string, { count: number; amount: number }> = {};
    for (const p of pays) {
      const k = methodMap.get(p.payment_method_id) ?? "—";
      byMethod[k] ??= { count: 0, amount: 0 };
      byMethod[k].count++;
      byMethod[k].amount += Number(p.amount ?? 0);
    }

    const productAgg: Record<string, { name: string; qty: number; total: number }> = {};
    for (const it of items) {
      const k = String(it.product_id ?? it.description ?? "n/a");
      productAgg[k] ??= { name: it.description ?? "—", qty: 0, total: 0 };
      productAgg[k].qty += Number(it.quantity ?? 0);
      productAgg[k].total += Number(it.total ?? 0);
    }
    const topProducts = Object.values(productAgg)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const openCash = cash.filter((c: any) => c.status === "open").length;
    const closedCash = cash.filter((c: any) => c.status === "closed").length;
    const diffSum = cash.reduce((s: number, c: any) => s + Number(c.difference_total ?? 0), 0);
    const diffAbs = cash.reduce((s: number, c: any) => s + Math.abs(Number(c.difference_total ?? 0)), 0);

    return {
      orders: {
        total: orders.length,
        paid: paidOrders.length,
        pending: pendingOrders.length,
        canceled: canceledOrders.length,
        gmv,
        discount,
        avgTicket,
        byStatus: Object.entries(byStatus)
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count),
      },
      payments: {
        total: pays.length,
        amount: pays.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0),
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
