/**
 * Pix manual charges — issue a Pix QR / copy-paste with a unique cents amount
 * per charge, so each incoming payment can be matched and the plan released.
 *
 * This is the bridge until Mercado Pago transparent checkout is finalized.
 * The same `confirmPixCharge` activation pathway will later be triggered by
 * the MP webhook (single integration point in the ecosystem).
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import {
  buildPixPayload,
  pixQrUrl,
  PIX_KEY_PLAIN,
  PIX_RECEBEDOR_SHORT,
  PIX_CIDADE,
} from '@/lib/pix'

const CreateInput = z.object({
  planCode: z.string().min(1),
  baseAmountCents: z.number().int().positive(),
  contractId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  payerName: z.string().optional(),
  payerDoc: z.string().optional(),
  payerEmail: z.string().email().optional(),
  payerWhatsapp: z.string().optional(),
  description: z.string().optional(),
})

type CreateOutput = {
  id: string
  amountCents: number
  amountFormatted: string
  payload: string
  qrUrl: string
  txid: string
  pixKey: string
  expiresAt: string
}

/**
 * Pick a free "unique cents" suffix (1..99) for the base amount such that no
 * other pending charge has the same total.
 */
async function reserveUniqueAmount(
  supabaseAdmin: any,
  baseCents: number,
): Promise<number> {
  // Strategy: try base+random(1..99) up to 30 times; fallback to scan.
  for (let i = 0; i < 30; i++) {
    const extra = 1 + Math.floor(Math.random() * 99)
    const candidate = baseCents + extra
    const { data, error } = await supabaseAdmin
      .from('billing_pix_charges')
      .select('id')
      .eq('unique_amount_cents', candidate)
      .eq('status', 'pending')
      .maybeSingle()
    if (error) throw error
    if (!data) return candidate
  }
  // Deterministic scan
  for (let extra = 1; extra <= 99; extra++) {
    const candidate = baseCents + extra
    const { data } = await supabaseAdmin
      .from('billing_pix_charges')
      .select('id')
      .eq('unique_amount_cents', candidate)
      .eq('status', 'pending')
      .maybeSingle()
    if (!data) return candidate
  }
  throw new Error('Sem centavos únicos livres no momento — tente novamente em alguns minutos.')
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Create a Pix charge. Authenticated; if you want to expose this publicly
 * (anonymous checkout), wrap it in a server route that validates a lead.
 */
export const createPixCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }): Promise<CreateOutput> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const uniqueCents = await reserveUniqueAmount(supabaseAdmin, data.baseAmountCents)
    const txid = `IMP${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`.slice(0, 25)

    const payload = buildPixPayload({
      pixKey: PIX_KEY_PLAIN,
      amount: uniqueCents / 100,
      merchantName: PIX_RECEBEDOR_SHORT,
      merchantCity: PIX_CIDADE,
      txid,
      description: data.description?.slice(0, 40),
    })

    const insert = {
      company_id: data.companyId ?? null,
      contract_id: data.contractId ?? null,
      plan_code: data.planCode,
      base_amount_cents: data.baseAmountCents,
      unique_amount_cents: uniqueCents,
      pix_payload: payload,
      pix_key: PIX_KEY_PLAIN,
      txid,
      status: 'pending' as const,
      payer_name: data.payerName ?? null,
      payer_doc: data.payerDoc ?? null,
      payer_email: data.payerEmail ?? null,
      payer_whatsapp: data.payerWhatsapp ?? null,
      notes: `Criado por ${context.userId}`,
    }

    const { data: row, error } = await supabaseAdmin
      .from('billing_pix_charges')
      .insert(insert)
      .select('id, expires_at')
      .single()
    if (error) throw new Error(error.message)

    return {
      id: row.id,
      amountCents: uniqueCents,
      amountFormatted: formatBRL(uniqueCents),
      payload,
      qrUrl: pixQrUrl(payload, 260),
      txid,
      pixKey: PIX_KEY_PLAIN,
      expiresAt: row.expires_at,
    }
  })

/**
 * Poll a charge's status (for the checkout page to flip to "paid" once admin
 * confirms — or, in the future, when the MP webhook posts).
 */
export const getPixChargeStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from('billing_pix_charges')
      .select('id, status, paid_at, unique_amount_cents, expires_at')
      .eq('id', data.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) throw new Error('Cobrança não encontrada.')
    return row
  })

/**
 * Admin-only: list pending charges so the financial team can confirm
 * payments by cross-checking the bank statement.
 */
export const listPendingPixCharges = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Error('Forbidden')

    const { data, error } = await context.supabase
      .from('billing_pix_charges')
      .select(
        'id, plan_code, base_amount_cents, unique_amount_cents, status, payer_name, payer_email, payer_whatsapp, contract_id, company_id, created_at, expires_at, paid_at',
      )
      .in('status', ['pending', 'paid'])
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return data ?? []
  })

/**
 * Admin-only: mark a charge as paid. This is the SAME activation pathway the
 * MP webhook will trigger later — keep all side effects (release plan,
 * activate subscription, send welcome email) inside this handler.
 */
export const confirmPixCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        receiptUrl: z.string().url().optional(),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Error('Forbidden')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: row, error } = await supabaseAdmin
      .from('billing_pix_charges')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        confirmed_by: context.userId,
        receipt_url: data.receiptUrl ?? null,
        notes: data.notes ?? null,
      })
      .eq('id', data.id)
      .eq('status', 'pending')
      .select('id, contract_id, company_id, plan_code, unique_amount_cents')
      .single()
    if (error) throw new Error(error.message)
    if (!row) throw new Error('Cobrança não está pendente ou já foi processada.')

    // If linked to a contract, advance it. Same activation surface MP webhook will hit.
    if (row.contract_id) {
      await supabaseAdmin
        .from('billing_contracts')
        .update({
          status: 'active',
          setup_paid_at: new Date().toISOString(),
          last_paid_at: new Date().toISOString(),
        })
        .eq('id', row.contract_id)
    }

    return { ok: true, id: row.id, contractId: row.contract_id }
  })

/**
 * Admin-only: cancel a charge (e.g. customer gave up, will redo).
 */
export const cancelPixCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Error('Forbidden')

    const { error } = await context.supabase
      .from('billing_pix_charges')
      .update({ status: 'cancelled' })
      .eq('id', data.id)
      .eq('status', 'pending')
    if (error) throw new Error(error.message)
    return { ok: true }
  })
