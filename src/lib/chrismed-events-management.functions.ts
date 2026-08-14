import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

async function assertChrismedManager(context: any) {
  const metadata = (context.claims?.app_metadata ?? {}) as Record<string, unknown>;
  if (metadata.is_super_admin === true || metadata.platform_role === 'super_admin' || metadata.is_impulsionando_staff === true) return;
  const { data, error } = await context.supabase.from('user_roles').select('role').eq('user_id', context.userId).eq('company_id', CHRISMED_COMPANY_ID).in('role', ['admin', 'gestor']).limit(1).maybeSingle();
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
  status: z.enum(['draft', 'published', 'cancelled', 'finished']).default('draft'),
  organizer_name: z.string().trim().min(2).max(180).default('CHRISMED'),
  contractor_type: z.string().trim().max(120).nullable().optional(),
  contractor_name: z.string().trim().max(220).nullable().optional(),
  event_kind: z.string().trim().max(160).nullable().optional(),
}).superRefine((value, ctx) => {
  if (new Date(value.ends_at) <= new Date(value.starts_at)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ends_at'], message: 'O término deve ser posterior ao início.' });
  if (value.registration_opens_at && value.registration_closes_at && new Date(value.registration_closes_at) <= new Date(value.registration_opens_at)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registration_closes_at'], message: 'O encerramento das inscrições deve ser posterior à abertura.' });
});

export const listChrismedEventsManagement = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await assertChrismedManager(context);
  const { data, error } = await supabaseAdmin.from('chrismed_events').select('id,slug,title,summary,description,cover_url,venue_name,venue_address,city,starts_at,ends_at,registration_opens_at,registration_closes_at,capacity,price_cents,status,organizer_name,contractor_type,contractor_name,event_kind,created_at,updated_at').order('starts_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const saveChrismedEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => EventInput.parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const payload = { slug: data.slug, title: data.title, summary: data.summary || null, description: data.description || null, cover_url: data.cover_url || null, venue_name: data.venue_name || null, venue_address: data.venue_address || null, city: data.city, starts_at: data.starts_at, ends_at: data.ends_at, registration_opens_at: data.registration_opens_at || null, registration_closes_at: data.registration_closes_at || null, capacity: data.capacity, price_cents: 0, status: data.status, organizer_name: data.organizer_name, contractor_type: data.contractor_type || null, contractor_name: data.contractor_name || null, event_kind: data.event_kind || null, updated_at: new Date().toISOString() };
  if (data.id) {
    const { data: row, error } = await supabaseAdmin.from('chrismed_events').update(payload).eq('id', data.id).select('*').single();
    if (error) throw new Error(error.message);
    return row;
  }
  const { data: row, error } = await supabaseAdmin.from('chrismed_events').insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  return row;
});

export const setChrismedEventStatus = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['draft', 'published', 'cancelled', 'finished']) }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const { data: row, error } = await supabaseAdmin.from('chrismed_events').update({ status: data.status, updated_at: new Date().toISOString() }).eq('id', data.id).select('id,slug,title,status,updated_at').single();
  if (error) throw new Error(error.message);
  return row;
});

export const deleteChrismedEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const { count, error: countError } = await supabaseAdmin.from('chrismed_event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', data.id).in('status', ['pending_approval', 'confirmed']);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) throw new Error('Este evento possui solicitações ou presenças ativas. Cancele ou trate os participantes antes de excluir.');
  const { error } = await supabaseAdmin.from('chrismed_events').delete().eq('id', data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const listChrismedEventRegistrationsManagement = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ event_id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  await supabaseAdmin.from('chrismed_event_registrations').update({ status: 'expired' }).eq('event_id', data.event_id).eq('status', 'pending_approval').lte('approval_expires_at', new Date().toISOString());
  const { data: rows, error } = await supabaseAdmin.from('chrismed_event_registrations').select('id,event_id,registration_code,attendee_name,attendee_email,attendee_phone,quantity,status,source,approval_expires_at,approved_at,rejected_at,qr_token,qr_issued_at,created_at,cancelled_at').eq('event_id', data.event_id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return rows ?? [];
});

