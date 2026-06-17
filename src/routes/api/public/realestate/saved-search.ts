/**
 * Public endpoint — "Cadastrar minha busca" da vitrine pública.
 * POST /api/public/realestate/saved-search
 *
 * Delegates business logic to processSavedSearch().
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const BodySchema = z.object({
  companySlug: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  contactWhatsapp: z.string().trim().max(40).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  operation: z.enum(['venda', 'locacao', 'venda_ou_locacao']).default('venda'),
  propertyTypes: z.array(z.string().trim().max(60)).default([]),
  cities: z.array(z.string().trim().max(120)).default([]),
  neighborhoods: z.array(z.string().trim().max(120)).default([]),
  priceMin: z.number().nonnegative().nullable().optional(),
  priceMax: z.number().nonnegative().nullable().optional(),
  bedroomsMin: z.number().int().min(0).max(20).default(0),
  bathroomsMin: z.number().int().min(0).max(20).default(0),
  parkingMin: z.number().int().min(0).max(20).default(0),
  areaMin: z.number().nonnegative().nullable().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
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

export const Route = createFileRoute('/api/public/realestate/saved-search')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let parsed
        try { parsed = BodySchema.safeParse(await request.json()) } catch { return json({ error: 'invalid_json' }, 400) }
        if (!parsed.success) return json({ error: 'invalid_input', issues: parsed.error.format() }, 422)
        const data = parsed.data
        if (data.hp && data.hp.trim().length > 0) return json({ ok: true, intentId: null, leadId: null, ignored: true })

        try {
          const { processSavedSearch } = await import('@/lib/realestate-vitrine-flow.server')
          const result = await processSavedSearch({
            companySlug: data.companySlug,
            contactName: data.contactName,
            contactEmail: data.contactEmail ?? null,
            contactPhone: data.contactPhone ?? null,
            contactWhatsapp: data.contactWhatsapp ?? null,
            operation: data.operation,
            propertyTypes: data.propertyTypes,
            cities: data.cities,
            neighborhoods: data.neighborhoods,
            priceMin: data.priceMin ?? null,
            priceMax: data.priceMax ?? null,
            bedroomsMin: data.bedroomsMin,
            bathroomsMin: data.bathroomsMin,
            parkingMin: data.parkingMin,
            areaMin: data.areaMin ?? null,
            notes: data.notes ?? null,
            source: data.source,
            utm: data.utm,
            ip: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
          })
          if (!result.ok) {
            if (result.code === 'company_not_found') return json({ error: 'company_not_found' }, 404)
            if (result.code === 'contact_required') return json({ error: 'contact_required', message: 'Informe e-mail, telefone ou WhatsApp.' }, 422)
          }
          return json({ ok: true, intentId: (result as any).intentId, leadId: (result as any).leadId, matchesCount: (result as any).matchesCount })
        } catch (err: any) {
          console.error('[/api/public/realestate/saved-search] error', err)
          return json({ error: 'server_error', message: err?.message ?? 'unknown' }, 500)
        }
      },
    },
  },
})
