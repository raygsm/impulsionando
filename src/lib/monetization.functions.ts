// Server functions para o Motor de Recebimento e Repasse (CORE Impulsionando).
// Leitura: qualquer membro da empresa vê o próprio modelo.
// Escrita: somente staff Impulsionando (via is_impulsionando_staff).

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'

export type MonetizationModel = 'saas' | 'revshare' | 'hybrid'
export type PayoutFrequency = 'instant' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type CoveredEvent =
  | 'sale'
  | 'rent'
  | 'recurring'
  | 'service'
  | 'subscription'
  | 'event'
  | 'product'

const COVERED_EVENTS: readonly CoveredEvent[] = [
  'sale',
  'rent',
  'recurring',
  'service',
  'subscription',
  'event',
  'product',
] as const

const rateInput = z.object({
  event_type: z.enum(COVERED_EVENTS as unknown as [CoveredEvent, ...CoveredEvent[]]),
  percent_bps: z.number().int().min(0).max(10_000),
  min_bps: z.number().int().min(0).max(10_000).nullable().optional(),
  max_bps: z.number().int().min(0).max(10_000).nullable().optional(),
})

const upsertSchema = z.object({
  company_id: z.string().uuid(),
  model: z.enum(['saas', 'revshare', 'hybrid']),
  monthly_fee_cents: z.number().int().min(0).default(0),
  setup_fee_cents: z.number().int().min(0).default(0),
  min_payout_cents: z.number().int().min(0).default(0),
  payout_frequency: z
    .enum(['instant', 'daily', 'weekly', 'biweekly', 'monthly'])
    .default('instant'),
  covered_events: z
    .array(z.enum(COVERED_EVENTS as unknown as [CoveredEvent, ...CoveredEvent[]]))
    .default([]),
  notes: z.string().max(2_000).nullable().optional(),
  rates: z.array(rateInput).default([]),
})

async function requireStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc('is_impulsionando_staff', { _user: userId })
  if (error) throw error
  if (!data) throw new Error('Forbidden: staff only')
}

/** Lê o modelo ativo da empresa + taxas vigentes. */
export const getMonetizationModel = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => z.object({ company_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) =>
    withInstrumentation(
      'monetization.getMonetizationModel',
      { user_id: context.userId, company_id: data.company_id },
      async () => {
        const { data: model, error } = await context.supabase
          .from('core_monetization_models')
          .select(
            'id, company_id, model, monthly_fee_cents, setup_fee_cents, min_payout_cents, payout_frequency, covered_events, version, is_active, effective_from, effective_to, accepted_by, accepted_at, signature_hash, notes, created_at, updated_at',
          )
          .eq('company_id', data.company_id)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (error) throw error
        if (!model) return { model: null, rates: [] as Array<z.infer<typeof rateInput>> }

        const { data: rates, error: ratesErr } = await context.supabase
          .from('core_revshare_rates')
          .select('id, event_type, percent_bps, min_bps, max_bps, provider_account_id, is_active')
          .eq('model_id', model.id)
          .eq('is_active', true)
          .order('event_type')
        if (ratesErr) throw ratesErr

        return { model, rates: rates ?? [] }
      },
    ),
  )


/** Lista o modelo de todas as empresas — visão CORE para o dashboard. */
export const listAllMonetizationModels = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('monetization.listAllMonetizationModels', { user_id: context.userId }, async () => {
      await requireStaff(context.supabase, context.userId)
      const { data, error } = await context.supabase
        .from('core_monetization_models')
        .select(
          'id, company_id, model, monthly_fee_cents, payout_frequency, covered_events, is_active, version, updated_at, companies:companies(id, name, niche)',
        )
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }),
  )


/**
 * Cria (ou versiona) o modelo de uma empresa.
 * Toda alteração: desativa a versão anterior, cria nova versão + novas taxas.
 * Aceite eletrônico (assinatura) é registrado em camada posterior.
 */
export const upsertMonetizationModel = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) =>
    withInstrumentation(
      'monetization.upsertMonetizationModel',
      { user_id: context.userId, company_id: data.company_id, model: data.model },
      async () => {
        await requireStaff(context.supabase, context.userId)

        const { data: prev } = await context.supabase
          .from('core_monetization_models')
          .select('id, version')
          .eq('company_id', data.company_id)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        const nextVersion = (prev?.version ?? 0) + 1

        if (prev?.id) {
          const { error: deactErr } = await context.supabase
            .from('core_monetization_models')
            .update({ is_active: false, effective_to: new Date().toISOString() })
            .eq('id', prev.id)
          if (deactErr) throw deactErr
        }

        const { data: created, error: insErr } = await context.supabase
          .from('core_monetization_models')
          .insert({
            company_id: data.company_id,
            model: data.model,
            monthly_fee_cents: data.monthly_fee_cents,
            setup_fee_cents: data.setup_fee_cents,
            min_payout_cents: data.min_payout_cents,
            payout_frequency: data.payout_frequency,
            covered_events: data.covered_events,
            version: nextVersion,
            is_active: true,
            notes: data.notes ?? null,
          })
          .select('id')
          .single()
        if (insErr) throw insErr

        if (data.rates.length > 0 && (data.model === 'revshare' || data.model === 'hybrid')) {
          const rows = data.rates.map((r) => ({
            model_id: created.id,
            company_id: data.company_id,
            event_type: r.event_type,
            percent_bps: r.percent_bps,
            min_bps: r.min_bps ?? null,
            max_bps: r.max_bps ?? null,
          }))
          const { error: ratesErr } = await context.supabase.from('core_revshare_rates').insert(rows)
          if (ratesErr) throw ratesErr
        }

        await context.supabase.from('audit_logs').insert({
          user_id: context.userId,
          action: 'monetization.upsert',
          entity: 'core_monetization_models',
          entity_id: created.id,
          after: { ...data, version: nextVersion },
        })

        return { id: created.id, version: nextVersion }
      },
    ),
  )