export const decideChrismedEventRegistration = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ registration_id: z.string().uuid(), decision: z.enum(['approve', 'reject']) }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const { data: current, error: currentError } = await supabaseAdmin.from('chrismed_event_registrations').select('id,event_id,status,approval_expires_at').eq('id', data.registration_id).single();
  if (currentError) throw new Error(currentError.message);
  if (current.status !== 'pending_approval') throw new Error('Esta solicitação não está mais pendente de aprovação.');
  if (!current.approval_expires_at || new Date(current.approval_expires_at).getTime() <= Date.now()) {
    await supabaseAdmin.from('chrismed_event_registrations').update({ status: 'expired' }).eq('id', current.id);
    throw new Error('O bloqueio de 90 minutos expirou e a vaga já foi liberada.');
  }
  const next = data.decision === 'approve' ? { status: 'confirmed', approved_at: new Date().toISOString(), approved_by: context.userId, rejected_at: null } : { status: 'rejected', rejected_at: new Date().toISOString(), approved_at: null, approved_by: context.userId };
  const { data: row, error } = await supabaseAdmin.from('chrismed_event_registrations').update(next).eq('id', current.id).select('id,event_id,status,registration_code,attendee_name,attendee_email,qr_token,approved_at,rejected_at').single();
  if (error) throw new Error(error.message);
  return row;
});

export const createChrismedEventInvitation = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ event_id: z.string().uuid(), invitee_name: z.string().trim().min(2).max(160), invitee_email: z.string().trim().email().max(320), invitee_phone: z.string().trim().max(40).nullable().optional(), expires_at: z.string().datetime().nullable().optional() }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const { data: event, error: eventError } = await supabaseAdmin.from('chrismed_events').select('id,status,ends_at,title').eq('id', data.event_id).single();
  if (eventError) throw new Error(eventError.message);
  if (event.status !== 'published' || new Date(event.ends_at).getTime() <= Date.now()) throw new Error('Só é possível convidar para evento publicado e futuro.');
  const { data: row, error } = await supabaseAdmin.from('chrismed_event_invitations').insert({ event_id: data.event_id, invitee_name: data.invitee_name, invitee_email: data.invitee_email.toLowerCase(), invitee_phone: data.invitee_phone || null, expires_at: data.expires_at || null, created_by: context.userId }).select('id,event_id,invitee_name,invitee_email,invitee_phone,token,status,expires_at,created_at').single();
  if (error) throw new Error(error.message);
  return row;
});

export const listChrismedEventInvitations = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ event_id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const { data: rows, error } = await supabaseAdmin.from('chrismed_event_invitations').select('id,event_id,invitee_name,invitee_email,invitee_phone,token,status,expires_at,accepted_at,declined_at,created_at').eq('event_id', data.event_id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return rows ?? [];
});

export const getChrismedEventAttendanceReport = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ event_id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  await assertChrismedManager(context);
  const [{ data: event, error: eventError }, { data: regs, error: regsError }, { data: checkins, error: checkError }] = await Promise.all([
    supabaseAdmin.from('chrismed_events').select('id,title,starts_at,ends_at,capacity,contractor_name,contractor_type,event_kind,venue_name,venue_address').eq('id', data.event_id).single(),
    supabaseAdmin.from('chrismed_event_registrations').select('id,attendee_name,attendee_email,status,source,registration_code,qr_token,created_at,approved_at').eq('event_id', data.event_id),
    supabaseAdmin.from('chrismed_event_checkins').select('id,registration_id,checked_in_at,checked_in_by,source').eq('event_id', data.event_id).order('checked_in_at', { ascending: true }),
  ]);
  if (eventError || regsError || checkError) throw new Error(eventError?.message ?? regsError?.message ?? checkError?.message ?? 'Falha ao gerar relatório.');
  const confirmed = (regs ?? []).filter((r: any) => r.status === 'confirmed');
  const presentIds = new Set((checkins ?? []).map((c: any) => c.registration_id));
  return { event, totals: { registrations: (regs ?? []).length, confirmed: confirmed.length, present: presentIds.size, absent: Math.max(confirmed.length - presentIds.size, 0), attendance_rate: confirmed.length ? Math.round((presentIds.size / confirmed.length) * 1000) / 10 : 0 }, registrations: (regs ?? []).map((r: any) => ({ ...r, checked_in: presentIds.has(r.id), checkin: (checkins ?? []).find((c: any) => c.registration_id === r.id) ?? null })) };
});
