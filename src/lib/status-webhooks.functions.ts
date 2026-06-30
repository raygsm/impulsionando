import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  })
  if (!data) throw new Error('Forbidden')
}

export const listStatusWebhooks = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('core_status_webhooks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return { items: data ?? [] }
  })

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(2).max(120),
  url: z.string().url().max(500),
  kind: z.enum(['slack', 'discord', 'generic']),
  secret: z.string().max(200).optional().nullable(),
  notify_incidents: z.boolean().default(true),
  notify_maintenance: z.boolean().default(true),
  services: z.array(z.string().max(80)).default([]),
  categories: z.array(z.string().max(80)).default([]),
  min_severity: z.enum(['info', 'minor', 'major', 'critical']).default('info'),
  max_retries: z.number().int().min(0).max(10).default(3),
  active: z.boolean().default(true),
  auto_disable_protected: z.boolean().default(false),
})


export const upsertStatusWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const payload = {
      label: data.label,
      url: data.url,
      kind: data.kind,
      secret: data.secret || null,
      notify_incidents: data.notify_incidents,
      notify_maintenance: data.notify_maintenance,
      services: data.services,
      categories: data.categories,
      min_severity: data.min_severity,
      max_retries: data.max_retries,
      active: data.active,
      auto_disable_protected: data.auto_disable_protected,

      updated_at: new Date().toISOString(),
    }
    if (data.id) {
      const { error } = await context.supabase
        .from('core_status_webhooks')
        .update(payload)
        .eq('id', data.id)
      if (error) throw new Error(error.message)
      return { ok: true, id: data.id }
    }
    const { data: row, error } = await context.supabase
      .from('core_status_webhooks')
      .insert({ ...payload, created_by: context.userId })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, id: (row as any).id }
  })

export const deleteStatusWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('core_status_webhooks')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const listStatusWebhookDispatches = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ webhook_id: z.string().uuid(), limit: z.number().int().min(1).max(200).default(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: items, error } = await context.supabase
      .from('core_status_webhook_dispatches')
      .select('*')
      .eq('webhook_id', data.webhook_id)
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (error) throw new Error(error.message)
    return { items: items ?? [] }
  })

export const triggerStatusWebhooksTick = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const res = await fetch(
      'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/status-webhooks',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    )
    return { ok: res.ok, status: res.status }
  })

export const testStatusWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { createHmac } = await import('crypto')

    const { data: hook, error } = await supabaseAdmin
      .from('core_status_webhooks')
      .select('id,label,url,kind,secret')
      .eq('id', data.id)
      .single()
    if (error || !hook) throw new Error(error?.message ?? 'Webhook não encontrado')

    const nowIso = new Date().toISOString()
    const ev = {
      reference_key: `test:${Date.now()}`,
      event_kind: 'test_ping' as const,
      category: 'incident' as const,
      service_slug: null as string | null,
      title: `[TESTE] Ping de Status — ${hook.label}`,
      text: `Disparo manual enviado por ${context.userId} em ${nowIso}.`,
      url: 'https://impulsionando.com.br/status',
      severity: 'info',
    }

    let body: unknown
    if (hook.kind === 'slack') {
      body = { text: `*${ev.title}*\n${ev.text}\n${ev.url}` }
    } else if (hook.kind === 'discord') {
      body = { content: `**${ev.title}**\n${ev.text}\n${ev.url}` }
    } else {
      body = { ...ev, sent_at: nowIso }
    }
    const json = JSON.stringify(body)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (hook.secret && hook.kind === 'generic') {
      headers['X-Impulsionando-Signature'] = createHmac('sha256', hook.secret)
        .update(json)
        .digest('hex')
    }

    let status = 0
    let ok = false
    let err: string | null = null
    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body: json })
      status = res.status
      ok = res.ok
      if (!ok) err = (await res.text()).slice(0, 500)
    } catch (e) {
      err = e instanceof Error ? e.message.slice(0, 500) : 'unknown error'
    }

    await supabaseAdmin.from('core_status_webhook_dispatches').insert({
      webhook_id: hook.id,
      reference_key: ev.reference_key,
      event_kind: ev.event_kind,
      status_code: status || null,
      ok,
      error: err,
    })
    await supabaseAdmin
      .from('core_status_webhooks')
      .update({
        last_dispatch_at: nowIso,
        last_status_code: status || null,
        last_error: ok ? null : err,
      })
      .eq('id', hook.id)

    return { ok, status, error: err }
  })

