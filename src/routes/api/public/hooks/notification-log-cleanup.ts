/**
 * Job de limpeza do notification_attempt_log.
 *
 * Lê a retenção (em dias) de core_settings.notification_log_retention_days
 * (default 90) e remove registros mais antigos. Idempotente.
 *
 * Disparado por pg_cron diariamente. Endpoint público / bypass auth — protegido
 * pela apikey (anon) padrão do Lovable Cloud.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/notification-log-cleanup')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const { data: setting } = await supabaseAdmin
          .from('core_settings' as any)
          .select('value')
          .eq('key', 'notification_log_retention_days')
          .maybeSingle()

        const raw = (setting as any)?.value
        const days = typeof raw === 'number' ? raw : Number(raw) || 90
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        const { data, error } = await supabaseAdmin
          .from('notification_attempt_log' as any)
          .delete()
          .lt('created_at', cutoff)
          .select('id')

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(
          JSON.stringify({
            ok: true,
            retention_days: days,
            cutoff,
            deleted: data?.length ?? 0,
            ran_at: new Date().toISOString(),
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
