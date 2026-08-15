import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function getRiomedCompanyId(client: any): Promise<string> {
  const { data, error } = await client.from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id;
}

async function emitRiomedEvent(opts: {
  source: string;
  eventCode: string;
  message: string;
  level?: "info" | "warn" | "error";
  payload?: Record<string, unknown>;
  correlationId?: string;
}) {
  try {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    await sb.from("riomed_operational_events").insert({
      company_id: companyId,
      level: opts.level ?? "info",
      source: opts.source,
      event_code: opts.eventCode,
      message: opts.message,
      payload: opts.payload ?? {},
      correlation_id: opts.correlationId ?? null,
    });
  } catch {
    // Evento operacional não deve bloquear a jornada principal.
  }
}

export const getRiomedSiteSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const { data, error } = await sb.from("riomed_site_settings")
      .select("brand_name,logo_url,primary_color,accent_color,whatsapp_official,whatsapp_message,country_code,default_language,hero_title,hero_subtitle,hero_cta_label,footer_text,extra")
      .eq("company_id", companyId).eq("is_published", true).maybeSingle();
    if (error) throw new Error(error.message);
    return {
      settings: data ?? {
        brand_name: "Rio Med",
        logo_url: null,
        primary_color: "#0E7C66",
        accent_color: "#0AB1A0",
        whatsapp_official: null,
        whatsapp_message: null,
        country_code: "BO",
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
  .inputValidator((d: { search?: string; category?: string; condition?: "new" | "used"; modality?: "venta" | "alquiler" | "ambos"; limit?: number } = {}) => d)
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    let query = sb.from("riomed_products")
      .select("id,sku,name,description,category,image_url,is_active,modality,price_sale,price_rental_daily,price_rental_monthly,currency,stock,metadata")
      .eq("company_id", companyId).eq("is_active", true)
      .order("display_order", { ascending: true }).limit(Math.min(data.limit ?? 60, 100));
    if (data.search) {
      const term = data.search.replace(/[,%()]/g, " ").trim();
      if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,category.ilike.%${term}%`);
    }
    if (data.category) query = query.eq("category", data.category);
    if (data.modality) {
      const values = data.modality === "ambos" ? ["ambos"] : [data.modality, "ambos"];
      query = query.in("modality", values);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    let items = rows ?? [];
    if (data.condition) items = items.filter((row: any) => (row.metadata?.condition ?? "new") === data.condition);
    return { items };
  });

export const getCotacaoBobUsd = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = await adminClient();
    const { data, error } = await sb.from("cotacao_bob_usd")
      .select("rate,source,captured_at").eq("is_active", true)
      .order("captured_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.rate) return { rate: null as number | null, source: null as string | null, capturedAt: null as string | null };
    return { rate: Number(data.rate), source: data.source as string, capturedAt: data.captured_at as string | null };
  });

export const listProductCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const { data, error } = await sb.from("riomed_products").select("category")
      .eq("company_id", companyId).eq("is_active", true);
    if (error) throw new Error(error.message);
    const set = new Set<string>();
    (data ?? []).forEach((row: any) => { if (row.category) set.add(row.category); });
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
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const payload = {
      clientType: data.clientType,
      needType: data.needType,
      productDesired: data.productDesired || null,
      productCode: data.productCode || null,
      city: data.city || null,
      department: data.department || null,
      urgency: data.urgency || null,
      photoUrl: data.photoUrl || null,
      pagePath: data.pagePath || null,
    };
    const { data: lead, error: leadError } = await sb.from("riomed_seller_leads").insert({
      company_id: companyId,
      customer_name: data.name,
      customer_phone: data.whatsapp,
      customer_email: data.email || null,
      interest: [data.productDesired, data.productCode, data.needType].filter(Boolean).join(" · ") || null,
      profile: data.clientType,
      notes: data.notes || null,
      status: "novo",
    }).select("id").single();
    if (leadError) throw new Error(leadError.message);
    const quoteCode = `COT-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const { data: quote, error: quoteError } = await sb.from("riomed_quotes").insert({
      company_id: companyId,
      code: quoteCode,
      channel: "site_cotizacion",
      status: "draft",
      currency: "BOB",
      notes: data.notes || null,
      metadata: { source: "site_cotizacion", lead_id: lead.id, contact: { name: data.name, phone: data.whatsapp, email: data.email || null }, ...payload },
    }).select("id").single();
    if (quoteError) throw new Error(quoteError.message);
    await emitRiomedEvent({
      source: "crm",
      eventCode: "quote.requested",
      message: `Solicitud de cotización de ${data.name}`,
      level: data.urgency === "alta" ? "warn" : "info",
      payload: { leadId: lead.id, quoteId: quote.id, quoteCode, ...payload },
      correlationId: quote.id,
    });
    return { leadId: lead.id, quoteId: quote.id, quoteCode, ok: true };
  });

export const trackRiomedWhatsappClick = createServerFn({ method: "POST" })
  .inputValidator((d: { pagePath?: string; referrer?: string; userAgent?: string }) => d)
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const { error } = await sb.from("riomed_whatsapp_clicks").insert({
      company_id: companyId,
      page_path: data.pagePath ?? null,
      referrer: data.referrer ?? null,
      user_agent: data.userAgent ?? null,
    });
    if (error) throw new Error(error.message);
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
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const { data: existing } = await sb.from("riomed_sellers").select("id,status")
      .eq("company_id", companyId).eq("email", data.email).maybeSingle();
    if (existing) return { ok: true, alreadyExists: true, status: existing.status, sellerId: existing.id };
    const { data: row, error } = await sb.from("riomed_sellers").insert({
      company_id: companyId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      territory: data.territory || null,
      notes: data.notes || null,
      status: "pending",
      commission_rate: 0,
      seller_code: `VEND-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      metadata: { source: "self_signup" },
    }).select("id").single();
    if (error) throw new Error(error.message);
    await emitRiomedEvent({ source: "sales", eventCode: "seller.application", message: `Nueva candidatura de vendedor: ${data.fullName}`, payload: { sellerId: row.id }, correlationId: row.id });
    return { ok: true, sellerId: row.id, status: "pending" };
  });

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
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const protocol = `RM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const { data: row, error } = await sb.from("riomed_support_tickets").insert({
      company_id: companyId,
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
    }).select("id,protocol").single();
    if (error) throw new Error(error.message);
    await emitRiomedEvent({
      source: "support",
      eventCode: "ticket.created",
      message: `Nuevo ticket ${protocol} (${data.urgency})`,
      level: data.urgency === "critica" ? "warn" : "info",
      payload: { ticketId: row.id, protocol, urgency: data.urgency, category: data.issueCategory },
      correlationId: row.id,
    });
    return { ok: true, protocol: row.protocol, id: row.id };
  });

export const listRiomedTeam = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const { data, error } = await sb.from("riomed_team")
      .select("id,full_name,member_role,specialty,rr_position")
      .eq("company_id", companyId).eq("active", true).order("rr_position");
    if (error) throw new Error(error.message);
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
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    let assignedId: string | null = null;
    let assignedName = "";
    if (data.preferredSellerId) {
      const { data: chosen } = await sb.from("riomed_team").select("id,full_name")
        .eq("company_id", companyId).eq("id", data.preferredSellerId).eq("active", true).eq("member_role", "vendedor").maybeSingle();
      if (chosen) { assignedId = chosen.id; assignedName = chosen.full_name; }
    }
    if (!assignedId) {
      const { data: sellers } = await sb.from("riomed_team").select("id,full_name,rr_position")
        .eq("company_id", companyId).eq("active", true).eq("member_role", "vendedor").order("rr_position");
      const list = sellers ?? [];
      if (list.length) {
        const { data: ptr } = await sb.from("riomed_rr_pointer").select("last_position").eq("company_id", companyId).maybeSingle();
        const last = ptr?.last_position ?? -1;
        const next = list.find((seller: any) => seller.rr_position > last) ?? list[0];
        assignedId = next.id;
        assignedName = next.full_name;
        await sb.from("riomed_rr_pointer").upsert({ company_id: companyId, last_position: next.rr_position, updated_at: new Date().toISOString() }, { onConflict: "company_id" });
      }
    }
    const { data: row, error } = await sb.from("riomed_seller_leads").insert({
      company_id: companyId,
      team_id: assignedId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      interest: data.interest || null,
      profile: data.profile || null,
      notes: data.notes || null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await emitRiomedEvent({ source: "crm", eventCode: "lead.created", message: `Nuevo lead de ${data.customerName}${assignedName ? ` → ${assignedName}` : ""}`, payload: { leadId: row.id, sellerId: assignedId }, correlationId: row.id });
    return { ok: true, leadId: row.id, sellerId: assignedId, sellerName: assignedName };
  });

export const listRiomedSellerLeads = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ status: z.string().optional(), sellerId: z.string().uuid().optional(), limit: z.number().int().min(1).max(500).optional() }).optional().parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    let query = sb.from("riomed_seller_leads").select("id,team_id,customer_name,customer_phone,customer_email,interest,profile,notes,status,created_at")
      .eq("company_id", companyId).order("created_at", { ascending: false }).limit(data?.limit ?? 200);
    if (data?.status) query = query.eq("status", data.status);
    if (data?.sellerId) query = query.eq("team_id", data.sellerId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const { data: team } = await sb.from("riomed_team").select("id,full_name,member_role").eq("company_id", companyId);
    const map = new Map((team ?? []).map((member: any) => [member.id, member]));
    return { leads: (rows ?? []).map((row: any) => ({ ...row, seller: map.get(row.team_id) ?? null })) };
  });

