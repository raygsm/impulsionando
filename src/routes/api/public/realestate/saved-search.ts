/**
 * Public endpoint — "Cadastrar minha busca" da vitrine pública.
 * POST /api/public/realestate/saved-search
 *
 * Cria: lead + search_intent + mensagem interna + histórico + notificações
 *       + 2 e-mails. Calcula matches (estoque compatível) e envia contagem.
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
  propertyTypes: z.array(z.enum(['apartamento', 'casa', 'casa_condominio', 'chacara', 'cobertura', 'galpao', 'kitnet', 'loja', 'outro', 'sala_comercial', 'sitio', 'studio', 'terreno'])).default([]),
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
        if (!data.contactEmail && !data.contactPhone && !data.contactWhatsapp) {
          return json({ error: 'contact_required', message: 'Informe e-mail, telefone ou WhatsApp.' }, 422)
        }

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { notifyManagers, sendVitrineEmail, APP_BASE_URL } = await import('@/lib/realestate-vitrine-notify.server')

          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('id, name')
            .eq('public_slug', data.companySlug)
            .eq('vitrine_enabled', true)
            .maybeSingle()
          if (!company) return json({ error: 'company_not_found' }, 404)
          const companyId = (company as any).id as string
          const companyName = (company as any).name as string

          const phoneOrWA = data.contactWhatsapp || data.contactPhone || null

          // Lead resolution / creation
          let leadId: string | null = null
          if (data.contactEmail) {
            const { data: existing } = await supabaseAdmin
              .from('crm_leads').select('id')
              .eq('company_id', companyId).eq('email', data.contactEmail).limit(1).maybeSingle()
            if (existing) leadId = (existing as any).id
          }
          if (!leadId && phoneOrWA) {
            const { data: existing } = await supabaseAdmin
              .from('crm_leads').select('id')
              .eq('company_id', companyId).eq('phone', phoneOrWA).limit(1).maybeSingle()
            if (existing) leadId = (existing as any).id
          }
          if (!leadId) {
            const { data: lead, error } = await supabaseAdmin.from('crm_leads').insert({
              company_id: companyId,
              name: data.contactName,
              email: data.contactEmail ?? null,
              phone: phoneOrWA,
              source: `vitrine:${data.source ?? 'vitrine'}`,
              status: 'new',
              tags: ['vitrine', 'busca-salva'],
              notes: data.notes ?? null,
            }).select('id').single()
            if (error) throw error
            leadId = (lead as any).id
          }

          // Create search_intent
          const { data: intent, error: intentErr } = await supabaseAdmin.from('realestate_search_intents').insert({
            company_id: companyId,
            lead_id: leadId,
            contact_name: data.contactName,
            contact_email: data.contactEmail ?? null,
            contact_phone: phoneOrWA,
            whatsapp: data.contactWhatsapp ?? null,
            operation: data.operation,
            property_types: data.propertyTypes,
            price_min: data.priceMin ?? null,
            price_max: data.priceMax ?? null,
            area_min: data.areaMin ?? null,
            bedrooms_min: data.bedroomsMin,
            bathrooms_min: data.bathroomsMin,
            parking_min: data.parkingMin,
            cities: data.cities,
            neighborhoods: data.neighborhoods,
            status: 'ativo',
            notes: data.notes ?? null,
            source: data.source ?? 'vitrine',
            utm: data.utm ?? {},
            ip: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null,
            user_agent: request.headers.get('user-agent') ?? null,
          }).select('id').single()
          if (intentErr) throw intentErr
          const intentId = (intent as any).id as string

          // Matches count (best-effort): active + published, type + operation + city filter
          let matchesCount = 0
          try {
            let q = supabaseAdmin.from('realestate_properties').select('id', { count: 'exact', head: true })
              .eq('company_id', companyId).eq('is_published', true).eq('status', 'ativo').eq('approval_status', 'approved')
            if (data.operation !== 'venda_ou_locacao') q = q.eq('operation', data.operation)
            if (data.propertyTypes.length) q = q.in('property_type', data.propertyTypes)
            if (data.cities.length) q = q.in('city', data.cities)
            if (data.bedroomsMin > 0) q = q.gte('bedrooms', data.bedroomsMin)
            const { count } = await q
            matchesCount = count ?? 0
          } catch (err) { console.warn('matches count failed', err) }

          // Internal message
          await supabaseAdmin.from('realestate_internal_messages').insert({
            company_id: companyId,
            channel: 'vitrine',
            request_kind: 'busca',
            status: 'nova',
            intent_id: intentId,
            lead_id: leadId,
            contact_name: data.contactName,
            contact_email: data.contactEmail ?? null,
            contact_phone: phoneOrWA,
            subject: `Nova busca cadastrada — ${data.contactName}`,
            body: `Cliente cadastrou busca pela vitrine. Imóveis compatíveis no estoque: ${matchesCount}.${data.notes ? `\n\nObservações: ${data.notes}` : ''}`,
          })

          // Notifications + emails to agency
          const actionUrl = `${APP_BASE_URL}/imobiliaria/intencoes?id=${intentId}`
          const { contacts: managerContacts } = await notifyManagers({
            companyId,
            title: 'Nova busca salva',
            message: `${data.contactName} cadastrou uma nova busca (${matchesCount} compatíveis).`,
            category: 'realestate.search.new',
            severity: matchesCount > 0 ? 'success' : 'info',
            actionUrl,
            actionLabel: 'Abrir busca',
          })

          for (const c of managerContacts) {
            if (!c.email) continue
            await sendVitrineEmail({
              templateName: 'realestate-vitrine-search-agency',
              to: c.email,
              templateData: {
                customerName: data.contactName,
                customerEmail: data.contactEmail,
                customerPhone: phoneOrWA,
                operation: data.operation,
                cities: data.cities,
                neighborhoods: data.neighborhoods,
                priceMin: data.priceMin ?? null,
                priceMax: data.priceMax ?? null,
                bedrooms: data.bedroomsMin,
                notes: data.notes,
                matchesCount,
                source: data.source,
                actionUrl,
                receivedAt: new Date().toISOString(),
              },
              idempotencyKey: `re-vitrine-search-agency-${intentId}-${c.email}`,
            })
          }

          // Customer confirmation
          if (data.contactEmail) {
            await sendVitrineEmail({
              templateName: 'realestate-vitrine-search-customer',
              to: data.contactEmail,
              templateData: {
                customerName: data.contactName,
                operation: data.operation,
                cities: data.cities,
                neighborhoods: data.neighborhoods,
                priceMin: data.priceMin ?? null,
                priceMax: data.priceMax ?? null,
                bedrooms: data.bedroomsMin,
                companyName,
                receivedAt: new Date().toISOString(),
              },
              idempotencyKey: `re-vitrine-search-customer-${intentId}`,
            })
          }

          return json({ ok: true, intentId, leadId, matchesCount })
        } catch (err: any) {
          console.error('[/api/public/realestate/saved-search] error', err)
          return json({ error: 'server_error', message: err?.message ?? 'unknown' }, 500)
        }
      },
    },
  },
})
