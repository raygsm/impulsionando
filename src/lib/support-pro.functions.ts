// Suporte Inteligente — server functions de operação, métricas e IA.
// Camada superior ao support-tickets.functions.ts; reservada a operadores/staff.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const STATUSES = [
  'new','received','in_review','waiting_customer','waiting_core',
  'waiting_third_party','in_development','resolved','closed','reopened','cancelled',
] as const

/** Inbox operador: lista paginada com filtros, contagens por status e SLA breach. */
export const operatorInbox = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    status?: typeof STATUSES[number] | 'all'
    priority?: 'low'|'medium'|'high'|'critical' | 'all'
    assigned_to_me?: boolean
    search?: string
    limit?: number
    company_id?: string
  }) => z.object({
    status: z.enum([...STATUSES, 'all']).optional(),
    priority: z.enum(['low','medium','high','critical','all']).optional(),
    assigned_to_me: z.boolean().optional(),
    search: z.string().max(200).optional(),
    limit: z.number().min(1).max(200).optional(),
    company_id: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    let q = supabase
      .from('support_tickets')
      .select('id, protocol, subject, type, priority, status, origin, requester_email, requester_name, assigned_to, sla_due_at, first_response_at, resolved_at, reopened_count, ai_topic, tags, created_at, updated_at, last_message_at, company_id, crm_lead_id, crm_opportunity_id')
      .order('created_at', { ascending: false })
      .limit(data.limit ?? 100)

    if (data.status && data.status !== 'all') q = q.eq('status', data.status)
    if (data.priority && data.priority !== 'all') q = q.eq('priority', data.priority)
    if (data.assigned_to_me) q = q.eq('assigned_to', userId)
    if (data.company_id) q = q.eq('company_id', data.company_id)
    if (data.search) {
      const s = data.search.replace(/%/g, '')
      q = q.or(`subject.ilike.%${s}%,protocol.ilike.%${s}%,requester_email.ilike.%${s}%`)
    }
    const { data: rows, error } = await q
    if (error) throw error

    const now = Date.now()
    const tickets = (rows ?? []).map((t) => ({
      ...t,
      sla_status:
        t.resolved_at ? 'ok' :
        t.sla_due_at && new Date(t.sla_due_at).getTime() < now ? 'breach' :
        t.sla_due_at && new Date(t.sla_due_at).getTime() - now < 2 * 3600_000 ? 'risk' : 'ok',
    }))

    // Contagens por status no escopo atual
    const byStatus: Record<string, number> = {}
    for (const s of STATUSES) byStatus[s] = 0
    for (const t of tickets) byStatus[t.status] = (byStatus[t.status] ?? 0) + 1

    return { tickets, byStatus }
  })

/** Métricas: TTFR (time to first response), TTR (time to resolution), CSAT, backlog. */
export const supportMetrics = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; days?: number }) =>
    z.object({
      company_id: z.string().uuid().optional(),
      days: z.number().min(1).max(365).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - (data.days ?? 30) * 86400_000).toISOString()
    let q = context.supabase
      .from('support_tickets')
      .select('id, status, created_at, first_response_at, resolved_at, rating, reopened_count, ai_topic, priority')
      .gte('created_at', since)
    if (data.company_id) q = q.eq('company_id', data.company_id)
    const { data: rows, error } = await q
    if (error) throw error
    const tickets = rows ?? []

    const ttfrSamples = tickets.filter((t) => t.first_response_at)
      .map((t) => new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime())
    const ttrSamples = tickets.filter((t) => t.resolved_at)
      .map((t) => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
    const avg = (xs: number[]) => xs.length ? Math.round(xs.reduce((a,b) => a+b, 0) / xs.length / 60000) : null
    const ratings = tickets.filter((t) => typeof t.rating === 'number').map((t) => t.rating as number)

    const backlog = tickets.filter((t) => !['resolved','closed','cancelled'].includes(t.status)).length
    const reopened = tickets.filter((t) => (t.reopened_count ?? 0) > 0).length

    // Top topics
    const topicCounts: Record<string, number> = {}
    for (const t of tickets) if (t.ai_topic) topicCounts[t.ai_topic] = (topicCounts[t.ai_topic] ?? 0) + 1
    const totalWithTopic = Object.values(topicCounts).reduce((a,b)=>a+b,0) || 1
    const topics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count, percentage: +(count * 100 / totalWithTopic).toFixed(1) }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 10)

    return {
      window_days: data.days ?? 30,
      total: tickets.length,
      backlog,
      reopened,
      ttfr_minutes_avg: avg(ttfrSamples),
      ttr_minutes_avg: avg(ttrSamples),
      csat_avg: ratings.length ? +(ratings.reduce((a,b)=>a+b,0) / ratings.length).toFixed(2) : null,
      csat_count: ratings.length,
      topics,
    }
  })

/** Atribui ticket a um operador. */
export const assignTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string; assigned_to: string | null }) =>
    z.object({
      ticket_id: z.string().uuid(),
      assigned_to: z.string().uuid().nullable(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('support_tickets')
      .update({ assigned_to: data.assigned_to })
      .eq('id', data.ticket_id)
    if (error) throw error
    return { ok: true }
  })

/** Reabre ticket via RPC (mesmo protocolo). */
export const reopenTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string; reason?: string }) =>
    z.object({ ticket_id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .rpc('support_reopen_ticket', { _ticket_id: data.ticket_id, _reason: data.reason ?? null })
    if (error) throw error
    return row
  })

