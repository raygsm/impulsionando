import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { buildPixPayload, pixQrUrl, PIX_KEY_PLAIN, PIX_RECEBEDOR_SHORT, PIX_CIDADE } from '@/lib/pix'

const PlanCode = z.enum(['ESSENCIAL', 'PRO', 'ENTERPRISE'])
const CreateInput = z.object({
  planCode: PlanCode,
  acceptTerms: z.literal(true),
  payerName: z.string().min(1).max(200),
  payerDoc: z.string().max(40).optional(),
  payerEmail: z.string().email(),
  payerWhatsapp: z.string().max(40).optional(),
  description: z.string().max(120).optional(),
})

async function currentCompanyId(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc('current_user_company_id')
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Sua conta ainda não está vinculada a uma empresa.')
  return data as string
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function reserveUniqueAmount(supabaseAdmin: any, baseCents: number): Promise<number> {
  for (let i = 0; i < 30; i++) {
    const candidate = baseCents + 1 + Math.floor(Math.random() * 99)
    const { data } = await supabaseAdmin.from('billing_pix_charges').select('id').eq('unique_amount_cents', candidate).eq('status', 'pending').maybeSingle()
    if (!data) return candidate
  }
  for (let extra = 1; extra <= 99; extra++) {
    const candidate = baseCents + extra
    const { data } = await supabaseAdmin.from('billing_pix_charges').select('id').eq('unique_amount_cents', candidate).eq('status', 'pending').maybeSingle()
    if (!data) return candidate
  }
  throw new Error('Sem identificadores Pix livres no momento. Tente novamente em alguns minutos.')
}

export const getInitialCheckoutQuote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ planCode: PlanCode }).parse(input))
  .handler(async ({ data, context }) => {
    await currentCompanyId(context.supabase)
    const { data: plan, error } = await context.supabase
      .from('billing_plans')
      .select('id,code,name,description,legal_text,recurring_amount,setup_fee,due_day,min_contract_days')
      .eq('code', data.planCode)
      .eq('is_active', true)
      .single()
    if (error || !plan) throw new Error(error?.message ?? 'Plano indisponível.')
    const { data: quote, error: qe } = await context.supabase.rpc('billing_initial_contract_quote', { p_plan_id: plan.id, p_effective_date: new Date().toISOString().slice(0, 10) })
    if (qe) throw new Error(qe.message)
    return { plan, quote }
  })

export const createPixCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { createHash, randomUUID } = await import('node:crypto')
    const companyId = await currentCompanyId(context.supabase)

    const { data: plan, error: pe } = await context.supabase
      .from('billing_plans')
      .select('id,code,name,legal_text')
      .eq('code', data.planCode)
      .eq('is_active', true)
      .single()
    if (pe || !plan) throw new Error(pe?.message ?? 'Plano indisponível.')
    if (!plan.legal_text?.trim()) throw new Error('Termos comerciais do plano não configurados.')

    const termsVersion = `billing-${plan.code.toLowerCase()}-2026-08`
    const termsHash = createHash('sha256').update(plan.legal_text.trim(), 'utf8').digest('hex')
    const idempotencyKey = `pix:${companyId}:${plan.id}:${randomUUID()}`

    const { data: sessionResult, error: se } = await context.supabase.rpc('billing_create_initial_checkout_session', {
      p_company_id: companyId,
      p_plan_id: plan.id,
      p_contact_name: data.payerName,
      p_contact_email: data.payerEmail,
      p_contact_phone: data.payerWhatsapp ?? null,
      p_contact_doc: data.payerDoc ?? null,
      p_terms_version: termsVersion,
      p_terms_hash: termsHash,
      p_idempotency_key: idempotencyKey,
      p_accepted_ip: null,
    })
    if (se) throw new Error(se.message)
    const sessionId = String((sessionResult as any).session_id)
    const quote = (sessionResult as any).quote
    const baseAmountCents = Math.round(Number(quote.initial_total) * 100)
    if (!Number.isFinite(baseAmountCents) || baseAmountCents <= 0) throw new Error('Valor canônico de checkout inválido.')

    const uniqueCents = await reserveUniqueAmount(supabaseAdmin, baseAmountCents)
    const txid = `IMP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`.slice(0, 25)
    const payload = buildPixPayload({ pixKey: PIX_KEY_PLAIN, amount: uniqueCents / 100, merchantName: PIX_RECEBEDOR_SHORT, merchantCity: PIX_CIDADE, txid, description: data.description?.slice(0, 40) })

    const { data: row, error } = await supabaseAdmin.from('billing_pix_charges').insert({
      company_id: companyId,
      contract_id: null,
      checkout_session_id: sessionId,
      plan_code: plan.code,
      base_amount_cents: baseAmountCents,
      unique_amount_cents: uniqueCents,
      pix_payload: payload,
      pix_key: PIX_KEY_PLAIN,
      txid,
      status: 'pending',
      payer_name: data.payerName,
      payer_doc: data.payerDoc ?? null,
      payer_email: data.payerEmail,
      payer_whatsapp: data.payerWhatsapp ?? null,
      notes: `Checkout canônico criado por ${context.userId}`,
      reconciliation_metadata: { terms_version: termsVersion, terms_hash: termsHash, quote },
    }).select('id,expires_at').single()
    if (error) throw new Error(error.message)

    return {
      id: row.id,
      checkoutSessionId: sessionId,
      baseAmountCents,
      amountCents: uniqueCents,
      amountFormatted: formatBRL(uniqueCents),
      canonicalAmountFormatted: formatBRL(baseAmountCents),
      payload,
      qrUrl: pixQrUrl(payload, 260),
      txid,
      pixKey: PIX_KEY_PLAIN,
      expiresAt: row.expires_at,
      quote,
    }
  })

