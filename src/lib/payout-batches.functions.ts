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
