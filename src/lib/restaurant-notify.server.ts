/**
 * Restaurante — helper server-only para enviar e-mails ao cliente.
 * Reaproveita a fila pgmq (transactional_emails) via supabaseAdmin.
 */
import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { TEMPLATES, assertTemplateAllowedForCustomerChannel } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'
const SITE_NAME = 'Impulsionando'

export async function sendRestaurantEmail(args: {
  templateName: 'restaurant-order-ready' | 'restaurant-bill-closed' | 'restaurant-postvisit-thanks'
  to: string
  templateData: Record<string, unknown>
  idempotencyKey: string
}) {
  // Guard: nunca envie um template INTERNO por canal ao cliente.
  // Lança InternalTemplateLeakError se a regra for violada.
  assertTemplateAllowedForCustomerChannel(args.templateName, 'customer-email')

  const tpl = TEMPLATES[args.templateName]
  if (!tpl) return { status: 'no_template' as const }
  const recipient = (args.to || '').trim().toLowerCase()
  if (!recipient || !recipient.includes('@')) return { status: 'error' as const, error: 'recipient_missing' }

  try {
    const element = React.createElement(tpl.component as any, args.templateData)
    const [html, text] = await Promise.all([
      renderAsync(element),
      renderAsync(element, { plainText: true }),
    ])
    const subject = typeof tpl.subject === 'function' ? tpl.subject(args.templateData) : tpl.subject

    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails').select('id').eq('email', recipient).maybeSingle()

    const messageId = crypto.randomUUID()
    const meta = { idempotency_key: args.idempotencyKey, channel: 'restaurant' }
    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId, template_name: args.templateName, recipient_email: recipient,
        status: 'suppressed', metadata: meta,
      })
      return { status: 'suppressed' as const, messageId }
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
    return { status: 'queued' as const, messageId }
  } catch (err: any) {
    console.error('sendRestaurantEmail failed', { template: args.templateName, err })
    return { status: 'error' as const, error: err?.message ?? 'unknown' }
  }
}
