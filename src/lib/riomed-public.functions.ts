import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function pubClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } as any },
  );
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function getRiomedCompanyId(client: any): Promise<string | null> {
  const { data } = await client
    .from("companies")
    .select("id")
    .ilike("name", "%riomed%")
    .limit(1)
    .maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await client.from("companies").select("id").limit(1).maybeSingle();
  return any2?.id ?? null;
}

export const getRiomedSiteSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = pubClient();
    const { data } = await supa
      .from("riomed_site_settings")
      .select("brand_name,logo_url,primary_color,accent_color,whatsapp_official,whatsapp_message,country_code,default_language,hero_title,hero_subtitle,hero_cta_label,footer_text,extra")
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();
    return {
      settings: data ?? {
        brand_name: "RioMed",
        logo_url: null,
        primary_color: "#0E7C66",
        accent_color: "#0AB1A0",
        whatsapp_official: "+595000000000",
        whatsapp_message: "Hola RioMed, me gustaría más información.",
        country_code: "PY",
        default_language: "es",
        hero_title: "Equipamiento médico-hospitalario confiable.",
        hero_subtitle: "Venta, alquiler y servicio técnico para hospitales, clínicas y pacientes.",
        hero_cta_label: "Solicitar cotización",
        footer_text: null,
        extra: {},
      },
    };
  });

