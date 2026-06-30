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

const listSchema = z.object({
  status: z.enum(['all', 'confirmed', 'pending', 'unsubscribed', 'bounced']).default('all'),
  search: z.string().max(200).optional().default(''),
  category: z.string().max(80).optional().default(''),
  min_severity: z.enum(['any', 'info', 'minor', 'major', 'critical']).default('any'),
  limit: z.number().int().min(1).max(500).default(100),
})

export const listStatusSubscribers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    let q = context.supabase
      .from('core_status_subscribers')
      .select(
        'id,email,source,confirmed_at,unsubscribed_at,bounced_at,last_notified_at,created_at,min_severity,categories',
      )
      .order('created_at', { ascending: false })
      .limit(data.limit)

    if (data.status === 'confirmed')
      q = q.not('confirmed_at', 'is', null).is('unsubscribed_at', null).is('bounced_at', null)
    else if (data.status === 'pending')
      q = q.is('confirmed_at', null).is('unsubscribed_at', null).is('bounced_at', null)
    else if (data.status === 'unsubscribed') q = q.not('unsubscribed_at', 'is', null)
    else if (data.status === 'bounced') q = q.not('bounced_at', 'is', null)

    if (data.search && data.search.trim()) {
      q = q.ilike('email', `%${data.search.trim()}%`)
    }

    if (data.category && data.category.trim()) {
      q = q.contains('categories', [data.category.trim()])
    }

    if (data.min_severity !== 'any') {
      q = q.eq('min_severity', data.min_severity)
    }

    const { data: items, error } = await q
    if (error) throw new Error(error.message)

    // Aggregate counts
    const { data: all } = await context.supabase
      .from('core_status_subscribers')
      .select('confirmed_at,unsubscribed_at,bounced_at')
      .limit(10000)
    const rows = (all ?? []) as Array<{
      confirmed_at: string | null
      unsubscribed_at: string | null
      bounced_at: string | null
    }>
    const counts = {
      total: rows.length,
      confirmed: rows.filter((r) => r.confirmed_at && !r.unsubscribed_at && !r.bounced_at).length,
      pending: rows.filter((r) => !r.confirmed_at && !r.unsubscribed_at && !r.bounced_at).length,
      unsubscribed: rows.filter((r) => r.unsubscribed_at).length,
      bounced: rows.filter((r) => r.bounced_at).length,
    }

    // Per-subscriber service filters (admin view)
    const ids = ((items ?? []) as Array<{ id: string }>).map((r) => r.id)
    const servicesBySub: Record<string, string[]> = {}
    if (ids.length > 0) {
      const { data: svcRows } = await context.supabase
        .from('core_status_subscriber_services')
        .select('subscriber_id,service_slug')
        .in('subscriber_id', ids)
      for (const r of ((svcRows ?? []) as Array<{ subscriber_id: string; service_slug: string }>)) {
        ;(servicesBySub[r.subscriber_id] ||= []).push(r.service_slug)
      }
    }
    const itemsWithSvcs = ((items ?? []) as Array<{ id: string }>).map((r) => ({
      ...r,
      services: servicesBySub[r.id] ?? [],
    }))

    return { items: itemsWithSvcs, counts }
  })

