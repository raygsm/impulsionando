// Suporte Inteligente — camada operacional alinhada ao contrato live de support_tickets.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const STATUSES = ['open','waiting_customer','waiting_internal','resolved','closed','reopened'] as const
const PRIORITIES = ['low','normal','high','critical'] as const

export const operatorInbox = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    status?: typeof STATUSES[number] | 'all'
    priority?: typeof PRIORITIES[number] | 'all'
    assigned_to_me?: boolean
    search?: string
    limit?: number
    company_id?: string
  }) => z.object({
    status: z.enum([...STATUSES, 'all']).optional(),
    priority: z.enum([...PRIORITIES, 'all']).optional(),
    assigned_to_me: z.boolean().optional(),
    search: z.string().max(200).optional(),
    limit: z.number().min(1).max(200).optional(),
    company_id: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    let q = supabase
      .from('support_tickets')
      .select('id,ticket_code,company_id,requester_user_id,contact_id,assigned_user_id,category,priority,status,subject,description,source_channel,first_response_due_at,resolution_due_at,first_response_at,resolved_at,closed_at,metadata,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(data.limit ?? 100)

    if (data.status && data.status !== 'all') q = q.eq('status', data.status)
    if (data.priority && data.priority !== 'all') q = q.eq('priority', data.priority)
    if (data.assigned_to_me) q = q.eq('assigned_user_id', userId)
    if (data.company_id) q = q.eq('company_id', data.company_id)
    if (data.search) {
      const s = data.search.replace(/[%_,]/g, ' ').trim()
      if (s) q = q.or(`subject.ilike.%${s}%,ticket_code.ilike.%${s}%,description.ilike.%${s}%`)
    }

    const { data: rows, error } = await q
    if (error) throw error

    const now = Date.now()
    const tickets = (rows ?? []).map((t) => {
      const firstResponseDue = t.first_response_due_at ? new Date(t.first_response_due_at).getTime() : null
      const resolutionDue = t.resolution_due_at ? new Date(t.resolution_due_at).getTime() : null
      const due = t.first_response_at ? resolutionDue : firstResponseDue
      return {
        ...t,
        sla_status: t.resolved_at || t.closed_at ? 'ok' : due && due < now ? 'breach' : due && due - now < 2 * 3600_000 ? 'risk' : 'ok',
      }
    })

    const byStatus: Record<string, number> = Object.fromEntries(STATUSES.map((s) => [s, 0]))
    for (const t of tickets) byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
    return { tickets, byStatus }
  })

export const supportMetrics = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; days?: number }) => z.object({
    company_id: z.string().uuid().optional(),
    days: z.number().min(1).max(365).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - (data.days ?? 30) * 86400_000).toISOString()
    let q = context.supabase
      .from('support_tickets')
      .select('id,status,priority,category,created_at,first_response_at,resolved_at,closed_at,first_response_due_at,resolution_due_at')
      .gte('created_at', since)
    if (data.company_id) q = q.eq('company_id', data.company_id)
    const { data: rows, error } = await q
    if (error) throw error
    const tickets = rows ?? []

    const avgMinutes = (xs: number[]) => xs.length ? Math.round(xs.reduce((a,b) => a + b, 0) / xs.length / 60000) : null
    const ttfr = tickets.filter((t) => t.first_response_at).map((t) => new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime())
    const ttr = tickets.filter((t) => t.resolved_at).map((t) => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
    const backlog = tickets.filter((t) => !['resolved','closed'].includes(t.status)).length
    const breached = tickets.filter((t) => {
      if (t.resolved_at || t.closed_at) return false
      const due = t.first_response_at ? t.resolution_due_at : t.first_response_due_at
      return !!due && new Date(due).getTime() < Date.now()
    }).length

    const categories: Record<string, number> = {}
    for (const t of tickets) categories[t.category] = (categories[t.category] ?? 0) + 1

    return {
      window_days: data.days ?? 30,
      total: tickets.length,
      backlog,
      sla_breached: breached,
      ttfr_minutes_avg: avgMinutes(ttfr),
      ttr_minutes_avg: avgMinutes(ttr),
      categories: Object.entries(categories).map(([category, count]) => ({ category, count })).sort((a,b) => b.count - a.count),
    }
  })

export const updateTicketOperationally = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ticket_id: string
    status: typeof STATUSES[number]
    priority: typeof PRIORITIES[number]
    assigned_user_id?: string | null
    public_message?: string | null
    internal_note?: string | null
  }) => z.object({
    ticket_id: z.string().uuid(),
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    assigned_user_id: z.string().uuid().nullable().optional(),
    public_message: z.string().max(4000).nullable().optional(),
    internal_note: z.string().max(4000).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc('support_staff_update_ticket', {
      p_ticket_id: data.ticket_id,
      p_status: data.status,
      p_priority: data.priority,
      p_assigned_user_id: data.assigned_user_id ?? null,
      p_public_message: data.public_message ?? null,
      p_internal_note: data.internal_note ?? null,
    })
    if (error) throw error
    return result
  })

export const reopenTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string; message: string }) => z.object({
    ticket_id: z.string().uuid(),
    message: z.string().min(1).max(4000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc('support_customer_reopen_ticket', {
      p_ticket_id: data.ticket_id,
      p_message: data.message,
    })
    if (error) throw error
    return result
  })

export const sendFollowUp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string; channel: 'whatsapp' | 'email'; body: string; to: string }) => z.object({
    ticket_id: z.string().uuid(),
    channel: z.enum(['whatsapp','email']),
    body: z.string().min(3).max(4000),
    to: z.string().min(3).max(320),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: t, error: tErr } = await context.supabase
      .from('support_tickets')
      .select('id,ticket_code,company_id,subject')
      .eq('id', data.ticket_id)
      .single()
    if (tErr) throw tErr

    const { error } = await context.supabase.from('message_outbox').insert({
      company_id: t.company_id,
      channel: data.channel,
      event_code: `support_followup_${data.channel}`,
      recipient_email: data.channel === 'email' ? data.to : null,
      recipient_phone: data.channel === 'whatsapp' ? data.to : null,
      subject: data.channel === 'email' ? `[${t.ticket_code}] ${t.subject}` : null,
      body: data.body,
      payload: { ticket_id: t.id, ticket_code: t.ticket_code },
      status: 'queued',
      reference_type: 'support_ticket',
      reference_id: t.id,
      correlation_id: `support:${t.id}:${Date.now()}`,
    })
    if (error) throw error
    return { ok: true, ticket_code: t.ticket_code }
  })
