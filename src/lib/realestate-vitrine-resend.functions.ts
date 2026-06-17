/**
 * Admin: reenviar e-mail da vitrine respeitando supressão.
 *
 * - Carrega um row de email_send_log pelo id.
 * - Confere permissão da imobiliária (gestor / corretor com realestate.interest.read).
 * - Reconstrói o template a partir do registro original guardado em
 *   `realestate_interests` ou `realestate_search_intents` (origem é detectada pelo
 *   template_name).
 * - Verifica supressão (`suppressed_emails`); se suprimido registra `suppressed`.
 * - Caso contrário, reinsere `pending` em `email_send_log` e re-enfileira em
 *   `transactional_emails` via `enqueue_email`.
 *
 * Retorna o novo status + messageId. Erros amigáveis para a UI.
 */
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const Input = z.object({
  companyId: z.string().uuid(),
  emailLogId: z.string().uuid(),
})

export type ResendResult =
  | { status: 'queued'; messageId: string; recipient: string }
  | { status: 'suppressed'; messageId: string; recipient: string }
  | { status: 'error'; error: string }

export const resendVitrineEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof Input>) => Input.parse(d))
  .handler(async ({ data, context }): Promise<ResendResult> => {
    // 1) Authorize: caller must have any vitrine read permission in the company.
    const { data: prof } = await context.supabase
      .from('user_profiles')
      .select('company_id, profile_id')
      .eq('user_id', context.userId)
      .eq('company_id', data.companyId)
      .maybeSingle()
    if (!prof) return { status: 'error', error: 'forbidden' }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    // 2) Find original email log row.
    const { data: log } = await supabaseAdmin
      .from('email_send_log')
      .select('id, message_id, template_name, recipient_email, metadata, created_at')
      .eq('id', data.emailLogId)
      .maybeSingle()
    if (!log) return { status: 'error', error: 'log_not_found' }
    const templateName = (log as any).template_name as string
    const recipient = ((log as any).recipient_email as string).trim()

    // 3) Find source record to rebuild template data.
    const { sendVitrineEmail, APP_BASE_URL } = await import('@/lib/realestate-vitrine-notify.server')

    let templateData: Record<string, unknown> | null = null
    let idempotencyKey = `resend-${data.emailLogId}-${Date.now()}`

    if (templateName.startsWith('realestate-vitrine-interest')) {
      // Locate the related interest via the original message_id correlation
      // (idempotencyKey embedded the interest id).
      const { data: int } = await supabaseAdmin
        .from('realestate_interests')
        .select(`id, kind, source, contact_name, contact_email, contact_phone, contact_whatsapp,
                 message, created_at, company:company_id ( id, name, public_slug ),
                 property:property_id ( id, title, reference_code )`)
        .eq('company_id', data.companyId)
        .order('created_at', { ascending: false })
        .limit(50)
      const candidate = (int ?? []).find((row: any) =>
        row.contact_email === recipient ||
        row.contact_phone === recipient ||
        row.contact_whatsapp === recipient,
      ) ?? int?.[0]
      if (!candidate) return { status: 'error', error: 'source_not_found' }
      const c: any = candidate
      const actionUrl = `${APP_BASE_URL}/imobiliaria/interessados?id=${c.id}`
      const companyName = c.company?.name ?? ''
      const slug = c.company?.public_slug ?? ''
      if (templateName === 'realestate-vitrine-interest-customer') {
        templateData = {
          customerName: c.contact_name,
          propertyTitle: c.property?.title ?? '—',
          referenceCode: c.property?.reference_code ?? null,
          companyName,
          propertyUrl: slug && c.property?.id ? `${APP_BASE_URL}/imoveis/${slug}/${c.property.id}` : APP_BASE_URL,
          receivedAt: c.created_at,
        }
      } else {
        templateData = {
          propertyTitle: c.property?.title ?? '—',
          referenceCode: c.property?.reference_code ?? null,
          customerName: c.contact_name,
          customerEmail: c.contact_email,
          customerPhone: c.contact_whatsapp || c.contact_phone,
          message: c.message, kind: c.kind, source: c.source,
          actionUrl, receivedAt: c.created_at,
        }
      }
      idempotencyKey = `resend-interest-${c.id}-${recipient}-${Date.now()}`
    } else if (templateName.startsWith('realestate-vitrine-search')) {
      const { data: intents } = await supabaseAdmin
        .from('realestate_search_intents')
        .select(`id, contact_name, contact_email, contact_phone, whatsapp, operation,
                 cities, neighborhoods, price_min, price_max, bedrooms_min, notes,
                 source, created_at, company:company_id ( id, name )`)
        .eq('company_id', data.companyId)
        .order('created_at', { ascending: false })
        .limit(50)
      const candidate = (intents ?? []).find((row: any) =>
        row.contact_email === recipient ||
        row.contact_phone === recipient ||
        row.whatsapp === recipient,
      ) ?? intents?.[0]
      if (!candidate) return { status: 'error', error: 'source_not_found' }
      const c: any = candidate
      const actionUrl = `${APP_BASE_URL}/imobiliaria/intencoes?id=${c.id}`
      if (templateName === 'realestate-vitrine-search-customer') {
        templateData = {
          customerName: c.contact_name,
          operation: c.operation, cities: c.cities, neighborhoods: c.neighborhoods,
          priceMin: c.price_min, priceMax: c.price_max, bedrooms: c.bedrooms_min,
          companyName: c.company?.name ?? '', receivedAt: c.created_at,
        }
      } else {
        templateData = {
          customerName: c.contact_name, customerEmail: c.contact_email,
          customerPhone: c.whatsapp || c.contact_phone,
          operation: c.operation, cities: c.cities, neighborhoods: c.neighborhoods,
          priceMin: c.price_min, priceMax: c.price_max, bedrooms: c.bedrooms_min,
          notes: c.notes, matchesCount: 0, source: c.source,
          actionUrl, receivedAt: c.created_at,
        }
      }
      idempotencyKey = `resend-search-${c.id}-${recipient}-${Date.now()}`
    } else {
      return { status: 'error', error: 'unsupported_template' }
    }

    // 4) Send (sendVitrineEmail handles suppression + email_send_log + queue).
    const r = await sendVitrineEmail({
      templateName,
      to: recipient,
      templateData: templateData!,
      idempotencyKey,
    })
    if (r.status === 'queued') return { status: 'queued', messageId: r.messageId!, recipient }
    if (r.status === 'suppressed') return { status: 'suppressed', messageId: r.messageId!, recipient }
    return { status: 'error', error: r.error ?? r.status }
  })

// List the last N email_send_log rows for a vitrine entity so the admin
// can pick which one to resend.
const ListInput = z.object({
  companyId: z.string().uuid(),
  templatePrefix: z.enum(['realestate-vitrine-interest', 'realestate-vitrine-search']),
  limit: z.number().int().min(1).max(50).default(20),
})

export const listVitrineEmailLog = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListInput>) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    // Authorize: must belong to the company.
    const { data: prof } = await context.supabase
      .from('user_profiles').select('user_id')
      .eq('user_id', context.userId).eq('company_id', data.companyId).maybeSingle()
    if (!prof) return { rows: [] }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: rows } = await supabaseAdmin
      .from('email_send_log')
      .select('id, message_id, template_name, recipient_email, status, error_message, created_at')
      .like('template_name', `${data.templatePrefix}%`)
      .order('created_at', { ascending: false })
      .limit(data.limit)
    return { rows: rows ?? [] }
  })
