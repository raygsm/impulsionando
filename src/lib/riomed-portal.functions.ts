import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pub() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function resolveCompanyBySubdomain(subdomain: string): Promise<string | null> {
  const s = pub();
  const { data } = await s.from("core_tenant_identity").select("company_id").eq("subdomain", subdomain).maybeSingle();
  return data?.company_id ?? null;
}

// =================== Vitrine pública ===================
export const getPublicShowcase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    subdomain: z.string().default("riomed"),
    slug: z.string().min(1),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = pub();
    const companyId = await resolveCompanyBySubdomain(data.subdomain);
    if (!companyId) throw new Error("Tenant não encontrado");

    const { data: showcase, error: e1 } = await s.from("riomed_showcase")
      .select("id, slug, title, subtitle, banner_url, layout, is_published, metadata")
      .eq("company_id", companyId).eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!showcase) throw new Error("Vitrine não encontrada");

    const { data: items } = await s.from("riomed_showcase_items")
      .select("id, position, is_featured, override_price, badge, product_id, variant_id, riomed_products!inner(id,name,description,category,image_url,price_sale,price_rental_daily,price_rental_monthly,currency,is_active)")
      .eq("showcase_id", showcase.id).eq("riomed_products.is_active", true)
      .order("position");

    const products = (items ?? []).map((it: any) => ({
      itemId: it.id,
      productId: it.product_id,
      variantId: it.variant_id,
      featured: it.is_featured,
      badge: it.badge,
      name: it.riomed_products.name,
      description: it.riomed_products.description,
      category: it.riomed_products.category,
      image: it.riomed_products.image_url,
      price: it.override_price ?? it.riomed_products.price_sale ?? 0,
      rentalDaily: it.riomed_products.price_rental_daily,
      rentalMonthly: it.riomed_products.price_rental_monthly,
      currency: it.riomed_products.currency ?? "BOB",
    }));

    return { showcase, products, companyId };
  });

// =================== Carrinho ===================
function newToken() {
  return crypto.randomUUID() + "-" + Math.random().toString(36).slice(2, 10);
}

