import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function getWmpTenantId(context: any) {
  const { data, error } = await context.supabase
    .from('communication_tenants')
    .select('id')
    .eq('slug', 'wmp')
    .eq('active', true)
    .single()
  if (error) throw error
  return data.id as string
}

export const listWmpLegalClauses = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await getWmpTenantId(context)
    const { data, error } = await context.supabase
      .from('wmp_legal_clause_versions')
      .select('id,clause_key,version,title,body,parameters,status,effective_from,effective_until,created_at,created_by')
      .eq('tenant_id', tenantId)
      .order('clause_key')
      .order('version', { ascending: false })
    if (error) throw error
    return data ?? []
  })

export const createWmpLegalClauseDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clause_key: string; title: string; body: string }) => z.object({
    clause_key: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/i, 'Use somente letras, números, hífen e underline na chave.'),
    title: z.string().trim().min(3).max(240),
    body: z.string().trim().min(20).max(30000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc('create_wmp_legal_clause_draft', {
      p_clause_key: data.clause_key,
      p_title: data.title,
      p_body: data.body,
      p_parameters: {},
    })
    if (error) throw error
    return row
  })

export const activateWmpLegalClause = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clause_id: string; confirm: boolean }) => z.object({
    clause_id: z.string().uuid(),
    confirm: z.literal(true),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc('activate_wmp_legal_clause', {
      p_clause_id: data.clause_id,
      p_confirm: true,
    })
    if (error) throw error
    return row
  })
