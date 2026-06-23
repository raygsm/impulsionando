import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase
    .from("user_profiles")
    .select("company_id")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (!data?.company_id) throw new Error("Empresa não encontrada");
  return data.company_id as string;
}

// ---- Terminais ----
export const listPosTerminals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data, error } = await sb
      .from("riomed_pos_terminals")
      .select("*")
      .eq("company_id", cid)
      .order("code");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPosTerminal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      code: z.string().min(1),
      name: z.string().min(1),
      location: z.string().optional(),
      active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const payload = { ...data, company_id: cid, currency: "BOB" };
    const { error } = await sb
      .from("riomed_pos_terminals")
      .upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Sessões ----
export const listPosSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().positive().max(100).default(30) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: rows, error } = await sb
      .from("riomed_pos_sessions")
      .select("*, terminal:riomed_pos_terminals(code,name)")
      .eq("company_id", cid)
      .order("opened_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const openPosSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      terminalId: z.string().uuid(),
      openingAmount: z.number().min(0).default(0),
      notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    // bloqueia se já houver sessão aberta
    const { data: existing } = await sb
      .from("riomed_pos_sessions")
      .select("id")
      .eq("company_id", cid)
      .eq("terminal_id", data.terminalId)
      .eq("status", "open")
      .maybeSingle();
    if (existing) throw new Error("Já existe uma sessão aberta neste caixa");
    const { data: row, error } = await sb
      .from("riomed_pos_sessions")
      .insert({
        company_id: cid,
        terminal_id: data.terminalId,
        opened_by: (context as any).userId,
        opening_amount: data.openingAmount,
        notes: data.notes,
        status: "open",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, sessionId: row.id };
  });

export const closePosSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      sessionId: z.string().uuid(),
      closingAmount: z.number().min(0),
      notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ses } = await sb
      .from("riomed_pos_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .eq("company_id", cid)
      .maybeSingle();
    if (!ses) throw new Error("Sessão não encontrada");
    if (ses.status === "closed") throw new Error("Sessão já fechada");

    const [salesAgg, movAgg] = await Promise.all([
      sb.from("riomed_pos_sales")
        .select("total, paid_amount, change_amount, payment_method")
        .eq("session_id", data.sessionId)
        .eq("status", "completed"),
      sb.from("riomed_pos_movements")
        .select("kind, amount")
        .eq("session_id", data.sessionId),
    ]);
    const cashSales = (salesAgg.data ?? [])
      .filter((s: any) => s.payment_method === "cash")
      .reduce((a: number, s: any) => a + Number(s.total), 0);
    const movs = (movAgg.data ?? []).reduce(
      (a: number, m: any) => a + (m.kind === "cash_in" ? Number(m.amount) : -Number(m.amount)),
      0,
    );
    const expected = Number(ses.opening_amount) + cashSales + movs;
    const diff = Number(data.closingAmount) - expected;

    const { error } = await sb
      .from("riomed_pos_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: (context as any).userId,
        closing_amount: data.closingAmount,
        expected_amount: expected,
        difference: diff,
        notes: data.notes ?? ses.notes,
      })
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true, expected, difference: diff };
  });

// ---- Vendas ----
const saleItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1),
  qty: z.number().positive(),
  unitPrice: z.number().min(0),
});

export const createPosSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      sessionId: z.string().uuid(),
      customerName: z.string().optional(),
      customerDoc: z.string().optional(),
      discount: z.number().min(0).default(0),
      paymentMethod: z.enum(["cash", "card", "qr", "transfer", "mixed"]).default("cash"),
      paidAmount: z.number().min(0),
      notes: z.string().optional(),
      items: z.array(saleItemSchema).min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ses } = await sb
      .from("riomed_pos_sessions")
      .select("id, terminal_id, status")
      .eq("id", data.sessionId)
      .eq("company_id", cid)
      .maybeSingle();
    if (!ses) throw new Error("Sessão não encontrada");
    if (ses.status !== "open") throw new Error("Sessão fechada — abra um caixa primeiro");

    const subtotal = data.items.reduce((a, i) => a + i.qty * i.unitPrice, 0);
    const total = Math.max(0, subtotal - data.discount);
    const change = Math.max(0, data.paidAmount - total);

    const { data: sale, error } = await sb
      .from("riomed_pos_sales")
      .insert({
        company_id: cid,
        session_id: data.sessionId,
        terminal_id: ses.terminal_id,
        seller_id: (context as any).userId,
        customer_name: data.customerName,
        customer_doc: data.customerDoc,
        subtotal, discount: data.discount, total,
        currency: "BOB",
        payment_method: data.paymentMethod,
        paid_amount: data.paidAmount,
        change_amount: change,
        status: "completed",
        notes: data.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const items = data.items.map(i => ({
      sale_id: sale.id,
      product_id: i.productId,
      description: i.description,
      qty: i.qty,
      unit_price: i.unitPrice,
      total: i.qty * i.unitPrice,
    }));
    const { error: e2 } = await sb.from("riomed_pos_sale_items").insert(items);
    if (e2) throw new Error(e2.message);

    return { ok: true, saleId: sale.id, total, change };
  });

