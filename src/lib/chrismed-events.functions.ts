import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const RegistrationInput = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  quantity: z.number().int().min(1).max(6),
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
  priceCents: number;
  registrationOpen: boolean;
};

export const listPublicChrismedEvents = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const now = new Date().toISOString();
  const [{ data: events, error }, { data: registrations, error: registrationsError }] = await Promise.all([
    supabaseAdmin
      .from('chrismed_events' as never)
      .select('id,slug,title,summary,description,cover_url,venue_name,venue_address,city,starts_at,ends_at,registration_opens_at,registration_closes_at,capacity,price_cents,status' as never)
      .eq('status' as never, 'published' as never)
      .gte('ends_at' as never, now as never)
      .order('starts_at' as never, { ascending: true }),
    supabaseAdmin
      .from('chrismed_event_registrations' as never)
      .select('event_id,quantity' as never)
      .eq('status' as never, 'confirmed' as never),
  ]);
  if (error) throw new Error('Não foi possível carregar a agenda de eventos.');
  if (registrationsError) throw new Error('Não foi possível calcular a disponibilidade dos eventos.');

  const reserved = new Map<string, number>();
  for (const row of (registrations ?? []) as unknown as Array<{ event_id: string; quantity: number }>) {
    reserved.set(row.event_id, (reserved.get(row.event_id) ?? 0) + Number(row.quantity));
  }

  return ((events ?? []) as unknown as Array<Record<string, unknown>>).map((event) => {
    const capacity = Number(event.capacity);
    const seatsRemaining = Math.max(0, capacity - (reserved.get(String(event.id)) ?? 0));
    const opensAt = event.registration_opens_at ? new Date(String(event.registration_opens_at)).getTime() : null;
    const closesAt = event.registration_closes_at ? new Date(String(event.registration_closes_at)).getTime() : null;
    const current = Date.now();
    return {
      id: String(event.id), slug: String(event.slug), title: String(event.title),
      summary: event.summary ? String(event.summary) : null,
      description: event.description ? String(event.description) : null,
      coverUrl: event.cover_url ? String(event.cover_url) : null,
      venueName: event.venue_name ? String(event.venue_name) : null,
      venueAddress: event.venue_address ? String(event.venue_address) : null,
      city: event.city ? String(event.city) : null,
      startsAt: String(event.starts_at), endsAt: String(event.ends_at), capacity,
      seatsRemaining, priceCents: Number(event.price_cents),
      registrationOpen: (opensAt === null || current >= opensAt) && (closesAt === null || current <= closesAt),
    } satisfies PublicChrismedEvent;
  });
});

export const registerForChrismedEvent = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => RegistrationInput.parse(input))
  .handler(async ({ data }) => {
    if (data.website) throw new Error('Solicitação inválida.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: result, error } = await supabaseAdmin.rpc('chrismed_register_event' as never, {
      p_event_id: data.eventId,
      p_attendee_name: data.name,
      p_attendee_email: data.email,
      p_attendee_phone: data.phone || null,
      p_quantity: data.quantity,
      p_consent_version: 'events-v1',
    } as never);
    if (error) {
      const known = ['Já existe uma inscrição ativa', 'Evento indisponível', 'Inscrições ainda não abertas', 'Inscrições encerradas'];
      const message = known.find((item) => error.message.includes(item));
      throw new Error(message ?? 'Não foi possível concluir a inscrição. Tente novamente.');
    }
    const row = ((result ?? []) as unknown as Array<{
      registration_id: string; registration_code: string; registration_status: 'confirmed' | 'waitlisted';
    }>)[0];
    if (!row) throw new Error('A inscrição não retornou confirmação.');
    return { id: row.registration_id, code: row.registration_code, status: row.registration_status };
  });
