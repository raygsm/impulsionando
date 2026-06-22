import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marketplace Operations Cockpit — Fase 41.
 * Pedidos B2B, GMV diário, Taxa de Intermediação Digital, supplier/buyer health.
 */
export const getMarketplaceOps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [ordersRes, eventsRes, suppliersRes, buyersRes] = await Promise.all([
      supabaseAdmin
        .from("mp_orders")
        .select("id, supplier_id, buyer_id, status, subtotal_cents, fee_cents, total_cents, supplier_net_cents, placed_at, approved_at, completed_at, rejected_at, invoiced_at, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("mp_order_events")
        .select("order_id, event_type, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("mp_suppliers")
        .select("id, display_name, supplier_type, status, custom_fee_pct")
        .limit(2000),
      supabaseAdmin
        .from("mp_buyers")
        .select("id, display_name, buyer_type, status")
        .limit(5000),
    ]);

    const orders = ordersRes.data ?? [];
    const events = eventsRes.data ?? [];
    const suppliers = suppliersRes.data ?? [];
    const buyers = buyersRes.data ?? [];

    const supMap = new Map(suppliers.map((s) => [s.id, s]));
    const buyMap = new Map(buyers.map((b) => [b.id, b]));

    // ---- KPIs gerais ----
    const totalOrders = orders.length;
    const statusCount = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status ?? "—"] = (acc[o.status ?? "—"] ?? 0) + 1;
      return acc;
    }, {});
    const approvedOrders = orders.filter((o) => ["approved", "completed", "invoiced"].includes(o.status ?? ""));
    const rejectedOrders = orders.filter((o) => o.status === "rejected").length;
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "placed").length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const gmv = approvedOrders.reduce((s, o) => s + Number(o.subtotal_cents ?? 0), 0) / 100;
    const feesCollected = approvedOrders.reduce((s, o) => s + Number(o.fee_cents ?? 0), 0) / 100;
    const supplierNet = approvedOrders.reduce((s, o) => s + Number(o.supplier_net_cents ?? 0), 0) / 100;
    const approvalRate = totalOrders ? ((approvedOrders.length / totalOrders) * 100) : 0;
    const avgTicket = approvedOrders.length ? gmv / approvedOrders.length : 0;

    // ---- Tempo médio de aprovação (placed_at -> approved_at) ----
    const approvalTimes = approvedOrders
      .filter((o) => o.placed_at && o.approved_at)
      .map((o) => (new Date(o.approved_at!).getTime() - new Date(o.placed_at!).getTime()) / 3600000);
    const avgApprovalHours = approvalTimes.length ? approvalTimes.reduce((s, n) => s + n, 0) / approvalTimes.length : null;

    // ---- GMV diário ----
    const dayMap = new Map<string, { gmv: number; orders: number; fees: number }>();
    for (const o of approvedOrders) {
      const day = (o.approved_at ?? o.completed_at ?? o.created_at)?.slice(0, 10);
      if (!day) continue;
      const cur = dayMap.get(day) ?? { gmv: 0, orders: 0, fees: 0 };
      cur.gmv += Number(o.subtotal_cents ?? 0) / 100;
      cur.fees += Number(o.fee_cents ?? 0) / 100;
      cur.orders++;
      dayMap.set(day, cur);
    }
    const dailyGmv = Array.from(dayMap.entries())
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // ---- Top suppliers ----
    const supAgg = new Map<string, { orders: number; gmv: number; fees: number; approved: number; rejected: number }>();
    for (const o of orders) {
      if (!o.supplier_id) continue;
      const cur = supAgg.get(o.supplier_id) ?? { orders: 0, gmv: 0, fees: 0, approved: 0, rejected: 0 };
      cur.orders++;
      if (["approved", "completed", "invoiced"].includes(o.status ?? "")) {
        cur.approved++;
        cur.gmv += Number(o.subtotal_cents ?? 0) / 100;
        cur.fees += Number(o.fee_cents ?? 0) / 100;
      }
      if (o.status === "rejected") cur.rejected++;
      supAgg.set(o.supplier_id, cur);
    }
    const topSuppliers = Array.from(supAgg.entries())
      .map(([id, v]) => {
        const s = supMap.get(id);
        return {
          id,
          name: s?.display_name ?? "—",
          type: s?.supplier_type ?? null,
          status: s?.status ?? null,
          orders: v.orders,
          approved: v.approved,
          rejected: v.rejected,
          gmv: v.gmv,
          fees: v.fees,
          approvalRate: v.orders ? (v.approved / v.orders) * 100 : 0,
        };
      })
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 15);

    // ---- Top buyers ----
    const buyAgg = new Map<string, { orders: number; gmv: number }>();
    for (const o of approvedOrders) {
      if (!o.buyer_id) continue;
      const cur = buyAgg.get(o.buyer_id) ?? { orders: 0, gmv: 0 };
      cur.orders++;
      cur.gmv += Number(o.subtotal_cents ?? 0) / 100;
      buyAgg.set(o.buyer_id, cur);
    }
    const topBuyers = Array.from(buyAgg.entries())
      .map(([id, v]) => ({
        id,
        name: buyMap.get(id)?.display_name ?? "—",
        type: buyMap.get(id)?.buyer_type ?? null,
        ...v,
      }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 15);

    // ---- Events breakdown ----
    const eventTypeCount = events.reduce<Record<string, number>>((acc, e) => {
      acc[e.event_type ?? "—"] = (acc[e.event_type ?? "—"] ?? 0) + 1;
      return acc;
    }, {});

    // ---- Suppliers stats ----
    const activeSuppliers = suppliers.filter((s) => s.status === "active" || s.status === "ativo").length;
    const inactiveSuppliers = suppliers.length - activeSuppliers;
    const activeBuyers = buyers.filter((b) => b.status === "active" || b.status === "ativo").length;

    return {
      windowDays: data.days,
      kpis: {
        totalOrders,
        approvedOrders: approvedOrders.length,
        rejectedOrders,
        pendingOrders,
        completedOrders,
        gmv,
        feesCollected,
        supplierNet,
        approvalRate,
        avgTicket,
        avgApprovalHours,
        activeSuppliers,
        inactiveSuppliers,
        activeBuyers,
        totalSuppliers: suppliers.length,
        totalBuyers: buyers.length,
      },
      statusCount,
      eventTypeCount,
      dailyGmv,
      topSuppliers,
      topBuyers,
    };
  });
