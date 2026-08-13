import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const WMP_TENANT_SLUG = 'wmp'

async function getWmpTenantId(supabase: any) {
  const { data, error } = await supabase
    .from('communication_tenants')
    .select('id')
    .eq('slug', WMP_TENANT_SLUG)
    .eq('active', true)
    .single()
  if (error) throw error
  return data.id as string
}

export const listWmpProposals = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string } = {}) => z.object({ status: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    let q = context.supabase
      .from('wmp_proposals')
      .select('id, proposal_number, status, current_version, title, commercial_summary, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (data.status) q = q.eq('status', data.status)
    const { data: rows, error } = await q
    if (error) throw error
    return rows ?? []
  })

export const createWmpProposalDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    title: string
    briefing_id?: string
    opportunity_id?: string
    contact_id?: string
    client_snapshot?: Record<string, unknown>
    event_snapshot?: Record<string, unknown>
  }) => z.object({
    title: z.string().trim().min(3).max(200),
    briefing_id: z.string().uuid().optional(),
    opportunity_id: z.string().uuid().optional(),
    contact_id: z.string().uuid().optional(),
    client_snapshot: z.record(z.string(), z.unknown()).optional(),
    event_snapshot: z.record(z.string(), z.unknown()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    const year = new Date().getFullYear()
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
    const proposalNumber = `WMP-${year}-${suffix}`
    const { data: row, error } = await context.supabase
      .from('wmp_proposals')
      .insert({
        tenant_id: tenantId,
        proposal_number: proposalNumber,
        status: 'DRAFT',
        current_version: 1,
        title: data.title,
        briefing_id: data.briefing_id ?? null,
        opportunity_id: data.opportunity_id ?? null,
        contact_id: data.contact_id ?? null,
        client_snapshot: data.client_snapshot ?? {},
        event_snapshot: data.event_snapshot ?? {},
        created_by: context.userId,
      })
      .select('id, proposal_number, status')
      .single()
    if (error) throw error
    return row
  })
