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

// --------- Restore intent (public, by id, only while unconsumed) ---------

export const getCatalogIntent = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient()
    const { data: row, error } = await sb
      .from('catalog_intents')
      .select('id,macro_slug,subnicho_slug,plan_tier,selected_modules,consumed_at,expires_at,source')
      .eq('id', data.id)
      .maybeSingle()
    if (error) throw error
    if (!row) return null
    if (row.consumed_at) return null
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null
    return row
  })

// --------- Tracking ---------

const TrackInput = z.object({
  eventName: z.string().trim().min(1).max(60),
  macroSlug: z.string().trim().max(60).optional().nullable(),
  subnichoSlug: z.string().trim().max(80).optional().nullable(),
  planTier: z.string().trim().max(20).optional().nullable(),
  selectedModules: z.array(z.string().trim().max(80)).max(20).optional(),
  intentId: z.string().uuid().optional().nullable(),
  sessionToken: z.string().trim().max(80).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const trackCatalogEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => TrackInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient()
    const { error } = await sb.from('catalog_events').insert({
      event_name: data.eventName,
      macro_slug: data.macroSlug ?? null,
      subnicho_slug: data.subnichoSlug ?? null,
      plan_tier: data.planTier ?? null,
      selected_modules: data.selectedModules ?? [],
      intent_id: data.intentId ?? null,
      session_token: data.sessionToken ?? null,
      metadata: data.metadata ?? {},
    })
    if (error) throw error
    return { ok: true }
  })

// --------- Conversion analytics (staff) ---------

export const getCatalogAnalytics = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().int().min(1).max(180).default(30) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', {
      _user: context.userId,
    })
    if (!isStaff) throw new Error('Forbidden')

    const since = new Date(Date.now() - data.days * 86400_000).toISOString()
    const [evRes, intentRes] = await Promise.all([
      context.supabase
        .from('catalog_events')
        .select('event_name,macro_slug,subnicho_slug,plan_tier,created_at')
        .gte('created_at', since),
      context.supabase
        .from('catalog_intents')
        .select('macro_slug,subnicho_slug,plan_tier,consumed_at,created_at')
        .gte('created_at', since),
    ])
    if (evRes.error) throw evRes.error
    if (intentRes.error) throw intentRes.error

    type Row = {
      macro: string
      sub: string
      plan: string
      views: number
      selects: number
      intents: number
      consumed: number
    }
    const map = new Map<string, Row>()
    const key = (m: string | null, s: string | null, p: string | null) =>
      `${m ?? '-'}|${s ?? '-'}|${p ?? '-'}`
    const ensure = (m: string | null, s: string | null, p: string | null): Row => {
      const k = key(m, s, p)
      let row = map.get(k)
      if (!row) {
        row = {
          macro: m ?? '-',
          sub: s ?? '-',
          plan: p ?? '-',
          views: 0,
          selects: 0,
          intents: 0,
          consumed: 0,
        }
        map.set(k, row)
      }
      return row
    }
    for (const e of evRes.data ?? []) {
      const r = ensure(e.macro_slug, e.subnicho_slug, e.plan_tier)
      if (e.event_name === 'view_plans') r.views += 1
      else if (e.event_name === 'select_module' || e.event_name === 'select_sub') r.selects += 1
    }
    for (const i of intentRes.data ?? []) {
      const r = ensure(i.macro_slug, i.subnicho_slug, i.plan_tier)
      r.intents += 1
      if (i.consumed_at) r.consumed += 1
    }
    const rows = Array.from(map.values()).sort((a, b) => b.intents - a.intents)
    const totals = rows.reduce(
      (acc, r) => {
        acc.views += r.views
        acc.selects += r.selects
        acc.intents += r.intents
        acc.consumed += r.consumed
        return acc
      },
      { views: 0, selects: 0, intents: 0, consumed: 0 },
    )
    return { rows, totals, days: data.days }
  })

// --------- Mark intent consumed (called from onboarding once opened) ---------

export const consumeCatalogIntent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('catalog_intents')
      .update({ consumed_at: new Date().toISOString(), user_id: context.userId })
      .eq('id', data.id)
      .is('consumed_at', null)
    if (error) throw error
    return { ok: true }
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
