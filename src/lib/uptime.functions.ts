import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

export const getUptimeOverview = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context

    const { data: staff } = await supabaseAdmin.rpc('is_impulsionando_staff', { _user: userId })
    if (!staff) {
      throw new Error('Forbidden: staff only')
    }

    const { data: state } = await supabaseAdmin
      .from('uptime_state')
      .select('url, label, paused, show_on_public, sort_order, is_up, since, last_check_at, last_alert_at, consecutive_failures, last_error, alert_emails, alert_whatsapps, alert_after_seconds')
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

async function assertStaff(userId: string) {
  const { data: staff } = await supabaseAdmin.rpc('is_impulsionando_staff', { _user: userId })
  if (!staff) throw new Error('Forbidden: staff only')
}

function parseList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean)
  if (typeof v === 'string')
    return v
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  return []
}

export const upsertUptimeTarget = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    url: string
    original_url?: string | null
    alert_emails?: string[] | string
    alert_whatsapps?: string[] | string
    alert_after_seconds?: number | null
  }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId)
    const url = data.url?.trim()
    if (!url || !/^https?:\/\//i.test(url)) throw new Error('URL inválida (http/https obrigatório)')

    const payload = {
      url,
      alert_emails: parseList(data.alert_emails),
      alert_whatsapps: parseList(data.alert_whatsapps),
      alert_after_seconds: data.alert_after_seconds ?? undefined,
    }


    const original = data.original_url?.trim()
    if (original && original !== url) {
      const { error } = await supabaseAdmin
        .from('uptime_state')
        .update(payload)
        .eq('url', original)
      if (error) throw error
      return { ok: true, url }
    }

    const { data: existing } = await supabaseAdmin
      .from('uptime_state')
      .select('url')
      .eq('url', url)
      .maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin.from('uptime_state').update(payload).eq('url', url)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin.from('uptime_state').insert({
        ...payload,
        is_up: true,
        since: new Date().toISOString(),
        consecutive_failures: 0,
      })
      if (error) throw error
    }
    return { ok: true, url }
  })

export const deleteUptimeTarget = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId)
    const { error } = await supabaseAdmin.from('uptime_state').delete().eq('url', data.url)
    if (error) throw error
    return { ok: true }
  })

