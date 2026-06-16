import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Módulo Eventos/Ingressos — CRUD de eventos, lotes, emissão, transferência e check-in.
 * Toda escrita é feita com supabase autenticado (RLS scope_by_company aplicada).
 */

const UUID = z.string().uuid();

// ---------- LIST / GET ----------
export const listEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => ({ companyId: UUID.parse(d.companyId) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("evt_events")
      .select("id,title,slug,status,starts_at,ends_at,capacity,is_published,venue_name,city,state,transfer_policy")
      .eq("company_id", data.companyId)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const getEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: UUID.parse(d.id) }))
  .handler(async ({ data, context }) => {
    const [{ data: event, error: e1 }, types, tickets, checkins] = await Promise.all([
      context.supabase.from("evt_events").select("*").eq("id", data.id).single(),
      context.supabase.from("evt_ticket_types").select("*").eq("event_id", data.id).order("sort_order"),
      context.supabase
        .from("evt_tickets")
        .select("id,code,status,holder_name,holder_email,ticket_type_id,price_paid,issued_at,used_at")
        .eq("event_id", data.id)
        .order("issued_at", { ascending: false })
        .limit(500),
      context.supabase
        .from("evt_checkins")
        .select("id,ticket_id,gate,checked_in_at")
        .eq("event_id", data.id)
        .order("checked_in_at", { ascending: false })
        .limit(200),
    ]);
    if (e1) throw new Error(e1.message);
    return {
      event,
      ticketTypes: types.data ?? [],
      tickets: tickets.data ?? [],
      checkins: checkins.data ?? [],
    };
  });

// ---------- CREATE / UPDATE EVENT ----------
const EventInput = z.object({
  companyId: UUID,
  id: UUID.optional(),
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, "use kebab-case"),
  description: z.string().max(5000).optional(),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(2).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(["rascunho", "publicado", "encerrado", "cancelado"]).default("rascunho"),
  transferPolicy: z.enum(["livre", "com_aprovacao", "bloqueada"]).default("livre"),
  refundPolicy: z.string().max(1000).optional(),
  organizerName: z.string().max(200).optional(),
  organizerContact: z.string().max(200).optional(),
  isPublished: z.boolean().default(false),
});

export const upsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EventInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      company_id: data.companyId,
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      venue_name: data.venueName ?? null,
      venue_address: data.venueAddress ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      capacity: data.capacity ?? null,
      status: data.status,
      transfer_policy: data.transferPolicy,
      refund_policy: data.refundPolicy ?? null,
      organizer_name: data.organizerName ?? null,
      organizer_contact: data.organizerContact ?? null,
      is_published: data.isPublished,
      created_by: context.userId,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase
        .from("evt_events").update(row).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return out;
    }
    const { data: out, error } = await context.supabase
      .from("evt_events").insert(row).select().single();
    if (error) throw new Error(error.message);
    return out;
  });

// ---------- TICKET TYPES ----------
const TicketTypeInput = z.object({
  id: UUID.optional(),
  companyId: UUID,
  eventId: UUID,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  perPersonLimit: z.number().int().positive().default(5),
  saleStartsAt: z.string().datetime().optional(),
  saleEndsAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const upsertTicketType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TicketTypeInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      company_id: data.companyId,
      event_id: data.eventId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      quantity: data.quantity,
      per_person_limit: data.perPersonLimit,
      sale_starts_at: data.saleStartsAt ?? null,
      sale_ends_at: data.saleEndsAt ?? null,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase
        .from("evt_ticket_types").update(row).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return out;
    }
    const { data: out, error } = await context.supabase
      .from("evt_ticket_types").insert(row).select().single();
    if (error) throw new Error(error.message);
    return out;
  });

// ---------- ISSUE TICKETS ----------
const IssueInput = z.object({
  companyId: UUID,
  eventId: UUID,
  ticketTypeId: UUID,
  buyerName: z.string().min(2).max(200),
  buyerEmail: z.string().email().max(320),
  buyerPhone: z.string().max(40).optional(),
  buyerDoc: z.string().max(40).optional(),
  quantity: z.number().int().min(1).max(20).default(1),
  pricePaid: z.number().min(0).optional(),
  paymentReference: z.string().max(200).optional(),
});

function genCode(): string {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
function genToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export const issueTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IssueInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tt, error: ttErr } = await context.supabase
      .from("evt_ticket_types")
      .select("id,price,quantity,quantity_sold,per_person_limit,is_active,company_id,event_id")
      .eq("id", data.ticketTypeId).single();
    if (ttErr || !tt) throw new Error("Lote não encontrado");
    if (!tt.is_active) throw new Error("Lote inativo");
    if (data.quantity > tt.per_person_limit) {
      throw new Error(`Limite por pessoa é ${tt.per_person_limit}`);
    }
    if (tt.quantity_sold + data.quantity > tt.quantity) {
      throw new Error("Quantidade indisponível neste lote");
    }
    const rows = Array.from({ length: data.quantity }, () => ({
      company_id: data.companyId,
      event_id: data.eventId,
      ticket_type_id: data.ticketTypeId,
      code: genCode(),
      qr_token: genToken(),
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail.toLowerCase(),
      buyer_phone: data.buyerPhone ?? null,
      buyer_doc: data.buyerDoc ?? null,
      holder_name: data.buyerName,
      holder_email: data.buyerEmail.toLowerCase(),
      holder_phone: data.buyerPhone ?? null,
      price_paid: data.pricePaid ?? tt.price,
      payment_reference: data.paymentReference ?? null,
    }));
    const { data: inserted, error } = await context.supabase
      .from("evt_tickets").insert(rows).select("id,code,qr_token,holder_name,holder_email");
    if (error) throw new Error(error.message);
    await context.supabase
      .from("evt_ticket_types")
      .update({ quantity_sold: tt.quantity_sold + data.quantity })
      .eq("id", tt.id);
    return { tickets: inserted ?? [] };
  });

// ---------- TRANSFER ----------
export const transferTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ticketId: string; toName: string; toEmail: string; toPhone?: string; reason?: string;
  }) => ({
    ticketId: UUID.parse(d.ticketId),
    toName: z.string().min(2).max(200).parse(d.toName),
    toEmail: z.string().email().parse(d.toEmail),
    toPhone: d.toPhone,
    reason: d.reason,
  }))
  .handler(async ({ data, context }) => {
    const { data: out, error } = await context.supabase.rpc("evt_transfer_ticket" as never, {
      _ticket_id: data.ticketId,
      _to_name: data.toName,
      _to_email: data.toEmail,
      _to_phone: data.toPhone ?? null,
      _reason: data.reason ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return { transferId: out as unknown as string };
  });

// ---------- CHECK-IN POR QR ----------
export const checkInByQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { qrToken: string; gate?: string }) => ({
    qrToken: z.string().min(8).parse(d.qrToken),
    gate: d.gate,
  }))
  .handler(async ({ data, context }) => {
    const { data: out, error } = await context.supabase.rpc("evt_checkin_by_qr" as never, {
      _qr_token: data.qrToken,
      _gate: data.gate ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return out as Record<string, unknown>;
  });

// ---------- CANCEL TICKET ----------
export const cancelTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string }) => ({ ticketId: UUID.parse(d.ticketId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("evt_tickets")
      .update({ status: "cancelado", cancelled_at: new Date().toISOString() })
      .eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
