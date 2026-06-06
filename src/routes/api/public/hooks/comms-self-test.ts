import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendWhatsAppText } from '@/lib/zapi.server'

// Endpoint de auto-teste: dispara uma mensagem para o e-mail e o WhatsApp
// informados como destinos oficiais de SAC da Impulsionando. Use uma única vez
// para confirmar que ambos os canais estão operacionais.
const TEST_EMAIL = 'sac@impulsionando.com.br'
const TEST_PHONE = '5521993075000'
const SITE_NAME = 'Impulsionando'
const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'

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

export const Route = createFileRoute('/api/public/hooks/comms-self-test')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let override: { email?: string; phone?: string } = {}
        try { override = await request.json() } catch {}
        const recipientEmail = (override.email || TEST_EMAIL).trim()
        const recipientPhone = (override.phone || TEST_PHONE).replace(/\D/g, '')
        const now = new Date()
        const stamp = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        const subject = `✅ Teste de canal — Impulsionando (${stamp})`
        const text =
          `Olá!\n\nEste é um teste automático de comunicação da plataforma Impulsionando.\n` +
          `Se você recebeu esta mensagem, o canal de E-MAIL está operacional.\n\n` +
          `Disparado em: ${stamp} (horário de Brasília).\n\n` +
          `— Plataforma Impulsionando`
        const html = `
<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#ffffff;color:#0f172a;padding:24px;">
  <div style="max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
    <h2 style="margin:0 0 12px;color:#1d4ed8;">Teste de canal — Impulsionando</h2>
    <p>Olá! Este é um <strong>teste automático</strong> de comunicação da plataforma.</p>
    <p>Se você recebeu esta mensagem, o canal de <strong>e-mail</strong> está operacional.</p>
    <p style="color:#64748b;font-size:12px;margin-top:24px;">Disparado em: ${stamp} (horário de Brasília).</p>
  </div>
</body></html>`.trim()

        // -------- E-MAIL --------
        let emailResult: { ok: boolean; status?: string; error?: string; message_id?: string } = {
          ok: false,
        }
        try {
          const { data: suppressed } = await supabaseAdmin
            .from('suppressed_emails')
            .select('id')
            .eq('email', TEST_EMAIL.toLowerCase())
            .maybeSingle()

          if (suppressed) {
            emailResult = { ok: false, status: 'suppressed', error: 'recipient_suppressed' }
          } else {
            const unsubscribe_token = await ensureUnsubscribeToken(TEST_EMAIL)
            const messageId = crypto.randomUUID()
            const idempotencyKey = `comms-self-test-${messageId}`

            await supabaseAdmin.from('email_send_log').insert({
              message_id: messageId,
              template_name: 'comms-self-test',
              recipient_email: TEST_EMAIL,
              status: 'pending',
            })

            const { error: enqErr } = await supabaseAdmin.rpc('enqueue_email', {
              queue_name: 'transactional_emails',
              payload: {
                message_id: messageId,
                to: TEST_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text,
                purpose: 'transactional',
                label: 'comms-self-test',
                idempotency_key: idempotencyKey,
                unsubscribe_token,
                queued_at: now.toISOString(),
              },
            })

            if (enqErr) {
              await supabaseAdmin.from('email_send_log').insert({
                message_id: messageId,
                template_name: 'comms-self-test',
                recipient_email: TEST_EMAIL,
                status: 'failed',
                error_message: enqErr.message,
              })
              emailResult = { ok: false, error: enqErr.message, message_id: messageId }
            } else {
              emailResult = { ok: true, status: 'queued', message_id: messageId }
            }
          }
        } catch (e: any) {
          emailResult = { ok: false, error: e?.message ?? 'email_failed' }
        }

        // -------- WHATSAPP --------
        const waMessage =
          `✅ Teste de canal — Impulsionando\n\n` +
          `Se você recebeu esta mensagem, o canal de WhatsApp está operacional.\n\n` +
          `Disparado em: ${stamp} (horário de Brasília).`
        let whatsapp: { phone: string; ok: boolean; status: number; body: string }
        try {
          const r = await sendWhatsAppText({ phone: TEST_PHONE, message: waMessage })
          whatsapp = { phone: TEST_PHONE, ok: r.ok, status: r.status, body: r.body }
        } catch (e: any) {
          whatsapp = { phone: TEST_PHONE, ok: false, status: 0, body: e?.message ?? 'error' }
        }

        return Response.json({
          ok: emailResult.ok && whatsapp.ok,
          email: { recipient: TEST_EMAIL, ...emailResult },
          whatsapp,
          at: now.toISOString(),
        })
      },
    },
  },
})
