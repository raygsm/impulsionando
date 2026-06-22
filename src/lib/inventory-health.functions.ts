import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Inventory & Stock Cockpit — Fase 53.
 * Saúde do estoque: rupturas, giro, valor parado, top movimentos, fornecedores.
 */
export const getInventoryHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [prodRes, catRes, supRes, movRes] = await Promise.all([
      supabaseAdmin.from("inv_products").select("id, name, sku, category_id, supplier_id, cost_price, sale_price, current_stock, min_stock, max_stock, track_stock, is_active").limit(50000),
      supabaseAdmin.from("inv_categories").select("id, name, is_active").limit(5000),
      supabaseAdmin.from("inv_suppliers").select("id, name, is_active").limit(10000),
      supabaseAdmin.from("inv_movements").select("id, product_id, kind, quantity, unit_cost, reason, created_at").gte("created_at", sinceIso).limit(100000),
    ]);

    const err = prodRes.error || catRes.error || supRes.error || movRes.error;
    if (err) throw new Error(err.message);

    const products = prodRes.data ?? [];
    const cats = catRes.data ?? [];
    const sups = supRes.data ?? [];
    const movs = movRes.data ?? [];

    const tracked = products.filter((p) => p.track_stock && p.is_active);
    const ruptured = tracked.filter((p) => Number(p.current_stock || 0) <= 0).length;
    const low = tracked.filter((p) => Number(p.current_stock || 0) > 0 && Number(p.current_stock || 0) <= Number(p.min_stock || 0)).length;
    const over = tracked.filter((p) => Number(p.max_stock || 0) > 0 && Number(p.current_stock || 0) > Number(p.max_stock || 0)).length;
    const stockValue = tracked.reduce((s, p) => s + Number(p.current_stock || 0) * Number(p.cost_price || 0), 0);
    const salesValue = tracked.reduce((s, p) => s + Number(p.current_stock || 0) * Number(p.sale_price || 0), 0);
    const potentialMargin = salesValue - stockValue;

    const inMovs = movs.filter((m) => m.kind === "in" || m.kind === "entrada" || Number(m.quantity || 0) > 0 && !["out","saida","saída"].includes(m.kind));
    const outMovs = movs.filter((m) => m.kind === "out" || m.kind === "saida" || m.kind === "saída");
    const totalIn = inMovs.reduce((s, m) => s + Math.abs(Number(m.quantity || 0)), 0);
    const totalOut = outMovs.reduce((s, m) => s + Math.abs(Number(m.quantity || 0)), 0);
    const inCost = inMovs.reduce((s, m) => s + Math.abs(Number(m.quantity || 0)) * Number(m.unit_cost || 0), 0);

    const prodMap = new Map(products.map((p) => [p.id, p]));
    const movAgg = new Map<string, { name: string; sku: string; in: number; out: number; net: number }>();
    for (const m of movs) {
      const p = prodMap.get(m.product_id);
      if (!p) continue;
      const cur = movAgg.get(m.product_id) ?? { name: p.name, sku: p.sku || "—", in: 0, out: 0, net: 0 };
      const q = Math.abs(Number(m.quantity || 0));
      if (outMovs.includes(m)) { cur.out += q; cur.net -= q; }
      else { cur.in += q; cur.net += q; }
      movAgg.set(m.product_id, cur);
    }
    const topMovers = Array.from(movAgg.values()).sort((a, b) => b.out - a.out).slice(0, 20);

    const rupturedList = tracked
      .filter((p) => Number(p.current_stock || 0) <= 0)
      .slice(0, 25)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku || "—", min: Number(p.min_stock || 0) }));

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      products: {
        total: products.length,
        active: products.filter((p) => p.is_active).length,
        tracked: tracked.length,
        ruptured,
        low,
        over,
        stockValue,
        salesValue,
        potentialMargin,
      },
      catalog: {
        categories: cats.length,
        activeCategories: cats.filter((c) => c.is_active).length,
        suppliers: sups.length,
        activeSuppliers: sups.filter((s) => s.is_active).length,
      },
      movements: {
        total: movs.length,
        in: totalIn,
        out: totalOut,
        net: totalIn - totalOut,
        inCost,
        turnover: stockValue > 0 ? (totalOut * (tracked[0]?.cost_price || 1)) / stockValue : 0,
      },
      topMovers,
      rupturedList,
    };
  });