export const getOrCreateCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    subdomain: z.string().default("riomed"),
    sessionToken: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await resolveCompanyBySubdomain(data.subdomain);
    if (!companyId) throw new Error("Tenant não encontrado");

    if (data.sessionToken) {
      const { data: existing } = await sb.from("riomed_public_carts")
        .select("*").eq("session_token", data.sessionToken).maybeSingle();
      if (existing && existing.company_id === companyId) {
        const { data: items } = await sb.from("riomed_cart_items")
          .select("*").eq("cart_id", existing.id).order("created_at");
        return { cart: existing, items: items ?? [], sessionToken: existing.session_token };
      }
    }

    const token = newToken();
    const { data: cart, error } = await sb.from("riomed_public_carts")
      .insert({ company_id: companyId, session_token: token, status: "active" })
      .select("*").single();
    if (error) throw new Error(error.message);
    return { cart, items: [], sessionToken: token };
  });

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    sessionToken: z.string(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    qty: z.number().positive().default(1),
    modality: z.enum(["sale","rental_daily","rental_monthly"]).default("sale"),
    rentalDays: z.number().int().positive().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts")
      .select("id, company_id, status").eq("session_token", data.sessionToken).maybeSingle();
    if (!cart) throw new Error("Carrinho não encontrado");
    if (cart.status !== "active") throw new Error("Carrinho não está ativo");

    const { data: product } = await sb.from("riomed_products")
      .select("name, price_sale, price_rental_daily, price_rental_monthly")
      .eq("id", data.productId).eq("company_id", cart.company_id).maybeSingle();
    if (!product) throw new Error("Produto inválido");

    let sku: string | null = null;
    if (data.variantId) {
      const { data: v } = await sb.from("riomed_product_variants").select("sku").eq("id", data.variantId).maybeSingle();
      sku = v?.sku ?? null;
    }

    const unitPrice = data.modality === "rental_daily"
      ? Number(product.price_rental_daily ?? 0)
      : data.modality === "rental_monthly"
        ? Number(product.price_rental_monthly ?? 0)
        : Number(product.price_sale ?? 0);
    const multiplier = (data.modality.startsWith("rental") && data.rentalDays) ? data.rentalDays : 1;
    const total = +(unitPrice * Number(data.qty) * multiplier).toFixed(2);

    const { error } = await sb.from("riomed_cart_items").insert({
      cart_id: cart.id, company_id: cart.company_id,
      product_id: data.productId, variant_id: data.variantId ?? null,
      modality: data.modality, product_name: product.name, sku,
      unit_price: unitPrice, qty: data.qty, rental_days: data.rentalDays ?? null,
      total,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ sessionToken: z.string(), itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts").select("id").eq("session_token", data.sessionToken).maybeSingle();
    if (!cart) throw new Error("Carrinho não encontrado");
    const { error } = await sb.from("riomed_cart_items").delete().eq("id", data.itemId).eq("cart_id", cart.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ sessionToken: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts").select("*").eq("session_token", data.sessionToken).maybeSingle();
    if (!cart) return { cart: null, items: [] };
    const { data: items } = await sb.from("riomed_cart_items").select("*").eq("cart_id", cart.id).order("created_at");
    return { cart, items: items ?? [] };
  });

// =================== Checkout ===================
export const submitCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    sessionToken: z.string(),
    contactName: z.string().min(2),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(8),
    contactDoc: z.string().optional(),
    companyName: z.string().optional(),
    audience: z.enum(["public","b2b","hospital","rental"]).default("public"),
    address: z.record(z.string(), z.any()).default({}),
    notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts")
      .select("*").eq("session_token", data.sessionToken).maybeSingle();
    if (!cart) throw new Error("Carrinho não encontrado");
    if (cart.items_count === 0) throw new Error("Carrinho vazio");

    const { data: items } = await sb.from("riomed_cart_items").select("*").eq("cart_id", cart.id);
    if (!items?.length) throw new Error("Carrinho vazio");

    // Cria lead em crm_leads
    const { data: lead } = await (sb.from("crm_leads") as any).insert({
      company_id: cart.company_id,
      name: data.contactName,
      email: data.contactEmail ?? null,
      phone: data.contactPhone,
      document: data.contactDoc ?? null,
      source: "riomed_portal",
      status: "new",
      notes: [data.companyName, data.audience, data.notes].filter(Boolean).join(" · "),
      tags: [data.audience, "portal"],
    }).select("id").single();

    // Próximo código de cotação
    const year = new Date().getFullYear();
    const { count } = await sb.from("riomed_quotes").select("id", { count: "exact", head: true })
      .eq("company_id", cart.company_id).gte("created_at", `${year}-01-01`);
    const code = `COT-${year}-${String((count ?? 0) + 1).padStart(5, "0")}`;

    const { data: quote } = await (sb.from("riomed_quotes") as any).insert({
      company_id: cart.company_id, code, lead_id: lead?.id ?? null,
      channel: "web", status: "sent",
      currency: cart.currency,
      subtotal: cart.subtotal, total: cart.total,
      expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
      sent_at: new Date().toISOString(),
      notes: data.notes ?? null,
      metadata: { audience: data.audience, source: "portal", checkout_session_token: data.sessionToken },
    }).select("id").single();

    if (quote) {
      const quoteItems = items.map((it: any, i: number) => ({
        company_id: cart.company_id, quote_id: quote.id,
        product_id: it.product_id, variant_id: it.variant_id,
        description: it.product_name, qty: it.qty, unit_price: it.unit_price,
        discount: 0, total: it.total, sort_order: i,
      }));
      await (sb.from("riomed_quote_items") as any).insert(quoteItems);
    }

    const { data: checkout } = await sb.from("riomed_checkout_sessions").insert({
      company_id: cart.company_id, cart_id: cart.id,
      contact_name: data.contactName, contact_email: data.contactEmail ?? null,
      contact_phone: data.contactPhone, contact_doc: data.contactDoc ?? null,
      company_name: data.companyName ?? null, audience: data.audience,
      address: data.address, notes: data.notes ?? null,
      lead_id: lead?.id ?? null, quote_id: quote?.id ?? null,
      status: "submitted", submitted_at: new Date().toISOString(),
    }).select("id").single();

    await sb.from("riomed_public_carts").update({ status: "submitted" }).eq("id", cart.id);

    return { ok: true, checkoutId: checkout?.id, quoteCode: code, leadId: lead?.id };
  });

// =================== Admin: gerenciar itens da vitrine ===================
export const listShowcaseAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ showcaseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: items } = await supabase.from("riomed_showcase_items")
      .select("*, riomed_products(name,sku,image_url,price_sale)")
      .eq("showcase_id", data.showcaseId).order("position");
    return { items: items ?? [] };
  });

export const addShowcaseItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    showcaseId: z.string().uuid(), productId: z.string().uuid(),
    isFeatured: z.boolean().default(false), badge: z.string().optional(),
    overridePrice: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: profile } = await supabase.from("user_profiles").select("company_id").eq("user_id", userId).maybeSingle();
    const { data: tenant } = await supabase.from("core_tenant_identity").select("company_id").eq("subdomain","riomed").maybeSingle();
    const companyId = profile?.company_id ?? tenant?.company_id;
    if (!companyId) throw new Error("Empresa não identificada");
    const { count } = await supabase.from("riomed_showcase_items").select("id", { count: "exact", head: true }).eq("showcase_id", data.showcaseId);
    const { error } = await supabase.from("riomed_showcase_items").insert({
      company_id: companyId, showcase_id: data.showcaseId, product_id: data.productId,
      is_featured: data.isFeatured, badge: data.badge ?? null,
      override_price: data.overridePrice ?? null,
      position: count ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeShowcaseItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("riomed_showcase_items").delete().eq("id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCheckoutSessionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data } = await supabase.from("riomed_checkout_sessions")
      .select("*").order("created_at", { ascending: false }).limit(100);
    return { sessions: data ?? [] };
  });
