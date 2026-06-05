import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

export const getUptimeOverview = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context

    const { data: staff } = await supabaseAdmin.rpc('is_impulsionando_staff', { _user_id: userId })
    if (!staff) {
      throw new Error('Forbidden: staff only')
    }

    const { data: state } = await supabaseAdmin
      .from('uptime_state')
      .select('url, is_up, since, last_check_at, last_alert_at, consecutive_failures, last_error, alert_emails')
      .order('url')

    const { data: recent } = await supabaseAdmin
      .from('uptime_checks')
      .select('url, is_up, http_status, response_ms, error_message, checked_at')
      .order('checked_at', { ascending: false })
      .limit(100)

    // Compute 24h uptime % per URL
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: last24 } = await supabaseAdmin
      .from('uptime_checks')
      .select('url, is_up')
      .gte('checked_at', since24h)

    const uptime24h: Record<string, { total: number; up: number; pct: number }> = {}
    for (const row of last24 ?? []) {
      const k = row.url as string
      uptime24h[k] = uptime24h[k] ?? { total: 0, up: 0, pct: 100 }
      uptime24h[k].total += 1
      if (row.is_up) uptime24h[k].up += 1
    }
    for (const k of Object.keys(uptime24h)) {
      const s = uptime24h[k]
      s.pct = s.total === 0 ? 100 : Math.round((s.up / s.total) * 10000) / 100
    }

    return { state: state ?? [], recent: recent ?? [], uptime24h }
  })
