// Marketplace Interno B2B "Todos para Todos" — Impulsionando.
// Busca, pedidos, propostas, contratações, avaliações (ecosystem-only) e indicações.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'

const DEFAULT_FEE_PCT = 0.005 // 0,50%

/** Resolve a empresa do usuário (membro principal). */
async function getMyCompanyId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles').select('company_id').eq('user_id', userId).maybeSingle()
  return data?.company_id ?? null
}

/** Busca pública de listagens ativas — RLS filtra. */
export const searchListings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    query?: string; niche?: string; audience?: 'b2b' | 'b2c' | 'both'; limit?: number;
  }) =>
    z.object({
      query: z.string().trim().max(200).optional(),
      niche: z.string().trim().max(80).optional(),
      audience: z.enum(['b2b', 'b2c', 'both']).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.searchListings', { user_id: context.userId }, async () => {
      let q = context.supabase
        .from('eco_marketplace_listings')
        .select('id, company_id, title, description, niche, subniche, audience, pricing_model, min_price_cents, max_price_cents, tags, coverage_area, companies:company_id(name, logo_url, rating_avg, rating_count)')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(data.limit)
      if (data.niche) q = q.eq('niche', data.niche)
      if (data.audience) q = q.in('audience', [data.audience, 'both'])
      if (data.query) q = q.textSearch('search_vector', data.query, { type: 'websearch', config: 'portuguese' })
      const { data: rows, error } = await q
      if (error) throw error
      return rows ?? []
    }),
  )

/** Cria listagem (empresa do usuário). */
export const createListing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      title: z.string().trim().min(3).max(200),
      description: z.string().trim().min(10).max(5000),
      niche: z.string().trim().min(2).max(80),
      subniche: z.string().trim().max(80).optional(),
      audience: z.enum(['b2b', 'b2c', 'both']).default('b2b'),
      pricing_model: z.enum(['hour', 'project', 'recurring', 'custom']).default('project'),
      min_price_cents: z.number().int().min(0).optional(),
      max_price_cents: z.number().int().min(0).optional(),
      tags: z.array(z.string().trim().max(40)).max(20).default([]),
      coverage_area: z.string().trim().max(120).default('national'),
      status: z.enum(['draft', 'active', 'paused']).default('active'),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.createListing', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      if (!companyId) throw new Error('Você precisa estar vinculado a uma empresa para publicar.')
      const { data: row, error } = await context.supabase
        .from('eco_marketplace_listings')
        .insert({ ...data, company_id: companyId })
        .select('id').single()
      if (error) throw error
      return row
    }),
  )

export const myListings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('marketplace.myListings', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      if (!companyId) return []
      const { data, error } = await context.supabase
        .from('eco_marketplace_listings')
        .select('*').eq('company_id', companyId).order('updated_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }),
  )

/** Cria um pedido de proposta. */
export const createRequest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      title: z.string().trim().min(3).max(200),
      scope: z.string().trim().min(10).max(5000),
      listing_id: z.string().uuid().optional(),
      target_niche: z.string().trim().max(80).optional(),
      budget_cents: z.number().int().min(0).optional(),
      deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      nda_required: z.boolean().default(false),
      contract_required: z.boolean().default(true),
      invited_providers: z.array(z.string().uuid()).max(20).default([]),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.createRequest', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      if (!companyId) throw new Error('Você precisa estar vinculado a uma empresa para abrir pedidos.')
      const { data: row, error } = await context.supabase
        .from('eco_marketplace_requests')
        .insert({
          ...data,
          requester_company_id: companyId,
          requester_user_id: context.userId,
          status: 'open',
        })
        .select('id').single()
      if (error) throw error
      return row
    }),
  )

/** Meus pedidos (como solicitante) + pedidos onde fui convidado/abertos. */
export const listRequests = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope?: 'mine' | 'inbox' }) =>
    z.object({ scope: z.enum(['mine', 'inbox']).default('mine') }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.listRequests', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      let q = context.supabase
        .from('eco_marketplace_requests')
        .select('id, title, scope, status, budget_cents, deadline, nda_required, contract_required, created_at, requester_company_id, target_niche')
        .order('created_at', { ascending: false }).limit(100)
      if (data.scope === 'mine' && companyId) q = q.eq('requester_company_id', companyId)
      if (data.scope === 'inbox') q = q.eq('status', 'open')
      const { data: rows, error } = await q
      if (error) throw error
      return rows ?? []
    }),
  )