export const redispatchStatusWebhookEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ dispatch_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { createHmac } = await import('crypto')

    const { data: disp, error: dErr } = await supabaseAdmin
      .from('core_status_webhook_dispatches')
      .select('id,webhook_id,reference_key,event_kind')
      .eq('id', data.dispatch_id)
      .single()
    if (dErr || !disp) throw new Error(dErr?.message ?? 'Disparo não encontrado')

    const { data: hook, error: hErr } = await supabaseAdmin
      .from('core_status_webhooks')
      .select('id,label,url,kind,secret,active')
      .eq('id', disp.webhook_id)
      .single()
    if (hErr || !hook) throw new Error(hErr?.message ?? 'Webhook não encontrado')
    if (!hook.active) throw new Error('Webhook está inativo.')

    const nowIso = new Date().toISOString()
    const ev = {
      reference_key: disp.reference_key,
      event_kind: disp.event_kind,
      title: `[REENVIO] ${disp.event_kind} — ${hook.label}`,
      text: `Reenvio manual do disparo ${disp.id} (referência ${disp.reference_key}) por ${context.userId} em ${nowIso}.`,
      url: 'https://impulsionando.com.br/status',
      replay: true as const,
    }

    let body: unknown
    if (hook.kind === 'slack') body = { text: `*${ev.title}*\n${ev.text}\n${ev.url}` }
    else if (hook.kind === 'discord') body = { content: `**${ev.title}**\n${ev.text}\n${ev.url}` }
    else body = { ...ev, sent_at: nowIso }

    const json = JSON.stringify(body)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (hook.secret && hook.kind === 'generic') {
      headers['X-Impulsionando-Signature'] = createHmac('sha256', hook.secret)
        .update(json)
        .digest('hex')
      headers['X-Impulsionando-Replay'] = '1'
    }

    let status = 0
    let ok = false
    let err: string | null = null
    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body: json })
      status = res.status
      ok = res.ok
      if (!ok) err = (await res.text()).slice(0, 500)
    } catch (e) {
      err = e instanceof Error ? e.message.slice(0, 500) : 'unknown error'
    }

    await supabaseAdmin.from('core_status_webhook_dispatches').insert({
      webhook_id: hook.id,
      reference_key: `${disp.reference_key}:replay:${Date.now()}`,
      event_kind: disp.event_kind,
      status_code: status || null,
      ok,
      error: err,
    })
    await supabaseAdmin
      .from('core_status_webhooks')
      .update({
        last_dispatch_at: nowIso,
        last_status_code: status || null,
        last_error: ok ? null : err,
      })
      .eq('id', hook.id)

    return { ok, status, error: err }
  })

export const redispatchFailedStatusWebhookDispatches = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        webhook_id: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { createHmac } = await import('crypto')

    const { data: hook, error: hErr } = await supabaseAdmin
      .from('core_status_webhooks')
      .select('id,label,url,kind,secret,active')
      .eq('id', data.webhook_id)
      .single()
    if (hErr || !hook) throw new Error(hErr?.message ?? 'Webhook não encontrado')
    if (!hook.active) throw new Error('Webhook está inativo.')

    const { data: failed, error: fErr } = await supabaseAdmin
      .from('core_status_webhook_dispatches')
      .select('id,reference_key,event_kind')
      .eq('webhook_id', data.webhook_id)
      .eq('ok', false)
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (fErr) throw new Error(fErr.message)

    let okCount = 0
    let failCount = 0
    let lastStatus = 0
    let lastError: string | null = null

    for (const disp of failed ?? []) {
      const nowIso = new Date().toISOString()
      const ev = {
        reference_key: disp.reference_key,
        event_kind: disp.event_kind,
        title: `[REENVIO EM LOTE] ${disp.event_kind} — ${hook.label}`,
        text: `Reenvio em lote de ${disp.id} (referência ${disp.reference_key}) por ${context.userId} em ${nowIso}.`,
        url: 'https://impulsionando.com.br/status',
        replay: true as const,
      }
      let body: unknown
      if (hook.kind === 'slack') body = { text: `*${ev.title}*\n${ev.text}\n${ev.url}` }
      else if (hook.kind === 'discord') body = { content: `**${ev.title}**\n${ev.text}\n${ev.url}` }
      else body = { ...ev, sent_at: nowIso }

      const json = JSON.stringify(body)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (hook.secret && hook.kind === 'generic') {
        headers['X-Impulsionando-Signature'] = createHmac('sha256', hook.secret)
          .update(json)
          .digest('hex')
        headers['X-Impulsionando-Replay'] = 'bulk'
      }

      let status = 0
      let ok = false
      let err: string | null = null
      try {
        const res = await fetch(hook.url, { method: 'POST', headers, body: json })
        status = res.status
        ok = res.ok
        if (!ok) err = (await res.text()).slice(0, 500)
      } catch (e) {
        err = e instanceof Error ? e.message.slice(0, 500) : 'unknown error'
      }
      lastStatus = status
      lastError = ok ? null : err
      if (ok) okCount++
      else failCount++

      await supabaseAdmin.from('core_status_webhook_dispatches').insert({
        webhook_id: hook.id,
        reference_key: `${disp.reference_key}:replay-bulk:${Date.now()}`,
        event_kind: disp.event_kind,
        status_code: status || null,
        ok,
        error: err,
      })
    }

    if ((failed ?? []).length > 0) {
      await supabaseAdmin
        .from('core_status_webhooks')
        .update({
          last_dispatch_at: new Date().toISOString(),
          last_status_code: lastStatus || null,
          last_error: lastError,
        })
        .eq('id', hook.id)
    }

    return { ok: failCount === 0, total: (failed ?? []).length, okCount, failCount }
  })

