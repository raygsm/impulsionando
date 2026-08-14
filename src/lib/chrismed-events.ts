import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const RegistrationInput = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  website: z.string().max(0).optional(),
});

export type PublicChrismedEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  coverUrl: string | null;
  venueName: string | null;
  venueAddress: string | null;
  city: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  seatsRemaining: number;
  registrationOpen: boolean;
  isPast: boolean;
  contractorType: string | null;
  contractorName: string | null;
  eventKind: string | null;
};

export async function listPublicChrismedEvents() {
  const { data: events, error } = await supabase.rpc("chrismed_list_public_events" as never);
  if (error) throw new Error("Não foi possível carregar a agenda de eventos.");

  return ((events ?? []) as unknown as Array<Record<string, unknown>>).map((event) => {
    const seatsRemaining = Number(event.seats_remaining);
    const opensAt = event.registration_opens_at ? new Date(String(event.registration_opens_at)).getTime() : null;
    const closesAt = event.registration_closes_at ? new Date(String(event.registration_closes_at)).getTime() : null;
    const endsAt = new Date(String(event.ends_at)).getTime();
    const current = Date.now();
    const isPast = endsAt < current;
    return {
      id: String(event.id),
      slug: String(event.slug),
      title: String(event.title),
      summary: event.summary ? String(event.summary) : null,
      description: event.description ? String(event.description) : null,
      coverUrl: event.cover_url ? String(event.cover_url) : null,
      venueName: event.venue_name ? String(event.venue_name) : null,
      venueAddress: event.venue_address ? String(event.venue_address) : null,
      city: event.city ? String(event.city) : null,
      startsAt: String(event.starts_at),
      endsAt: String(event.ends_at),
      capacity: Number(event.capacity),
      seatsRemaining,
      contractorType: event.contractor_type ? String(event.contractor_type) : null,
      contractorName: event.contractor_name ? String(event.contractor_name) : null,
      eventKind: event.event_kind ? String(event.event_kind) : null,
      isPast,
      registrationOpen: !isPast && seatsRemaining > 0 && (opensAt === null || current >= opensAt) && (closesAt === null || current <= closesAt),
    } satisfies PublicChrismedEvent;
  });
}

export async function registerForChrismedEvent(input: unknown) {
  const data = RegistrationInput.parse(input);
  if (data.website) throw new Error("Solicitação inválida.");
  const { data: result, error } = await supabase.rpc("chrismed_register_event" as never, {
    p_event_id: data.eventId,
    p_attendee_name: data.name,
    p_attendee_email: data.email,
    p_attendee_phone: data.phone || null,
    p_quantity: 1,
    p_consent_version: "events-v2",
  } as never);
  if (error) {
    const known = ["Já existe uma solicitação ativa", "Evento indisponível", "Evento lotado", "Inscrições ainda não abertas", "Inscrições encerradas"];
    const message = known.find((item) => error.message.includes(item));
    throw new Error(message ?? "Não foi possível enviar sua solicitação. Tente novamente.");
  }
  const row = ((result ?? []) as unknown as Array<{ registration_id: string; registration_code: string; registration_status: "pending_approval" }>)[0];
  if (!row) throw new Error("A solicitação não retornou protocolo.");
  return { id: row.registration_id, code: row.registration_code, status: row.registration_status };
}

export async function acceptChrismedEventInvitation(token: string) {
  const parsed = z.string().uuid().parse(token);
  const { data, error } = await supabase.rpc("chrismed_accept_event_invitation" as never, { p_token: parsed } as never);
  if (error) throw new Error(error.message || "Não foi possível aceitar o convite.");
  const row = ((data ?? []) as unknown as Array<{ registration_id: string; registration_code: string; registration_status: string }>)[0];
  if (!row) throw new Error("O convite não retornou confirmação.");
  return row;
}

export async function getChrismedEventCredential(token: string) {
  const parsed = z.string().uuid().parse(token);
  const { data, error } = await supabase.rpc("chrismed_get_event_credential" as never, { p_token: parsed } as never);
  if (error) throw new Error("Credencial indisponível.");
  const row = ((data ?? []) as unknown as Array<Record<string, unknown>>)[0];
  if (!row) throw new Error("Credencial inválida ou participação ainda não confirmada.");
  return {
    registrationId: String(row.registration_id),
    registrationCode: String(row.registration_code),
    attendeeName: String(row.attendee_name),
    attendeeEmail: String(row.attendee_email),
    eventId: String(row.event_id),
    eventTitle: String(row.event_title),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    venueName: row.venue_name ? String(row.venue_name) : null,
    venueAddress: row.venue_address ? String(row.venue_address) : null,
    city: row.city ? String(row.city) : null,
    qrToken: String(row.qr_token),
  };
}
