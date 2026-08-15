import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const PlanCode = z.enum(['ESSENCIAL', 'PRO', 'ENTERPRISE', 'WHITE_LABEL'])

const QuoteSchema = z.object({
  plan_code: PlanCode,
  contact_name: z.string().trim().min(2).max(120),
  contact_company: z.string().trim().min(2).max(160),
  contact_email: z.string().trim().email().max(180),
  contact_whatsapp: z.string().trim().min(8).max(40),
  contact_doc: z.string().trim().max(40).optional().default(''),
  accept_terms: z.literal(true),
})

/**
 * Solicitação comercial baseada exclusivamente no plano registrado em billing_plans.
 * Não abre checkout nem cria cobrança. Enquanto allow_direct_checkout=false, o fluxo é de proposta/contato.
 */
export const requestPlanQuote = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => QuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: plan, error: planError } = await supabaseAdmin
      .from('billing_plans')
      .select('id,code,name,status_comercial,is_active,show_on_site,show_in_checkout,allow_direct_checkout,route_to_quote,route_to_whatsapp,recurring_amount,setup_fee')
      .eq('code', data.plan_code)
      .eq('is_active', true)
      .maybeSingle()

    if (planError) return { ok: false as const, message: planError.message }
    if (!plan) return { ok: false as const, message: 'Plano indisponível.' }

    const correlationId = `billing-quote:${crypto.randomUUID()}`
    const { error: outboxError } = await supabaseAdmin.from('message_outbox').insert({
      event_code: 'billing_quote_requested',
      channel: 'email',
      recipient_email: data.contact_email.toLowerCase(),
      recipient_phone: data.contact_whatsapp,
      recipient_name: data.contact_name,
      subject: `Solicitação comercial — ${plan.name}`,
      body: `Recebemos sua solicitação para o plano ${plan.name}. Nossa equipe comercial dará continuidade ao atendimento.`,
      payload: {
        plan_code: plan.code,
        plan_name: plan.name,
        company: data.contact_company,
        document: data.contact_doc || null,
        whatsapp: data.contact_whatsapp,
        status_comercial: plan.status_comercial,
        direct_checkout_enabled: plan.allow_direct_checkout,
      },
      status: 'queued',
      reference_type: 'billing_plan',
      reference_id: String(plan.id),
      correlation_id: correlationId,
    })

    if (outboxError) return { ok: false as const, message: outboxError.message }

    return {
      ok: true as const,
      plan_code: plan.code,
      plan_name: plan.name,
      correlation_id: correlationId,
      direct_checkout_enabled: false,
      next_step: plan.route_to_whatsapp ? 'whatsapp' : 'commercial_contact',
    }
  })

/**
 * Fonte única de verdade para /contratar: lê somente billing_plans.
 * Nenhum preço é calculado no front ou derivado de salário mínimo.
 */
export const getContratarPricing = createServerFn({ method: 'GET' }).handler(async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data, error } = await supabase
    .from('billing_plans')
    .select('code,name,description,setup_fee,recurring_amount,cycle,status_comercial,min_contract_days,min_installments,included_module_count,extra_module_price,discount_percent,show_on_site,show_in_checkout,allow_direct_checkout,route_to_quote,route_to_whatsapp,cta,legal_text,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return {
    source_of_truth: 'billing_plans' as const,
    plans: data ?? [],
    direct_checkout_available: (data ?? []).some((plan) => plan.allow_direct_checkout && plan.show_in_checkout),
  }
})

export const listPublicPlans = createServerFn({ method: 'GET' }).handler(async () => {
  const pricing = await getContratarPricing()
  return pricing.plans.filter((plan) => plan.show_on_site)
})
