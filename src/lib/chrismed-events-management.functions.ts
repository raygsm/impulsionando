import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

async function assertChrismedManager(context: any) {
  const metadata = (context.claims?.app_metadata ?? {}) as Record<string, unknown>;
  if (
    metadata.is_super_admin === true ||
    metadata.platform_role === 'super_admin' ||
    metadata.is_impulsionando_staff === true
  ) return;

  const { data, error } = await context.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.userId)
    .eq('company_id', CHRISMED_COMPANY_ID)
    .in('role', ['admin', 'gestor'])
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error('Forbidden: CHRISMED management access required');
}

const EventInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(6000).nullable().optional(),
  cover_url: z.string().trim().url().max(2000).nullable().optional(),
  venue_name: z.string().trim().max(200).nullable().optional(),
  venue_address: z.string().trim().max(400).nullable().optional(),
  city: z.string().trim().max(120).default('Rio de Janeiro'),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  registration_opens_at: z.string().datetime().nullable().optional(),
  registration_closes_at: z.string().datetime().nullable().optional(),
  capacity: z.number().int().min(1).max(100000),
  price_cents: z.number().int().min(0).max(100000000),
  status: z.enum(['draft', 'published', 'cancelled', 'finished']).default('draft'),
  organizer_name: z.string().trim().min(2).max(180).default('CHRISMED'),
}).superRefine((value, ctx) => {
  if (new Date(value.ends_at) <= new Date(value.starts_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ends_at'], message: 'O término deve ser posterior ao início.' });
  }
  if (value.registration_opens_at && value.registration_closes_at && new Date(value.registration_closes_at) <= new Date(value.registration_opens_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registration_closes_at'], message: 'O encerramento das inscrições deve ser posterior à abertura.' });
  }
});

export const listChrismedEventsManagement = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertChrismedManager(context);
    const { data, error } = await supabaseAdmin
      .from('chrismed_events')
      .select('id,slug,title,summary,description,cover_url,venue_name,venue_address,city,starts_at,ends_at,registration_opens_at,registration_closes_at,capacity,price_cents,status,organizer_name,created_at,updated_at')
      .order('starts_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveChrismedEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EventInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertChrismedManager(context);
    const payload = {
      slug: data.slug,
      title: data.title,
      summary: data.summary || null,
      description: data.description || null,
      cover_url: data.cover_url || null,
      venue_name: data.venue_name || null,
      venue_address: data.venue_address || null,
      city: data.city,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      registration_opens_at: data.registration_opens_at || null,
      registration_closes_at: data.registration_closes_at || null,
      capacity: data.capacity,
      price_cents: data.price_cents,
      status: data.status,
      organizer_name: data.organizer_name,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from('chrismed_events')
        .update(payload)
        .eq('id', data.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    const { data: row, error } = await supabaseAdmin
      .from('chrismed_events')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setChrismedEventStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(['draft', 'published', 'cancelled', 'finished']),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertChrismedManager(context);
    const { data: row, error } = await supabaseAdmin
      .from('chrismed_events')
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq('id', data.id)
      .select('id,slug,title,status,updated_at')
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteChrismedEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertChrismedManager(context);

    const { count, error: countError } = await supabaseAdmin
      .from('chrismed_event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', data.id)
      .neq('status', 'cancelled');
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) {
      throw new Error('Este evento possui inscrições ativas. Cancele as inscrições ou altere o status do evento em vez de excluí-lo.');
    }

    const { error } = await supabaseAdmin.from('chrismed_events').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listChrismedEventRegistrationsManagement = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ event_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertChrismedManager(context);
    const { data: rows, error } = await supabaseAdmin
      .from('chrismed_event_registrations')
      .select('id,event_id,registration_code,attendee_name,attendee_email,attendee_phone,quantity,status,source,created_at,cancelled_at')
      .eq('event_id', data.event_id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
