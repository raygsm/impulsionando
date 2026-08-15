import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function riomedContext(ctx: any): Promise<{ companyId: string; tenantId: string }> {
  const { data, error } = await ctx.supabase.from("communication_tenants")
    .select("id,company_id").eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id || !data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return { companyId: data.company_id as string, tenantId: data.id as string };
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
  .inputValidator((d: unknown) => z.object({ from: z.string().optional(), to: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { companyId, tenantId } = await riomedContext(context as any);
    const to = data.to ?? new Date().toISOString().slice(0, 10);
    const from = data.from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = `${to}T23:59:59.999Z`;

    const [orders, quotes, contacts, ar, ap, commissions, products, variants, suppliers, hospitals, campaigns] = await Promise.all([
      sb.from("sales_orders").select("id,total,status,created_at,contact_id").eq("company_id", companyId).gte("created_at", from).lte("created_at", end),
      sb.from("riomed_quotes").select("id,total,status,created_at,channel").eq("company_id", companyId).gte("created_at", from).lte("created_at", end),
      sb.from("communication_contacts").select("id,attributes,created_at").eq("tenant_id", tenantId).is("merged_into_contact_id", null).gte("created_at", from).lte("created_at", end),
      sb.from("riomed_ar_invoices").select("amount,paid_amount,status,due_date").eq("company_id", companyId),
      sb.from("riomed_ap_invoices").select("amount,paid_amount,status,due_date").eq("company_id", companyId),
      sb.from("riomed_commissions").select("amount,status,period").eq("company_id", companyId),
      sb.from("riomed_products").select("id,stock").eq("company_id", companyId).eq("is_active", true),
      sb.from("riomed_product_variants").select("id,product_id,stock").eq("company_id", companyId).eq("active", true),
      sb.from("riomed_suppliers").select("status").eq("company_id", companyId),
      sb.from("riomed_hospital_accounts").select("status").eq("company_id", companyId),
      sb.from("riomed_campaigns").select("id,status,created_at").eq("company_id", companyId).gte("created_at", from).lte("created_at", end),
    ]);
    for (const r of [orders, quotes, contacts, ar, ap, commissions, products, variants, suppliers, hospitals, campaigns]) {
      if (r.error) throw new Error(r.error.message);
    }

    const o = orders.data ?? [];
    const q = quotes.data ?? [];
    const c = contacts.data ?? [];
    const sum = (rows: any[], col: string) => rows.reduce((s, r) => s + Number(r[col] ?? 0), 0);
    const byDay: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (const r of o) {
      const day = String(r.created_at).slice(0, 10);
      byDay[day] ??= { date: day, revenue: 0, orders: 0 };
      byDay[day].revenue += Number(r.total ?? 0);
      byDay[day].orders += 1;
    }

    const variantProductIds = new Set((variants.data ?? []).map((v: any) => v.product_id));
    const stockUnits = (variants.data ?? []).reduce((s: number, v: any) => s + Number(v.stock ?? 0), 0)
      + (products.data ?? []).filter((p: any) => !variantProductIds.has(p.id)).reduce((s: number, p: any) => s + Number(p.stock ?? 0), 0);
    const wonQuotes = q.filter((x: any) => ["won", "approved"].includes(x.status)).length;
    const sourceCounts: Record<string, number> = {};
    for (const contact of c) {
      const source = String((contact as any).attributes?.source ?? (contact as any).attributes?.lead_source ?? "não informado");
      sourceCounts[source] = (sourceCounts[source] ?? 0) + 1;
    }
    const openFinancial = (rows: any[]) => rows.filter((r: any) => !["paid", "cancelled"].includes(r.status));
    const outstanding = (rows: any[]) => openFinancial(rows).reduce((s: number, r: any) => s + Math.max(0, Number(r.amount ?? 0) - Number(r.paid_amount ?? 0)), 0);

    return {
      period: { from, to },
      kpis: {
        revenue: sum(o, "total"),
        orders: o.length,
        avgTicket: o.length ? sum(o, "total") / o.length : 0,
        leads: c.length,
        winRate: q.length ? (wonQuotes / q.length) * 100 : 0,
        arOpen: outstanding(ar.data ?? []),
        apOpen: outstanding(ap.data ?? []),
        commissionsAccrued: (commissions.data ?? []).filter((x: any) => x.status === "accrued").reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0),
        products: (products.data ?? []).length,
        stockUnits,
        suppliersApproved: (suppliers.data ?? []).filter((x: any) => ["approved", "active"].includes(x.status)).length,
        hospitalsActive: (hospitals.data ?? []).filter((x: any) => ["approved", "active"].includes(x.status)).length,
        campaignsRunning: (campaigns.data ?? []).filter((x: any) => x.status === "running").length,
      },
      salesByDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      leadsBySource: Object.entries(sourceCounts).map(([source, count]) => ({ source, count })),
      ordersByStatus: Object.entries(o.reduce((acc: Record<string, number>, x: any) => { acc[x.status] = (acc[x.status] ?? 0) + 1; return acc; }, {})).map(([status, count]) => ({ status, count: Number(count) })),
    };
  });

const ExportDataset = z.enum([
  "sales_orders", "riomed_quotes", "riomed_ar_invoices", "riomed_ap_invoices",
  "riomed_commissions", "riomed_products", "riomed_product_variants", "communication_contacts",
]);

export const exportCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dataset: ExportDataset, from: z.string().optional(), to: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { companyId, tenantId } = await riomedContext(context as any);
    let q = sb.from(data.dataset).select("*").limit(10000);
    q = data.dataset === "communication_contacts" ? q.eq("tenant_id", tenantId) : q.eq("company_id", companyId);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", `${data.to}T23:59:59.999Z`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { csv: toCsv(rows ?? []), filename: `${data.dataset}-${new Date().toISOString().slice(0, 10)}.csv`, count: (rows ?? []).length };
  });

// Mantém o nome do export para compatibilidade de rota, mas este relatório NÃO é documento fiscal oficial.
export const getFiscalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { companyId } = await riomedContext(context as any);
    const from = `${data.month}-01`;
    const next = new Date(`${from}T00:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
    const to = next.toISOString().slice(0, 10);
    const [orders, items] = await Promise.all([
      sb.from("sales_orders").select("id,order_number,total,status,created_at,contact_id,customer_name,currency").eq("company_id", companyId).gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true }),
      sb.from("sales_order_items").select("order_id,product_id,description,quantity,unit_price,discount,total,created_at").eq("company_id", companyId).gte("created_at", from).lt("created_at", to),
    ]);
    if (orders.error) throw new Error(orders.error.message);
    if (items.error) throw new Error(items.error.message);
    const orderMap = new Map((orders.data ?? []).map((o: any) => [o.id, o]));
    const lines = (items.data ?? []).map((item: any) => {
      const order: any = orderMap.get(item.order_id) ?? {};
      return {
        order_number: order.order_number ?? item.order_id.slice(0, 8),
        issued_at: order.created_at ?? item.created_at,
        status: order.status ?? "",
        customer_name: order.customer_name ?? "",
        currency: order.currency ?? "BOB",
        product_id: item.product_id,
        description: item.description,
        qty: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
      };
    });
    const gross = (orders.data ?? []).reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const unitsSold = lines.reduce((s: number, l: any) => s + Number(l.qty ?? 0), 0);
    return {
      month: data.month, from, to,
      summary: { orders: (orders.data ?? []).length, gross, lines: lines.length, unitsSold },
      csv: toCsv(lines),
      filename: `relatorio-comercial-${data.month}.csv`,
      officialFiscalDocument: false,
    };
  });