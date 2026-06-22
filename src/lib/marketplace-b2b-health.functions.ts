import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marketplace B2B Ops Cockpit — Fase 57.
 * GMV, Taxa de Intermediação Digital, fornecedores, compradores, catálogo e ledger.
 */
export const getMarketplaceB2BHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [supRes, buyRes, catRes, ordRes, itRes, ledRes, subRes, plansRes, feeRes] = await Promise.all([
      supabaseAdmin.from("mp_suppliers").select("id, display_name, supplier_type, status, custom_fee_pct, regions_served").limit(20000),
      supabaseAdmin.from("mp_buyers").select("id, display_name, buyer_type, status, created_at").limit(50000),
      supabaseAdmin.from("mp_catalog_items").select("id, supplier_id, price_cents, stock_qty, active").limit(50000),
      supabaseAdmin.from("mp_orders").select("id, supplier_id, buyer_id, status, subtotal_cents, fee_pct, fee_cents, total_cents, supplier_net_cents, placed_at, approved_at, completed_at, rejected_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("mp_order_items").select("id, order_id, qty, line_total_cents").limit(100000),
      supabaseAdmin.from("mp_transactions_ledger").select("id, period_month, gmv_cents, order_id, supplier_id").limit(100000),
      supabaseAdmin.from("mp_subscriptions").select("id, plan_id, status, next_billing_at, canceled_at, created_at").limit(20000),
      supabaseAdmin.from("mp_plans").select("id, name, slug, price_cents, active").limit(2000),
      supabaseAdmin.from("mp_fee_policies").select("id, scope, niche_slug, fee_pct, active").limit(2000),
    ]);

    const err = supRes.error || buyRes.error || catRes.error || ordRes.error || itRes.error || ledRes.error || subRes.error || plansRes.error || feeRes.error;
    if (err) throw new Error(err.message);

    const suppliers = supRes.data ?? [];
    const buyers = buyRes.data ?? [];
    const catalog = catRes.data ?? [];
    const orders = ordRes.data ?? [];
    const ledger = ledRes.data ?? [];
    const subscriptions = subRes.data ?? [];
    const plans = plansRes.data ?? [];
    const fees = feeRes.data ?? [];

    const gmv = orders.reduce((s, o) => s + Number(o.subtotal_cents || 0), 0) / 100;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_cents || 0), 0) / 100;
    const intermediationFee = orders.reduce((s, o) => s + Number(o.fee_cents || 0), 0) / 100;
    const supplierNet = orders.reduce((s, o) => s + Number(o.supplier_net_cents || 0), 0) / 100;
    const avgFeePct = orders.length ? orders.reduce((s, o) => s + Number(o.fee_pct || 0), 0) / orders.length : 0;

    const placed = orders.filter((o) => !!o.placed_at).length;
    const approved = orders.filter((o) => !!o.approved_at).length;
    const completed = orders.filter((o) => !!o.completed_at || o.status === "completed").length;
    const rejected = orders.filter((o) => !!o.rejected_at || o.status === "rejected").length;
    const pending = orders.filter((o) => !["completed","rejected","cancelled"].includes(o.status) && !o.completed_at).length;
    const completionRate = orders.length ? (completed / orders.length) * 100 : 0;
    const avgTicket = orders.length ? totalRevenue / orders.length : 0;

    // ranking suppliers
    const supMap = new Map(suppliers.map((s) => [s.id, s]));
    const supAgg = new Map<string, { name: string; type: string; gmv: number; orders: number; fee: number }>();
    for (const o of orders) {
      const s = supMap.get(o.supplier_id);
      if (!s) continue;
      const cur = supAgg.get(o.supplier_id) ?? { name: s.display_name, type: s.supplier_type || "—", gmv: 0, orders: 0, fee: 0 };
      cur.gmv += Number(o.subtotal_cents || 0) / 100;
      cur.fee += Number(o.fee_cents || 0) / 100;
      cur.orders++;
      supAgg.set(o.supplier_id, cur);
    }
    const topSuppliers = Array.from(supAgg.values()).sort((a, b) => b.gmv - a.gmv).slice(0, 20);

    // active catalog stats
    const activeItems = catalog.filter((c) => c.active).length;
    const outOfStock = catalog.filter((c) => Number(c.stock_qty || 0) <= 0 && c.active).length;

    const subActive = subscriptions.filter((s) => s.status === "authorized" || s.status === "active").length;
    const subCanceled = subscriptions.filter((s) => s.status === "cancelled" || !!s.canceled_at).length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      orders: { total: orders.length, placed, approved, completed, rejected, pending, completionRate, avgTicket, totalRevenue },
      gmv: { gmv, intermediationFee, supplierNet, avgFeePct },
      suppliers: { total: suppliers.length, active: suppliers.filter((s) => s.status === "active").length },
      buyers: { total: buyers.length, active: buyers.filter((b) => b.status === "active").length },
      catalog: { total: catalog.length, active: activeItems, outOfStock },
      ledgerEntries: ledger.length,
      subscriptions: { total: subscriptions.length, active: subActive, canceled: subCanceled, plans: plans.length },
      fees: fees.filter((f) => f.active),
      topSuppliers,
    };
  });
