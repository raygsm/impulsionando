// Public endpoint para abertura de ticket de suporte sem autenticação.
// Phase 3 strangler: quando PHASE3_API_BASE está definido, delega ao Nest Support API.
// Caso contrário, insert legado via service role (prod / rollback).
import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import {
  createSupportTicketViaNest,
  phase3ApiBase,
} from '@/lib/reengineering/support-api'

type TicketType = 'question' | 'technical' | 'suggestion' | 'financial' | 'commercial' | 'other'
type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

interface Input {
  name: string
  email: string
  phone?: string
  subject: string
  description: string
  type: TicketType
  priority: TicketPriority
  niche?: string
  page?: string
}

const TYPES: TicketType[] = ['question', 'technical', 'suggestion', 'financial', 'commercial', 'other']
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical']

function validate(raw: any): { ok: true; value: Input } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'invalid_body' }
  const name = String(raw.name ?? '').trim().slice(0, 160)
  const email = String(raw.email ?? '').trim().toLowerCase().slice(0, 200)
  const subject = String(raw.subject ?? '').trim().slice(0, 200)
  const description = String(raw.description ?? '').trim().slice(0, 4000)
  const type = (TYPES.includes(raw.type) ? raw.type : 'question') as TicketType
  const priority = (PRIORITIES.includes(raw.priority) ? raw.priority : 'medium') as TicketPriority
  if (!name) return { ok: false, error: 'missing_name' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'invalid_email' }
  if (subject.length < 4) return { ok: false, error: 'subject_too_short' }
  if (description.length < 10) return { ok: false, error: 'description_too_short' }
  return {
    ok: true,
    value: {
      name, email, subject, description, type, priority,
      phone: raw.phone ? String(raw.phone).trim().slice(0, 40) : undefined,
      niche: raw.niche ? String(raw.niche).slice(0, 60) : undefined,
      page: raw.page ? String(raw.page).slice(0, 300) : undefined,
    },
  }
}

export const Route = createFileRoute('/api/public/support/create-ticket')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: any
        try { raw = await request.json() } catch {
          return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
        }
        const parsed = validate(raw)
        if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 })
        const input = parsed.value

        if (phase3ApiBase()) {
          const correlationId = request.headers.get('x-correlation-id') ?? undefined
          const idempotencyKey = request.headers.get('idempotency-key') ?? undefined
          const nest = await createSupportTicketViaNest(input, { correlationId, idempotencyKey })
          if (!nest.ok) {
            return Response.json(
              { ok: false, error: nest.error, detail: nest.detail },
              { status: nest.error === 'invalid_json' || nest.error === 'VALIDATION_FAILED' ? 400 : 502 },
            )
          }
          return Response.json({
            ok: true,
            ticket_id: nest.ticket_id,
            protocol: nest.protocol,
            via: 'phase3-api',
          })
        }

        const ua = request.headers.get('user-agent') ?? null
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || ''

        const { data, error } = await supabaseAdmin
          .from('support_tickets')
          .insert({
            requester_email: input.email,
            requester_name: input.name,
            subject: input.subject,
            description: input.description,
            type: input.type,
            priority: input.priority,
            origin: 'form',
            status: 'new',
            metadata: {
              phone: input.phone ?? null,
              niche: input.niche ?? null,
              page: input.page ?? null,
              user_agent: ua,
              ip_hash: ip ? `sha:${ip.slice(0, 32)}` : null,
              source: 'public_support_form',
            },
            tags: ['publico', input.type, ...(input.niche ? [`nicho:${input.niche}`] : [])],
          })
          .select('id, protocol')
          .single()

        if (error || !data) {
          return Response.json({ ok: false, error: 'insert_failed', detail: error?.message }, { status: 500 })
        }

        return Response.json({ ok: true, ticket_id: data.id, protocol: data.protocol })
      },
    },
  },
})
