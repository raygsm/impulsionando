import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const TrialSchema = z.object({
  plan_code: z.enum(['essencial', 'integrado', 'avancado']),
  contact_name: z.string().trim().min(2).max(120),
  contact_company: z.string().trim().min(2).max(160),
  contact_email: z.string().trim().email().max(180),
  contact_whatsapp: z.string().trim().min(8).max(40),
  contact_doc: z.string().trim().max(40).optional().default(''),
  accept_terms: z.literal(true),
})

export const startTrial = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => TrialSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const startedAt = new Date().toISOString()
    const { data: trialId, error } = await supabaseAdmin.rpc('trial_create', {
      _contact_name: data.contact_name,
      _contact_company: data.contact_company,
      _contact_email: data.contact_email.toLowerCase(),
      _contact_whatsapp: data.contact_whatsapp,
      _contact_doc: data.contact_doc || '',
      _chosen_plan: data.plan_code,
      _source: 'site_contratar',
    })

    // Registra evento de auditoria (billing) para trial de 3 dias sem cartão.
    try {
      await supabaseAdmin.rpc('log_admin_action', {
        _action: error ? 'billing.trial_failed' : 'billing.trial_started',
        _entity: 'trial_subscriptions',
        _entity_id: (trialId as string | null) ?? undefined,
        _after: {
          plan_code: data.plan_code,
          trial_days: 3,
          requires_card: false,
          setup_and_first_month_on_activation: true,
          contact_email: data.contact_email.toLowerCase(),
          contact_company: data.contact_company,
        },
        _metadata: {
          source: 'site_contratar',
          started_at: startedAt,
          error: error?.message ?? null,
        },
        _severity: error ? 'warning' : 'notice',
        _category: 'billing',
      })
    } catch {
      // logging não pode derrubar o fluxo de trial
    }

    if (error) return { ok: false as const, message: error.message }
    return { ok: true as const, trial_id: trialId as string }
  })

/**
 * Fonte única de verdade para preços dos planos exibidos em /contratar.
 * Lê o salário mínimo vigente de `core_settings.minimum_wage` e devolve
 * os valores calculados. Também devolve a lista de planos como estão
 * gravados em `billing_plans` para conferência (o job de sync mantém
 * ambos sincronizados).
 */
export const getContratarPricing = createServerFn({ method: 'GET' }).handler(async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data: wageRow } = await supabase
    .from('core_settings')
    .select('value')
    .eq('key', 'minimum_wage')
    .maybeSingle()

  const value = (wageRow?.value ?? {}) as { amount?: number; year?: number; source?: string }
  const wage = Number(value.amount ?? 0)

  const round2 = (n: number) => Math.round(n * 100) / 100
  const computed = {
    essencial: { factor: 0.5, recurring: round2(wage * 0.5), setup: round2(wage * 0.5) },
    integrado: { factor: 1,   recurring: round2(wage * 1.0), setup: round2(wage * 1.0) },
    avancado:  { factor: 2,   recurring: round2(wage * 2.0), setup: round2(wage * 2.0) },
  }

  const { data: plansRows } = await supabase
    .from('billing_plans')
    .select('code, name, setup_fee, recurring_amount, status_comercial, show_on_site')
    .in('code', ['essencial-mensal', 'completo-mensal', 'full'])

  return {
    minimum_wage: {
      amount: wage,
      year: value.year ?? null,
      source: value.source ?? null,
    },
    trial: { days: 3, requires_card: false, charge_on_activation: 'setup + first_month' },
    computed,
    plans_in_db: plansRows ?? [],
  }
})

export const listPublicPlans = createServerFn({ method: 'GET' }).handler(async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { data, error } = await supabase
    .from('billing_plans')
    .select('code,name,description,recurring_amount,setup_fee,min_contract_days,included_module_count,cta,sort_order')
    .eq('is_active', true)
    .eq('show_on_site', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
})