export const listRiomedPublicProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { search?: string; category?: string; condition?: "new"|"used"; modality?: "venta"|"alquiler"|"ambos"; limit?: number } = {}) => d)
  .handler(async ({ data }) => {
    const supa = pubClient();
    let q = supa
      .from("riomed_products")
      .select("id,sku,name,description,category,brand,model,image_url,is_active,modality,price_sale,price_rental_daily,price_rental_monthly,currency,stock,metadata")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(data.limit ?? 60);
    if (data.search) q = q.or(`name.ilike.%${data.search}%,sku.ilike.%${data.search}%,brand.ilike.%${data.search}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.modality) q = q.in("modality", data.modality === "ambos" ? ["ambos"] : [data.modality, "ambos"]);
    const { data: rows } = await q;
    let items = rows ?? [];
    if (data.condition) {
      items = items.filter((r: any) => (r.metadata?.condition ?? "new") === data.condition);
    }
    return { items };
  });

export const getCotacaoBobUsd = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const supa = pubClient();
      const { data } = await supa
        .from("cotacao_bob_usd")
        .select("rate,source,captured_at")
        .eq("is_active", true)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.rate) return { rate: Number(data.rate), source: data.source as string, capturedAt: data.captured_at as string | null };
    } catch { /* fallback */ }
    return { rate: 6.96, source: "fallback", capturedAt: null as string | null };
  });

export const listProductCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = pubClient();
    const { data } = await supa
      .from("riomed_products")
      .select("category")
      .eq("is_active", true);
    const set = new Set<string>();
    (data ?? []).forEach((r: any) => { if (r.category) set.add(r.category); });
    return { categories: Array.from(set).sort() };
  });

const quoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  clientType: z.enum(["paciente", "clinica", "hospital", "empresa", "proveedor", "tecnico", "candidato"]),
  needType: z.enum(["compra", "alquiler", "mantenimiento"]),
  productDesired: z.string().trim().max(240).optional().or(z.literal("")),
  productCode: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  urgency: z.enum(["baja", "media", "alta"]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  photoUrl: z.string().trim().max(800).optional().or(z.literal("")),
  pagePath: z.string().trim().max(200).optional(),
});

export const submitRiomedQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => quoteSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await adminClient();
    const companyId = await getRiomedCompanyId(admin);
    if (!companyId) throw new Error("RioMed company not configured");

    const tags = ["riomed", "cotizacion-site", `tipo:${data.clientType}`, `necesidad:${data.needType}`];
    if (data.urgency) tags.push(`urgencia:${data.urgency}`);

    const payload: Record<string, any> = {
      clientType: data.clientType,
      needType: data.needType,
      productDesired: data.productDesired || null,
      productCode: data.productCode || null,
      city: data.city || null,
      department: data.department || null,
      urgency: data.urgency || null,
      notes: data.notes || null,
      photoUrl: data.photoUrl || null,
      pagePath: data.pagePath || null,
    };

    const { data: lead, error } = await admin
      .from("crm_leads")
      .insert({
        company_id: companyId,
        name: data.name,
        email: data.email || null,
        phone: data.whatsapp,
        source: "site_cotizacion",
        status: "new",
        tags,
        notes: data.notes || null,
        riomed_origin: "cotizacion",
        riomed_quote_payload: payload,
      })
      .select()
      .single();
    if (error) throw error;

    try {
      await admin.from("crm_activities").insert({
        company_id: companyId,
        lead_id: lead.id,
        activity_type: "quote_request",
        subject: "Solicitud de cotización vía sitio",
        content: `Tipo: ${data.clientType} | Necesidad: ${data.needType}${data.productDesired ? ` | Producto: ${data.productDesired}` : ""}${data.productCode ? ` | Código: ${data.productCode}` : ""}`,
      } as any);
    } catch { /* non-blocking */ }

    try {
      await admin.rpc("riomed_log_audit", {
        _company_id: companyId,
        _actor_id: null as any,
        _actor_email: data.email || "",
        _action: "quote.submitted",
        _entity_type: "lead",
        _entity_id: lead.id,
        _before: null as any,
        _after: { id: lead.id, ...payload },
        _metadata: { source: "site_cotizacion" },
      } as any);
    } catch { /* non-blocking */ }

    // Auto-assign lead to a seller per distribution config
    try {
      await admin.rpc("assign_riomed_lead", {
        _company_id: companyId,
        _lead_id: lead.id,
        _opportunity_id: null as any,
      } as any);
    } catch { /* non-blocking */ }

    return { leadId: lead.id, ok: true };
  });

export const trackRiomedWhatsappClick = createServerFn({ method: "POST" })
  .inputValidator((d: { pagePath?: string; referrer?: string; userAgent?: string }) => d)
  .handler(async ({ data }) => {
    const admin = await adminClient();
    const companyId = await getRiomedCompanyId(admin);
    if (!companyId) return { ok: false };
    await admin.from("riomed_whatsapp_clicks").insert({
      company_id: companyId,
      page_path: data.pagePath ?? null,
      referrer: data.referrer ?? null,
      user_agent: data.userAgent ?? null,
    });
    return { ok: true };
  });

const sellerSignupSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(40),
  territory: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const submitRiomedSellerApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sellerSignupSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await adminClient();
    const companyId = await getRiomedCompanyId(admin);
    if (!companyId) throw new Error("RioMed company not configured");

    const { data: existing } = await admin
      .from("riomed_sellers")
      .select("id,status")
      .eq("company_id", companyId)
      .eq("email", data.email)
      .maybeSingle();
    if (existing) {
      return { ok: true, alreadyExists: true, status: existing.status };
    }

    const { data: row, error } = await admin
      .from("riomed_sellers")
      .insert({
        company_id: companyId,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        territory: data.territory || null,
        notes: data.notes || null,
        status: "pending",
        commission_rate: 0,
        seller_code: `VEND-${Date.now().toString(36).toUpperCase()}`,
        metadata: { source: "self_signup" } as any,
      })
      .select("id")
      .single();
    if (error) throw error;

    try {
      await admin.from("crm_leads").insert({
        company_id: companyId,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        source: "seller_application",
        status: "new",
        tags: ["riomed", "vendedor-aplicacion"],
        notes: data.notes || null,
        riomed_origin: "seller_application",
      });
    } catch { /* non-blocking */ }

    return { ok: true, sellerId: row.id, status: "pending" };
  });