export const listStatusServiceBreakdown = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)

    const [{ data: targets }, { data: filters }, { data: activeSubs }] = await Promise.all([
      context.supabase
        .from('uptime_state')
        .select('public_slug,label,show_on_public,sort_order')
        .not('public_slug', 'is', null)
        .order('sort_order', { ascending: true }),
      context.supabase
        .from('core_status_subscriber_services')
        .select('subscriber_id,service_slug')
        .limit(50000),
      context.supabase
        .from('core_status_subscribers')
        .select('id')
        .not('confirmed_at', 'is', null)
        .is('unsubscribed_at', null)
        .is('bounced_at', null)
        .limit(50000),
    ])

    const activeIds = new Set(((activeSubs ?? []) as Array<{ id: string }>).map((r) => r.id))
    const filtersBySub: Record<string, Set<string>> = {}
    for (const r of ((filters ?? []) as Array<{ subscriber_id: string; service_slug: string }>)) {
      if (!activeIds.has(r.subscriber_id)) continue
      ;(filtersBySub[r.subscriber_id] ||= new Set()).add(r.service_slug)
    }

    const subsWithFilter = Object.keys(filtersBySub).length
    const subsAllServices = activeIds.size - subsWithFilter

    const breakdown = ((targets ?? []) as Array<{ public_slug: string; label: string | null; show_on_public: boolean }>).map((t) => {
      const explicit = Object.values(filtersBySub).reduce(
        (n, set) => n + (set.has(t.public_slug) ? 1 : 0),
        0,
      )
      return {
        slug: t.public_slug,
        label: t.label ?? t.public_slug,
        show_on_public: !!t.show_on_public,
        explicit_subscribers: explicit,
        effective_subscribers: explicit + subsAllServices,
      }
    })

    return { breakdown, subsWithFilter, subsAllServices, activeSubscribers: activeIds.size }
  })

export const listStatusCategories = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data } = await context.supabase
      .from('uptime_state')
      .select('category')
      .not('category', 'is', null)
      .limit(2000)
    const set = new Set<string>()
    for (const r of ((data ?? []) as Array<{ category: string | null }>)) {
      if (r.category) set.add(r.category)
    }
    return { categories: Array.from(set).sort() }
  })


export const listStatusDispatchLog = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ subscriber_id: z.string().uuid().optional(), limit: z.number().int().min(1).max(500).default(100) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    let q = context.supabase
      .from('core_status_dispatch_log')
      .select('id,subscriber_id,incident_id,event_kind,reference_key,delivered_at,error,created_at')
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (data.subscriber_id) q = q.eq('subscriber_id', data.subscriber_id)
    const { data: items, error } = await q
    if (error) throw new Error(error.message)
    return { items: items ?? [] }
  })

export const forceUnsubscribeStatusSubscriber = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('core_status_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const setStatusSubscriberSeverity = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        min_severity: z.enum(['info', 'minor', 'major', 'critical']),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('core_status_subscribers')
      .update({ min_severity: data.min_severity })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const setStatusSubscriberCategories = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        categories: z.array(z.string().min(1).max(80)).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const cleaned = Array.from(
      new Set(
        data.categories
          .map((c) => c.trim())
          .filter((c) => /^[\w\s\-./&+]{1,80}$/.test(c)),
      ),
    )
    const { error } = await context.supabase
      .from('core_status_subscribers')
      .update({ categories: cleaned.length > 0 ? cleaned : null })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true, categories: cleaned }
  })

export const resendStatusConfirmation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: sub, error: subErr } = await supabaseAdmin
      .from('core_status_subscribers')
      .select('id,email,confirm_token,confirmed_at,unsubscribed_at')
      .eq('id', data.id)
      .single()
    if (subErr || !sub) throw new Error(subErr?.message || 'Not found')
    if (sub.confirmed_at) throw new Error('Inscrição já confirmada')
    if (sub.unsubscribed_at) throw new Error('Inscrição cancelada')

    const SITE = 'https://impulsionando.com.br'
    const confirmUrl = `${SITE}/api/public/status-confirm?token=${sub.confirm_token}`

    const { error: insErr } = await supabaseAdmin.from('message_outbox').insert({
      channel: 'email',
      status: 'queued',
      to_address: sub.email,
      subject: 'Confirme sua inscrição no Status Impulsionando',
      body: `Olá,\n\nReenviamos o link de confirmação da sua inscrição:\n${confirmUrl}\n\nSe você não solicitou, ignore este email.`,
      tags: { topic: 'status_subscriber_confirm_resend', subscriber_id: sub.id },
    } as any)
    if (insErr) throw new Error(insErr.message)

    return { ok: true }
  })

const broadcastSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(8000),
  tag: z.string().min(3).max(80).default('manual_broadcast'),
})