export const listPendingStatusWebhookRetries = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ limit: z.number().int().min(1).max(200).default(100) })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: items, error } = await context.supabase
      .from('core_status_webhook_dispatches')
      .select('id,webhook_id,reference_key,event_kind,retry_count,next_retry_at,status_code,error,created_at')
      .not('next_retry_at', 'is', null)
      .order('next_retry_at', { ascending: true })
      .limit(data.limit)
    if (error) throw new Error(error.message)

    const ids = Array.from(new Set((items ?? []).map((r: any) => r.webhook_id)))
    let labels: Record<string, string> = {}
    if (ids.length) {
      const { data: hooks } = await context.supabase
        .from('core_status_webhooks')
        .select('id,label')
        .in('id', ids)
      labels = Object.fromEntries((hooks ?? []).map((h: any) => [h.id, h.label]))
    }
    return {
      items: (items ?? []).map((r: any) => ({ ...r, webhook_label: labels[r.webhook_id] ?? '—' })),
    }
  })

export const cancelStatusWebhookRetry = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ dispatch_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('core_status_webhook_dispatches')
      .update({ next_retry_at: null })
      .eq('id', data.dispatch_id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const cancelAllStatusWebhookRetries = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ webhook_id: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    let q = supabaseAdmin
      .from('core_status_webhook_dispatches')
      .update({ next_retry_at: null }, { count: 'exact' })
      .not('next_retry_at', 'is', null)
    if (data.webhook_id) q = q.eq('webhook_id', data.webhook_id)
    const { error, count } = await q
    if (error) throw new Error(error.message)
    return { ok: true, cancelled: count ?? 0 }
  })

export const getStatusWebhooksHealth = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ hours: z.number().int().min(1).max(168).default(24) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const since = new Date(Date.now() - data.hours * 3600_000).toISOString()
    const { data: rows, error } = await context.supabase
      .from('core_status_webhook_dispatches')
      .select('webhook_id,ok,retry_count,next_retry_at,created_at')
      .gte('created_at', since)
      .limit(5000)
    if (error) throw new Error(error.message)

    const map = new Map<
      string,
      { total: number; ok: number; fail: number; retries: number; pending: number; lastAt: string | null }
    >()
    for (const r of (rows ?? []) as any[]) {
      const cur = map.get(r.webhook_id) ?? { total: 0, ok: 0, fail: 0, retries: 0, pending: 0, lastAt: null }
      cur.total++
      if (r.ok) cur.ok++
      else cur.fail++
      if ((r.retry_count ?? 0) > 0) cur.retries++
      if (r.next_retry_at) cur.pending++
      if (!cur.lastAt || r.created_at > cur.lastAt) cur.lastAt = r.created_at
      map.set(r.webhook_id, cur)
    }
    const items = Array.from(map.entries()).map(([webhook_id, s]) => ({
      webhook_id,
      ...s,
      success_rate: s.total > 0 ? Math.round((s.ok / s.total) * 1000) / 10 : null,
    }))
    return { hours: data.hours, items }
  })

