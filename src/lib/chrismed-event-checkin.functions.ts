import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const CheckinInput = z.object({ event_id: z.string().uuid(), qr_token: z.string().uuid() });

async function isChrismedManager(context: any) {
  const metadata = (context.claims?.app_metadata ?? {}) as Record<string, unknown>;
  if (metadata.is_super_admin === true || metadata.platform_role === 'super_admin' || metadata.is_impulsionando_staff === true) return true;
  const { data } = await context.supabase.from('user_roles').select('role').eq('user_id', context.userId).eq('company_id', CHRISMED_COMPANY_ID).in('role', ['admin', 'gestor']).limit(1).maybeSingle();
  return !!data;
}

export const listChrismedCheckinEvents = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const manager = await isChrismedManager(context);
    let eventIds: string[] | null = null;
    if (!manager) {
      const { data: memberships, error } = await context.supabase.from('chrismed_event_contractor_users').select('event_id').eq('user_id', context.userId);
      if (error) throw new Error('Não foi possível validar seu acesso aos eventos.');
      eventIds = (memberships ?? []).map((row: any) => row.event_id);
      if (!eventIds.length) return [];
    }
    let query = supabaseAdmin.from('chrismed_events').select('id,title,starts_at,ends_at,status,venue_name,city,contractor_name').in('status', ['published', 'finished']).order('starts_at', { ascending: false });
    if (eventIds) query = query.in('id', eventIds);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const checkinChrismedEventQr = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckinInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc('chrismed_checkin_event_qr', {
      p_event_id: data.event_id,
      p_qr_token: data.qr_token,
    });
    if (error) {
      const known = ['Credencial inválida', 'Check-in já realizado', 'Acesso não autorizado', 'Evento indisponível'];
      throw new Error(known.find((message) => error.message.includes(message)) ?? 'Não foi possível confirmar a presença.');
    }
    const row = Array.isArray(result) ? result[0] : result;
    if (!row) throw new Error('O check-in não retornou confirmação.');
    return row as Record<string, unknown>;
  });
