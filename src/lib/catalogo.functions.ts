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

// --------- Tracking (single + batch) ---------

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

export const trackCatalogEventsBatch = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ events: z.array(TrackInput).min(1).max(50) }).parse(data),
  )
  .handler(async ({ data }) => {
    const sb = publicClient()
    const rows = data.events.map((e) => ({
      event_name: e.eventName,
      macro_slug: e.macroSlug ?? null,
      subnicho_slug: e.subnichoSlug ?? null,
      plan_tier: e.planTier ?? null,
      selected_modules: e.selectedModules ?? [],
      intent_id: e.intentId ?? null,
      session_token: e.sessionToken ?? null,
      metadata: e.metadata ?? {},
    }))
    const { error } = await sb.from('catalog_events').insert(rows)
    if (error) throw error
    return { ok: true, inserted: rows.length }
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
        .select(
          'macro_slug,subnicho_slug,plan_tier,consumed_at,converted_at,conversion_kind,reuse_attempts,last_reuse_attempt_at,created_at',
        )
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
      opened: number
      converted: number
      reuseAttempts: number
      lastConvertedAt: string | null
      lastReuseAt: string | null
      conversionKinds: Record<string, number>
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
          opened: 0,
          converted: 0,
          reuseAttempts: 0,
          lastConvertedAt: null,
          lastReuseAt: null,
          conversionKinds: {},
        }
        map.set(k, row)
      }
      return row
    }
    const maxIso = (a: string | null, b: string | null) =>
      !a ? b : !b ? a : a > b ? a : b
    for (const e of evRes.data ?? []) {
      const r = ensure(e.macro_slug, e.subnicho_slug, e.plan_tier)
      if (e.event_name === 'view_plans') r.views += 1
      else if (e.event_name === 'select_module' || e.event_name === 'select_sub') r.selects += 1
    }
    for (const i of intentRes.data ?? []) {
      const r = ensure(i.macro_slug, i.subnicho_slug, i.plan_tier)
      r.intents += 1
      if (i.consumed_at) r.opened += 1
      if (i.converted_at) {
        r.converted += 1
        r.lastConvertedAt = maxIso(r.lastConvertedAt, i.converted_at)
        if (i.conversion_kind) {
          r.conversionKinds[i.conversion_kind] = (r.conversionKinds[i.conversion_kind] ?? 0) + 1
        }
      }
      r.reuseAttempts += i.reuse_attempts ?? 0
      if (i.last_reuse_attempt_at) {
        r.lastReuseAt = maxIso(r.lastReuseAt, i.last_reuse_attempt_at)
      }
    }
    const rows = Array.from(map.values()).sort((a, b) => b.intents - a.intents)
    const totals = rows.reduce(
      (acc, r) => {
        acc.views += r.views
        acc.selects += r.selects
        acc.intents += r.intents
        acc.opened += r.opened
        acc.converted += r.converted
        acc.reuseAttempts += r.reuseAttempts
        return acc
      },
      { views: 0, selects: 0, intents: 0, opened: 0, converted: 0, reuseAttempts: 0 },
    )
    return { rows, totals, days: data.days }
  })


// --------- Idempotent consume + conversion ---------
// "Consumed" = intent has been opened in onboarding (intent reaches the app).
// "Converted" = a downstream success event happened (onboarding finished,
// contract signed, payment captured). Set via markCatalogConversion.

export const consumeCatalogIntent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { decideConsumeAction } = await import('./catalog-intent-lifecycle')
    const { data: existing, error: readErr } = await context.supabase
      .from('catalog_intents')
      .select('id,consumed_at,reuse_attempts')
      .eq('id', data.id)
      .maybeSingle()
    if (readErr) throw readErr
    const action = decideConsumeAction(existing)

    if (action.kind === 'not_found') {
      return { ok: false, alreadyConsumed: false, notFound: true }
    }
    if (action.kind === 'reuse') {
      const sbAnon = publicClient()
      await sbAnon.from('catalog_events').insert({
        event_name: 'intent_reuse_attempt',
        intent_id: data.id,
        metadata: { user_id: context.userId, attempt: action.nextAttempts },
      })
      await context.supabase
        .from('catalog_intents')
        .update({
          reuse_attempts: action.nextAttempts,
          last_reuse_attempt_at: new Date().toISOString(),
        })
        .eq('id', data.id)
      return { ok: true, alreadyConsumed: true, reuseAttempts: action.nextAttempts }
    }
    // first_consume — guarded by `.is('consumed_at', null)` so two parallel
    // requests can't both win.
    const { error } = await context.supabase
      .from('catalog_intents')
      .update({ consumed_at: new Date().toISOString(), user_id: context.userId })
      .eq('id', data.id)
      .is('consumed_at', null)
    if (error) throw error
    return { ok: true, alreadyConsumed: false }
  })

