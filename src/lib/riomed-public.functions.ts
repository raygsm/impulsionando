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

// ─── Wave 3: Support tickets + Seller round-robin ──────────────────────────

const supportSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  customerPhone: z.string().trim().min(6).max(40),
  customerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  equipmentType: z.string().trim().max(160).optional().or(z.literal("")),
  equipmentBrand: z.string().trim().max(160).optional().or(z.literal("")),
  issueCategory: z.enum(["mantenimiento_preventivo","correctivo","calibracion","instalacion","capacitacion","otro"]),
  urgency: z.enum(["baja","media","alta","critica"]),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  locationCity: z.string().trim().max(120).optional().or(z.literal("")),
  preferredWindow: z.string().trim().max(120).optional().or(z.literal("")),
});

export const openRiomedSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => supportSchema.parse(d))
  .handler(async ({ data }) => {
    const supa = pubClient();
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 9000 + 1000).toString();
    const protocol = `RM-${stamp}-${rand}`;
    const { data: row, error } = await supa.from("riomed_support_tickets").insert({
      protocol,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      equipment_type: data.equipmentType || null,
      equipment_brand: data.equipmentBrand || null,
      issue_category: data.issueCategory,
      urgency: data.urgency,
      description: data.description || null,
      location_city: data.locationCity || null,
      preferred_window: data.preferredWindow || null,
    } as any).select("id,protocol").single();
    if (error) throw error;
    await emitRiomedEvent({
      source: "support",
      eventCode: "ticket.created",
      message: `Novo ticket ${protocol} (${data.urgency})`,
      level: data.urgency === "critica" ? "warn" : "info",
      payload: {
        ticketId: row.id, protocol, urgency: data.urgency,
        category: data.issueCategory, city: data.locationCity,
        customer: { name: data.customerName, phone: data.customerPhone, email: data.customerEmail },
      },
      correlationId: row.id,
    });
    return { ok: true, protocol: row.protocol, id: row.id };
  });

export const listRiomedTeam = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = pubClient();
    const { data } = await supa
      .from("riomed_team")
      .select("id,full_name,email,phone,member_role,specialty,rr_position")
      .eq("active", true)
      .order("rr_position", { ascending: true });
    return { team: data ?? [] };
  });

const leadSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  customerPhone: z.string().trim().min(6).max(40),
  customerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  interest: z.string().trim().max(300).optional().or(z.literal("")),
  profile: z.enum(["hospital","clinica","consultorio","ambulancia","home_care","profesional","periferico","otro"]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  preferredSellerId: z.string().uuid().optional(),
});

export const submitRiomedSellerLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => leadSchema.parse(d))
  .handler(async ({ data }) => {
    const supa = pubClient();
    let assignedId: string | null = null;
    let assignedName = "";

    if (data.preferredSellerId) {
      const { data: chosen } = await supa
        .from("riomed_team").select("id,full_name").eq("id", data.preferredSellerId).eq("member_role","vendedor").maybeSingle();
      if (chosen) { assignedId = chosen.id; assignedName = chosen.full_name; }
    }

    if (!assignedId) {
      const { data: sellers } = await supa
        .from("riomed_team").select("id,full_name,rr_position")
        .eq("active", true).eq("member_role","vendedor")
        .order("rr_position", { ascending: true });
      const list = sellers ?? [];
      if (list.length > 0) {
        const { data: ptr } = await supa.from("riomed_rr_pointer").select("last_position").eq("id",1).maybeSingle();
        const last = ptr?.last_position ?? 0;
        const next = list.find((s: any) => s.rr_position > last) ?? list[0];
        assignedId = next.id; assignedName = next.full_name;
        await supa.from("riomed_rr_pointer").update({ last_position: next.rr_position, updated_at: new Date().toISOString() }).eq("id",1);
      }
    }

    const { data: row, error } = await supa.from("riomed_seller_leads").insert({
      team_id: assignedId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      interest: data.interest || null,
      profile: data.profile || null,
      notes: data.notes || null,
    } as any).select("id").single();
    if (error) throw error;
    await emitRiomedEvent({
      source: "crm",
      eventCode: "lead.created",
      message: `Novo lead de ${data.customerName}${assignedName ? " → " + assignedName : ""}`,
      payload: {
        leadId: row.id, sellerId: assignedId, sellerName: assignedName,
        profile: data.profile, interest: data.interest,
        customer: { name: data.customerName, phone: data.customerPhone, email: data.customerEmail },
      },
      correlationId: row.id,
    });
    return { ok: true, leadId: row.id, sellerId: assignedId, sellerName: assignedName };
  });

// ============================================================
// Wave 4/5 — admin panels + jornadas (operational events → N8N)
// ============================================================

