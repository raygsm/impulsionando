import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function resolveCompanyId(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("user_profiles").select("company_id").eq("user_id", userId).maybeSingle();
  if (profile?.company_id) return profile.company_id;
  const { data: tenant } = await supabase
    .from("core_tenant_identity").select("company_id").eq("subdomain", "riomed").maybeSingle();
  if (!tenant?.company_id) throw new Error("Empresa não identificada.");
  return tenant.company_id;
}

async function nextQuoteCode(supabase: any, companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("riomed_quotes").select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", `${year}-01-01`);
  return `COT-${year}-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

// =============== Cotações ===============
export const createRiomedQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      leadId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      channel: z.enum(["web", "whatsapp", "b2b", "phone", "field"]).default("web"),
      currency: z.string().default("BOB"),
      expiresInDays: z.number().int().min(1).max(180).default(15),
      notes: z.string().max(2000).optional(),
      items: z.array(z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        description: z.string().max(500).optional(),
        qty: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        discount: z.number().nonnegative().default(0),
      })).default([]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const code = await nextQuoteCode(supabase, companyId);

    const { data: quote, error } = await supabase
      .from("riomed_quotes")
      .insert({
        company_id: companyId,
        code,
        lead_id: data.leadId ?? null,
        customer_id: data.customerId ?? null,
        owner_user_id: userId,
        channel: data.channel,
        currency: data.currency,
        expires_at: new Date(Date.now() + data.expiresInDays * 86400_000).toISOString(),
        notes: data.notes ?? null,
        created_by: userId,
      })
      .select("id, code")
      .single();
    if (error || !quote) throw error ?? new Error("Falha ao criar cotação");

    if (data.items.length) {
      // hidrata descrição
      const ids = data.items.map(i => i.productId);
      const { data: prods } = await supabase
        .from("riomed_products").select("id, name, sku").in("id", ids);
      const byId = new Map((prods ?? []).map((p: any) => [p.id, p]));

      const rows = data.items.map((it, idx) => ({
        company_id: companyId,
        quote_id: quote.id,
        product_id: it.productId,
        variant_id: it.variantId ?? null,
        description: it.description ?? `${byId.get(it.productId)?.sku ?? ""} ${byId.get(it.productId)?.name ?? ""}`.trim(),
        qty: it.qty,
        unit_price: it.unitPrice,
        discount: it.discount,
        sort_order: idx,
      }));
      const { error: itErr } = await supabase.from("riomed_quote_items").insert(rows);
      if (itErr) throw itErr;
    }

    return { id: quote.id, code: quote.code };
  });

export const confirmRiomedQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ quoteId: z.string().uuid(), warehouseId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: orderId, error } = await (supabase as any).rpc("riomed_quote_confirm", {
      p_quote_id: data.quoteId,
      p_user_id: userId,
      p_warehouse_id: data.warehouseId ?? null,
    });
    if (error) throw error;
    return { orderId };
  });

export const updateRiomedQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      quoteId: z.string().uuid(),
      status: z.enum(["draft", "sent", "negotiating", "lost", "cancelled"]),
      lostReason: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: any = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    if (data.status === "lost") patch.lost_reason = data.lostReason ?? null;
    const { error } = await context.supabase.from("riomed_quotes").update(patch).eq("id", data.quoteId);
    if (error) throw error;
    return { ok: true };
  });

export const listRiomedQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.string().optional(), limit: z.number().int().min(1).max(200).default(50) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    let q = context.supabase.from("riomed_quotes")
      .select("id, code, status, channel, total, currency, expires_at, created_at, owner_user_id, lead_id, customer_id")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getRiomedQuote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ quoteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: quote, error } = await context.supabase
      .from("riomed_quotes").select("*").eq("id", data.quoteId).single();
    if (error) throw error;
    const { data: items } = await context.supabase
      .from("riomed_quote_items").select("*").eq("quote_id", data.quoteId).order("sort_order");
    return { quote, items: items ?? [] };
  });

// =============== Dashboard ===============
export const getRiomedCommercialOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [open, won30, lost30, pipeline, recent, mySales] = await Promise.all([
      context.supabase.from("riomed_quotes")
        .select("id, total", { count: "exact" })
        .eq("company_id", companyId)
        .in("status", ["draft", "sent", "negotiating"]),
      context.supabase.from("riomed_quotes")
        .select("id, total", { count: "exact" })
        .eq("company_id", companyId).eq("status", "won").gte("won_at", since30),
      context.supabase.from("riomed_quotes")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId).eq("status", "lost").gte("updated_at", since30),
      context.supabase.from("riomed_quotes")
        .select("status, total")
        .eq("company_id", companyId)
        .in("status", ["draft", "sent", "negotiating", "won", "lost"])
        .gte("created_at", since30),
      context.supabase.from("riomed_quotes")
        .select("id, code, status, total, currency, channel, created_at, owner_user_id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }).limit(10),
      context.supabase.from("riomed_quotes")
        .select("id, total")
        .eq("company_id", companyId).eq("owner_user_id", context.userId)
        .eq("status", "won").gte("won_at", since30),
    ]);

    const openCount = open.count ?? 0;
    const openValue = (open.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
    const wonCount = won30.count ?? 0;
    const wonValue = (won30.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
    const lostCount = lost30.count ?? 0;
    const myWonValue = (mySales.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);

    const byStage: Record<string, { count: number; value: number }> = {};
    for (const row of pipeline.data ?? []) {
      const s = (row as any).status as string;
      byStage[s] = byStage[s] ?? { count: 0, value: 0 };
      byStage[s].count += 1;
      byStage[s].value += Number((row as any).total ?? 0);
    }
    const winRate = wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0;

    return {
      openCount, openValue, wonCount, wonValue, lostCount,
      winRate, myWonValue, byStage,
      recent: recent.data ?? [],
    };
  });
