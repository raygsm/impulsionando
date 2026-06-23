import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function pubClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } as any },
  );
}

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("companies").select("id").ilike("name", "%riomed%").limit(1).maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (!any2?.id) throw new Error("RioMed company not found");
  return any2.id;
}

const itemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  variant_id: z.string().uuid().optional().nullable(),
  description: z.string().max(500),
  qty: z.coerce.number().min(0.001),
  unit_price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

export const listRiomedQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const { data } = await supabase
      .from("riomed_quotes")
      .select("*, crm_leads(name,email,phone)")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(100);
    return { quotes: data ?? [] };
  });

export const getRiomedQuote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: q } = await supabase.from("riomed_quotes").select("*").eq("id", data.id).single();
    const { data: items } = await supabase
      .from("riomed_quote_items").select("*").eq("quote_id", data.id).order("sort_order");
    return { quote: q, items: items ?? [] };
  });

export const saveRiomedQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      lead_id: z.string().uuid().optional().nullable(),
      customer_id: z.string().uuid().optional().nullable(),
      currency: z.string().default("PYG"),
      notes: z.string().max(2000).optional().nullable(),
      expires_at: z.string().optional().nullable(),
      items: z.array(itemSchema).min(1),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const itemsTotals = data.items.map((it) => ({
      ...it,
      total: Math.max(0, it.qty * it.unit_price - (it.discount ?? 0)),
    }));
    const subtotal = itemsTotals.reduce((s, it) => s + it.qty * it.unit_price, 0);
    const discount_total = itemsTotals.reduce((s, it) => s + (it.discount ?? 0), 0);
    const total = subtotal - discount_total;

    let quoteId = data.id;
    if (quoteId) {
      const { error } = await supabase
        .from("riomed_quotes")
        .update({
          lead_id: data.lead_id ?? null, customer_id: data.customer_id ?? null,
          currency: data.currency, notes: data.notes, expires_at: data.expires_at ?? null,
          subtotal, discount_total, total,
        })
        .eq("id", quoteId);
      if (error) throw new Error(error.message);
      await supabase.from("riomed_quote_items").delete().eq("quote_id", quoteId);
    } else {
      const code = `Q-${Date.now().toString(36).toUpperCase()}`;
      const { data: row, error } = await supabase
        .from("riomed_quotes")
        .insert({
          company_id: cid, code, status: "draft", channel: "internal",
          lead_id: data.lead_id ?? null, customer_id: data.customer_id ?? null,
          currency: data.currency, notes: data.notes,
          expires_at: data.expires_at ?? null,
          subtotal, discount_total, total,
          owner_user_id: userId, created_by: userId,
        })
        .select().single();
      if (error) throw new Error(error.message);
      quoteId = row.id;
    }

    const rows = itemsTotals.map((it, i) => ({
      company_id: cid, quote_id: quoteId,
      product_id: it.product_id ?? null, variant_id: it.variant_id ?? null,
      description: it.description, qty: it.qty, unit_price: it.unit_price,
      discount: it.discount ?? 0, total: it.total, sort_order: i,
    }));
    const { error: e2 } = await supabase.from("riomed_quote_items").insert(rows);
    if (e2) throw new Error(e2.message);

    return { quoteId };
  });

export const sendRiomedQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const token = `qt_${crypto.randomUUID().replace(/-/g, "")}`;
    const expires = new Date(Date.now() + 30 * 86400000).toISOString();
    const { error } = await supabase
      .from("riomed_quotes")
      .update({ public_token: token, public_token_expires_at: expires, status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { token, expires };
  });

export const convertQuoteToOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: orderId, error } = await supabase.rpc("riomed_convert_quote_to_order", { _quote_id: data.id });
    if (error) throw new Error(error.message);
    return { orderId };
  });

// Public quote view / approval
export const getPublicQuote = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(8) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: q } = await supabaseAdmin
      .from("riomed_quotes")
      .select("id,code,status,currency,subtotal,discount_total,total,expires_at,notes,public_token_expires_at,approved_at,rejected_at,company_id")
      .eq("public_token", data.token)
      .maybeSingle();
    if (!q) return { quote: null, items: [] };
    if (q.public_token_expires_at && new Date(q.public_token_expires_at) < new Date()) {
      return { quote: null, items: [], expired: true };
    }
    const { data: items } = await supabaseAdmin
      .from("riomed_quote_items")
      .select("description,qty,unit_price,discount,total,sort_order")
      .eq("quote_id", q.id)
      .order("sort_order");
    return { quote: q, items: items ?? [] };
  });


export const approvePublicQuote = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      token: z.string().min(8),
      approverName: z.string().min(2).max(120),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: q, error } = await supabaseAdmin
      .from("riomed_quotes")
      .select("id, status, public_token_expires_at")
      .eq("public_token", data.token).maybeSingle();
    if (error || !q) throw new Error("Cotización no encontrada");
    if (q.public_token_expires_at && new Date(q.public_token_expires_at) < new Date())
      throw new Error("Enlace expirado");
    if (["converted", "approved"].includes(q.status))
      return { ok: true, alreadyApproved: true };

    await supabaseAdmin
      .from("riomed_quotes")
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by_name: data.approverName })
      .eq("id", q.id);

    const { data: orderId } = await supabaseAdmin.rpc("riomed_convert_quote_to_order", { _quote_id: q.id });
    return { ok: true, orderId };
  });

export const rejectPublicQuote = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: z.string().min(8), reason: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("riomed_quotes")
      .update({ status: "rejected", rejected_at: new Date().toISOString(), rejection_reason: data.reason ?? null })
      .eq("public_token", data.token);
    return { ok: true };
  });

// Orders + commissions
export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const { data } = await supabase
      .from("sales_orders")
      .select("*")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(100);
    return { orders: data ?? [] };
  });

export const listCommissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ period: z.string().optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    let q = supabase.from("riomed_commissions").select("*").eq("company_id", cid)
      .order("created_at", { ascending: false }).limit(200);
    if (data.period) q = q.eq("period", data.period);
    const { data: rows } = await q;
    const totals = (rows ?? []).reduce(
      (acc: any, r: any) => {
        acc.gross += Number(r.base_amount ?? 0);
        acc.commission += Number(r.amount ?? 0);
        acc.byStatus[r.status] = (acc.byStatus[r.status] ?? 0) + Number(r.amount ?? 0);
        return acc;
      },
      { gross: 0, commission: 0, byStatus: {} as Record<string, number> },
    );
    return { commissions: rows ?? [], totals };
  });

export const markCommissionPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase
      .from("riomed_commissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCommissionRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const { data } = await supabase.from("riomed_commission_rules").select("*").eq("company_id", cid)
      .order("scope").order("updated_at", { ascending: false });
    return { rules: data ?? [] };
  });

export const upsertCommissionRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      scope: z.enum(["product", "category", "seller"]),
      product_id: z.string().uuid().optional().nullable(),
      category: z.string().max(120).optional().nullable(),
      user_id: z.string().uuid().optional().nullable(),
      rate_pct: z.coerce.number().min(0).max(100),
      active: z.boolean().default(true),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const payload = { ...data, company_id: cid };
    if (data.id) {
      const { error } = await supabase.from("riomed_commission_rules").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("riomed_commission_rules").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCommissionRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("riomed_commission_rules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
