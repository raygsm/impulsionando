import { createFileRoute } from '@tanstack/react-router';

/**
 * Cron: processa fila CRM (crm_touch_queue) — toques agendados pendentes vencidos.
 * Para cada toque: cria notificação in-app para o assignee, ou enfileira no message_outbox
 * (email/whatsapp), marca status='sent' (ou 'failed' em erro).
 */
export const Route = createFileRoute('/api/public/cron/crm-touch-dispatch')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const sb = supabaseAdmin;

        const { data: due, error } = await sb
          .from('crm_touch_queue')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_for', new Date().toISOString())
          .limit(200);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        let processed = 0;
        let failed = 0;
        for (const t of due ?? []) {
          try {
            const payload: any = t.payload ?? {};
            if (t.channel === 'inapp' || t.channel === 'task') {
              if (t.assignee_user_id) {
                await sb.from('notifications').insert({
                  user_id: t.assignee_user_id,
                  company_id: t.company_id,
                  title: payload.template || 'Tarefa de relacionamento',
                  message: `Toque CRM: ${t.rule_code}`,
                  category: 'crm',
                  action_url: t.quote_id ? `/admin/pedidos/${t.quote_id}` : t.lead_id ? `/admin/crm/leads/${t.lead_id}` : null,
                } as any);
              }
            } else {
              await sb.from('message_outbox').insert({
                company_id: t.company_id,
                channel: t.channel,
                event_code: payload.template ?? t.rule_code ?? 'crm_touch',
                body: `Toque CRM: ${t.rule_code}`,
                payload: payload,
                status: 'pending',
              } as any);
            }
            await sb.from('crm_touch_queue').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', t.id);
            processed++;
          } catch (e: any) {
            await sb.from('crm_touch_queue').update({ status: 'failed', error: e.message }).eq('id', t.id);
            failed++;
          }
        }
        return Response.json({ ok: true, processed, failed });
      },
    },
  },
});
