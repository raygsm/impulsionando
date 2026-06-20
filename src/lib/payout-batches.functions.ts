// Consolidação de lotes de repasse + ações de pagamento.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'
import { runConsolidation } from './payout-consolidation'

export type LedgerStatus = 'scheduled' | 'pending' | 'processing' | 'paid' | 'retained' | 'failed' | 'cancelled'

/** Consolida eventos `approved` sem lote em 1 linha do ledger por empresa/período.
 *  Idempotente: roda por (company_id, period_start, period_end) único.
 *  Só staff pode chamar via UI (cron usa service_role).
 */
export const consolidatePayouts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; period_start: string; period_end: string }) =>
    z
      .object({
        company_id: z.string().uuid().optional(),
        period_start: z.string().min(10),
        period_end: z.string().min(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation(
      'payouts.consolidatePayouts',
      { user_id: context.userId, company_id: data.company_id ?? 'all' },
      async () => {
        const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
        if (!isStaff) throw new Error('Forbidden: staff only')
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        return runConsolidation(supabaseAdmin, {
          company_id: data.company_id,
          period_start: data.period_start,
          period_end: data.period_end,
        })
      },
    ),
  )

export async function runConsolidation(
  supabase: any,
  args: { company_id?: string; period_start: string; period_end: string },
): Promise<{ batches: number; events: number; retained: number }> {
  let q = supabase
    .from('core_payout_events')
    .select('id, company_id, gross_cents, fee_cents, net_cents, model_id')
    .eq('status', 'approved')
    .is('ledger_id', null)
    .gte('occurred_at', args.period_start)
    .lt('occurred_at', args.period_end)
  if (args.company_id) q = q.eq('company_id', args.company_id)
  const { data: events, error } = await q
  if (error) throw error
  if (!events?.length) return { batches: 0, events: 0, retained: 0 }

  // Agrupar por company_id
  const groups = new Map<string, typeof events>()
  for (const e of events) {
    const arr = groups.get(e.company_id) ?? []
    arr.push(e)
    groups.set(e.company_id, arr)
  }

  let batches = 0
  let retained = 0
  let totalEvents = 0

  for (const [company_id, group] of groups) {
    // min_payout do modelo ativo
    const { data: model } = await supabase
      .from('core_monetization_models')
      .select('id, min_payout_cents')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const gross = group.reduce((a: number, e: any) => a + (e.gross_cents ?? 0), 0)
    const fee = group.reduce((a: number, e: any) => a + (e.fee_cents ?? 0), 0)
    const net = group.reduce((a: number, e: any) => a + (e.net_cents ?? 0), 0)
    const min = model?.min_payout_cents ?? 0
    const isRetained = net < min

    // upsert idempotente por (company_id, period_start, period_end)
    const { data: existing } = await supabase
      .from('core_payout_ledger')
      .select('id')
      .eq('company_id', company_id)
      .eq('period_start', args.period_start)
      .eq('period_end', args.period_end)
      .maybeSingle()

    let ledger_id: string
    if (existing) {
      ledger_id = existing.id
      await supabase
        .from('core_payout_ledger')
        .update({
          gross_cents: gross,
          fee_cents: fee,
          net_cents: net,
          event_count: group.length,
          status: isRetained ? 'retained' : 'scheduled',
          retention_reason: isRetained ? `Abaixo do mínimo (${min} cents)` : null,
        })
        .eq('id', ledger_id)
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('core_payout_ledger')
        .insert({
          company_id,
          period_start: args.period_start,
          period_end: args.period_end,
          gross_cents: gross,
          fee_cents: fee,
          net_cents: net,
          event_count: group.length,
          status: isRetained ? 'retained' : 'scheduled',
          retention_reason: isRetained ? `Abaixo do mínimo (${min} cents)` : null,
        })
        .select('id')
        .single()
      if (insErr) throw insErr
      ledger_id = ins.id
    }

    // Marcar eventos como consolidados
    await supabase
      .from('core_payout_events')
      .update({ ledger_id, status: 'consolidated' })
      .in('id', group.map((e: any) => e.id))

    batches += 1
    totalEvents += group.length
    if (isRetained) retained += 1
  }

  return { batches, events: totalEvents, retained }
}

/** Lista lotes — RLS filtra por empresa (cliente) ou tudo (staff). */
export const listPayoutBatches = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; status?: LedgerStatus; limit?: number }) =>
    z
      .object({
        company_id: z.string().uuid().optional(),
        status: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('payouts.listPayoutBatches', { user_id: context.userId }, async () => {
      let q = context.supabase
        .from('core_payout_ledger')
        .select(
          'id, company_id, period_start, period_end, gross_cents, fee_cents, net_cents, event_count, status, provider, provider_payout_id, retention_reason, paid_at, marked_paid_at, receipt_url, companies:companies(name, niche)',
        )
        .order('period_end', { ascending: false })
        .limit(data.limit ?? 100)
      if (data.company_id) q = q.eq('company_id', data.company_id)
      if (data.status) q = q.eq('status', data.status)
      const { data: rows, error } = await q
      if (error) throw error
      return rows ?? []
    }),
  )

/** Detalhe de um lote: dados + eventos compondo. */
export const getPayoutBatch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ledger_id: string }) => z.object({ ledger_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) =>
    withInstrumentation('payouts.getPayoutBatch', { user_id: context.userId, ledger_id: data.ledger_id }, async () => {
      const { data: batch, error } = await context.supabase
        .from('core_payout_ledger')
        .select('*, companies:companies(name, niche)')
        .eq('id', data.ledger_id)
        .maybeSingle()
      if (error) throw error
      if (!batch) throw new Error('Lote não encontrado')

      const { data: events, error: evErr } = await context.supabase
        .from('core_payout_events')
        .select('id, event_type, gross_cents, fee_cents, net_cents, occurred_at, provider, provider_payment_id, status')
        .eq('ledger_id', data.ledger_id)
        .order('occurred_at', { ascending: false })
      if (evErr) throw evErr

      return { batch, events: events ?? [] }
    }),
  )

/** Marca lote como pago — staff only. */
export const markPayoutPaid = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ledger_id: string; provider_payout_id?: string; receipt_url?: string }) =>
    z
      .object({
        ledger_id: z.string().uuid(),
        provider_payout_id: z.string().optional(),
        receipt_url: z.string().url().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('payouts.markPayoutPaid', { user_id: context.userId, ledger_id: data.ledger_id }, async () => {
      const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
      if (!isStaff) throw new Error('Forbidden: staff only')
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const now = new Date().toISOString()
      const { error } = await supabaseAdmin
        .from('core_payout_ledger')
        .update({
          status: 'paid',
          provider_payout_id: data.provider_payout_id ?? null,
          receipt_url: data.receipt_url ?? null,
          paid_at: now,
          marked_paid_at: now,
          paid_by: context.userId,
        })
        .eq('id', data.ledger_id)
      if (error) throw error
      return { ok: true }
    }),
  )

/** Reabre lote (volta para scheduled) — staff only. */
export const reopenPayout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ledger_id: string }) => z.object({ ledger_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) =>
    withInstrumentation('payouts.reopenPayout', { user_id: context.userId, ledger_id: data.ledger_id }, async () => {
      const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
      if (!isStaff) throw new Error('Forbidden: staff only')
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const { error } = await supabaseAdmin
        .from('core_payout_ledger')
        .update({ status: 'scheduled', paid_at: null, marked_paid_at: null, paid_by: null })
        .eq('id', data.ledger_id)
      if (error) throw error
      return { ok: true }
    }),
  )