export const submitQuote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      request_id: z.string().uuid(),
      amount_cents: z.number().int().min(100),
      scope_details: z.string().trim().min(10).max(5000),
      delivery_days: z.number().int().min(1).max(3650).optional(),
      message: z.string().trim().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.submitQuote', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      if (!companyId) throw new Error('Você precisa estar vinculado a uma empresa para enviar propostas.')
      const { data: row, error } = await context.supabase
        .from('eco_marketplace_quotes')
        .insert({
          ...data,
          provider_company_id: companyId,
          provider_user_id: context.userId,
          status: 'sent',
        })
        .select('id').single()
      if (error) throw error
      return row
    }),
  )

/** Aceita uma proposta: cria engagement com taxa de intermediação calculada. */
export const acceptQuote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quote_id: string }) =>
    z.object({ quote_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.acceptQuote', { user_id: context.userId }, async () => {
      const { data: quote, error: qErr } = await context.supabase
        .from('eco_marketplace_quotes')
        .select('id, request_id, provider_company_id, amount_cents, status, eco_marketplace_requests!inner(requester_company_id, target_niche)')
        .eq('id', data.quote_id).single()
      if (qErr || !quote) throw qErr ?? new Error('Proposta não encontrada')
      if (quote.status !== 'sent') throw new Error('Proposta não está disponível para aceite')

      const niche = (quote as any).eco_marketplace_requests?.target_niche ?? null
      const { data: fee } = await context.supabase
        .from('mp_fee_policies').select('fee_pct')
        .or(`niche_slug.eq.${niche},scope.eq.default`)
        .eq('active', true).order('scope').limit(1).maybeSingle()
      const feePct = Number(fee?.fee_pct ?? DEFAULT_FEE_PCT)
      const feeCents = Math.round(quote.amount_cents * feePct)
      const feeBps = Math.round(feePct * 10000)

      const { data: eng, error: eErr } = await context.supabase
        .from('eco_marketplace_engagements')
        .insert({
          quote_id: quote.id,
          request_id: quote.request_id,
          requester_company_id: (quote as any).eco_marketplace_requests.requester_company_id,
          provider_company_id: quote.provider_company_id,
          gmv_cents: quote.amount_cents,
          intermediation_fee_cents: feeCents,
          intermediation_fee_bps: feeBps,
          status: 'active',
        })
        .select('id').single()
      if (eErr) throw eErr

      await context.supabase.from('eco_marketplace_quotes').update({ status: 'accepted' }).eq('id', quote.id)
      await context.supabase.from('eco_marketplace_requests').update({ status: 'awarded' }).eq('id', quote.request_id)
      return eng
    }),
  )

export const submitReview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      engagement_id: z.string().uuid(),
      reviewed_company_id: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      rating_quality: z.number().int().min(1).max(5).optional(),
      rating_deadline: z.number().int().min(1).max(5).optional(),
      rating_communication: z.number().int().min(1).max(5).optional(),
      rating_price: z.number().int().min(1).max(5).optional(),
      comment: z.string().trim().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.submitReview', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      if (!companyId) throw new Error('Apenas membros de empresa podem avaliar.')
      const { data: row, error } = await context.supabase
        .from('eco_marketplace_reviews')
        .insert({
          ...data,
          reviewer_company_id: companyId,
          reviewer_user_id: context.userId,
        })
        .select('id').single()
      if (error) throw error
      return row
    }),
  )

/** Indicação empresa→empresa (B recomenda C para A, ou B indica C como prestador). */
export const createReferral = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      referred_company_id: z.string().uuid(),
      target_company_id: z.string().uuid().optional(),
      target_email: z.string().trim().email().max(255).optional(),
      context_note: z.string().trim().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('marketplace.createReferral', { user_id: context.userId }, async () => {
      const companyId = await getMyCompanyId(context.supabase, context.userId)
      if (!companyId) throw new Error('Apenas membros de empresa podem indicar.')
      const { data: row, error } = await context.supabase
        .from('eco_marketplace_referrals')
        .insert({
          ...data,
          referrer_company_id: companyId,
          referrer_user_id: context.userId,
          status: 'sent',
        })
        .select('id').single()
      if (error) throw error
      return row
    }),
  )
