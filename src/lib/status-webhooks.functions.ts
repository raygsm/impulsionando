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
  active: z.boolean().default(true),
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
      active: data.active,

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
