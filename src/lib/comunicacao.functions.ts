import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

const listSchema = z.object({
  status: z.enum(['all', 'queued', 'sending', 'sent', 'failed', 'skipped', 'cancelled']).default('all'),
  channel: z.enum(['all', 'whatsapp', 'email', 'in_app']).default('all'),
  limit: z.number().int().min(1).max(200).default(100),
});

export const listOutbox = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from('message_outbox')
      .select('id, company_id, event_code, channel, status, recipient_email, recipient_phone, recipient_name, subject, attempts, max_attempts, scheduled_at, sent_at, last_error, created_at')
      .order('created_at', { ascending: false })
      .limit(data.limit);
    if (data.status !== 'all') q = q.eq('status', data.status);
    if (data.channel !== 'all') q = q.eq('channel', data.channel);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const resendOutbox = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('message_outbox')
      .update({ status: 'queued', attempts: 0, last_error: null, scheduled_at: new Date().toISOString() })
      .eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelOutbox = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('message_outbox')
      .update({ status: 'cancelled' })
      .eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
