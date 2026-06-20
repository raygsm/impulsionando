// Suporte / Tickets — server functions ponta-a-ponta.
// RLS faz o gating; aqui só validação, derivação de contexto e ações privilegiadas.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'

const TYPES = [
  'financial','payment','payout','commission','contract','access','technical',
  'whatsapp','email','mercadopago','dashboard','permission','registration',
  'marketplace','clube','consumer','lgpd','suggestion','question','commercial','other',
] as const
const PRIORITIES = ['low','medium','high','critical'] as const
const STATUSES = [
  'new','received','in_review','waiting_customer','waiting_core',
  'waiting_third_party','in_development','resolved','closed','reopened','cancelled',
] as const

const slaHoursFor = (p: typeof PRIORITIES[number]): number =>
  ({ low: 72, medium: 24, high: 8, critical: 2 }[p])

/** Cria ticket. Auto-detecta scope (empresa membro OU consumidor). */
export const createTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    subject: string; description: string;
    type?: typeof TYPES[number]; priority?: typeof PRIORITIES[number];
    company_id?: string;
  }) =>
    z.object({
      subject: z.string().trim().min(3).max(200),
      description: z.string().trim().min(5).max(8000),
      type: z.enum(TYPES).optional(),
      priority: z.enum(PRIORITIES).optional(),
      company_id: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('support.createTicket', { user_id: context.userId }, async () => {
      const priority = data.priority ?? 'medium'
      const slaDue = new Date(Date.now() + slaHoursFor(priority) * 3600_000).toISOString()

      // Determina se é consumidor (sem empresa) ou cliente (membro de companies)
      let companyId = data.company_id ?? null
      if (!companyId) {
        const { data: prof } = await context.supabase
          .from('user_profiles').select('company_id').eq('user_id', context.userId).maybeSingle()
        companyId = prof?.company_id ?? null
      }
      const isConsumer = !companyId

      const { data: userInfo } = await context.supabase.auth.getUser()
      const email = userInfo.user?.email ?? null

      const { data: row, error } = await context.supabase
        .from('support_tickets')
        .insert({
          company_id: companyId,
          consumer_user_id: isConsumer ? context.userId : null,
          requester_user_id: context.userId,
          requester_email: email,
          subject: data.subject,
          description: data.description,
          type: data.type ?? 'question',
          priority,
          status: 'new',
          origin: 'form',
          sla_due_at: slaDue,
        })
        .select('id, protocol')
        .single()
      if (error) throw error
      return row
    }),
  )

/** Lista tickets — RLS filtra automaticamente por papel. */
export const listTickets = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    status?: typeof STATUSES[number]; priority?: typeof PRIORITIES[number];
    company_id?: string; limit?: number;
  }) =>
    z.object({
      status: z.enum(STATUSES).optional(),
      priority: z.enum(PRIORITIES).optional(),
      company_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('support.listTickets', { user_id: context.userId }, async () => {
      let q = context.supabase
        .from('support_tickets')
        .select('id, protocol, company_id, subject, type, priority, status, origin, assigned_to, sla_due_at, first_response_at, resolved_at, created_at, updated_at, companies:companies(name)')
        .order('created_at', { ascending: false })
        .limit(data.limit ?? 200)
      if (data.status) q = q.eq('status', data.status)
      if (data.priority) q = q.eq('priority', data.priority)
      if (data.company_id) q = q.eq('company_id', data.company_id)
      const { data: rows, error } = await q
      if (error) throw error
      return rows ?? []
    }),
  )

/** Detalhe de ticket + mensagens (RLS oculta mensagens internas para não-staff). */
export const getTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string }) => z.object({ ticket_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) =>
    withInstrumentation('support.getTicket', { user_id: context.userId, ticket_id: data.ticket_id }, async () => {
      const { data: ticket, error } = await context.supabase
        .from('support_tickets')
        .select('*, companies:companies(name, niche)')
        .eq('id', data.ticket_id)
        .maybeSingle()
      if (error) throw error
      if (!ticket) throw new Error('Ticket não encontrado')

      const { data: messages, error: mErr } = await context.supabase
        .from('support_ticket_messages')
        .select('id, author_user_id, author_role, body, is_internal, attachments, created_at')
        .eq('ticket_id', data.ticket_id)
        .order('created_at', { ascending: true })
      if (mErr) throw mErr

      return { ticket, messages: messages ?? [] }
    }),
  )

