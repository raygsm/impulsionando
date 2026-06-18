/**
 * Server fns para o painel do salão:
 *  - listAttemptLogs: filtros + paginação + ordenação + busca textual rápida.
 *  - getAttemptLogDetails: detalhe completo de um request_id (sequência + payload).
 *  - exportNotificationsCsv: CSV (internos + pós-visita) filtrado por nicho/data.
 *  - simulatePostvisitWindow: janela liberada por nicho (modo simulação).
 *  - emitInternalEvent: webhook interno do CORE.
 *  - getRetentionSettings/setRetentionSettings: retenção configurável do log.
 */
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'
import {
  earliestPostvisitMoment,
  listNicheRegistry,
  postVisitDelayHours,
  REGISTRY_VERSION,
} from '@/lib/postvisit-timing-registry'

const SortField = z.enum(['created_at', 'status', 'channel', 'event', 'niche'])

const ListInput = z
  .object({
    company_id: z.string().uuid().optional(),
    niche: z.string().optional(),
    channel: z.string().optional(),
    status: z.string().optional(),
    reason: z.string().optional(),
    request_id: z.string().optional(),
    q: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(10).max(200).optional().default(50),
    sortBy: SortField.optional().default('created_at'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .default({} as any)

export const listAttemptLogs = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context
    const page = data.page ?? 1
    const pageSize = data.pageSize ?? 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let q = supabase
      .from('notification_attempt_log' as any)
      .select(
        'id, request_id, company_id, channel, event, niche, recipient, status, reason, idempotency_key, metadata, created_at',
        { count: 'exact' },
      )
      .order(data.sortBy ?? 'created_at', { ascending: (data.sortDir ?? 'desc') === 'asc' })
      .range(from, to)

    if (data.company_id) q = q.eq('company_id', data.company_id)
    if (data.niche) q = q.eq('niche', data.niche)
    if (data.channel) q = q.eq('channel', data.channel)
    if (data.status) q = q.eq('status', data.status)
    if (data.reason) q = q.eq('reason', data.reason)
    if (data.request_id) q = q.eq('request_id', data.request_id)
    if (data.from) q = q.gte('created_at', data.from)
    if (data.to) q = q.lte('created_at', data.to)
    if (data.q && data.q.trim()) {
      const term = data.q.trim().replace(/[%,]/g, '')
      q = q.or(
        `event.ilike.%${term}%,recipient.ilike.%${term}%,reason.ilike.%${term}%,request_id.ilike.%${term}%,idempotency_key.ilike.%${term}%`,
      )
    }

    const { data: rows, error, count } = await q
    if (error) throw new Error(error.message)
    return {
      rows: (rows ?? []) as any[],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    }
  })

const DetailsInput = z.object({ request_id: z.string().min(1) })

export const getAttemptLogDetails = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DetailsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context
    const { data: rows, error } = await supabase
      .from('notification_attempt_log' as any)
      .select(
        'id, request_id, company_id, channel, event, niche, recipient, status, reason, idempotency_key, metadata, created_at',
      )
      .eq('request_id', data.request_id)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return { rows: (rows ?? []) as any[] }
  })

