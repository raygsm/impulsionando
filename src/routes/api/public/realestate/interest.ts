/**
 * Public endpoint — "Tenho interesse no imóvel" da vitrine pública.
 * POST /api/public/realestate/interest
 *
 * Delegates business logic to processInterest() so the same code path is
 * exercised by integration tests.
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const BodySchema = z.object({
  companySlug: z.string().trim().min(1).max(120),
  propertyId: z.string().uuid(),
  kind: z.enum(['interesse', 'visita', 'avaliacao', 'contato', 'proposta']).optional().default('interesse'),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  contactWhatsapp: z.string().trim().max(40).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  message: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  source: z.string().trim().max(60).optional().default('vitrine'),
  utm: z.record(z.string(), z.string()).optional().default({}),
  hp: z.string().optional(),
})

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...corsHeaders } })

export const Route = createFileRoute('/api/public/realestate/interest')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let parsed
        try { parsed = BodySchema.safeParse(await request.json()) } catch { return json({ error: 'invalid_json' }, 400) }
        if (!parsed.success) return json({ error: 'invalid_input', issues: parsed.error.format() }, 422)
        const data = parsed.data
        if (data.hp && data.hp.trim().length > 0) return json({ ok: true, interestId: null, leadId: null, ignored: true })

        try {
          const { processInterest } = await import('@/lib/realestate-vitrine-flow.server')
          const result = await processInterest({
            companySlug: data.companySlug,
            propertyId: data.propertyId,
            kind: data.kind,
            contactName: data.contactName,
            contactEmail: data.contactEmail ?? null,
            contactPhone: data.contactPhone ?? null,
            contactWhatsapp: data.contactWhatsapp ?? null,
            message: data.message ?? null,
            source: data.source,
            utm: data.utm,
            ip: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
          })
          if (!result.ok) {
            if (result.code === 'company_not_found') return json({ error: 'company_not_found' }, 404)
            if (result.code === 'property_unavailable') return json({ error: 'property_unavailable' }, 404)
            if (result.code === 'contact_required') return json({ error: 'contact_required', message: 'Informe e-mail, telefone ou WhatsApp.' }, 422)
          }
          return json({ ok: true, interestId: (result as any).interestId, leadId: (result as any).leadId })
        } catch (err: any) {
          console.error('[/api/public/realestate/interest] error', err)
          return json({ error: 'server_error', message: err?.message ?? 'unknown' }, 500)
        }
      },
    },
  },
})
