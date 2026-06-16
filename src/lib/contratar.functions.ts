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
    const { data: trialId, error } = await supabaseAdmin.rpc('trial_create', {
      _contact_name: data.contact_name,
      _contact_company: data.contact_company,
      _contact_email: data.contact_email.toLowerCase(),
      _contact_whatsapp: data.contact_whatsapp,
      _contact_doc: data.contact_doc || '',
      _chosen_plan: data.plan_code,
      _source: 'site_contratar',
    })
    if (error) {
      return { ok: false as const, message: error.message }
    }
    return { ok: true as const, trial_id: trialId as string }
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