const ExportInput = z.object({
  company_id: z.string().uuid().optional(),
  niche: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

function csvEscape(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export const exportNotificationsCsv = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ExportInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context

    let iq = supabase
      .from('sales_order_items')
      .select(
        'id, description, quantity, kitchen_status, notified_ready_at, company_id, order:order_id ( id, session:restaurant_table_sessions ( customer_name, table:table_id ( number ) ) )',
      )
      .not('notified_ready_at', 'is', null)
      .order('notified_ready_at', { ascending: false })
      .limit(2000)
    if (data.company_id) iq = iq.eq('company_id', data.company_id)
    if (data.from) iq = iq.gte('notified_ready_at', data.from)
    if (data.to) iq = iq.lte('notified_ready_at', data.to)
    const { data: items } = await iq

    let pq = supabase
      .from('restaurant_table_sessions')
      .select(
        'id, customer_name, customer_email, postvisit_notified_at, bill_notified_at, company_id, table:table_id ( number ), company:company_id ( niche_slug )',
      )
      .not('postvisit_notified_at', 'is', null)
      .order('postvisit_notified_at', { ascending: false })
      .limit(2000)
    if (data.company_id) pq = pq.eq('company_id', data.company_id)
    if (data.from) pq = pq.gte('postvisit_notified_at', data.from)
    if (data.to) pq = pq.lte('postvisit_notified_at', data.to)
    const { data: postvisits } = await pq

    const header = [
      'kind',
      'timestamp',
      'company_id',
      'niche',
      'table_number',
      'customer',
      'description_or_email',
      'idempotency_key',
      'status',
    ]
    const lines: string[] = [header.join(',')]

    for (const r of (items ?? []) as any[]) {
      const niche = r.company?.niche_slug ?? ''
      if (data.niche && niche && niche !== data.niche) continue
      lines.push(
        [
          'item_ready',
          r.notified_ready_at,
          r.company_id ?? '',
          niche,
          r.order?.session?.[0]?.table?.number ?? '',
          r.order?.session?.[0]?.customer_name ?? '',
          `${r.quantity}× ${r.description}`,
          `item-ready:${r.id}`,
          r.kitchen_status ?? '',
        ]
          .map(csvEscape)
          .join(','),
      )
    }
    for (const s of (postvisits ?? []) as any[]) {
      const niche = s.company?.niche_slug ?? ''
      if (data.niche && niche !== data.niche) continue
      lines.push(
        [
          'postvisit',
          s.postvisit_notified_at,
          s.company_id ?? '',
          niche,
          s.table?.number ?? '',
          s.customer_name ?? '',
          s.customer_email ?? '',
          `postvisit:${s.id}`,
          'sent',
        ]
          .map(csvEscape)
          .join(','),
      )
    }

    return {
      filename: `notificacoes-salao-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: lines.join('\n'),
      count: lines.length - 1,
    }
  })

const SimInput = z.object({
  bill_closed_at: z.string(),
  niche: z.string().optional(),
})

export const simulatePostvisitWindow = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SimInput.parse(d))
  .handler(async ({ data }) => {
    const earliest = earliestPostvisitMoment(data.bill_closed_at, data.niche)
    return {
      registryVersion: REGISTRY_VERSION,
      niche: data.niche ?? null,
      delayHours: postVisitDelayHours(data.niche),
      earliestAt: earliest.toISOString(),
      now: new Date().toISOString(),
      releasedNow: Date.now() >= earliest.getTime(),
      registry: listNicheRegistry(),
    }
  })

const InternalEventInput = z.object({
  source: z.enum(['notifyItemReady', 'postvisit', 'manual']),
  company_id: z.string().uuid().optional(),
  niche: z.string().optional(),
  request_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
})

export const emitInternalEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InternalEventInput.parse(d))
  .handler(async ({ data }) => {
    const { logNotificationAttempt } = await import('@/lib/notification-attempt-log.server')
    await logNotificationAttempt({
      request_id: data.request_id ?? null,
      company_id: data.company_id ?? null,
      channel: 'internal',
      event: data.source,
      niche: data.niche ?? null,
      status: 'sent',
      reason: null,
      idempotency_key: data.idempotency_key ?? null,
      metadata: data.payload ?? {},
    })
    return { ok: true }
  })

// ----- Retenção configurável -----

export const getRetentionSettings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context
    const { data } = await supabase
      .from('core_settings' as any)
      .select('value, updated_at')
      .eq('key', 'notification_log_retention_days')
      .maybeSingle()
    const raw = (data as any)?.value
    const days = typeof raw === 'number' ? raw : Number(raw) || 90
    return { days, updated_at: (data as any)?.updated_at ?? null }
  })

const SetRetentionInput = z.object({ days: z.number().int().min(7).max(365) })

export const setRetentionSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetRetentionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const { error } = await supabase
      .from('core_settings' as any)
      .update({ value: data.days, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('key', 'notification_log_retention_days')
    if (error) throw new Error(error.message)
    return { ok: true, days: data.days }
  })
