import { createFileRoute } from '@tanstack/react-router'

/**
 * Cron tick (daily): syncs bounces from `suppressed_emails` into
 * `core_status_subscribers.bounced_at` and purges stale pending
 * inscriptions (>14 days without confirmation).
 */
export const Route = createFileRoute('/api/public/hooks/status-subscribers-maintenance')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // 1) Mark bounced subscribers
        const { data: suppressed } = await supabaseAdmin
          .from('suppressed_emails')
          .select('email')
          .limit(10000)
        const emails = Array.from(
          new Set(((suppressed ?? []) as Array<{ email: string }>).map((r) => r.email.toLowerCase())),
        )
        let bouncedCount = 0
        if (emails.length > 0) {
          const { data: toMark } = await supabaseAdmin
            .from('core_status_subscribers')
            .select('id,email')
            .in('email', emails)
            .is('bounced_at', null)
            .limit(10000)
          const ids = ((toMark ?? []) as Array<{ id: string }>).map((r) => r.id)
          if (ids.length > 0) {
            const { error } = await supabaseAdmin
              .from('core_status_subscribers')
              .update({ bounced_at: new Date().toISOString() })
              .in('id', ids)
            if (!error) bouncedCount = ids.length
          }
        }

        // 2) Purge stale pending (>14d unconfirmed)
        const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        const { data: stale } = await supabaseAdmin
          .from('core_status_subscribers')
          .select('id')
          .is('confirmed_at', null)
          .is('unsubscribed_at', null)
          .is('bounced_at', null)
          .lt('created_at', cutoff)
          .limit(5000)
        const staleIds = ((stale ?? []) as Array<{ id: string }>).map((r) => r.id)
        let purgedCount = 0
        if (staleIds.length > 0) {
          const { error } = await supabaseAdmin
            .from('core_status_subscribers')
            .delete()
            .in('id', staleIds)
          if (!error) purgedCount = staleIds.length
        }

        return Response.json({
          ok: true,
          bounced: bouncedCount,
          purged_pending: purgedCount,
          at: new Date().toISOString(),
        })
      },
    },
  },
})
