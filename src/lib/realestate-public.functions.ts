/**
 * Public real-estate server functions used by the public vitrine pages
 * /imoveis/$slug and /imoveis/$slug/$propertyId.
 *
 * These use a publishable-key Supabase client (no service role) and rely on
 * the `realestate_properties_public_read` + `companies` anon SELECT policies
 * created in the vitrine migration.
 */
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/integrations/supabase/types'

function publicClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

const ListInput = z.object({
  slug: z.string().trim().min(1).max(120),
  operation: z.enum(['venda', 'locacao', 'venda_ou_locacao']).optional(),
  propertyType: z.string().trim().max(60).optional(),
  city: z.string().trim().max(120).optional(),
  bedroomsMin: z.number().int().min(0).max(20).optional(),
  priceMin: z.number().nonnegative().nullable().optional(),
  priceMax: z.number().nonnegative().nullable().optional(),
  q: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
})

export const listPublicProperties = createServerFn({ method: 'POST' })
  .inputValidator((d: z.infer<typeof ListInput>) => ListInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient()
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, public_slug, vitrine_enabled')
      .eq('public_slug', data.slug)
      .eq('vitrine_enabled', true)
      .maybeSingle()
    if (!company) return { company: null, rows: [], total: 0 }

    const from = (data.page - 1) * data.pageSize
    const to = from + data.pageSize - 1
    let q = supabase
      .from('realestate_properties')
      .select(
        'id, title, reference_code, operation, property_type, sale_price, rent_price, bedrooms, bathrooms, parking_spots, suites, area_useful, area_total, city, neighborhood, state, photos, description, created_at',
        { count: 'exact' },
      )
      .eq('company_id', (company as any).id)
      .eq('is_published', true)
      .eq('status', 'ativo')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (data.operation && data.operation !== 'venda_ou_locacao') q = q.eq('operation', data.operation)
    if (data.propertyType) q = q.eq('property_type', data.propertyType as any)
    if (data.city) q = q.eq('city', data.city)
    if (data.bedroomsMin && data.bedroomsMin > 0) q = q.gte('bedrooms', data.bedroomsMin)
    if (data.priceMin != null) {
      q = q.or(`sale_price.gte.${data.priceMin},rent_price.gte.${data.priceMin}`)
    }
    if (data.priceMax != null) {
      q = q.or(`sale_price.lte.${data.priceMax},rent_price.lte.${data.priceMax}`)
    }
    if (data.q && data.q.trim()) {
      const s = `%${data.q.trim()}%`
      q = q.or(`title.ilike.${s},neighborhood.ilike.${s},city.ilike.${s},reference_code.ilike.${s}`)
    }

    const { data: rows, error, count } = await q
    if (error) {
      console.error('listPublicProperties error', error)
      return { company, rows: [], total: 0, error: error.message }
    }
    return { company, rows: rows ?? [], total: count ?? 0 }
  })

const DetailInput = z.object({
  slug: z.string().trim().min(1).max(120),
  propertyId: z.string().uuid(),
})

export const getPublicProperty = createServerFn({ method: 'POST' })
  .inputValidator((d: z.infer<typeof DetailInput>) => DetailInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient()
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, public_slug, vitrine_enabled')
      .eq('public_slug', data.slug)
      .eq('vitrine_enabled', true)
      .maybeSingle()
    if (!company) return { company: null, property: null }

    const { data: property, error } = await supabase
      .from('realestate_properties')
      .select(
        'id, title, reference_code, operation, property_type, sale_price, rent_price, condo_fee, iptu, bedrooms, bathrooms, parking_spots, suites, area_useful, area_total, city, neighborhood, state, address_line, zip, photos, features, description, created_at, latitude, longitude',
      )
      .eq('id', data.propertyId)
      .eq('company_id', (company as any).id)
      .eq('is_published', true)
      .eq('status', 'ativo')
      .eq('approval_status', 'approved')
      .maybeSingle()
    if (error) {
      console.error('getPublicProperty error', error)
      return { company, property: null, error: error.message }
    }
    return { company, property }
  })
