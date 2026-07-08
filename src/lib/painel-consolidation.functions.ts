/**
 * Server functions do painel /colors/painel.
 *
 *  - `getPainelAggregate` chama a função Postgres `painel_aggregate`
 *    (SECURITY DEFINER, gated por `has_role(auth.uid(),'admin')`) e devolve
 *    funil por host, top campanhas e legacy hits agregados no período.
 *
 * Requer `requireSupabaseAuth` — SELECT nas tabelas `painel_*` é admin-only.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const inputSchema = z.object({
  host: z.string().max(200).nullable().optional(),
  sinceIso: z.string().datetime().optional(),
  untilIso: z.string().datetime().optional(),
})

export type PainelFunnelRow = {
  host: string
  sessions: number
  cta: number
  checkout: number
  lead: number
  whatsapp: number
  ebook: number
  conversion_rate: number
}
export type PainelCampaignRow = {
  utm_campaign: string
  sessions: number
  cta: number
  checkout: number
  lead: number
}
export type PainelLegacyRow = { host: string; hits: number; last_hit: string }
export type PainelAggregate = {
  generated_at: string
  since: string
  until: string
  host_filter: string | null
  total_events: number
  funnel: PainelFunnelRow[]
  campaigns: PainelCampaignRow[]
  legacy: PainelLegacyRow[]
}

export const getPainelAggregate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<PainelAggregate> => {
    const now = new Date()
    const since = data.sinceIso ? new Date(data.sinceIso) : new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    const until = data.untilIso ? new Date(data.untilIso) : now
    const host = data.host && data.host.trim() ? data.host.trim() : null

    const { data: agg, error } = await context.supabase.rpc('painel_aggregate' as never, {
      host_filter: host,
      since_ts: since.toISOString(),
      until_ts: until.toISOString(),
    } as never)
    if (error) throw new Error(`painel_aggregate: ${error.message}`)
    return agg as unknown as PainelAggregate
  })
