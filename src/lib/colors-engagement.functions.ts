import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";

const touchSchema = z.object({
  sourceChannel: z.string().max(60).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(160).optional(),
  utmContent: z.string().max(160).optional(),
  utmTerm: z.string().max(160).optional(),
});

const appointmentSchema = touchSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(8).max(30),
  audience: z.enum(["customer","lead","affiliate","affiliate_candidate","partner","other"]),
  appointmentType: z.enum(["customer_call","sales_call","affiliate_manager_call","support_call","partnership_call","other"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().max(1200).optional(),
  consentLgpd: z.literal(true),
});

const eventRegistrationSchema = touchSchema.extend({
  eventId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(8).max(30),
  affiliateCode: z.string().trim().max(80).optional(),
  consentLgpd: z.literal(true),
  consentMarketing: z.boolean().default(false),
});

const supportSchema = touchSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional(),
  whatsapp: z.string().trim().min(8).max(30),
  category: z.enum(["pedido","rastreio","pagamento","produto","troca_devolucao","afiliado","evento","outro"]),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  consentLgpd: z.literal(true),
});

function normEmail(v?: string) { return v ? v.trim().toLowerCase() : null; }
function normPhone(v?: string) { return v ? v.replace(/\D/g, "") : null; }
function protocol() { return `COL-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,8).toUpperCase()}`; }
function hashDocument(v: string) { return createHash("sha256").update(`colors:${v}`).digest("hex"); }

async function companyId(sb: any) {
  const { data, error } = await sb.from("companies").select("id").eq("document", "58.255.587/0001-60").maybeSingle();
  if (error || !data?.id) throw new Error("Colors company not configured");
  return data.id as string;
}

async function ensureContact(sb: any, data: { fullName: string; email?: string; whatsapp: string; consentLgpd: boolean; touch?: any }) {
  const emailN = normEmail(data.email);
  const phoneN = normPhone(data.whatsapp);
  let existing: any = null;
  if (emailN) ({ data: existing } = await sb.from("colors_contacts").select("id").eq("email_normalized", emailN).maybeSingle());
  if (!existing && phoneN) ({ data: existing } = await sb.from("colors_contacts").select("id").eq("whatsapp_normalized", phoneN).maybeSingle());
  const payload = {
    full_name: data.fullName,
    email: data.email ?? null,
    whatsapp: data.whatsapp,
    consent_lgpd: data.consentLgpd,
    consent_timestamp: new Date().toISOString(),
    consent_source: data.touch?.sourceChannel ?? "colors_site",
    last_touch: data.touch ?? {},
    last_seen_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await sb.from("colors_contacts").update(payload).eq("id", existing.id);
    return existing.id as string;
  }
  const { data: inserted, error } = await sb.from("colors_contacts").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  return inserted.id as string;
}

export const createColorsAppointment = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => appointmentSchema.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb: any = supabaseAdmin;
    const touch = { source_channel: data.sourceChannel, utm_source: data.utmSource, utm_medium: data.utmMedium, utm_campaign: data.utmCampaign, utm_content: data.utmContent, utm_term: data.utmTerm };
    const contactId = await ensureContact(sb, { fullName: data.fullName, email: data.email, whatsapp: data.whatsapp, consentLgpd: true, touch });
    const { data: row, error } = await sb.from("colors_appointments").insert({
      contact_id: contactId, audience: data.audience, appointment_type: data.appointmentType, status: "requested",
      starts_at: data.startsAt, ends_at: data.endsAt, source_channel: data.sourceChannel ?? "site",
      utm_source: data.utmSource, utm_medium: data.utmMedium, utm_campaign: data.utmCampaign, utm_content: data.utmContent, utm_term: data.utmTerm,
      notes: data.notes ?? null, metadata: { protocol: protocol() }
    }).select("id,metadata").single();
    if (error) throw new Error(error.message);
    await sb.from("colors_event_bus").insert({ event_id: `appointment:${row.id}`, event_type: "APPOINTMENT_REQUESTED", aggregate_type: "appointment", aggregate_id: row.id, payload: { appointment_id: row.id, contact_id: contactId } });
    return { ok: true, appointmentId: row.id, protocol: row.metadata?.protocol };
  });

export const listPublishedColorsEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("colors_events").select("id,slug,title,description,starts_at,ends_at,venue_name,city,state,is_free,capacity,hero_image_url,seo_title,seo_description").eq("status","published").gte("starts_at", new Date(Date.now()-86400000).toISOString()).order("starts_at");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const registerColorsEvent = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => eventRegistrationSchema.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb: any = supabaseAdmin;
    const touch = { source_channel: data.sourceChannel, utm_source: data.utmSource, utm_medium: data.utmMedium, utm_campaign: data.utmCampaign, utm_content: data.utmContent, utm_term: data.utmTerm };
    const contactId = await ensureContact(sb, { fullName: data.fullName, email: data.email, whatsapp: data.whatsapp, consentLgpd: true, touch });
    const { data: row, error } = await sb.from("colors_event_registrations").insert({ event_id: data.eventId, contact_id: contactId, full_name: data.fullName, email: data.email, whatsapp: data.whatsapp, affiliate_code: data.affiliateCode ?? null, consent_lgpd: true, consent_marketing: data.consentMarketing, ...touch }).select("id").single();
    if (error) throw new Error(error.message);
    await sb.from("colors_event_bus").insert({ event_id: `event-registration:${row.id}`, event_type: "EVENT_REGISTRATION_CREATED", aggregate_type: "event_registration", aggregate_id: row.id, payload: { registration_id: row.id, event_id: data.eventId, contact_id: contactId } });
    return { ok: true, registrationId: row.id };
  });

export const createColorsSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => supportSchema.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb: any = supabaseAdmin;
    const cid = await companyId(sb);
    const touch = { source_channel: data.sourceChannel, utm_source: data.utmSource, utm_medium: data.utmMedium, utm_campaign: data.utmCampaign, utm_content: data.utmContent, utm_term: data.utmTerm };
    const contactId = await ensureContact(sb, { fullName: data.fullName, email: data.email, whatsapp: data.whatsapp, consentLgpd: true, touch });
    const ticketCode = protocol();
    const { data: row, error } = await sb.from("support_tickets").insert({ company_id: cid, contact_id: contactId, category: data.category, priority: "normal", status: "open", subject: data.subject, description: data.description, source_channel: data.sourceChannel ?? "colors_site", ticket_code: ticketCode, metadata: { brand: "colors_saude", iris: true, ...touch } }).select("id,ticket_code").single();
    if (error) throw new Error(error.message);
    await sb.from("colors_event_bus").insert({ event_id: `support:${row.id}`, event_type: "SUPPORT_TICKET_CREATED", aggregate_type: "support_ticket", aggregate_id: row.id, payload: { ticket_id: row.id, ticket_code: row.ticket_code, contact_id: contactId } });
    return { ok: true, ticketId: row.id, protocol: row.ticket_code };
  });
