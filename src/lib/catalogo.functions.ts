/**
 * Public catalog server functions:
 * - getCatalog: macros, subs, plans
 * - getNichePlans(macroSlug): module/limit mapping for the 3 tiers
 * - saveCatalogIntent: persist the visitor's selection before onboarding/checkout
 * - upsertNichePlanModules: staff-only admin write
 */
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import type { Database } from '@/integrations/supabase/types'

function publicClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

export const getCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const sb = publicClient()
  const [macros, subs, plans, mappings] = await Promise.all([
    sb.from('core_macro_nichos').select('id,slug,nome,ordem').order('ordem'),
    sb.from('core_subnichos').select('id,macro_id,slug,nome,ordem').order('ordem'),
    sb
      .from('billing_plans')
      .select('id,code,name,description,recurring_amount,cycle,cta,sort_order')
      .eq('is_active', true)
      .eq('show_on_site', true)
      .order('sort_order'),
    sb
      .from('core_niche_plan_modules')
      .select('macro_slug,plan_tier,choose_limit,modules,base_price_label'),
  ])

  if (macros.error) throw macros.error
  if (subs.error) throw subs.error
  if (plans.error) throw plans.error
  if (mappings.error) throw mappings.error

  // Set of macros with at least one mapping → drives "Em breve" badge
  const mappedMacros = new Set((mappings.data ?? []).map((m) => m.macro_slug))

  return {
    macros: macros.data ?? [],
    subs: subs.data ?? [],
    plans: plans.data ?? [],
    mappings: mappings.data ?? [],
    mappedMacros: Array.from(mappedMacros),
  }
})

const IntentInput = z.object({
  macroSlug: z.string().trim().min(1).max(60),
  subnichoSlug: z.string().trim().min(1).max(80),
  planTier: z.enum(['essencial', 'ideal', 'full']),
  selectedModules: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  source: z.string().trim().max(40).optional(),
})

export const saveCatalogIntent = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => IntentInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient()
    const { data: row, error } = await sb
      .from('catalog_intents')
      .insert({
        macro_slug: data.macroSlug,
        subnicho_slug: data.subnichoSlug,
        plan_tier: data.planTier,
        selected_modules: data.selectedModules,
        source: data.source ?? 'catalogo',
      })
      .select('id')
      .single()
    if (error) throw error
    return { id: row.id }
  })

// --------- Admin: manage niche → plan → modules ---------

const UpsertInput = z.object({
  macroSlug: z.string().trim().min(1).max(60),
  planTier: z.enum(['essencial', 'ideal', 'full']),
  chooseLimit: z.number().int().min(0).max(50),
  modules: z.array(z.string().trim().min(1).max(80)).max(50),
  basePriceLabel: z.string().trim().max(60).optional().nullable(),
})

export const upsertNichePlanModules = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UpsertInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isStaff, error: roleErr } = await context.supabase.rpc(
      'is_impulsionando_staff',
      { _user: context.userId },
    )
    if (roleErr) throw roleErr
    if (!isStaff) throw new Error('Forbidden')

    const { error } = await context.supabase.from('core_niche_plan_modules').upsert(
      {
        macro_slug: data.macroSlug,
        plan_tier: data.planTier,
        choose_limit: data.chooseLimit,
        modules: data.modules,
        base_price_label: data.basePriceLabel ?? null,
      },
      { onConflict: 'macro_slug,plan_tier' },
    )
    if (error) throw error
    return { ok: true }
  })