export const broadcastStatusAnnouncement = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => broadcastSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: subs, error } = await supabaseAdmin
      .from('core_status_subscribers')
      .select('id,email,unsubscribe_token')
      .not('confirmed_at', 'is', null)
      .is('unsubscribed_at', null)
      .is('bounced_at', null)
      .limit(10000)
    if (error) throw new Error(error.message)
    const list = (subs ?? []) as Array<{ id: string; email: string; unsubscribe_token: string }>
    if (list.length === 0) return { enqueued: 0, skipped: 0 }

    const SITE = 'https://impulsionando.com.br'
    const refKey = `${data.tag}:${new Date().toISOString().slice(0, 16)}`

    // Skip dedupe: check existing dispatches with same reference_key
    const { data: existing } = await supabaseAdmin
      .from('core_status_dispatch_log')
      .select('subscriber_id')
      .eq('reference_key', refKey)
      .limit(10000)
    const sent = new Set(((existing ?? []) as Array<{ subscriber_id: string }>).map((r) => r.subscriber_id))

    const toSend = list.filter((s) => !sent.has(s.id))
    if (toSend.length === 0) return { enqueued: 0, skipped: list.length }

    const outboxRows = toSend.map((s) => ({
      channel: 'email',
      status: 'queued',
      to_address: s.email,
      subject: data.subject,
      body: `${data.body}\n\n—\nPreferências: ${SITE}/api/public/status-preferences?token=${s.unsubscribe_token}\nCancelar inscrição: ${SITE}/api/public/status-unsubscribe?token=${s.unsubscribe_token}`,
      tags: { topic: data.tag, subscriber_id: s.id },
    }))
    const logRows = toSend.map((s) => ({
      subscriber_id: s.id,
      incident_id: null,
      event_kind: 'broadcast',
      reference_key: refKey,
      delivered_at: new Date().toISOString(),
    }))

    const { error: outErr } = await supabaseAdmin.from('message_outbox').insert(outboxRows as any)
    if (outErr) throw new Error(outErr.message)
    const { error: logErr } = await supabaseAdmin.from('core_status_dispatch_log').insert(logRows as any)
    if (logErr) throw new Error(logErr.message)

    return { enqueued: toSend.length, skipped: list.length - toSend.length }
  })

const testEmailSchema = z.object({
  to: z.string().email().max(320),
  kind: z.enum(['incident_opened', 'incident_resolved', 'maintenance_scheduled', 'broadcast']).default('incident_opened'),
  severity: z.enum(['info', 'minor', 'major', 'critical']).default('minor'),
})

export const sendStatusTestEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => testEmailSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const SITE = 'https://impulsionando.com.br'
    const labels: Record<string, { subject: string; body: string }> = {
      incident_opened: {
        subject: `[TESTE • ${data.severity.toUpperCase()}] Novo incidente aberto`,
        body: `Este é um email de TESTE enviado pelo painel administrativo.\n\nSimulação: incidente aberto com severidade "${data.severity}".\n\nNenhum inscrito real recebeu esta mensagem.`,
      },
      incident_resolved: {
        subject: '[TESTE] Incidente resolvido',
        body: 'Email de TESTE: simulação de incidente resolvido. Nenhum inscrito real recebeu esta mensagem.',
      },
      maintenance_scheduled: {
        subject: '[TESTE] Manutenção programada',
        body: 'Email de TESTE: simulação de manutenção programada. Nenhum inscrito real recebeu esta mensagem.',
      },
      broadcast: {
        subject: '[TESTE] Broadcast manual',
        body: 'Email de TESTE: pré-visualização de broadcast manual. Nenhum inscrito real recebeu esta mensagem.',
      },
    }
    const tpl = labels[data.kind]

    const { error } = await supabaseAdmin.from('message_outbox').insert({
      channel: 'email',
      status: 'queued',
      to_address: data.to.trim().toLowerCase(),
      subject: tpl.subject,
      body: `${tpl.body}\n\n—\nStatus page: ${SITE}/status\nEnviado em: ${new Date().toISOString()}`,
      tags: { topic: 'status_test_email', kind: data.kind, severity: data.severity, requested_by: context.userId },
    } as any)
    if (error) throw new Error(error.message)
    return { ok: true, to: data.to.trim().toLowerCase(), kind: data.kind, severity: data.severity }
  })