export const markCatalogConversion = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      kind: z.enum(['onboarding_completed', 'contract_signed', 'payment_captured']),
      validatedFields: z
        .object({
          goal: z.boolean().optional(),
          niche: z.boolean().optional(),
          mainPain: z.boolean().optional(),
          metric: z.boolean().optional(),
          target: z.boolean().optional(),
        })
        .optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { decideConversionAction } = await import('./catalog-intent-lifecycle')
    const { data: existing } = await context.supabase
      .from('catalog_intents')
      .select('id,converted_at')
      .eq('id', data.id)
      .maybeSingle()
    const action = decideConversionAction(existing, data.kind, data.validatedFields ?? null)
    if (action.kind !== 'first_conversion') {
      return {
        ok: action.kind !== 'not_found',
        firstConversion: false,
        kind: data.kind,
        reason: action.kind,
        missing: action.kind === 'incomplete' ? action.missing : undefined,
      }
    }
    // `.is('converted_at', null)` makes this idempotent at the DB level too.
    const { data: updated, error } = await context.supabase
      .from('catalog_intents')
      .update({
        converted_at: new Date().toISOString(),
        conversion_kind: data.kind,
        // typed-cast: validated_fields column added in a later migration
        ...(data.validatedFields ? ({ validated_fields: data.validatedFields } as Record<string, unknown>) : {}),
      } as never)
      .eq('id', data.id)
      .is('converted_at', null)
      .select('id')
      .maybeSingle()
    if (error) throw error
    return { ok: true, firstConversion: !!updated, kind: data.kind }
  })

// --------- Admin: intent audit + tracker dedupe stats ---------

export const getCatalogIntentsAudit = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        days: z.number().int().min(1).max(180).default(30),
        onlyConverted: z.boolean().default(false),
        conversionKinds: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', {
      _user: context.userId,
    })
    if (!isStaff) throw new Error('Forbidden')
    const since = new Date(Date.now() - data.days * 86400_000).toISOString()
    let q = context.supabase
      .from('catalog_intents')
      .select(
        // include validated_fields (added in later migration)
        'id,macro_slug,subnicho_slug,plan_tier,selected_modules,created_at,consumed_at,converted_at,conversion_kind,reuse_attempts,last_reuse_attempt_at,validated_fields' as never,
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (data.onlyConverted) q = q.not('converted_at', 'is', null)
    if (data.conversionKinds && data.conversionKinds.length > 0) {
      q = q.in('conversion_kind', data.conversionKinds)
    }
    const { data: rows, error } = await q
    if (error) throw error
    return { rows: (rows as unknown as Array<Record<string, unknown>>) ?? [] }
  })

export const getTrackerStats = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().int().min(1).max(180).default(7) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc('is_impulsionando_staff', {
      _user: context.userId,
    })
    if (!isStaff) throw new Error('Forbidden')
    const since = new Date(Date.now() - data.days * 86400_000).toISOString()
    const { data: rows, error } = await context.supabase
      .from('catalog_events')
      .select('metadata,created_at')
      .eq('event_name', 'tracker_stats')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) throw error
    const totals = { attempted: 0, sent: 0, deduped: 0, dropped: 0, batches: 0, samples: 0 }
    for (const r of rows ?? []) {
      const m = (r.metadata ?? {}) as Record<string, number>
      totals.attempted += Number(m.attempted ?? 0)
      totals.sent += Number(m.sent ?? 0)
      totals.deduped += Number(m.deduped ?? 0)
      totals.dropped += Number(m.dropped ?? 0)
      totals.batches += Number(m.batches ?? 0)
      totals.samples += 1
    }
    const dedupePct =
      totals.attempted > 0
        ? Number(((totals.deduped / totals.attempted) * 100).toFixed(1))
        : 0
    return { totals, dedupePct, days: data.days }
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
