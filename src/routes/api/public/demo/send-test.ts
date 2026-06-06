// Public DEMO endpoint: sends a TEST email or WhatsApp on behalf of a lead
// exploring the demonstration area. Reuses the existing email queue and the
// Z-API helper. ALL messages are forced to contain "TESTE" in subject and body
// so they can never be confused with real production communication.

import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendWhatsAppText } from '@/lib/zapi.server'

const SITE_NAME = 'Impulsionando'
const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'

const TESTE_BANNER =
  'TESTE — Esta é uma mensagem de demonstração da plataforma Impulsionando Tecnologia. Nenhuma ação real foi executada.'

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
  const { data: final } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalized)
    .maybeSingle()
  return final?.token ?? token
}

function ensureTesteSubject(s: string): string {
  const t = (s ?? '').trim()
  return /^teste\s*[—\-]/i.test(t) ? t : `TESTE — ${t || 'Demonstração Impulsionando'}`
}

function ensureTesteBody(b: string): string {
  const body = (b ?? '').trim()
  if (body.toUpperCase().startsWith('TESTE')) return body
  return `${TESTE_BANNER}\n\n${body}`
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildHtml(subject: string, body: string, scenarioLabel: string, scenarioModule: string) {
  return `
<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#ffffff;color:#0f172a;padding:24px;">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#facc15;color:#78350f;padding:10px 16px;font-weight:bold;font-size:13px;letter-spacing:.5px;">
      ⚠ MENSAGEM DE TESTE — AMBIENTE DE DEMONSTRAÇÃO
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 12px;color:#1d4ed8;">${htmlEscape(subject)}</h2>
      <p style="font-size:13px;color:#64748b;margin:0 0 16px;">
        Cenário simulado: <strong>${htmlEscape(scenarioLabel)}</strong> · Módulo: <strong>${htmlEscape(scenarioModule)}</strong>
      </p>
      <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.55;margin:0;">${htmlEscape(body)}</pre>
      <p style="color:#64748b;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;">
        Esta mensagem foi enviada porque você informou este contato na área de demonstração em
        https://impulsionando.com.br/demo. Nenhuma ação real foi executada e nenhum dado real foi
        utilizado. Para parar de receber, basta não informar este contato novamente.
      </p>
    </div>
  </div>
</body></html>`.trim()
}

interface DemoSendInput {
  channel: 'email' | 'whatsapp'
  recipient: string
  scenario_id: string
  scenario_label: string
  scenario_module: string
  subject?: string
  body: string
}

function validate(input: any): { ok: true; value: DemoSendInput } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'invalid_body' }
  const channel = input.channel
  if (channel !== 'email' && channel !== 'whatsapp') return { ok: false, error: 'invalid_channel' }
  const recipient = String(input.recipient ?? '').trim()
  if (!recipient) return { ok: false, error: 'missing_recipient' }
  if (channel === 'email' && !/^\S+@\S+\.\S+$/.test(recipient)) return { ok: false, error: 'invalid_email' }
  if (channel === 'whatsapp' && recipient.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'invalid_phone' }
  }
  const scenario_id = String(input.scenario_id ?? '').slice(0, 64)
  const scenario_label = String(input.scenario_label ?? '').slice(0, 120)
  const scenario_module = String(input.scenario_module ?? '').slice(0, 80)
  const subject = input.subject ? String(input.subject).slice(0, 200) : undefined
  const body = String(input.body ?? '').slice(0, 4000)
  if (!body) return { ok: false, error: 'missing_body' }
  return { ok: true, value: { channel, recipient, scenario_id, scenario_label, scenario_module, subject, body } }
}

export const Route = createFileRoute('/api/public/demo/send-test')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: any
        try {
          raw = await request.json()
        } catch {
          return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
        }
        const parsed = validate(raw)
        if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 })
        const input = parsed.value

        const subject = ensureTesteSubject(input.subject ?? input.scenario_label ?? 'Demonstração')
        const body = ensureTesteBody(input.body)

        if (input.channel === 'email') {
          try {
            const { data: suppressed } = await supabaseAdmin
              .from('suppressed_emails')
              .select('id')
              .eq('email', input.recipient.toLowerCase())
              .maybeSingle()
            if (suppressed) {
              return Response.json({ ok: false, error: 'recipient_suppressed' }, { status: 200 })
            }

            const unsubscribe_token = await ensureUnsubscribeToken(input.recipient)
            const messageId = crypto.randomUUID()
            const idempotencyKey = `demo-test-${input.scenario_id || 'generic'}-${messageId}`
            const html = buildHtml(subject, body, input.scenario_label, input.scenario_module)

            await supabaseAdmin.from('email_send_log').insert({
              message_id: messageId,
              template_name: `demo-test:${input.scenario_id || 'generic'}`,
              recipient_email: input.recipient,
              status: 'pending',
              metadata: {
                is_demo: true,
                is_test_contact: true,
                source: 'demo',
                consent_context: 'teste_demonstracao',
                scenario_id: input.scenario_id,
                module: input.scenario_module,
              },
            })

            const { error: enqErr } = await supabaseAdmin.rpc('enqueue_email', {
              queue_name: 'transactional_emails',
              payload: {
                message_id: messageId,
                to: input.recipient,
                from: `${SITE_NAME} DEMO <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text: body,
                purpose: 'transactional',
                label: `demo-test:${input.scenario_id || 'generic'}`,
                idempotency_key: idempotencyKey,
                unsubscribe_token,
                queued_at: new Date().toISOString(),
              },
            })

            if (enqErr) {
              await supabaseAdmin.from('email_send_log').insert({
                message_id: messageId,
                template_name: `demo-test:${input.scenario_id || 'generic'}`,
                recipient_email: input.recipient,
                status: 'failed',
                error_message: enqErr.message,
              })
              return Response.json(
                { ok: false, error: 'enqueue_failed', detail: enqErr.message },
                { status: 500 },
              )
            }
            return Response.json({ ok: true, channel: 'email', status: 'queued', message_id: messageId })
          } catch (e: any) {
            return Response.json(
              { ok: false, error: 'email_failed', detail: e?.message ?? String(e) },
              { status: 500 },
            )
          }
        }

        // ---- WhatsApp ----
        try {
          const waMessage =
            `*${subject}*\n` +
            `_(Cenário: ${input.scenario_label} · ${input.scenario_module})_\n\n` +
            `${body}\n\n` +
            `— Esta mensagem saiu da DEMONSTRAÇÃO em https://impulsionando.com.br/demo`
          const r = await sendWhatsAppText({ phone: input.recipient, message: waMessage })
          return Response.json({
            ok: r.ok,
            channel: 'whatsapp',
            status: r.ok ? 'sent' : 'failed',
            message_id: r.messageId,
            http_status: r.status,
          }, { status: r.ok ? 200 : 502 })
        } catch (e: any) {
          return Response.json(
            { ok: false, error: 'whatsapp_failed', detail: e?.message ?? String(e) },
            { status: 500 },
          )
        }
      },
    },
  },
})
