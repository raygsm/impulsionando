import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normalizeSubdomain(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "riomed" ? "rio-med" : normalized;
}

async function resolveCompanyBySubdomain(subdomain: string): Promise<string | null> {
  const sb = await adminClient();
  const { data, error } = await sb.from("core_tenant_identity")
    .select("company_id")
    .eq("subdomain", normalizeSubdomain(subdomain))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.company_id ?? null;
}

async function riomedCompanyId(sb: any): Promise<string> {
  const { data, error } = await sb.from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id;
}

export const getPublicShowcase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ subdomain: z.string().default("riomed"), slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await resolveCompanyBySubdomain(data.subdomain);
    if (!companyId) throw new Error("Rio Med não encontrado");
    const { data: showcase, error } = await sb.from("riomed_showcase")
      .select("id,slug,title,subtitle,banner_url,layout,is_published,metadata")
      .eq("company_id", companyId).eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!showcase) throw new Error("Vitrine não encontrada");
    const { data: items, error: itemsError } = await sb.from("riomed_showcase_items")
      .select("id,position,is_featured,override_price,badge,product_id,variant_id,riomed_products!inner(id,name,description,category,image_url,price_sale,price_rental_daily,price_rental_monthly,currency,is_active)")
      .eq("company_id", companyId).eq("showcase_id", showcase.id).eq("riomed_products.is_active", true).order("position");
    if (itemsError) throw new Error(itemsError.message);
    const products = (items ?? []).map((item: any) => ({
      itemId: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      featured: item.is_featured,
      badge: item.badge,
      name: item.riomed_products.name,
      description: item.riomed_products.description,
      category: item.riomed_products.category,
      image: item.riomed_products.image_url,
      price: item.override_price ?? item.riomed_products.price_sale ?? 0,
      rentalDaily: item.riomed_products.price_rental_daily,
      rentalMonthly: item.riomed_products.price_rental_monthly,
      currency: item.riomed_products.currency ?? "BOB",
    }));
    return { showcase, products, companyId };
  });

function newToken() {
  return crypto.randomUUID() + "-" + Math.random().toString(36).slice(2, 10);
}

