import { createFileRoute } from '@tanstack/react-router'
import { createHmac, timingSafeEqual } from 'crypto'
import { z } from 'zod'

const DispatcherPayloadSchema = z.object({
  workflow_name: z.string().min(1).max(240),
  event_code: z.string().min(1).max(240),
  tenant_slug: z.string().min(1).max(120),
  correlation_id: z.string().min(1).max(240),
  company_id: z.string().uuid().nullable().optional(),
  dispatched_at: z.string().datetime(),
  data: z.record(z.unknown()),
})

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const normalized = signature.startsWith('sha256=') ? signature.slice(7) : signature
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const actual = Buffer.from(normalized, 'hex')
  const wanted = Buffer.from(expected, 'hex')
  return actual.length === wanted.length && timingSafeEqual(actual, wanted)
}

export const Route = createFileRoute('/api/public/hooks/n8n-verify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text()
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? ''
        if (!secret) return Response.json({ ok: false, authorized: false, error: 'hmac_not_configured' }, { status: 503 })

        if (!verifySignature(rawBody, request.headers.get('x-impulsionando-signature'), secret)) {
          return Response.json({ ok: false, authorized: false, error: 'invalid_signature' }, { status: 401 })
        }

        let parsed: z.infer<typeof DispatcherPayloadSchema>
        try {
          parsed = DispatcherPayloadSchema.parse(JSON.parse(rawBody))
        } catch {
          return Response.json({ ok: false, authorized: false, error: 'invalid_dispatch_payload' }, { status: 422 })
        }

        return Response.json({
          ok: true,
          authorized: true,
          workflow_name: parsed.workflow_name,
          event_code: parsed.event_code,
          tenant_slug: parsed.tenant_slug,
          correlation_id: parsed.correlation_id,
        })
      },
      GET: async () => Response.json({ ok: true, auth: 'hmac', purpose: 'n8n_dispatch_verifier' }),
    },
  },
})