export const getPixChargeStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from('billing_pix_charges').select('id,status,paid_at,unique_amount_cents,expires_at,contract_id').eq('id', data.id).maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) throw new Error('Cobrança não encontrada.')
    return row
  })

const ListInput = z.object({ statuses: z.array(z.enum(['pending','paid','expired','cancelled'])).optional(), fromISO: z.string().datetime().optional(), toISO: z.string().datetime().optional(), planCode: z.string().optional(), search: z.string().optional(), limit: z.number().int().min(1).max(500).optional() }).optional()
export const listPendingPixCharges = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => ListInput.parse(input)).handler(async ({ data, context }) => {
  const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  const { data: staff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
  if (!isAdmin && !staff) throw new Error('Forbidden')
  let q:any = context.supabase.from('billing_pix_charges').select('id,plan_code,base_amount_cents,unique_amount_cents,status,payer_name,payer_email,payer_whatsapp,contract_id,company_id,checkout_session_id,created_at,expires_at,paid_at,receipt_url,txid,notes').order('created_at',{ascending:false}).limit(data?.limit??200)
  q=q.in('status',data?.statuses??['pending','paid']); if(data?.fromISO)q=q.gte('created_at',data.fromISO); if(data?.toISO)q=q.lte('created_at',data.toISO); if(data?.planCode)q=q.eq('plan_code',data.planCode)
  if(data?.search){const s=data.search.trim();q=q.or(`payer_name.ilike.%${s}%,payer_email.ilike.%${s}%,payer_whatsapp.ilike.%${s}%,txid.ilike.%${s}%`)}
  const {data:rows,error}=await q;if(error)throw new Error(error.message);return rows??[]
})

export const countPendingPixCharges = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const {data:isAdmin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});const {data:staff}=await context.supabase.rpc('is_impulsionando_staff',{_user:context.userId});if(!isAdmin&&!staff)return{count:0};const{count}=await context.supabase.from('billing_pix_charges').select('id',{count:'exact',head:true}).eq('status','pending');return{count:count??0}
})

export const confirmPixCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id:z.string().uuid(),receiptUrl:z.string().url().optional(),notes:z.string().max(500).optional() }).parse(input))
  .handler(async ({data,context})=>{
    const {data:isAdmin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});const{data:staff}=await context.supabase.rpc('is_impulsionando_staff',{_user:context.userId});if(!isAdmin&&!staff)throw new Error('Forbidden')
    const{ supabaseAdmin }=await import('@/integrations/supabase/client.server');const now=new Date().toISOString()
    const{data:row,error}=await supabaseAdmin.from('billing_pix_charges').update({status:'paid',paid_at:now,confirmed_by:context.userId,receipt_url:data.receiptUrl??null,...(data.notes!==undefined?{notes:data.notes}:{})}).eq('id',data.id).eq('status','pending').select('id').single();if(error||!row)throw new Error(error?.message??'Cobrança não está pendente.')
    const{data:finalized,error:fe}=await supabaseAdmin.rpc('billing_finalize_manual_pix_charge',{p_charge_id:row.id});if(fe)throw new Error(fe.message)
    return{ok:true,id:row.id,finalized}
  })

export const cancelPixCharge=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid()}).parse(input)).handler(async({data,context})=>{const{data:isAdmin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});const{data:staff}=await context.supabase.rpc('is_impulsionando_staff',{_user:context.userId});if(!isAdmin&&!staff)throw new Error('Forbidden');const{error}=await context.supabase.from('billing_pix_charges').update({status:'cancelled'}).eq('id',data.id).eq('status','pending');if(error)throw new Error(error.message);return{ok:true}})
export const updatePixReceipt=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid(),receiptUrl:z.string().url().nullable(),notes:z.string().max(500).optional()}).parse(input)).handler(async({data,context})=>{const{data:isAdmin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});const{data:staff}=await context.supabase.rpc('is_impulsionando_staff',{_user:context.userId});if(!isAdmin&&!staff)throw new Error('Forbidden');const{error}=await context.supabase.from('billing_pix_charges').update({receipt_url:data.receiptUrl,...(data.notes!==undefined?{notes:data.notes}:{})}).eq('id',data.id);if(error)throw new Error(error.message);return{ok:true}})