/** Adiciona mensagem. is_internal só passa para staff (RLS reforça). */
export const addTicketMessage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticket_id: string; body: string; is_internal?: boolean }) =>
    z.object({
      ticket_id: z.string().uuid(),
      body: z.string().trim().min(1).max(8000),
      is_internal: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('support.addMessage', { user_id: context.userId, ticket_id: data.ticket_id }, async () => {
      const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
      const role: 'staff' | 'customer' | 'consumer' = isStaff
        ? 'staff'
        : (await (async () => {
            const { data: prof } = await context.supabase
              .from('user_profiles').select('company_id').eq('user_id', context.userId).maybeSingle()
            return prof?.company_id ? 'customer' : 'consumer'
          })())
      const { error } = await context.supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: data.ticket_id,
          author_user_id: context.userId,
          author_role: role,
          body: data.body,
          is_internal: !!(data.is_internal && isStaff),
        })
      if (error) throw error
      return { ok: true }
    }),
  )

/** Muda status (staff) ou reabre/avalia (requester). */
export const updateTicketStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ticket_id: string;
    status?: typeof STATUSES[number];
    assigned_to?: string | null;
    priority?: typeof PRIORITIES[number];
    rating?: number; rating_comment?: string;
  }) =>
    z.object({
      ticket_id: z.string().uuid(),
      status: z.enum(STATUSES).optional(),
      assigned_to: z.string().uuid().nullable().optional(),
      priority: z.enum(PRIORITIES).optional(),
      rating: z.number().int().min(1).max(5).optional(),
      rating_comment: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('support.updateStatus', { user_id: context.userId, ticket_id: data.ticket_id }, async () => {
      const patch: Record<string, unknown> = {}
      if (data.status) patch.status = data.status
      if (data.priority) patch.priority = data.priority
      if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to
      if (data.rating !== undefined) patch.rating = data.rating
      if (data.rating_comment !== undefined) patch.rating_comment = data.rating_comment

      const { error } = await context.supabase
        .from('support_tickets')
        .update(patch)
        .eq('id', data.ticket_id)
      if (error) throw error
      return { ok: true }
    }),
  )

/** Dashboard de suporte — staff only. */
export const supportDashboard = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('support.dashboard', { user_id: context.userId }, async () => {
      const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
      if (!isStaff) throw new Error('Forbidden: staff only')

      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const since30d = new Date(Date.now() - 30 * 86400_000).toISOString()
      const { data: rows, error } = await supabaseAdmin
        .from('support_tickets')
        .select('id, status, priority, type, created_at, first_response_at, resolved_at, sla_due_at, company_id')
        .gte('created_at', since30d)
      if (error) throw error
      const tickets = rows ?? []

      const open = tickets.filter((t) => !['resolved','closed','cancelled'].includes(t.status))
      const overdue = open.filter((t) => t.sla_due_at && new Date(t.sla_due_at) < new Date())
      const firstResp = tickets.filter((t) => t.first_response_at).map((t) =>
        (new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime()) / 60000)
      const resolveT = tickets.filter((t) => t.resolved_at).map((t) =>
        (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / 60000)
      const avg = (a: number[]) => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : 0

      const byPriority: Record<string, number> = {}
      const byType: Record<string, number> = {}
      const byStatus: Record<string, number> = {}
      for (const t of tickets) {
        byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1
        byType[t.type] = (byType[t.type] ?? 0) + 1
        byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
      }

      return {
        totals: {
          period_days: 30,
          total: tickets.length,
          open: open.length,
          overdue: overdue.length,
          first_response_avg_min: avg(firstResp),
          resolve_avg_min: avg(resolveT),
        },
        byPriority, byType, byStatus,
      }
    }),
  )