export const listRiomedTickets = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ status: z.string().optional(), urgency: z.string().optional(), limit: z.number().int().min(1).max(500).optional() }).optional().parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    let query = sb.from("riomed_support_tickets").select("*").eq("company_id", companyId)
      .order("created_at", { ascending: false }).limit(data?.limit ?? 200);
    if (data?.status) query = query.eq("status", data.status);
    if (data?.urgency) query = query.eq("urgency", data.urgency);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { tickets: rows ?? [] };
  });

export const updateRiomedLeadStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ leadId: z.string().uuid(), status: z.enum(["novo","em_contato","qualificado","ganho","perdido"]), notes: z.string().max(2000).optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const patch: Record<string, unknown> = { status: data.status, updated_at: new Date().toISOString() };
    if (data.notes) patch.notes = data.notes;
    const { error } = await sb.from("riomed_seller_leads").update(patch).eq("id", data.leadId).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    await emitRiomedEvent({ source: "crm", eventCode: `lead.${data.status}`, message: `Lead movido para ${data.status}`, payload: { leadId: data.leadId, status: data.status }, correlationId: data.leadId });
    return { ok: true };
  });

export const updateRiomedTicketStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ticketId: z.string().uuid(), status: z.enum(["aberto","triagem","em_atendimento","aguardando_peca","resolvido","cancelado"]) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const { error } = await sb.from("riomed_support_tickets").update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.ticketId).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    await emitRiomedEvent({ source: "support", eventCode: `ticket.${data.status}`, message: `Ticket movido para ${data.status}`, level: data.status === "cancelado" ? "warn" : "info", payload: { ticketId: data.ticketId, status: data.status }, correlationId: data.ticketId });
    return { ok: true };
  });

