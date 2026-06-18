/**
 * Public catalog: Macro Nicho → Subnicho → Template → Plano.
 * Uses publishable-key client; all four tables have anon SELECT policies.
 */
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
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
  const [macros, subs, templates, plans] = await Promise.all([
    sb.from('core_macro_nichos').select('id,slug,nome,ordem').order('ordem'),
    sb.from('core_subnichos').select('id,macro_id,slug,nome,ordem').order('ordem'),
    sb.from('core_templates').select('id,subnicho_id,slug,nome,descricao,modulos,destaque'),
    sb
      .from('billing_plans')
      .select('id,code,name,description,recurring_amount,cycle,included_module_count,extra_module_price,cta,sort_order')
      .eq('is_active', true)
      .eq('show_on_site', true)
      .order('sort_order', { ascending: true }),
  ])

  if (macros.error) throw macros.error
  if (subs.error) throw subs.error
  if (templates.error) throw templates.error
  if (plans.error) throw plans.error

  return {
    macros: macros.data ?? [],
    subs: subs.data ?? [],
    templates: templates.data ?? [],
    plans: plans.data ?? [],
  }
})