/** Dispara follow-up por WhatsApp/Email via message_outbox. */
export const sendFollowUp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ticket_id: string
    channel: 'whatsapp' | 'email'
    body: string
    to?: string
  }) => z.object({
    ticket_id: z.string().uuid(),
    channel: z.enum(['whatsapp','email']),
    body: z.string().min(3).max(4000),
    to: z.string().max(200).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: t, error: tErr } = await context.supabase
      .from('support_tickets')
      .select('id, protocol, requester_email, requester_name, company_id, subject')
      .eq('id', data.ticket_id).single()
    if (tErr) throw tErr

    const to = data.to ?? t.requester_email
    if (!to) throw new Error('Destinatário não disponível para este ticket.')

    const { error } = await context.supabase.from('message_outbox').insert({
      company_id: t.company_id,
      channel: data.channel,
      to_address: to,
      subject: data.channel === 'email' ? `[${t.protocol}] ${t.subject}` : null,
      body: data.body,
      template_key: `support_followup_${data.channel}`,
      metadata: { ticket_id: t.id, protocol: t.protocol },
      status: 'queued',
    })
    if (error) throw error

    await context.supabase.from('support_ticket_events').insert({
      ticket_id: t.id,
      actor_user_id: context.userId,
      event_type: 'followup_sent',
      to_value: data.channel,
      metadata: { to, length: data.body.length },
    })
    return { ok: true }
  })

/** IA: resume e categoriza tickets sem ai_topic (últimos 30d). Roda no cron. */
export const summarizeRecentTickets = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; limit?: number }) =>
    z.object({ company_id: z.string().uuid().optional(), limit: z.number().min(1).max(50).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY
    if (!key) return { ok: false, error: 'LOVABLE_API_KEY ausente', processed: 0 }

    let q = context.supabase
      .from('support_tickets')
      .select('id, subject, description, type, company_id')
      .is('ai_topic', null)
      .gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(data.limit ?? 20)
    if (data.company_id) q = q.eq('company_id', data.company_id)
    const { data: rows, error } = await q
    if (error) throw error
    if (!rows?.length) return { ok: true, processed: 0 }

    const { generateText } = await import('ai')
    const { createLovableAiGatewayProvider } = await import('./ai-gateway.server')
    const gateway = createLovableAiGatewayProvider(key)
    const model = gateway('google/gemini-2.5-flash')

    let processed = 0
    for (const t of rows) {
      try {
        const { text } = await generateText({
          model,
          system: 'Você categoriza tickets de suporte em um tema curto (2-4 palavras) e um resumo de 1 frase. Responda APENAS no formato JSON: {"topic":"...","summary":"..."}.',
          prompt: `Assunto: ${t.subject}\nTipo: ${t.type}\nDescrição: ${(t.description ?? '').slice(0, 800)}`,
        })
        const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
        if (json.topic && json.summary) {
          await context.supabase.from('support_tickets')
            .update({ ai_topic: String(json.topic).slice(0, 80), ai_summary: String(json.summary).slice(0, 400) })
            .eq('id', t.id)
          processed++
        }
      } catch { /* skip */ }
    }

    // Agregação diária por company
    const today = new Date().toISOString().slice(0, 10)
    const { data: dayRows } = await context.supabase
      .from('support_tickets')
      .select('company_id, ai_topic')
      .gte('created_at', today + 'T00:00:00.000Z')
      .not('ai_topic', 'is', null)
    const counts = new Map<string, number>()
    for (const r of dayRows ?? []) {
      const key = `${r.company_id ?? 'null'}|${r.ai_topic}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const totalsByCompany = new Map<string, number>()
    for (const [k, c] of counts) {
      const [comp] = k.split('|')
      totalsByCompany.set(comp, (totalsByCompany.get(comp) ?? 0) + c)
    }
    for (const [k, count] of counts) {
      const [comp, topic] = k.split('|')
      const tot = totalsByCompany.get(comp) ?? 1
      await context.supabase.from('support_ticket_topics_daily').upsert({
        company_id: comp === 'null' ? null : comp,
        day: today,
        topic,
        ticket_count: count,
        percentage: +(count * 100 / tot).toFixed(2),
      }, { onConflict: 'company_id,day,topic' })
    }

    return { ok: true, processed }
  })

/** Vincula ticket a um lead/oportunidade do CRM. */
export const linkTicketCrm = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string; crm_lead_id?: string; crm_opportunity_id?: string }) =>
    z.object({
      ticket_id: z.string().uuid(),
      crm_lead_id: z.string().uuid().optional(),
      crm_opportunity_id: z.string().uuid().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('support_tickets')
      .update({
        crm_lead_id: data.crm_lead_id ?? null,
        crm_opportunity_id: data.crm_opportunity_id ?? null,
      })
      .eq('id', data.ticket_id)
    if (error) throw error
    return { ok: true }
  })
