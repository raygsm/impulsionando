/**
 * Contracts — server-only notification helper.
 * Sends "contract-generated" and "contract-signed" emails via the queue.
 * SERVER-ONLY: never import from client modules (filename has .server suffix).
 */
import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'
const SITE_NAME = 'Impulsionando'

export async function sendContractEmail(args: {
  templateName: 'contract-generated' | 'contract-signed'
  to: string
  templateData: Record<string, unknown>
  idempotencyKey: string
}): Promise<{ status: 'queued' | 'suppressed' | 'error' | 'no_template'; messageId?: string; error?: string }> {
  const tpl = TEMPLATES[args.templateName]
  if (!tpl) return { status: 'no_template' }
  const recipient = (args.to || '').trim()
  if (!recipient) return { status: 'error', error: 'recipient_missing' }
  const meta = { idempotency_key: args.idempotencyKey, channel: 'contracts' }

  try {
    const element = React.createElement(tpl.component as any, args.templateData)
    const [html, text] = await Promise.all([
      renderAsync(element),
      renderAsync(element, { plainText: true }),
    ])
    const subject = typeof tpl.subject === 'function' ? tpl.subject(args.templateData) : tpl.subject

    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails').select('id').eq('email', recipient.toLowerCase()).maybeSingle()

    const messageId = crypto.randomUUID()
    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId, template_name: args.templateName, recipient_email: recipient,
        status: 'suppressed', metadata: meta,
      })
      return { status: 'suppressed', messageId }
    }

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId, template_name: args.templateName, recipient_email: recipient,
      status: 'pending', metadata: meta,
    })
    await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject, html, text,
        purpose: 'transactional',
        label: args.templateName,
        idempotency_key: args.idempotencyKey,
        queued_at: new Date().toISOString(),
      },
    })
    return { status: 'queued', messageId }
  } catch (err: any) {
    console.error('sendContractEmail failed', { template: args.templateName, err })
    return { status: 'error', error: err?.message ?? 'unknown' }
  }
}
