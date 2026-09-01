import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  )
}

export const getClubePublicOverview = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = publicClient()
  const [companiesRes, offersRes] = await Promise.all([
    supabase
      .from('companies_vitrine_public' as any)
      .select('id,name,trade_name,segment,logo_url,public_slug,address_city,address_state,website')
      .order('trade_name', { ascending: true })
      .limit(120),
    supabase
      .from('clube_partner_offers' as any)
      .select('id,company_id,title,kind,active,starts_at,ends_at')
      .eq('active', true)
      .limit(500),
  ])

  if (companiesRes.error) throw new Error(companiesRes.error.message)
  if (offersRes.error) throw new Error(offersRes.error.message)

  const companies = (companiesRes.data ?? []) as any[]
  const offers = (offersRes.data ?? []) as any[]
  const categoryMap = new Map<string, number>()
  for (const company of companies) {
    const label = String(company.segment || 'Outros').trim() || 'Outros'
    categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1)
  }

  return {
    companies,
    offers,
    stats: {
      companies: companies.length,
      activeOffers: offers.length,
    },
    categories: [...categoryMap.entries()]
      .map(([label, count]) => ({
        label,
        count,
        slug: label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR')),
  }
})
