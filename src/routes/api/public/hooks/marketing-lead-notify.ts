import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Impulsionando'
const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'

const BodySchema = z.object({
  leadId: z.string().uuid(),
})

export const Route = createFileRoute('/api/public/hooks/marketing-lead-notify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof BodySchema>
        try {
          const json = await request.json()
          parsed = BodySchema.parse(json)
        } catch {
          return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
        }

        const { data: lead, error } = await supabaseAdmin
          .from('marketing_leads')
          .select(
            'id, source, name, email, phone, company, message, recommended_plan, recommended_modules, page_url, created_at',
          )
          .eq('id', parsed.leadId)
          .maybeSingle()

        if (error || !lead) {
          console.error('marketing-lead-notify: lead not found', { error, leadId: parsed.leadId })
          return Response.json({ ok: false, error: 'lead_not_found' }, { status: 404 })
        }

        const tpl = TEMPLATES['marketing-lead-new']
        if (!tpl) {
          return Response.json({ ok: false, error: 'template_missing' }, { status: 500 })
        }

        const data = {
          leadName: lead.name ?? undefined,
          leadEmail: lead.email ?? undefined,
          leadPhone: lead.phone ?? undefined,
          leadCompany: (lead as any).company ?? undefined,
          leadSource: lead.source ?? undefined,
          leadMessage: lead.message ?? undefined,
          recommendedPlan: (lead as any).recommended_plan ?? undefined,
          recommendedModules: (lead as any).recommended_modules ?? undefined,
          pageUrl: (lead as any).page_url ?? undefined,
          createdAt: lead.created_at ?? new Date().toISOString(),
        }

        const recipient = tpl.to!
        const element = React.createElement(tpl.component, data)
        const html = await renderAsync(element)
        const text = await renderAsync(element, { plainText: true })
        const subject = typeof tpl.subject === 'function' ? tpl.subject(data) : tpl.subject

        const messageId = crypto.randomUUID()
        const idempotencyKey = `marketing-lead-new-${lead.id}`

        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: 'marketing-lead-new',
          recipient_email: recipient,
          status: 'pending',
        })

        const { error: enqErr } = await supabaseAdmin.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: 'transactional',
            label: 'marketing-lead-new',
            idempotency_key: idempotencyKey,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqErr) {
          console.error('marketing-lead-notify: enqueue failed', enqErr)
          await supabaseAdmin.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'marketing-lead-new',
            recipient_email: recipient,
            status: 'failed',
            error_message: enqErr.message,
          })
          return Response.json({ ok: false, error: 'enqueue_failed' }, { status: 500 })
        }

        return Response.json({ ok: true, queued: true })
      },
    },
  },
})
