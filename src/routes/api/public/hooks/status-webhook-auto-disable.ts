import { createFileRoute } from '@tanstack/react-router'

/**
 * Cron (recommended: hourly): auto-disables status webhooks whose success
 * rate dropped below the configured threshold in the last `hours` window,
 * provided at least `min_total` dispatches occurred.
 *
 * Settings live in `core_settings` under keys:
 *   - status_webhook_auto_disable_enabled (bool, default true)
 *   - status_webhook_auto_disable_hours (int, default 24)
 *   - status_webhook_auto_disable_min_total (int, default 10)
 *   - status_webhook_auto_disable_threshold (number, default 50)
 *
 * Each run logs to `core_integration_logs` with provider='status-webhooks'
 * and event='auto_disable'.
 */
export const Route = createFileRoute('/api/public/hooks/status-webhook-auto-disable')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const settingKeys = [
          'status_webhook_auto_disable_enabled',
          'status_webhook_auto_disable_hours',
          'status_webhook_auto_disable_min_total',
          'status_webhook_auto_disable_threshold',
        ]
        const { data: settingsRows } = await supabaseAdmin
          .from('core_settings')
          .select('key,value')
          .in('key', settingKeys)
        const s = new Map<string, any>((settingsRows ?? []).map((r: any) => [r.key, r.value]))
        const enabled = s.get('status_webhook_auto_disable_enabled') !== false
        const hours = Number(s.get('status_webhook_auto_disable_hours') ?? 24)
        const minTotal = Number(s.get('status_webhook_auto_disable_min_total') ?? 10)
        const threshold = Number(s.get('status_webhook_auto_disable_threshold') ?? 50)

        if (!enabled) {
          return new Response(JSON.stringify({ ok: true, skipped: 'disabled' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const since = new Date(Date.now() - hours * 3600_000).toISOString()
        const { data: rows, error } = await supabaseAdmin
          .from('core_status_webhook_dispatches')
          .select('webhook_id,ok')
          .gte('created_at', since)
          .limit(20000)
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const stats = new Map<string, { total: number; ok: number }>()
        for (const r of (rows ?? []) as any[]) {
          const cur = stats.get(r.webhook_id) ?? { total: 0, ok: 0 }
          cur.total++
          if (r.ok) cur.ok++
          stats.set(r.webhook_id, cur)
        }

        const candidates: Array<{ webhook_id: string; total: number; ok: number; success_rate: number }> = []
        for (const [webhook_id, st] of stats.entries()) {
          if (st.total < minTotal) continue
          const rate = (st.ok / st.total) * 100
          if (rate < threshold) {
            candidates.push({ webhook_id, total: st.total, ok: st.ok, success_rate: Math.round(rate * 10) / 10 })
          }
        }

        let disabled = 0
        let protectedSkipped = 0
        if (candidates.length > 0) {
          const ids = candidates.map((c) => c.webhook_id)
          const { data: active } = await supabaseAdmin
            .from('core_status_webhooks')
            .select('id,label,auto_disable_protected')
            .in('id', ids)
            .eq('active', true)
          const protectedIds = (active ?? []).filter((h: any) => h.auto_disable_protected).map((h: any) => h.id)
          const activeIds = (active ?? []).filter((h: any) => !h.auto_disable_protected).map((h: any) => h.id)
          protectedSkipped = protectedIds.length
          if (activeIds.length > 0) {
            await supabaseAdmin
              .from('core_status_webhooks')
              .update({
                active: false,
                last_error: `Auto-desativado (cron): <${threshold}% sucesso na janela ${hours}h`,
                updated_at: new Date().toISOString(),
              })
              .in('id', activeIds)
            disabled = activeIds.length
          }
        }

        await supabaseAdmin.from('core_integration_logs').insert({
          integration_slug: 'status-webhooks',
          event_type: 'auto_disable',
          status: 'ok',
          response: {
            hours,
            min_total: minTotal,
            threshold,
            candidates,
            disabled,
            protected_skipped: protectedSkipped,
            at: new Date().toISOString(),
          },
        })

        return new Response(
          JSON.stringify({ ok: true, hours, threshold, minTotal, disabled, protectedSkipped, candidates }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
