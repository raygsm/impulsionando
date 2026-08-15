import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data, error } = await ctx.supabase
    .from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

export const listPosTerminals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data, error } = await sb.from("riomed_pos_terminals").select("*").eq("company_id", cid).order("code");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPosTerminal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    code: z.string().min(1),
    name: z.string().min(1),
    location: z.string().optional(),
    active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const payload = { ...data, company_id: cid, currency: "BOB" };
    const { error } = await sb.from("riomed_pos_terminals").upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPosSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().positive().max(100).default(30) }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: rows, error } = await sb.from("riomed_pos_sessions")
      .select("*, terminal:riomed_pos_terminals(code,name)")
      .eq("company_id", cid).order("opened_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const openPosSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    terminalId: z.string().uuid(),
    openingAmount: z.number().min(0).default(0),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: existing, error: existingError } = await sb.from("riomed_pos_sessions").select("id")
      .eq("company_id", cid).eq("terminal_id", data.terminalId).eq("status", "open").maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) throw new Error("Já existe uma sessão aberta neste caixa");
    const { data: row, error } = await sb.from("riomed_pos_sessions").insert({
      company_id: cid,
      terminal_id: data.terminalId,
      opened_by: (context as any).userId,
      opening_amount: data.openingAmount,
      notes: data.notes,
      status: "open",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, sessionId: row.id };
  });

export const closePosSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string().uuid(),
    closingAmount: z.number().min(0),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ses, error: sessionError } = await sb.from("riomed_pos_sessions").select("*")
      .eq("id", data.sessionId).eq("company_id", cid).maybeSingle();
    if (sessionError) throw new Error(sessionError.message);
    if (!ses) throw new Error("Sessão não encontrada");
    if (ses.status === "closed") throw new Error("Sessão já fechada");

    const [salesAgg, movAgg] = await Promise.all([
      sb.from("riomed_pos_sales").select("total, paid_amount, change_amount, payment_method").eq("session_id", data.sessionId).eq("status", "completed"),
      sb.from("riomed_pos_movements").select("kind, amount").eq("session_id", data.sessionId),
    ]);
    if (salesAgg.error) throw new Error(salesAgg.error.message);
    if (movAgg.error) throw new Error(movAgg.error.message);
    const cashSales = (salesAgg.data ?? []).filter((s: any) => s.payment_method === "cash")
      .reduce((a: number, s: any) => a + Number(s.total), 0);
    const movs = (movAgg.data ?? []).reduce((a: number, m: any) => a + (m.kind === "cash_in" ? Number(m.amount) : -Number(m.amount)), 0);
    const expected = Number(ses.opening_amount) + cashSales + movs;
    const diff = Number(data.closingAmount) - expected;

    const { error } = await sb.from("riomed_pos_sessions").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: (context as any).userId,
      closing_amount: data.closingAmount,
      expected_amount: expected,
      difference: diff,
      notes: data.notes ?? ses.notes,
    }).eq("id", data.sessionId).eq("company_id", cid);
    if (error) throw new Error(error.message);
    return { ok: true, expected, difference: diff };
  });

const saleItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1),
  qty: z.number().positive(),
  unitPrice: z.number().min(0),
});

export const createPosSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string().uuid(),
    customerName: z.string().optional(),
    customerDoc: z.string().optional(),
    discount: z.number().min(0).default(0),
    paymentMethod: z.enum(["cash", "card", "qr", "transfer", "mixed"]).default("cash"),
    paidAmount: z.number().min(0),
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ses, error: sessionError } = await sb.from("riomed_pos_sessions")
      .select("id, terminal_id, status").eq("id", data.sessionId).eq("company_id", cid).maybeSingle();
    if (sessionError) throw new Error(sessionError.message);
    if (!ses) throw new Error("Sessão não encontrada");
    if (ses.status !== "open") throw new Error("Sessão fechada — abra um caixa primeiro");

    const subtotal = data.items.reduce((a, i) => a + i.qty * i.unitPrice, 0);
    const total = Math.max(0, subtotal - data.discount);
    if (data.paymentMethod === "cash" && data.paidAmount < total) throw new Error("Valor recebido é menor que o total da venda");
    const change = Math.max(0, data.paidAmount - total);

    const { data: sale, error } = await sb.from("riomed_pos_sales").insert({
      company_id: cid,
      session_id: data.sessionId,
      terminal_id: ses.terminal_id,
      seller_id: (context as any).userId,
      customer_name: data.customerName,
      customer_doc: data.customerDoc,
      subtotal,
      discount: data.discount,
      total,
      currency: "BOB",
      payment_method: data.paymentMethod,
      paid_amount: data.paidAmount,
      change_amount: change,
      status: "completed",
      notes: data.notes,
    }).select("id").single();
    if (error) throw new Error(error.message);

    const items = data.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      total: item.qty * item.unitPrice,
    }));
    const { error: itemError } = await sb.from("riomed_pos_sale_items").insert(items);
    if (itemError) throw new Error(itemError.message);
    return { ok: true, saleId: sale.id, total, change };
  });

