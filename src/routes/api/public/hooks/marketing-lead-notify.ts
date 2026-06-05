import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'
import { sendWhatsAppText } from '@/lib/zapi.server'

const SITE_NAME = 'Impulsionando'
const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'

// Equipe interna que recebe alertas de novo lead.
const ALERT_WHATSAPPS = ['5521995077375', '5521993075000']

const BodySchema = z.object({
  leadId: z.string().uuid(),
})

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function ensureUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase()
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalized)
    .maybeSingle()
  if (existing && !existing.used_at) return existing.token
  const token = generateToken()
  await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .upsert({ token, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
  // re-read in case insert was ignored due to existing row
  const { data: final } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalized)
    .maybeSingle()
  return final?.token ?? token
}

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

        // -------- E-MAIL --------
        let emailResult: { ok: boolean; status?: string; error?: string } = { ok: false }
        try {
          // Suppression check
          const { data: suppressed } = await supabaseAdmin
            .from('suppressed_emails')
            .select('id')
            .eq('email', recipient.toLowerCase())
            .maybeSingle()

          if (suppressed) {
            await supabaseAdmin.from('email_send_log').insert({
              message_id: crypto.randomUUID(),
              template_name: 'marketing-lead-new',
              recipient_email: recipient,
              status: 'suppressed',
            })
            emailResult = { ok: false, status: 'suppressed' }
          } else {
            const unsubscribe_token = await ensureUnsubscribeToken(recipient)
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
                unsubscribe_token,
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
              emailResult = { ok: false, error: enqErr.message }
            } else {
              emailResult = { ok: true, status: 'queued' }
            }
          }
        } catch (e: any) {
          console.error('marketing-lead-notify: email path failed', e)
          emailResult = { ok: false, error: e?.message ?? 'email_failed' }
        }

        // -------- WHATSAPP --------
        const waText =
          `🟢 Novo lead Impulsionando (${(lead as any).source ?? 'site'})\n\n` +
          `Nome: ${lead.name ?? '—'}\n` +
          `WhatsApp: ${lead.phone ?? '—'}\n` +
          `E-mail: ${lead.email ?? '—'}\n` +
          ((lead as any).recommended_plan ? `Plano: ${(lead as any).recommended_plan}\n` : '') +
          ((lead as any).recommended_modules?.length
            ? `Módulos: ${(lead as any).recommended_modules.join(' | ')}\n`
            : '') +
          (lead.message ? `\nMensagem: ${lead.message}\n` : '') +
          ((lead as any).page_url ? `\nOrigem: ${(lead as any).page_url}` : '')

        const waResults: Array<{ phone: string; ok: boolean; status: number }> = []
        for (const phone of ALERT_WHATSAPPS) {
          try {
            const r = await sendWhatsAppText({ phone, message: waText })
            waResults.push({ phone, ok: r.ok, status: r.status })
            if (!r.ok) {
              console.error('marketing-lead-notify: whatsapp failed', {
                phone,
                status: r.status,
                body: r.body,
              })
            }
          } catch (e: any) {
            console.error('marketing-lead-notify: whatsapp error', e)
            waResults.push({ phone, ok: false, status: 0 })
          }
        }

        return Response.json({
          ok: emailResult.ok || waResults.some((r) => r.ok),
          email: emailResult,
          whatsapp: waResults,
        })
      },
    },
  },
})