async function emitRiomedEvent(opts: {
  source: string;
  eventCode: string;
  message: string;
  level?: "info" | "warn" | "error";
  payload?: Record<string, unknown>;
  correlationId?: string;
}) {
  try {
    const supa = await adminClient();
    const companyId = await getRiomedCompanyId(supa);
    if (!companyId) return;
    await supa.from("riomed_operational_events").insert({
      company_id: companyId,
      level: opts.level ?? "info",
      source: opts.source,
      event_code: opts.eventCode,
      message: opts.message,
      payload: opts.payload ?? {},
      correlation_id: opts.correlationId ?? null,
    } as any);
  } catch { /* não bloquear fluxo principal */ }
}


export const listRiomedSellerLeads = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    status: z.string().optional(),
    sellerId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const supa = await adminClient();
    let q = supa.from("riomed_seller_leads")
      .select("id,team_id,customer_name,customer_phone,customer_email,interest,profile,notes,status,created_at")
      .order("created_at", { ascending: false })
      .limit(data?.limit ?? 200);
    if (data?.status) q = q.eq("status", data.status);
    if (data?.sellerId) q = q.eq("team_id", data.sellerId);
    const { data: rows, error } = await q;
    if (error) throw error;
    const { data: team } = await supa.from("riomed_team").select("id,full_name,member_role");
    const map = new Map((team ?? []).map((t: any) => [t.id, t]));
    return { leads: (rows ?? []).map((r: any) => ({ ...r, seller: map.get(r.team_id) ?? null })) };
  });

export const listRiomedTickets = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    status: z.string().optional(),
    urgency: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const supa = await adminClient();
    let q = supa.from("riomed_support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data?.limit ?? 200);
    if (data?.status) q = q.eq("status", data.status);
    if (data?.urgency) q = q.eq("urgency", data.urgency);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { tickets: rows ?? [] };
  });

export const updateRiomedLeadStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    leadId: z.string().uuid(),
    status: z.enum(["novo","em_contato","qualificado","ganho","perdido"]),
    notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const supa = await adminClient();
    const patch: any = { status: data.status, updated_at: new Date().toISOString() };
    if (data.notes) patch.notes = data.notes;
    const { error } = await supa.from("riomed_seller_leads").update(patch).eq("id", data.leadId);
    if (error) throw error;
    await emitRiomedEvent({
      source: "crm",
      eventCode: `lead.${data.status}`,
      message: `Lead movido para ${data.status}`,
      payload: { leadId: data.leadId, status: data.status },
      correlationId: data.leadId,
    });
    return { ok: true };
  });

export const updateRiomedTicketStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    ticketId: z.string().uuid(),
    status: z.enum(["aberto","triagem","em_atendimento","aguardando_peca","resolvido","cancelado"]),
  }).parse(d))
  .handler(async ({ data }) => {
    const supa = await adminClient();
    const { error } = await supa.from("riomed_support_tickets")
      .update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.ticketId);
    if (error) throw error;
    await emitRiomedEvent({
      source: "support",
      eventCode: `ticket.${data.status}`,
      message: `Ticket movido para ${data.status}`,
      level: data.status === "resolvido" ? "info" : data.status === "cancelado" ? "warn" : "info",
      payload: { ticketId: data.ticketId, status: data.status },
      correlationId: data.ticketId,
    });
    return { ok: true };
  });

export const getRiomedTeamPerformance = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = await adminClient();
    const { data: team } = await supa.from("riomed_team")
      .select("id,full_name,member_role,specialty,phone,email,rr_position")
      .eq("active", true).order("rr_position", { ascending: true });
    const { data: leads } = await supa.from("riomed_seller_leads").select("team_id,status");
    const stats = new Map<string, { total: number; novo: number; em_contato: number; qualificado: number; ganho: number; perdido: number }>();
    for (const l of (leads ?? [])) {
      const k = (l as any).team_id;
      if (!k) continue;
      const s = stats.get(k) ?? { total: 0, novo: 0, em_contato: 0, qualificado: 0, ganho: 0, perdido: 0 };
      s.total++;
      const st = ((l as any).status ?? "novo") as keyof typeof s;
      if (st in s) (s as any)[st]++;
      stats.set(k, s);
    }
    return {
      team: (team ?? []).map((t: any) => ({
        ...t,
        stats: stats.get(t.id) ?? { total: 0, novo: 0, em_contato: 0, qualificado: 0, ganho: 0, perdido: 0 },
      })),
    };
  });

export const listRiomedOperationalEvents = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    source: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const supa = await adminClient();
    let q = supa.from("riomed_operational_events")
      .select("id,level,source,event_code,message,payload,correlation_id,created_at")
      .order("created_at", { ascending: false })
      .limit(data?.limit ?? 100);
    if (data?.source) q = q.eq("source", data.source);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { events: rows ?? [] };
  });
