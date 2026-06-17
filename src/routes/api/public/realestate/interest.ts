/**
 * Public endpoint — "Tenho interesse no imóvel" da vitrine pública.
 * POST /api/public/realestate/interest
 *
 * Body JSON:
 *  { companySlug, propertyId, kind?, contactName, contactEmail?, contactPhone?, contactWhatsapp?, message?, source?, utm?, hp? }
 *
 * Cria: lead (crm_leads) + interest (realestate_interests) + mensagem interna +
 *       histórico do imóvel + notificações in-app + 2 e-mails (cliente + imobiliária).
 *
 * Honeypot: campo `hp` deve ser vazio (anti-spam). Validação de input com Zod.
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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

export const Route = createFileRoute('/api/public/realestate/interest')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let parsed
        try {
          const json = await request.json()
          parsed = BodySchema.safeParse(json)
        } catch {
          return jsonResponse({ error: 'invalid_json' }, 400)
        }
        if (!parsed.success) {
          return jsonResponse({ error: 'invalid_input', issues: parsed.error.format() }, 422)
        }
        const data = parsed.data

        // Honeypot: silently succeed to confuse bots
        if (data.hp && data.hp.trim().length > 0) {
          return jsonResponse({ ok: true, interestId: null, leadId: null, ignored: true })
        }
        if (!data.contactEmail && !data.contactPhone && !data.contactWhatsapp) {
          return jsonResponse({ error: 'contact_required', message: 'Informe e-mail, telefone ou WhatsApp.' }, 422)
        }

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { notifyManagers, sendVitrineEmail, APP_BASE_URL } = await import('@/lib/realestate-vitrine-notify.server')

          // 1) Resolve company by slug + property
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('id, name, vitrine_enabled, public_slug')
            .eq('public_slug', data.companySlug)
            .eq('vitrine_enabled', true)
            .maybeSingle()
          if (!company) return jsonResponse({ error: 'company_not_found' }, 404)
          const companyId = (company as any).id as string
          const companyName = (company as any).name as string

          const { data: property } = await supabaseAdmin
            .from('realestate_properties')
            .select('id, title, reference_code, broker_user_id, company_id, is_published, status, approval_status')
            .eq('id', data.propertyId)
            .eq('company_id', companyId)
            .maybeSingle()
          if (!property || (property as any).is_published !== true || (property as any).status !== 'ativo' || (property as any).approval_status !== 'approved') {
            return jsonResponse({ error: 'property_unavailable' }, 404)
          }

          const propertyTitle = (property as any).title as string
          const referenceCode = (property as any).reference_code as string | null
          const brokerUserId = (property as any).broker_user_id as string | null

          // 2) Resolve / create lead
          const phoneOrWA = data.contactWhatsapp || data.contactPhone || null
          let leadId: string | null = null
          if (data.contactEmail) {
            const { data: existing } = await supabaseAdmin
              .from('crm_leads')
              .select('id')
              .eq('company_id', companyId)
              .eq('email', data.contactEmail)
              .limit(1)
              .maybeSingle()
            if (existing) leadId = (existing as any).id
          }
          if (!leadId && phoneOrWA) {
            const { data: existing } = await supabaseAdmin
              .from('crm_leads')
              .select('id')
              .eq('company_id', companyId)
              .eq('phone', phoneOrWA)
              .limit(1)
              .maybeSingle()
            if (existing) leadId = (existing as any).id
          }
          if (!leadId) {
            const { data: lead, error: leadErr } = await supabaseAdmin
              .from('crm_leads')
              .insert({
                company_id: companyId,
                name: data.contactName,
                email: data.contactEmail ?? null,
                phone: phoneOrWA,
                source: `vitrine:${data.source ?? 'vitrine'}`,
                status: 'new',
                tags: ['vitrine', 'interesse-imovel'],
                notes: data.message ?? null,
                owner_user_id: brokerUserId,
              })
              .select('id')
              .single()
            if (leadErr) throw leadErr
            leadId = (lead as any).id
          }

          // 3) Create interest
          const { data: interest, error: intErr } = await supabaseAdmin
            .from('realestate_interests')
            .insert({
              company_id: companyId,
              property_id: data.propertyId,
              lead_id: leadId,
              broker_user_id: brokerUserId,
              kind: data.kind,
              status: 'novo',
              contact_name: data.contactName,
              contact_email: data.contactEmail ?? null,
              contact_phone: data.contactPhone ?? null,
              contact_whatsapp: data.contactWhatsapp ?? null,
              message: data.message ?? null,
              source: data.source ?? 'vitrine',
              utm: data.utm ?? {},
              ip: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null,
              user_agent: request.headers.get('user-agent') ?? null,
              last_action_at: new Date().toISOString(),
            })
            .select('id')
            .single()
          if (intErr) throw intErr
          const interestId = (interest as any).id as string

          // 4) Internal message
          await supabaseAdmin.from('realestate_internal_messages').insert({
            company_id: companyId,
            channel: 'vitrine',
            request_kind: data.kind === 'visita' ? 'visita' : data.kind === 'avaliacao' ? 'avaliacao' : data.kind === 'contato' ? 'contato' : 'interesse',
            status: 'nova',
            property_id: data.propertyId,
            interest_id: interestId,
            lead_id: leadId,
            contact_name: data.contactName,
            contact_email: data.contactEmail ?? null,
            contact_phone: phoneOrWA,
            subject: `${data.kind === 'visita' ? 'Pedido de visita' : data.kind === 'avaliacao' ? 'Pedido de avaliação' : data.kind === 'contato' ? 'Solicitação de contato' : 'Interesse no imóvel'}${referenceCode ? ` ${referenceCode}` : ''}`,
            body: data.message ?? `${data.contactName} demonstrou interesse no imóvel ${propertyTitle}.`,
            assigned_user_id: brokerUserId,
          })

          // 5) Property history
          await supabaseAdmin.from('realestate_property_history').insert({
            company_id: companyId,
            property_id: data.propertyId,
            event_code: `interest.${data.kind}`,
            actor_lead_id: leadId,
            description: `${data.contactName} registrou ${data.kind} pela vitrine.`,
            payload: { interest_id: interestId, source: data.source, utm: data.utm ?? {} },
          })

          // 6) Notifications in-app + emails to agency (managers + broker)
          const actionUrl = `${APP_BASE_URL}/imobiliaria/interessados?id=${interestId}`
          const { contacts: managerContacts } = await notifyManagers({
            companyId,
            title: 'Novo interessado',
            message: `${data.contactName} — ${propertyTitle}${referenceCode ? ` (${referenceCode})` : ''}`,
            category: 'realestate.interest.new',
            severity: 'info',
            actionUrl,
            actionLabel: 'Abrir interessado',
          })

          // Add broker to email recipients (if any) and dedupe
          const brokerContacts: Array<{ email: string | null }> = []
          if (brokerUserId) {
            const { data: brokerRow } = await supabaseAdmin
              .from('user_profiles')
              .select('email')
              .eq('user_id', brokerUserId)
              .maybeSingle()
            if (brokerRow && (brokerRow as any).email) brokerContacts.push({ email: (brokerRow as any).email })
          }
          const allEmails = new Set<string>()
          for (const c of managerContacts) if (c.email) allEmails.add(c.email)
          for (const c of brokerContacts) if (c.email) allEmails.add(c.email)
          for (const email of allEmails) {
            await sendVitrineEmail({
              templateName: 'realestate-vitrine-interest-agency',
              to: email,
              templateData: {
                propertyTitle, referenceCode,
                customerName: data.contactName,
                customerEmail: data.contactEmail,
                customerPhone: phoneOrWA,
                message: data.message, kind: data.kind, source: data.source,
                actionUrl, receivedAt: new Date().toISOString(),
              },
              idempotencyKey: `re-vitrine-interest-agency-${interestId}-${email}`,
            })
          }

          // 7) Email to customer (confirmação)
          if (data.contactEmail) {
            await sendVitrineEmail({
              templateName: 'realestate-vitrine-interest-customer',
              to: data.contactEmail,
              templateData: {
                customerName: data.contactName,
                propertyTitle, referenceCode,
                companyName,
                propertyUrl: `${APP_BASE_URL}/imoveis/${data.companySlug}/${data.propertyId}`,
                receivedAt: new Date().toISOString(),
              },
              idempotencyKey: `re-vitrine-interest-customer-${interestId}`,
            })
          }

          return jsonResponse({ ok: true, interestId, leadId })
        } catch (err: any) {
          console.error('[/api/public/realestate/interest] error', err)
          return jsonResponse({ error: 'server_error', message: err?.message ?? 'unknown' }, 500)
        }
      },
    },
  },
})
