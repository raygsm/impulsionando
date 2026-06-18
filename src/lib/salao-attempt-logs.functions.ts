/**
 * Server fns para o painel do salão:
 *  - listAttemptLogs: filtros por nicho, canal, status, motivo, intervalo.
 *  - exportNotificationsCsv: CSV de notificações internas + pós-visita
 *    filtrado por nicho e intervalo de datas (download client-side).
 *  - simulatePostvisitWindow: dado bill_notified_at + nicho, devolve
 *    quando a pós-visita seria liberada (modo simulação no painel).
 *  - emitInternalEvent: webhook interno do CORE — registra um evento
 *    (notifyItemReady / pós-visita) na tabela attempt log, em tempo real.
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

const ListInput = z
  .object({
    company_id: z.string().uuid().optional(),
    niche: z.string().optional(),
    channel: z.string().optional(),
    status: z.string().optional(),
    reason: z.string().optional(),
    request_id: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  })
  .default({})

export const listAttemptLogs = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context
    let q = supabase
      .from('notification_attempt_log' as any)
      .select(
        'id, request_id, company_id, channel, event, niche, recipient, status, reason, idempotency_key, metadata, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(data.limit ?? 100)
    if (data.company_id) q = q.eq('company_id', data.company_id)
    if (data.niche) q = q.eq('niche', data.niche)
    if (data.channel) q = q.eq('channel', data.channel)
    if (data.status) q = q.eq('status', data.status)
    if (data.reason) q = q.eq('reason', data.reason)
    if (data.request_id) q = q.eq('request_id', data.request_id)
    if (data.from) q = q.gte('created_at', data.from)
    if (data.to) q = q.lte('created_at', data.to)
    const { data: rows, error } = await q
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

    // Internos (item pronto)
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

    // Pós-visita
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