export const getOrCreateCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ subdomain: z.string().default("riomed"), sessionToken: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await resolveCompanyBySubdomain(data.subdomain);
    if (!companyId) throw new Error("Rio Med não encontrado");
    if (data.sessionToken) {
      const { data: existing } = await sb.from("riomed_public_carts").select("*")
        .eq("session_token", data.sessionToken).eq("company_id", companyId).maybeSingle();
      if (existing && existing.status === "active" && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
        const { data: items } = await sb.from("riomed_cart_items").select("*").eq("cart_id", existing.id).order("created_at");
        return { cart: existing, items: items ?? [], sessionToken: existing.session_token };
      }
    }
    const token = newToken();
    const { data: cart, error } = await sb.from("riomed_public_carts")
      .insert({ company_id: companyId, session_token: token, status: "active", currency: "BOB" })
      .select("*").single();
    if (error) throw new Error(error.message);
    return { cart, items: [], sessionToken: token };
  });

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    sessionToken: z.string().min(8),
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    qty: z.number().positive().default(1),
    modality: z.enum(["sale","rental_daily","rental_monthly"]).default("sale"),
    rentalDays: z.number().int().positive().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts").select("id,company_id,status,expires_at")
      .eq("session_token", data.sessionToken).maybeSingle();
    if (!cart || cart.status !== "active") throw new Error("Carrinho não está ativo");
    if (cart.expires_at && new Date(cart.expires_at) <= new Date()) throw new Error("Carrinho expirado");
    const { data: product } = await sb.from("riomed_products")
      .select("name,sku,price_sale,price_rental_daily,price_rental_monthly,is_active")
      .eq("id", data.productId).eq("company_id", cart.company_id).eq("is_active", true).maybeSingle();
    if (!product) throw new Error("Produto indisponível");
    let sku = product.sku ?? null;
    if (data.variantId) {
      const { data: variant } = await sb.from("riomed_product_variants")
        .select("sku,active,product_id").eq("id", data.variantId).eq("company_id", cart.company_id).maybeSingle();
      if (!variant || !variant.active || variant.product_id !== data.productId) throw new Error("Variação inválida");
      sku = variant.sku ?? sku;
    }
    const unitPrice = data.modality === "rental_daily"
      ? Number(product.price_rental_daily ?? 0)
      : data.modality === "rental_monthly"
        ? Number(product.price_rental_monthly ?? 0)
        : Number(product.price_sale ?? 0);
    if (unitPrice <= 0) throw new Error("Modalidade sem preço configurado");
    const multiplier = data.modality.startsWith("rental") ? (data.rentalDays ?? 1) : 1;
    const total = +(unitPrice * data.qty * multiplier).toFixed(2);
    const { error } = await sb.from("riomed_cart_items").insert({
      cart_id: cart.id,
      company_id: cart.company_id,
      product_id: data.productId,
      variant_id: data.variantId ?? null,
      modality: data.modality,
      product_name: product.name,
      sku,
      unit_price: unitPrice,
      qty: data.qty,
      rental_days: data.rentalDays ?? null,
      total,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ sessionToken: z.string().min(8), itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts").select("id,status")
      .eq("session_token", data.sessionToken).maybeSingle();
    if (!cart || cart.status !== "active") throw new Error("Carrinho não está ativo");
    const { error } = await sb.from("riomed_cart_items").delete().eq("id", data.itemId).eq("cart_id", cart.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ sessionToken: z.string().min(8) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts").select("*").eq("session_token", data.sessionToken).maybeSingle();
    if (!cart) return { cart: null, items: [] };
    const { data: items } = await sb.from("riomed_cart_items").select("*").eq("cart_id", cart.id).order("created_at");
    return { cart, items: items ?? [] };
  });

export const submitCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    sessionToken: z.string().min(8),
    contactName: z.string().trim().min(2).max(160),
    contactEmail: z.string().trim().email().optional(),
    contactPhone: z.string().trim().min(8).max(40),
    contactDoc: z.string().trim().max(80).optional(),
    companyName: z.string().trim().max(180).optional(),
    audience: z.enum(["public","b2b","hospital","rental"]).default("public"),
    address: z.record(z.string(), z.any()).default({}),
    notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: cart } = await sb.from("riomed_public_carts").select("*")
      .eq("session_token", data.sessionToken).eq("status", "active").maybeSingle();
    if (!cart || cart.items_count === 0) throw new Error("Carrinho vazio ou indisponível");
    const { data: items } = await sb.from("riomed_cart_items").select("*").eq("cart_id", cart.id);
    if (!items?.length) throw new Error("Carrinho vazio");

    const year = new Date().getFullYear();
    const code = `COT-${year}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const contactSnapshot = {
      name: data.contactName,
      email: data.contactEmail ?? null,
      phone: data.contactPhone,
      document: data.contactDoc ?? null,
      company: data.companyName ?? null,
      audience: data.audience,
      address: data.address,
    };
    const { data: quote, error: quoteError } = await sb.from("riomed_quotes").insert({
      company_id: cart.company_id,
      code,
      channel: "web",
      status: "sent",
      currency: cart.currency,
      subtotal: cart.subtotal,
      discount_total: 0,
      total: cart.total,
      expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
      sent_at: new Date().toISOString(),
      notes: data.notes ?? null,
      metadata: { audience: data.audience, source: "portal", checkout_session_token: data.sessionToken, contact: contactSnapshot },
    }).select("id").single();
    if (quoteError) throw new Error(quoteError.message);

    const quoteItems = items.map((item: any, index: number) => ({
      company_id: cart.company_id,
      quote_id: quote.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      description: item.product_name,
      qty: item.qty,
      unit_price: item.unit_price,
      discount: 0,
      total: item.total,
      sort_order: index,
    }));
    const { error: itemError } = await sb.from("riomed_quote_items").insert(quoteItems);
    if (itemError) throw new Error(itemError.message);

    const { data: checkout, error: checkoutError } = await sb.from("riomed_checkout_sessions").insert({
      company_id: cart.company_id,
      cart_id: cart.id,
      contact_name: data.contactName,
      contact_email: data.contactEmail ?? null,
      contact_phone: data.contactPhone,
      contact_doc: data.contactDoc ?? null,
      company_name: data.companyName ?? null,
      audience: data.audience,
      address: data.address,
      notes: data.notes ?? null,
      quote_id: quote.id,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).select("id").single();
    if (checkoutError) throw new Error(checkoutError.message);
    await sb.from("riomed_public_carts").update({ status: "submitted" }).eq("id", cart.id);
    return { ok: true, checkoutId: checkout.id, quoteCode: code, quoteId: quote.id, paymentEnabled: false };
  });

export const listShowcaseAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ showcaseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await riomedCompanyId(supabase);
    const { data: items, error } = await supabase.from("riomed_showcase_items")
      .select("*,riomed_products(name,sku,image_url,price_sale)")
      .eq("company_id", companyId).eq("showcase_id", data.showcaseId).order("position");
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

export const addShowcaseItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    showcaseId: z.string().uuid(),
    productId: z.string().uuid(),
    isFeatured: z.boolean().default(false),
    badge: z.string().max(80).optional(),
    overridePrice: z.number().min(0).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await riomedCompanyId(supabase);
    const { data: showcase } = await supabase.from("riomed_showcase").select("id")
      .eq("id", data.showcaseId).eq("company_id", companyId).maybeSingle();
    if (!showcase) throw new Error("Vitrine não encontrada");
    const { data: product } = await supabase.from("riomed_products").select("id")
      .eq("id", data.productId).eq("company_id", companyId).maybeSingle();
    if (!product) throw new Error("Produto não encontrado");
    const { count } = await supabase.from("riomed_showcase_items").select("id", { count: "exact", head: true }).eq("showcase_id", data.showcaseId);
    const { error } = await supabase.from("riomed_showcase_items").insert({
      company_id: companyId,
      showcase_id: data.showcaseId,
      product_id: data.productId,
      is_featured: data.isFeatured,
      badge: data.badge ?? null,
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
    const companyId = await riomedCompanyId(supabase);
    const { error } = await supabase.from("riomed_showcase_items").delete().eq("id", data.itemId).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCheckoutSessionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await riomedCompanyId(supabase);
    const { data, error } = await supabase.from("riomed_checkout_sessions")
      .select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { sessions: data ?? [] };
  });