export const listPosSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string().uuid().optional(),
    limit: z.number().int().positive().max(200).default(50),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    let query = sb.from("riomed_pos_sales").select("*").eq("company_id", cid);
    if (data.sessionId) query = query.eq("session_id", data.sessionId);
    const { data: rows, error } = await query.order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const emitPosSaleFiscal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ saleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: sale, error } = await sb.from("riomed_pos_sales").select("id,fiscal_number")
      .eq("id", data.saleId).eq("company_id", cid).maybeSingle();
    if (error) throw new Error(error.message);
    if (!sale) throw new Error("Venda não encontrada");
    if (sale.fiscal_number) return { ok: true, fiscalNumber: sale.fiscal_number, alreadyEmitted: true };
    throw new Error("Emissão fiscal Rio Med ainda não está habilitada no Core. A venda foi preservada e pode ser faturada após a ativação do módulo fiscal.");
  });

export const createPosMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string().uuid(),
    kind: z.enum(["cash_in", "cash_out"]),
    amount: z.number().positive(),
    reason: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: session, error: sessionError } = await sb.from("riomed_pos_sessions").select("id,status")
      .eq("id", data.sessionId).eq("company_id", cid).maybeSingle();
    if (sessionError) throw new Error(sessionError.message);
    if (!session || session.status !== "open") throw new Error("Movimentações só podem ser lançadas em caixa aberto");
    const { error } = await sb.from("riomed_pos_movements").insert({
      company_id: cid,
      session_id: data.sessionId,
      kind: data.kind,
      amount: data.amount,
      reason: data.reason,
      created_by: (context as any).userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPosOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const [terminals, openSessions, recentSales] = await Promise.all([
      sb.from("riomed_pos_terminals").select("*").eq("company_id", cid).order("code"),
      sb.from("riomed_pos_sessions").select("*, terminal:riomed_pos_terminals(code,name)").eq("company_id", cid).eq("status", "open"),
      sb.from("riomed_pos_sales").select("id,total,payment_method,fiscal_number,created_at,customer_name").eq("company_id", cid).order("created_at", { ascending: false }).limit(20),
    ]);
    if (terminals.error) throw new Error(terminals.error.message);
    if (openSessions.error) throw new Error(openSessions.error.message);
    if (recentSales.error) throw new Error(recentSales.error.message);
    return { terminals: terminals.data ?? [], openSessions: openSessions.data ?? [], recentSales: recentSales.data ?? [] };
  });

export const getPosZReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string().uuid().optional(),
    terminalId: z.string().uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);

    let salesQ = sb.from("riomed_pos_sales").select("*").eq("company_id", cid);
    let movsQ = sb.from("riomed_pos_movements").select("*").eq("company_id", cid);
    let sesQ = sb.from("riomed_pos_sessions").select("*, terminal:riomed_pos_terminals(code,name)").eq("company_id", cid);

    if (data.sessionId) {
      salesQ = salesQ.eq("session_id", data.sessionId);
      movsQ = movsQ.eq("session_id", data.sessionId);
      sesQ = sesQ.eq("id", data.sessionId);
    }
    if (data.terminalId) {
      salesQ = salesQ.eq("terminal_id", data.terminalId);
      sesQ = sesQ.eq("terminal_id", data.terminalId);
    }
    if (data.from) {
      salesQ = salesQ.gte("created_at", data.from);
      movsQ = movsQ.gte("created_at", data.from);
      sesQ = sesQ.gte("opened_at", data.from);
    }
    if (data.to) {
      salesQ = salesQ.lte("created_at", data.to);
      movsQ = movsQ.lte("created_at", data.to);
      sesQ = sesQ.lte("opened_at", data.to);
    }

    const [sales, movs, sessions] = await Promise.all([
      salesQ,
      movsQ,
      sesQ.order("opened_at", { ascending: false }).limit(200),
    ]);
    if (sales.error) throw new Error(sales.error.message);
    if (movs.error) throw new Error(movs.error.message);
    if (sessions.error) throw new Error(sessions.error.message);
    const completed = (sales.data ?? []).filter((sale: any) => sale.status === "completed");

    const byMethod: Record<string, { count: number; total: number }> = {};
    let total = 0;
    let cash = 0;
    let fiscalEmitted = 0;
    for (const sale of completed) {
      const method = sale.payment_method ?? "cash";
      byMethod[method] = byMethod[method] ?? { count: 0, total: 0 };
      byMethod[method].count += 1;
      byMethod[method].total += Number(sale.total);
      total += Number(sale.total);
      if (method === "cash") cash += Number(sale.total);
      if (sale.fiscal_number) fiscalEmitted += 1;
    }
    const cashIn = (movs.data ?? []).filter((m: any) => m.kind === "cash_in").reduce((a: number, m: any) => a + Number(m.amount), 0);
    const cashOut = (movs.data ?? []).filter((m: any) => m.kind === "cash_out").reduce((a: number, m: any) => a + Number(m.amount), 0);
    const openingSum = (sessions.data ?? []).reduce((a: number, session: any) => a + Number(session.opening_amount ?? 0), 0);
    const expected = openingSum + cash + cashIn - cashOut;

    return {
      sessions: sessions.data ?? [],
      summary: {
        salesCount: completed.length,
        salesTotal: total,
        cashTotal: cash,
        cashIn,
        cashOut,
        openingSum,
        expectedCash: expected,
        fiscalEmitted,
        fiscalPending: completed.length - fiscalEmitted,
        byMethod,
      },
      sales: completed,
      movements: movs.data ?? [],
    };
  });