export const autoDisableUnhealthyStatusWebhooks = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        hours: z.number().int().min(1).max(168).default(24),
        min_total: z.number().int().min(1).max(1000).default(5),
        threshold: z.number().min(0).max(100).default(50),
        dry_run: z.boolean().default(false),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const since = new Date(Date.now() - data.hours * 3600_000).toISOString()
    const { data: rows, error } = await context.supabase
      .from('core_status_webhook_dispatches')
      .select('webhook_id,ok,created_at')
      .gte('created_at', since)
      .limit(10000)
    if (error) throw new Error(error.message)

    const stats = new Map<string, { total: number; ok: number }>()
    for (const r of (rows ?? []) as any[]) {
      const cur = stats.get(r.webhook_id) ?? { total: 0, ok: 0 }
      cur.total++
      if (r.ok) cur.ok++
      stats.set(r.webhook_id, cur)
    }

    const candidates: Array<{ webhook_id: string; total: number; ok: number; success_rate: number }> = []
    for (const [webhook_id, s] of stats.entries()) {
      if (s.total < data.min_total) continue
      const rate = (s.ok / s.total) * 100
      if (rate < data.threshold) candidates.push({ webhook_id, total: s.total, ok: s.ok, success_rate: Math.round(rate * 10) / 10 })
    }

    if (data.dry_run || candidates.length === 0) {
      return { ok: true, dry_run: data.dry_run, disabled: 0, candidates }
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const ids = candidates.map((c) => c.webhook_id)
    const { error: uErr } = await supabaseAdmin
      .from('core_status_webhooks')
      .update({
        active: false,
        last_error: `Auto-desativado: ${data.threshold}% mínimo, janela ${data.hours}h, usuário ${context.userId}`,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
    if (uErr) throw new Error(uErr.message)
    return { ok: true, dry_run: false, disabled: ids.length, candidates }
  })

export const listInactiveStatusWebhooks = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('core_status_webhooks')
      .select('id,label,url,kind,last_error,last_dispatch_at,last_status_code,updated_at')
      .eq('active', false)
      .order('updated_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return { items: data ?? [] }
  })

export const reactivateStatusWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('core_status_webhooks')
      .update({
        active: true,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const reactivateAllInactiveStatusWebhooks = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await supabaseAdmin
      .from('core_status_webhooks')
      .update({
        active: true,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('active', false)
      .select('id')
    if (error) throw new Error(error.message)
    return { ok: true, reactivated: (data ?? []).length }
  })

export const getStatusWebhookHealthHistory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        webhook_id: z.string().uuid(),
        hours: z.number().int().min(1).max(168).default(24),
        bucket_minutes: z.number().int().min(15).max(360).default(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const sinceMs = Date.now() - data.hours * 3600_000
    const since = new Date(sinceMs).toISOString()
    const { data: rows, error } = await context.supabase
      .from('core_status_webhook_dispatches')
      .select('ok,created_at')
      .eq('webhook_id', data.webhook_id)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(5000)
    if (error) throw new Error(error.message)

    const bucketMs = data.bucket_minutes * 60_000
    const totalBuckets = Math.ceil((data.hours * 3600_000) / bucketMs)
    const buckets: Array<{ ts: string; total: number; ok: number; fail: number; success_rate: number | null }> = []
    for (let i = 0; i < totalBuckets; i++) {
      const start = sinceMs + i * bucketMs
      buckets.push({ ts: new Date(start).toISOString(), total: 0, ok: 0, fail: 0, success_rate: null })
    }
    for (const r of (rows ?? []) as any[]) {
      const idx = Math.floor((new Date(r.created_at).getTime() - sinceMs) / bucketMs)
      if (idx < 0 || idx >= buckets.length) continue
      const b = buckets[idx]
      b.total++
      if (r.ok) b.ok++
      else b.fail++
    }
    for (const b of buckets) {
      b.success_rate = b.total > 0 ? Math.round((b.ok / b.total) * 1000) / 10 : null
    }
    return { hours: data.hours, bucket_minutes: data.bucket_minutes, buckets }
  })

// ---------------------------------------------------------------------------
// W92 — Auto-disable cron settings (read/write `core_settings`)
// ---------------------------------------------------------------------------

const AUTO_DISABLE_KEYS = [
  'status_webhook_auto_disable_enabled',
  'status_webhook_auto_disable_hours',
  'status_webhook_auto_disable_min_total',
  'status_webhook_auto_disable_threshold',
] as const

export const getStatusWebhookAutoDisableSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('core_settings')
      .select('key,value')
      .in('key', AUTO_DISABLE_KEYS as unknown as string[])
    if (error) throw new Error(error.message)
    const s = new Map<string, any>((data ?? []).map((r: any) => [r.key, r.value]))
    return {
      enabled: s.get('status_webhook_auto_disable_enabled') !== false,
      hours: Number(s.get('status_webhook_auto_disable_hours') ?? 24),
      min_total: Number(s.get('status_webhook_auto_disable_min_total') ?? 10),
      threshold: Number(s.get('status_webhook_auto_disable_threshold') ?? 50),
    }
  })

export const updateStatusWebhookAutoDisableSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        enabled: z.boolean(),
        hours: z.number().int().min(1).max(168),
        min_total: z.number().int().min(1).max(10000),
        threshold: z.number().min(0).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const rows = [
      { key: 'status_webhook_auto_disable_enabled', value: data.enabled, label: 'Auto-desativar webhooks degradados', category: 'status' },
      { key: 'status_webhook_auto_disable_hours', value: data.hours, label: 'Janela (h) para avaliação de saúde', category: 'status' },
      { key: 'status_webhook_auto_disable_min_total', value: data.min_total, label: 'Mín. de disparos para avaliar', category: 'status' },
      { key: 'status_webhook_auto_disable_threshold', value: data.threshold, label: '% mínimo de sucesso', category: 'status' },
    ].map((r) => ({ ...r, updated_by: context.userId, updated_at: new Date().toISOString() }))
    const { error } = await (supabaseAdmin as any)
      .from('core_settings')
      .upsert(rows, { onConflict: 'key' })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// W93 — recent auto-disable cron runs (from core_integration_logs)
export const listStatusWebhookAutoDisableRuns = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).default(20) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: rows, error } = await (supabaseAdmin as any)
      .from('core_integration_logs')
      .select('id,created_at,status,response,error')
      .eq('integration_slug', 'status-webhooks')
      .eq('event_type', 'auto_disable')
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (error) throw new Error(error.message)
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      status: r.status,
      error: r.error,
      hours: r.response?.hours ?? null,
      threshold: r.response?.threshold ?? null,
      min_total: r.response?.min_total ?? null,
      disabled: r.response?.disabled ?? 0,
      protected_skipped: r.response?.protected_skipped ?? 0,
      candidates: Array.isArray(r.response?.candidates) ? r.response.candidates : [],
      manual: r.response?.manual === true,
      by: r.response?.by ?? null,
      skipped: r.response?.skipped ?? null,
    }))
  })


// W94 — manual trigger of the auto-disable evaluation (admin "Run now")
export const runStatusWebhookAutoDisableNow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const settingKeys = [
      'status_webhook_auto_disable_enabled',
      'status_webhook_auto_disable_hours',
      'status_webhook_auto_disable_min_total',
      'status_webhook_auto_disable_threshold',
    ]
    const { data: settingsRows } = await (supabaseAdmin as any)
      .from('core_settings')
      .select('key,value')
      .in('key', settingKeys)
    const s = new Map<string, any>((settingsRows ?? []).map((r: any) => [r.key, r.value]))
    const enabled = s.get('status_webhook_auto_disable_enabled') !== false
    const hours = Number(s.get('status_webhook_auto_disable_hours') ?? 24)
    const minTotal = Number(s.get('status_webhook_auto_disable_min_total') ?? 10)
    const threshold = Number(s.get('status_webhook_auto_disable_threshold') ?? 50)

    if (!enabled) {
      await (supabaseAdmin as any).from('core_integration_logs').insert({
        integration_slug: 'status-webhooks',
        event_type: 'auto_disable',
        status: 'ok',
        response: { skipped: 'disabled', manual: true, by: context.userId, at: new Date().toISOString() },
      })
      return { ok: true, skipped: 'disabled' as const, disabled: 0, candidates: [] }
    }

    const since = new Date(Date.now() - hours * 3600_000).toISOString()
    const { data: rows, error } = await (supabaseAdmin as any)
      .from('core_status_webhook_dispatches')
      .select('webhook_id,ok')
      .gte('created_at', since)
      .limit(20000)
    if (error) throw new Error(error.message)

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
      const { data: active } = await (supabaseAdmin as any)
        .from('core_status_webhooks')
        .select('id,auto_disable_protected')
        .in('id', ids)
        .eq('active', true)
      const protectedIds = (active ?? []).filter((h: any) => h.auto_disable_protected).map((h: any) => h.id)
      const activeIds = (active ?? []).filter((h: any) => !h.auto_disable_protected).map((h: any) => h.id)
      protectedSkipped = protectedIds.length
      if (activeIds.length > 0) {
        await (supabaseAdmin as any)
          .from('core_status_webhooks')
          .update({
            active: false,
            last_error: `Auto-desativado (manual): <${threshold}% sucesso na janela ${hours}h`,
            updated_at: new Date().toISOString(),
          })
          .in('id', activeIds)
        disabled = activeIds.length
      }
    }

    await (supabaseAdmin as any).from('core_integration_logs').insert({
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
        manual: true,
        by: context.userId,
        at: new Date().toISOString(),
      },
    })

    return { ok: true, hours, threshold, minTotal, disabled, protectedSkipped, candidates }
  })


