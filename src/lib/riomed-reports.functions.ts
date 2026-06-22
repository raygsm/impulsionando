import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase.from("user_profiles").select("company_id").eq("user_id", ctx.userId).maybeSingle();
  if (!data?.company_id) throw new Error("Empresa não encontrada");
  return data.company_id as string;
}

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export const getExecutiveOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    from: z.string().optional(), to: z.string().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const to = data.to ?? new Date().toISOString().slice(0, 10);
    const from = data.from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const [orders, quotes, leads, ar, ap, commissions, products, stock, suppliers, hospitals, campaigns] = await Promise.all([
      sb.from("sales_orders").select("id,total_amount,status,created_at,customer_id").eq("company_id", cid).gte("created_at", from).lte("created_at", `${to}T23:59:59`),
      sb.from("riomed_quotes").select("id,total,status,created_at").eq("company_id", cid).gte("created_at", from).lte("created_at", `${to}T23:59:59`),
      sb.from("crm_leads").select("id,status,created_at,source").eq("company_id", cid).gte("created_at", from).lte("created_at", `${to}T23:59:59`),
      sb.from("riomed_ar_invoices").select("amount,paid_amount,status,due_date").eq("company_id", cid),
      sb.from("riomed_ap_invoices").select("amount,paid_amount,status,due_date").eq("company_id", cid),
      sb.from("riomed_commissions").select("amount,status,period").eq("company_id", cid),
      sb.from("riomed_products").select("id").eq("company_id", cid),
      sb.from("riomed_stock_levels").select("qty_on_hand,qty_available,product_id").eq("company_id", cid),
      sb.from("riomed_suppliers").select("status").eq("company_id", cid),
      sb.from("riomed_hospital_accounts").select("status").eq("company_id", cid),
      sb.from("riomed_campaigns").select("id,status,created_at").eq("company_id", cid).gte("created_at", from),
    ]);

    const o = orders.data ?? []; const q = quotes.data ?? []; const l = leads.data ?? [];
    const sum = (rows: any[], col: string) => rows.reduce((s, r) => s + Number(r[col] ?? 0), 0);

    // Vendas por dia
    const byDay: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (const r of o) {
      const d = (r.created_at as string).slice(0, 10);
      byDay[d] ??= { date: d, revenue: 0, orders: 0 };
      byDay[d].revenue += Number(r.total_amount ?? 0);
      byDay[d].orders += 1;
    }
    const salesByDay = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

    const wonQuotes = q.filter((x: any) => x.status === "won").length;
    const totalQuotes = q.length;

    return {
      period: { from, to },
      kpis: {
        revenue: sum(o, "total_amount"),
        orders: o.length,
        avgTicket: o.length ? sum(o, "total_amount") / o.length : 0,
        leads: l.length,
        winRate: totalQuotes ? (wonQuotes / totalQuotes) * 100 : 0,
        arOpen: sum((ar.data ?? []).filter((r: any) => r.status !== "paid" && r.status !== "cancelled"), "amount"),
        apOpen: sum((ap.data ?? []).filter((r: any) => r.status !== "paid" && r.status !== "cancelled"), "amount"),
        commissionsAccrued: (commissions.data ?? []).filter((c: any) => c.status === "accrued").reduce((s: number, c: any) => s + Number(c.amount), 0),
        products: (products.data ?? []).length,
        stockUnits: sum(stock.data ?? [], "qty_on_hand"),
        suppliersApproved: (suppliers.data ?? []).filter((s: any) => s.status === "approved").length,
        hospitalsActive: (hospitals.data ?? []).filter((h: any) => h.status === "active").length,
        campaignsRunning: (campaigns.data ?? []).filter((c: any) => c.status === "active" || c.status === "running").length,
      },
      salesByDay,
      leadsBySource: Object.entries(
        l.reduce((acc: Record<string, number>, x: any) => { acc[x.source ?? "—"] = (acc[x.source ?? "—"] ?? 0) + 1; return acc; }, {})
      ).map(([source, count]) => ({ source, count })),
      ordersByStatus: Object.entries(
        o.reduce((acc: Record<string, number>, x: any) => { acc[x.status] = (acc[x.status] ?? 0) + 1; return acc; }, {})
      ).map(([status, count]) => ({ status, count })),
    };
  });

export const exportCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    dataset: z.enum(["sales_orders","riomed_quotes","riomed_ar_invoices","riomed_ap_invoices","riomed_commissions","riomed_stock_levels","riomed_products","crm_leads"]),
    from: z.string().optional(), to: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    let q = sb.from(data.dataset).select("*").eq("company_id", cid).limit(10000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", `${data.to}T23:59:59`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { csv: toCsv(rows ?? []), filename: `${data.dataset}-${new Date().toISOString().slice(0,10)}.csv`, count: (rows ?? []).length };
  });

export const getFiscalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: z.string() }).parse(d)) // YYYY-MM
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const from = `${data.month}-01`;
    const next = new Date(`${from}T00:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
    const to = next.toISOString().slice(0, 10);

    const [orders, items] = await Promise.all([
      sb.from("sales_orders").select("id,number,total_amount,status,created_at,customer_id").eq("company_id", cid).gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true }),
      sb.from("sales_order_items").select("order_id,product_id,quantity,unit_price,total_price").eq("company_id", cid),
    ]);
    const o = orders.data ?? []; const it = items.data ?? [];
    const itemsByOrder = new Map<string, any[]>();
    for (const i of it) {
      if (!itemsByOrder.has(i.order_id)) itemsByOrder.set(i.order_id, []);
      itemsByOrder.get(i.order_id)!.push(i);
    }
    const lines = o.flatMap((ord: any) => (itemsByOrder.get(ord.id) ?? []).map((i: any) => ({
      order_number: ord.number ?? ord.id.slice(0, 8),
      issued_at: ord.created_at, status: ord.status,
      product_id: i.product_id, qty: i.quantity, unit_price: i.unit_price, total: i.total_price,
    })));
    const sum = (rows: any[], col: string) => rows.reduce((s, r) => s + Number(r[col] ?? 0), 0);
    return {
      month: data.month, from, to,
      summary: {
        orders: o.length,
        gross: sum(o, "total_amount"),
        lines: lines.length,
        unitsSold: sum(lines, "qty"),
      },
      csv: toCsv(lines),
      filename: `relatorio-fiscal-${data.month}.csv`,
    };
  });