export const listPosSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      sessionId: z.string().uuid().optional(),
      limit: z.number().int().positive().max(200).default(50),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    let q = sb.from("riomed_pos_sales").select("*").eq("company_id", cid);
    if (data.sessionId) q = q.eq("session_id", data.sessionId);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const emitPosSaleFiscal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ saleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: sale } = await sb
      .from("riomed_pos_sales")
      .select("*")
      .eq("id", data.saleId)
      .eq("company_id", cid)
      .maybeSingle();
    if (!sale) throw new Error("Venda não encontrada");
    if (sale.fiscal_number) return { ok: true, fiscalNumber: sale.fiscal_number, alreadyEmitted: true };

    // cria AR e usa RPC de emissão fiscal já existente
    const { data: ar, error: e1 } = await sb
      .from("riomed_ar_invoices")
      .insert({
        company_id: cid,
        description: `Venda POS ${String(sale.id).slice(0, 8)}`,
        amount: sale.total,
        currency: "BOB",
        status: "paid",
      })
      .select("id")
      .single();
    if (e1) throw new Error(e1.message);

    const { data: num, error: e2 } = await sb.rpc("riomed_emit_fiscal_invoice", { p_ar_id: ar.id });
    if (e2) throw new Error(e2.message);

    await sb
      .from("riomed_pos_sales")
      .update({ fiscal_invoice_id: ar.id, fiscal_number: num as string })
      .eq("id", data.saleId);

    return { ok: true, fiscalNumber: num as string };
  });

// ---- Movimentos ----
export const createPosMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      sessionId: z.string().uuid(),
      kind: z.enum(["cash_in", "cash_out"]),
      amount: z.number().positive(),
      reason: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
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
      sb.from("riomed_pos_sessions")
        .select("*, terminal:riomed_pos_terminals(code,name)")
        .eq("company_id", cid)
        .eq("status", "open"),
      sb.from("riomed_pos_sales")
        .select("id, total, payment_method, fiscal_number, created_at, customer_name")
        .eq("company_id", cid)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    return {
      terminals: terminals.data ?? [],
      openSessions: openSessions.data ?? [],
      recentSales: recentSales.data ?? [],
    };
  });

// ---- Relatório Z/X (fechamento de caixa) ----
export const getPosZReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      sessionId: z.string().uuid().optional(),
      terminalId: z.string().uuid().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);

    let salesQ = sb.from("riomed_pos_sales").select("*").eq("company_id", cid);
    let movsQ = sb.from("riomed_pos_movements").select("*").eq("company_id", cid);
    let sesQ = sb.from("riomed_pos_sessions")
      .select("*, terminal:riomed_pos_terminals(code,name)")
      .eq("company_id", cid);

    if (data.sessionId) {
      salesQ = salesQ.eq("session_id", data.sessionId);
      movsQ = movsQ.eq("session_id", data.sessionId);
      sesQ = sesQ.eq("id", data.sessionId);
    }
    if (data.terminalId) {
      salesQ = salesQ.eq("terminal_id", data.terminalId);
      sesQ = sesQ.eq("terminal_id", data.terminalId);
    }
    if (data.from) { salesQ = salesQ.gte("created_at", data.from); movsQ = movsQ.gte("created_at", data.from); sesQ = sesQ.gte("opened_at", data.from); }
    if (data.to) { salesQ = salesQ.lte("created_at", data.to); movsQ = movsQ.lte("created_at", data.to); sesQ = sesQ.lte("opened_at", data.to); }

    const [sales, movs, sessions] = await Promise.all([salesQ, movsQ, sesQ.order("opened_at", { ascending: false }).limit(200)]);
    const completed = (sales.data ?? []).filter((s: any) => s.status === "completed");

    const byMethod: Record<string, { count: number; total: number }> = {};
    let total = 0, cash = 0, fiscalEmitted = 0;
    for (const s of completed) {
      const m = s.payment_method ?? "cash";
      byMethod[m] = byMethod[m] ?? { count: 0, total: 0 };
      byMethod[m].count += 1;
      byMethod[m].total += Number(s.total);
      total += Number(s.total);
      if (m === "cash") cash += Number(s.total);
      if (s.fiscal_number) fiscalEmitted += 1;
    }
    const cashIn = (movs.data ?? []).filter((m: any) => m.kind === "cash_in").reduce((a: number, m: any) => a + Number(m.amount), 0);
    const cashOut = (movs.data ?? []).filter((m: any) => m.kind === "cash_out").reduce((a: number, m: any) => a + Number(m.amount), 0);
    const openingSum = (sessions.data ?? []).reduce((a: number, s: any) => a + Number(s.opening_amount ?? 0), 0);
    const expected = openingSum + cash + cashIn - cashOut;

    return {
      sessions: sessions.data ?? [],
      summary: {
        salesCount: completed.length,
        salesTotal: total,
        cashTotal: cash,
        cashIn, cashOut,
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
