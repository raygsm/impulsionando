import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase.from("user_profiles").select("company_id").eq("user_id", ctx.userId).maybeSingle();
  if (!data?.company_id) throw new Error("Empresa não encontrada");
  return data.company_id as string;
}

export const getFinanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    await sb.rpc("riomed_refresh_overdue", { p_company_id: cid });
    const [ar, ap, comm, rules] = await Promise.all([
      sb.from("riomed_ar_invoices").select("*").eq("company_id", cid).order("due_date", { ascending: true }).limit(500),
      sb.from("riomed_ap_invoices").select("*").eq("company_id", cid).order("due_date", { ascending: true }).limit(500),
      sb.from("riomed_commissions").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(500),
      sb.from("riomed_commission_rules").select("*").eq("company_id", cid).order("scope", { ascending: true }),
    ]);
    const sum = (rows: any[], col = "amount") => rows.reduce((s, r) => s + Number(r[col] ?? 0), 0);
    const arRows = ar.data ?? []; const apRows = ap.data ?? []; const cRows = comm.data ?? [];
    const open = (rows: any[]) => rows.filter((r) => r.status === "open" || r.status === "partial" || r.status === "overdue");
    const overdue = (rows: any[]) => rows.filter((r) => r.status === "overdue");

    // Cashflow 30 dias (a partir de hoje), por dia: entradas (AR due) - saídas (AP due)
    const days: Record<string, { date: string; in: number; out: number; net: number }> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today.getTime() + i * 86400000).toISOString().slice(0, 10);
      days[d] = { date: d, in: 0, out: 0, net: 0 };
    }
    for (const r of open(arRows)) {
      const d = (r.due_date as string).slice(0, 10);
      if (days[d]) days[d].in += Number(r.amount) - Number(r.paid_amount ?? 0);
    }
    for (const r of open(apRows)) {
      const d = (r.due_date as string).slice(0, 10);
      if (days[d]) days[d].out += Number(r.amount) - Number(r.paid_amount ?? 0);
    }
    const cashflow = Object.values(days).map((d) => ({ ...d, net: d.in - d.out }));

    return {
      ar: arRows, ap: apRows, commissions: cRows, rules: rules.data ?? [],
      kpis: {
        arOpen: sum(open(arRows), "amount") - sum(open(arRows), "paid_amount"),
        apOpen: sum(open(apRows), "amount") - sum(open(apRows), "paid_amount"),
        arOverdue: sum(overdue(arRows), "amount"),
        apOverdue: sum(overdue(apRows), "amount"),
        commissionsAccrued: cRows.filter((c: any) => c.status === "accrued").reduce((s: number, c: any) => s + Number(c.amount), 0),
        commissionsPaid: cRows.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount), 0),
      },
      cashflow,
    };
  });

export const createApInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    supplierId: z.string().uuid().optional(),
    description: z.string().min(2),
    amount: z.number().positive(),
    dueDate: z.string(),
    category: z.string().optional(),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { error } = await sb.from("riomed_ap_invoices").insert({
      company_id: cid, supplier_id: data.supplierId ?? null,
      description: data.description, amount: data.amount, due_date: data.dueDate,
      category: data.category ?? null, notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createArInvoiceFromOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), dueDays: z.number().int().default(30) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { data: id, error } = await sb.rpc("riomed_ar_from_order", { p_order_id: data.orderId, p_due_days: data.dueDays });
    if (error) throw new Error(error.message);
    return { ok: true, id };
  });

export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    table: z.enum(["riomed_ar_invoices","riomed_ap_invoices"]),
    id: z.string().uuid(),
    paymentMethod: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { data: row } = await sb.from(data.table).select("amount").eq("id", data.id).maybeSingle();
    const { error } = await sb.from(data.table).update({
      status: "paid", paid_amount: row?.amount ?? 0, paid_at: new Date().toISOString(),
      payment_method: data.paymentMethod ?? "cash",
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertCommissionRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    scope: z.enum(["default","user","category"]).default("default"),
    category: z.string().optional(),
    ratePct: z.number().min(0).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const payload: any = {
      company_id: cid, user_id: data.userId ?? null, scope: data.scope,
      category: data.category ?? null, rate_pct: data.ratePct, active: true,
    };
    const { error } = data.id
      ? await sb.from("riomed_commission_rules").update(payload).eq("id", data.id)
      : await sb.from("riomed_commission_rules").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCommissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["accrued","approved","paid","cancelled"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const patch: any = { status: data.status };
    if (data.status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await sb.from("riomed_commissions").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const accrueCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { data: id, error } = await sb.rpc("riomed_accrue_commission", { p_order_id: data.orderId, p_user_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true, id };
  });
