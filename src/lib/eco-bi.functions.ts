// BI Cross-Tenant do Ecossistema Impulsionando.
// Agrega KPIs operacionais e comerciais de TODAS as empresas (tenants) do core.
// Acessível apenas a admins do core (has_role 'admin').
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertCoreAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' })
  if (!isAdmin) throw new Error('Forbidden: requer admin do core')
}

export const getEcosystemBI = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) =>
    z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { captureServerError } = await import('@/lib/runtime-observability.functions')
    return captureServerError(
      { scope: 'eco-bi.getEcosystemBI', userId: context.userId, supabaseAdmin, context: { days: data.days } },
      async () => {
    const sb = context.supabase
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString()



    const [
      companies,
      mktEngagements,
      mktListings,
      mktRequests,
      mktReviews,
      tickets,
      legalAcceptances,
      legalDocs,
      contractSigs,
      consumerMems,
      lgpdConsents,
      payouts,
    ] = await Promise.all([
      sb.from('companies').select('id, is_active, is_master, created_at, niche_id'),
      sb.from('eco_marketplace_engagements').select('gmv_cents, fee_cents, fee_pct, status, created_at').gte('created_at', since),
      sb.from('eco_marketplace_listings').select('id, status'),
      sb.from('eco_marketplace_requests').select('id, status, created_at').gte('created_at', since),
      sb.from('eco_marketplace_reviews').select('rating, created_at').gte('created_at', since),
      sb.from('support_tickets').select('id, status, priority, sla_breached_at, created_at, resolved_at').gte('created_at', since),
      sb.from('eco_legal_acceptances').select('id, created_at').gte('created_at', since),
      sb.from('eco_legal_documents').select('id, audience, is_current').eq('is_current', true),
      sb.from('contract_signatures').select('id, signed_at, status').gte('signed_at', since),
      sb.from('consumer_memberships').select('id, status, plan_id, created_at'),
      sb.from('lgpd_consents').select('id, granted, created_at').gte('created_at', since),
      sb.from('core_payout_ledger').select('amount_cents, status, created_at').gte('created_at', since),
    ])

    const tenants = (companies.data ?? []).filter((c: any) => !c.is_master)
    const tenantsAtivos = tenants.filter((c: any) => c.is_active).length
    const tenantsNovos = tenants.filter((c: any) => new Date(c.created_at) >= new Date(since)).length

    const eng = mktEngagements.data ?? []
    const gmvCents = eng.reduce((a: number, b: any) => a + Number(b.gmv_cents ?? 0), 0)
    const feeCents = eng.reduce((a: number, b: any) => a + Number(b.fee_cents ?? 0), 0)
    const engCount = eng.length

    const reviews = mktReviews.data ?? []
    const ratingAvg = reviews.length
      ? reviews.reduce((a: number, b: any) => a + Number(b.rating), 0) / reviews.length
      : 0

    const tks = tickets.data ?? []
    const openTickets = tks.filter((t: any) => !['resolved', 'closed'].includes(t.status)).length
    const slaBreaches = tks.filter((t: any) => t.sla_breached_at).length
    const resolvedTks = tks.filter((t: any) => t.resolved_at)
    const avgResolutionH = resolvedTks.length
      ? resolvedTks.reduce((a: number, t: any) => a + (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()), 0) /
        resolvedTks.length /
        3_600_000
      : 0

    const lgpd = lgpdConsents.data ?? []
    const lgpdGrants = lgpd.filter((c: any) => c.granted).length

    const pays = payouts.data ?? []
    const payoutCents = pays.filter((p: any) => p.status === 'paid').reduce((a: number, b: any) => a + Number(b.amount_cents ?? 0), 0)

    const mems = consumerMems.data ?? []
    const memActive = mems.filter((m: any) => m.status === 'active').length

    return {
      since,
      tenants: { total: tenants.length, ativos: tenantsAtivos, novos: tenantsNovos },
      marketplace: {
        listingsAtivos: (mktListings.data ?? []).filter((l: any) => l.status === 'active').length,
        requestsNovos: (mktRequests.data ?? []).length,
        engagements: engCount,
        gmvCents,
        feeCents,
        ratingAvg,
      },
      suporte: { abertos: openTickets, slaBreaches, avgResolutionH },
      juridico: {
        documentosVigentes: (legalDocs.data ?? []).length,
        aceitesPeriodo: (legalAcceptances.data ?? []).length,
        contratosAssinados: (contractSigs.data ?? []).filter((c: any) => c.status === 'signed').length,
      },
      lgpd: { totalConsentimentos: lgpd.length, concedidos: lgpdGrants },
      monetizacao: { payoutPagoCents: payoutCents, assinaturasAtivas: memActive },
    }
      },
    )
  })


export type EcosystemBI = Awaited<ReturnType<typeof getEcosystemBI>>
