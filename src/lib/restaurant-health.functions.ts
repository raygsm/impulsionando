import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Restaurant & POS Cockpit — Fase 52.
 * Giro de mesas, ticket médio, top itens, sessões de caixa, formas de pagamento
 * e operação de cozinha.
 */
export const getRestaurantHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [tablesRes, sessRes, invRes, miRes, ordersRes, oiRes, cashRes, payRes] = await Promise.all([
      supabaseAdmin.from("restaurant_tables").select("id, status, is_active, capacity, area").limit(20000),
      supabaseAdmin.from("restaurant_table_sessions").select("id, table_id, party_size, status, total, opened_at, closed_at").gte("opened_at", sinceIso).limit(50000),
      supabaseAdmin.from("restaurant_table_invoices").select("id, amount_cents, status, created_at, paid_at, attempt_number").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("restaurant_menu_items").select("id, name, price_cents, is_available, is_active").limit(20000),
      supabaseAdmin.from("sales_orders").select("id, status, total, discount, subtotal, confirmed_at, cancelled_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("sales_order_items").select("id, order_id, product_id, description, quantity, unit_price, total, kitchen_status, created_at, kitchen_updated_at, notified_ready_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("sales_cash_sessions").select("id, opened_at, closed_at, opening_amount, closing_amount, expected_total, difference_total, status").gte("opened_at", sinceIso).limit(20000),
      supabaseAdmin.from("sales_payments").select("id, payment_method_id, amount, created_at").gte("created_at", sinceIso).limit(100000),
    ]);

    const err = tablesRes.error || sessRes.error || invRes.error || miRes.error || ordersRes.error || oiRes.error || cashRes.error || payRes.error;
    if (err) throw new Error(err.message);

    const tables = tablesRes.data ?? [];
    const sessions = sessRes.data ?? [];
    const invoices = invRes.data ?? [];
    const menu = miRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const items = oiRes.data ?? [];
    const cash = cashRes.data ?? [];
    const payments = payRes.data ?? [];

    // Tables
    const tablesActive = tables.filter((t) => t.is_active).length;
    const tablesOccupied = tables.filter((t) => t.status === "occupied" || t.status === "ocupada").length;
    const totalCapacity = tables.reduce((s, t) => s + Number(t.capacity || 0), 0);

    // Sessions
    const sessClosed = sessions.filter((s) => !!s.closed_at);
    const turnTimes = sessClosed
      .filter((s) => s.opened_at)
      .map((s) => (new Date(s.closed_at as string).getTime() - new Date(s.opened_at).getTime()) / 60000);
    const avgTurnMin = turnTimes.length ? turnTimes.reduce((a, b) => a + b, 0) / turnTimes.length : 0;
    const sessRevenue = sessions.reduce((s, x) => s + Number(x.total || 0), 0);
    const avgSession = sessions.length ? sessRevenue / sessions.length : 0;
    const totalParty = sessions.reduce((s, x) => s + Number(x.party_size || 0), 0);
    const avgPartySize = sessions.length ? totalParty / sessions.length : 0;
    const turnoverPerTable = tablesActive ? sessClosed.length / tablesActive : 0;

    // Orders
    const ordersConfirmed = orders.filter((o) => !!o.confirmed_at || o.status === "confirmed" || o.status === "paid" || o.status === "closed");
    const ordersCancelled = orders.filter((o) => !!o.cancelled_at || o.status === "cancelled");
    const ordersOpen = orders.filter((o) => !o.confirmed_at && !o.cancelled_at);
    const ordersRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const ordersDiscount = orders.reduce((s, o) => s + Number(o.discount || 0), 0);
    const avgTicket = ordersConfirmed.length ? ordersConfirmed.reduce((s, o) => s + Number(o.total || 0), 0) / ordersConfirmed.length : 0;
    const cancelRate = orders.length ? (ordersCancelled.length / orders.length) * 100 : 0;

    // Items / kitchen
    const totalItems = items.length;
    const itemsServed = items.filter((i) => i.kitchen_status === "served" || i.kitchen_status === "ready" || !!i.notified_ready_at).length;
    const kitchenTimes = items.filter((i) => i.kitchen_updated_at && i.created_at && (i.kitchen_status === "ready" || i.kitchen_status === "served"))
      .map((i) => (new Date(i.kitchen_updated_at as string).getTime() - new Date(i.created_at).getTime()) / 60000);
    const avgKitchenMin = kitchenTimes.length ? kitchenTimes.reduce((a, b) => a + b, 0) / kitchenTimes.length : 0;

    // Top items
    const itemAgg = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items) {
      const key = it.product_id || it.description || "—";
      const cur = itemAgg.get(key) ?? { name: it.description || "—", qty: 0, revenue: 0 };
      cur.qty += Number(it.quantity || 0);
      cur.revenue += Number(it.total || 0);
      itemAgg.set(key, cur);
    }
    const topItems = Array.from(itemAgg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 20);

    // Cash sessions
    const cashOpen = cash.filter((c) => !c.closed_at || c.status === "open").length;
    const cashClosed = cash.filter((c) => !!c.closed_at);
    const cashDiffSum = cashClosed.reduce((s, c) => s + Number(c.difference_total || 0), 0);
    const cashDiffAbs = cashClosed.reduce((s, c) => s + Math.abs(Number(c.difference_total || 0)), 0);
    const cashWithDiff = cashClosed.filter((c) => Math.abs(Number(c.difference_total || 0)) > 0.01).length;

    // Payments
    const payMap = new Map<string, { count: number; amount: number }>();
    for (const p of payments) {
      const k = p.payment_method_id || "—";
      const cur = payMap.get(k) ?? { count: 0, amount: 0 };
      cur.count++;
      cur.amount += Number(p.amount || 0);
      payMap.set(k, cur);
    }
    const paymentsBreakdown = Array.from(payMap, ([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount);
    const paymentsTotal = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // Pix invoices
    const invPaid = invoices.filter((i) => i.status === "paid" || !!i.paid_at).length;
    const invPending = invoices.filter((i) => i.status === "pending" || i.status === "open").length;
    const invFailed = invoices.filter((i) => i.status === "failed" || !!i.attempt_number && i.attempt_number > 1).length;
    const invRevenue = invoices.filter((i) => i.status === "paid" || !!i.paid_at).reduce((s, i) => s + Number(i.amount_cents || 0), 0) / 100;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      tables: {
        total: tables.length,
        active: tablesActive,
        occupied: tablesOccupied,
        capacity: totalCapacity,
        avgTurnMin,
        turnoverPerTable,
      },
      sessions: {
        total: sessions.length,
        closed: sessClosed.length,
        avgPartySize,
        avgSession,
        revenue: sessRevenue,
      },
      orders: {
        total: orders.length,
        confirmed: ordersConfirmed.length,
        cancelled: ordersCancelled.length,
        open: ordersOpen.length,
        revenue: ordersRevenue,
        discount: ordersDiscount,
        avgTicket,
        cancelRate,
      },
      kitchen: {
        items: totalItems,
        served: itemsServed,
        avgPrepMin: avgKitchenMin,
      },
      menu: {
        total: menu.length,
        active: menu.filter((m) => m.is_active).length,
        available: menu.filter((m) => m.is_available && m.is_active).length,
      },
      topItems,
      cash: {
        sessions: cash.length,
        open: cashOpen,
        closed: cashClosed.length,
        diffSum: cashDiffSum,
        diffAbs: cashDiffAbs,
        withDiff: cashWithDiff,
      },
      payments: {
        total: paymentsTotal,
        count: payments.length,
        breakdown: paymentsBreakdown,
      },
      pix: {
        total: invoices.length,
        paid: invPaid,
        pending: invPending,
        failed: invFailed,
        revenue: invRevenue,
      },
    };
  });
