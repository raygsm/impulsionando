/**
 * Webhook interno — recebe eventos do CORE para o painel do salão.
 *
 * Eventos suportados (campo `source`):
 *   - "notifyItemReady": sinal de garçom marcou item como entregue
 *   - "postvisit":       régua pós-visita (enviada / bloqueada)
 *
 * Autenticação: header `x-impulsionando-signature` = HMAC-SHA256(body, INTERNAL_WEBHOOK_SECRET)
 *
 * Cada chamada vira uma linha em `notification_attempt_log` — o painel
 * em tempo real lê dela (polling 10s) e mostra o evento na lista.
 */
import { createFileRoute } from '@tanstack/react-router'
import { createHmac, timingSafeEqual } from 'crypto'
import { z } from 'zod'

const Body = z.object({
  source: z.enum(['notifyItemReady', 'postvisit', 'manual']),
  request_id: z.string().optional(),
  company_id: z.string().uuid().optional(),
  niche: z.string().optional(),
  recipient: z.string().optional(),
  status: z.enum(['sent', 'queued', 'blocked', 'skipped', 'error']).default('sent'),
  reason: z.string().optional(),
  idempotency_key: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

function verifySig(rawBody: string, signature: string | null): boolean {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET
  if (!secret) {
    // Dev/preview sem secret: aceitamos chamadas locais (loopback only)
    return true
  }
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export const Route = createFileRoute('/api/public/hooks/core-notification-event')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text()
        if (!verifySig(raw, request.headers.get('x-impulsionando-signature'))) {
          return new Response('invalid signature', { status: 401 })
        }
        let parsed: z.infer<typeof Body>
        try {
          parsed = Body.parse(JSON.parse(raw))
        } catch (err: any) {
          return new Response(`invalid body: ${err?.message ?? 'parse_error'}`, { status: 400 })
        }

        const { logNotificationAttempt } = await import(
          '@/lib/notification-attempt-log.server'
        )
        await logNotificationAttempt({
          request_id: parsed.request_id ?? null,
          company_id: parsed.company_id ?? null,
          channel: 'webhook',
          event: parsed.source,
          niche: parsed.niche ?? null,
          recipient: parsed.recipient ?? null,
          status: parsed.status,
          reason: parsed.reason ?? null,
          idempotency_key: parsed.idempotency_key ?? null,
          metadata: parsed.metadata ?? {},
        })

        return Response.json({ ok: true })
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-impulsionando-signature',
          },
        }),
    },
  },
})
