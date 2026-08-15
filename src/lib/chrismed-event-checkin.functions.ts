import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const CheckinInput = z.object({ event_id: z.string().uuid(), qr_token: z.string().uuid() });

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
