// Cron público: consolida lotes de repasse para empresas com periodicidade vencida.
// Autenticação: header `apikey` deve bater com SUPABASE_PUBLISHABLE_KEY (padrão canônico pg_cron).
import { createFileRoute } from '@tanstack/react-router'
import { runConsolidation } from '@/lib/payout-consolidation'

function frequencyToPeriod(freq: string, now: Date): { start: string; end: string } | null {
  const end = new Date(now)
  end.setUTCHours(0, 0, 0, 0)
  const start = new Date(end)
  switch (freq) {
    case 'daily':
      start.setUTCDate(start.getUTCDate() - 1)
      break
    case 'weekly':
      start.setUTCDate(start.getUTCDate() - 7)
      break
    case 'biweekly':
      start.setUTCDate(start.getUTCDate() - 14)
      break
    case 'monthly':
      start.setUTCMonth(start.getUTCMonth() - 1)
      break
    default:
      return null
  }
  return { start: start.toISOString(), end: end.toISOString() }
}

export const Route = createFileRoute('/api/public/cron/payouts-consolidate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY
        const got = request.headers.get('apikey') ?? ''
        if (!expected || got !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const now = new Date()
        const results: Record<string, unknown> = {}




        for (const freq of ['daily', 'weekly', 'biweekly', 'monthly']) {
          const period = frequencyToPeriod(freq, now)
          if (!period) continue

          const { data: models } = await supabaseAdmin
            .from('core_monetization_models')
            .select('company_id')
            .eq('is_active', true)
            .eq('payout_frequency', freq)

          let totalBatches = 0
          let totalEvents = 0
          let totalRetained = 0
          for (const m of models ?? []) {
            const r = await runConsolidation(supabaseAdmin, {
              company_id: m.company_id,
              period_start: period.start,
              period_end: period.end,
            })
            totalBatches += r.batches
            totalEvents += r.events
            totalRetained += r.retained
          }
          results[freq] = { batches: totalBatches, events: totalEvents, retained: totalRetained, period }
        }

        return Response.json({ ok: true, ran_at: now.toISOString(), results })
      },
    },
  },
})
