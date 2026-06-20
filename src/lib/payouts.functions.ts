// Dashboards de monetização — leitura de eventos e ledger.
// RLS aplica: cliente vê só sua empresa; staff vê tudo.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'

export type PayoutEventStatus = 'pending' | 'approved' | 'refunded' | 'chargeback' | 'cancelled' | 'failed'

/** Lista empresas que o usuário enxerga (via RLS de companies). Usado p/ menu. */
export const listMyCompanies = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('payouts.listMyCompanies', { user_id: context.userId }, async () => {
      const { data, error } = await context.supabase
        .from('companies')
        .select('id, name, trade_name, niche')
        .order('name')
        .limit(50)
      if (error) throw error
      return data ?? []
    }),
  )


/** Resumo de monetização para uma empresa (KPIs + últimos eventos). */
export const getCompanyMonetization = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; limit?: number }) =>
    z.object({ company_id: z.string().uuid(), limit: z.number().int().min(1).max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation(
      'payouts.getCompanyMonetization',
      { user_id: context.userId, company_id: data.company_id },
      async () => {
        const limit = data.limit ?? 50
        const { data: events, error } = await context.supabase
          .from('core_payout_events')
          .select(
            'id, event_type, gross_cents, fee_cents, net_cents, percent_bps_applied, rule_version, provider, provider_payment_id, status, occurred_at, approved_at, metadata',
          )
          .eq('company_id', data.company_id)
          .order('occurred_at', { ascending: false })
          .limit(limit)
        if (error) throw error

        const { data: ledger, error: ledErr } = await context.supabase
          .from('core_payout_ledger')
          .select('id, period_start, period_end, gross_cents, fee_cents, net_cents, event_count, status, provider, provider_payout_id, receipt_url, paid_at')
          .eq('company_id', data.company_id)
          .order('period_end', { ascending: false })
          .limit(24)
        if (ledErr) throw ledErr

        const approved = (events ?? []).filter((e) => e.status === 'approved')
        const summary = {
          gross_total: approved.reduce((a, e) => a + (e.gross_cents ?? 0), 0),
          fee_total: approved.reduce((a, e) => a + (e.fee_cents ?? 0), 0),
          net_total: approved.reduce((a, e) => a + (e.net_cents ?? 0), 0),
          events_count: approved.length,
          pending_count: (events ?? []).filter((e) => e.status === 'pending').length,
        }

        return { summary, events: events ?? [], ledger: ledger ?? [] }
      },
    ),
  )


/** Visão CORE — agrega por empresa (staff). */
export const getGlobalPayoutOverview = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('payouts.getGlobalPayoutOverview', { user_id: context.userId }, async () => {
      const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', { _user: context.userId })
      if (!isStaff) throw new Error('Forbidden: staff only')

      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await context.supabase
        .from('core_payout_events')
        .select('company_id, gross_cents, fee_cents, net_cents, status, occurred_at, companies:companies(name, niche)')
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(5000)
      if (error) throw error

      const rows = data ?? []
      const approved = rows.filter((r) => r.status === 'approved')
      const totals = {
        gross: approved.reduce((a, r) => a + (r.gross_cents ?? 0), 0),
        fee: approved.reduce((a, r) => a + (r.fee_cents ?? 0), 0),
        events: approved.length,
      }

      const byCompany = new Map<string, { name: string; niche: string | null; gross: number; fee: number; events: number }>()
      for (const r of approved) {
        const key = r.company_id
        const prev = byCompany.get(key) ?? {
          name: (r as any).companies?.name ?? '—',
          niche: (r as any).companies?.niche ?? null,
          gross: 0,
          fee: 0,
          events: 0,
        }
        prev.gross += r.gross_cents ?? 0
        prev.fee += r.fee_cents ?? 0
        prev.events += 1
        byCompany.set(key, prev)
      }
      const top = Array.from(byCompany.entries())
        .map(([company_id, v]) => ({ company_id, ...v }))
        .sort((a, b) => b.fee - a.fee)
        .slice(0, 10)

      return { totals, top, sample: rows.slice(0, 100) }
    }),
  )