export const getRiomedTeamPerformance = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    const [{ data: team, error: teamError }, { data: leads, error: leadError }] = await Promise.all([
      sb.from("riomed_team").select("id,full_name,member_role,specialty,phone,email,rr_position").eq("company_id", companyId).eq("active", true).order("rr_position"),
      sb.from("riomed_seller_leads").select("team_id,status").eq("company_id", companyId),
    ]);
    if (teamError) throw new Error(teamError.message);
    if (leadError) throw new Error(leadError.message);
    const stats = new Map<string, any>();
    for (const lead of leads ?? []) {
      const key = (lead as any).team_id;
      if (!key) continue;
      const current = stats.get(key) ?? { total: 0, novo: 0, em_contato: 0, qualificado: 0, ganho: 0, perdido: 0 };
      current.total += 1;
      if ((lead as any).status in current) current[(lead as any).status] += 1;
      stats.set(key, current);
    }
    return { team: (team ?? []).map((member: any) => ({ ...member, stats: stats.get(member.id) ?? { total: 0, novo: 0, em_contato: 0, qualificado: 0, ganho: 0, perdido: 0 } })) };
  });

export const listRiomedOperationalEvents = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ source: z.string().optional(), limit: z.number().int().min(1).max(500).optional() }).optional().parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const companyId = await getRiomedCompanyId(sb);
    let query = sb.from("riomed_operational_events")
      .select("id,level,source,event_code,message,payload,correlation_id,created_at")
      .eq("company_id", companyId).order("created_at", { ascending: false }).limit(data?.limit ?? 100);
    if (data?.source) query = query.eq("source", data.source);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });
