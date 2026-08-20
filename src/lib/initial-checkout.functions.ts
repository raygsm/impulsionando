import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const PlanCode = z.enum(['ESSENCIAL', 'PRO', 'ENTERPRISE'])
const StartInput = z.object({
  planCode: PlanCode,
  acceptTerms: z.literal(true),
  payerName: z.string().trim().min(1).max(200),
  payerDoc: z.string().trim().max(40).optional(),
  payerEmail: z.string().trim().email(),
  payerWhatsapp: z.string().trim().max(40).optional(),
})

async function currentCompanyId(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc('current_user_company_id')
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Sua conta ainda não está vinculada a uma empresa.')
  return String(data)
}

export const getInitialCheckoutOffer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ planCode: PlanCode }).parse(input))
  .handler(async ({ data, context }) => {
    await currentCompanyId(context.supabase)
    const { data: plan, error } = await context.supabase
      .from('billing_plans')
      .select('id,code,name,description,legal_text,recurring_amount,setup_fee,due_day,min_contract_days,included_module_count')
      .eq('code', data.planCode).eq('is_active', true).single()
    if (error || !plan) throw new Error(error?.message ?? 'Plano indisponível.')
    const { data: quote, error: quoteError } = await context.supabase.rpc('billing_initial_contract_quote', {
      p_plan_id: plan.id,
      p_effective_date: new Date().toISOString().slice(0, 10),
    })
    if (quoteError) throw new Error(quoteError.message)
    return { plan, quote }
  })

export const createInitialCheckoutPix = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data, context }) => {
    const { createHash, randomUUID } = await import('node:crypto')
    const companyId = await currentCompanyId(context.supabase)
    const { data: plan, error: planError } = await context.supabase
      .from('billing_plans').select('id,code,name,legal_text').eq('code', data.planCode).eq('is_active', true).single()
    if (planError || !plan) throw new Error(planError?.message ?? 'Plano indisponível.')
    if (!plan.legal_text?.trim()) throw new Error('Termos comerciais do plano não configurados.')

    const termsVersion = `billing-${plan.code.toLowerCase()}-2026-08`
    const termsHash = createHash('sha256').update(plan.legal_text.trim(), 'utf8').digest('hex')
    const { data: sessionResult, error: sessionError } = await context.supabase.rpc('billing_create_initial_checkout_session', {
      p_company_id: companyId,
      p_plan_id: plan.id,
      p_contact_name: data.payerName,
      p_contact_email: data.payerEmail,
      p_contact_phone: data.payerWhatsapp ?? null,
      p_contact_doc: data.payerDoc ?? null,
      p_terms_version: termsVersion,
      p_terms_hash: termsHash,
      p_idempotency_key: `mp:${companyId}:${plan.id}:${randomUUID()}`,
      p_accepted_ip: null,
    })
    if (sessionError) throw new Error(sessionError.message)
    const checkoutSessionId = String((sessionResult as any)?.session_id ?? '')
    if (!checkoutSessionId) throw new Error('Sessão de checkout não criada.')

    const { data: edgeData, error: edgeError } = await context.supabase.functions.invoke('core-initial-checkout-payment', {
      body: { checkout_session_id: checkoutSessionId },
    })
    if (edgeError) throw new Error(edgeError.message)
    if (!edgeData?.ok || !edgeData?.payment) throw new Error(edgeData?.error ?? 'Não foi possível gerar o Pix Mercado Pago.')

    return {
      checkoutSessionId,
      paymentId: String(edgeData.payment.id),
      mpPaymentId: String(edgeData.payment.mp_payment_id ?? ''),
      status: String(edgeData.payment.status ?? 'pending'),
      amountCents: Number(edgeData.payment.amount_cents ?? 0),
      qrCode: String(edgeData.payment.pix_qr_code ?? ''),
      qrCodeBase64: String(edgeData.payment.pix_qr_code_base64 ?? ''),
      expiresAt: edgeData.payment.pix_expires_at ? String(edgeData.payment.pix_expires_at) : null,
      quote: edgeData.quote ?? (sessionResult as any)?.quote ?? null,
    }
  })

export const getInitialCheckoutPaymentStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ checkoutSessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await currentCompanyId(context.supabase)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('billing_checkout_sessions')
      .select('id,status,billing_contract_id,mpago_payment_id,customer_company_id')
      .eq('id', data.checkoutSessionId).eq('customer_company_id', companyId).maybeSingle()
    if (sessionError) throw new Error(sessionError.message)
    if (!session) throw new Error('Checkout não encontrado.')

    let payment: any = null
    if (session.mpago_payment_id) {
      const res = await supabaseAdmin.from('mpago_payments').select('id,status,approved_at,pix_expires_at').eq('id', session.mpago_payment_id).maybeSingle()
      if (res.error) throw new Error(res.error.message)
      payment = res.data
    }
    if (payment?.status === 'approved' && session.status !== 'completed') {
      const finalized = await supabaseAdmin.rpc('billing_finalize_initial_checkout', { p_checkout_session_id: session.id })
      if (finalized.error) throw new Error(finalized.error.message)
      const refreshed = await supabaseAdmin.from('billing_checkout_sessions').select('status,billing_contract_id').eq('id', session.id).single()
      return { status: payment.status, checkoutStatus: refreshed.data?.status ?? session.status, contractId: refreshed.data?.billing_contract_id ?? null, completed: refreshed.data?.status === 'completed' }
    }
    return { status: payment?.status ?? 'pending', checkoutStatus: session.status, contractId: session.billing_contract_id ?? null, completed: session.status === 'completed' }
  })
