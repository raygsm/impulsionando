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

export const getWmpCorporateProposalPrefill = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { briefing_date_id: string }) => z.object({ briefing_date_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    const { data: dateRow, error: dateError } = await context.supabase
      .from('wmp_briefing_dates')
      .select('id,briefing_id,event_date,start_time,end_time,venue_name,venue_cep,venue_address,venue_bairro,venue_city,venue_state,venue_municipio_ibge,status,notes')
      .eq('tenant_id', tenantId)
      .eq('id', data.briefing_date_id)
      .single()
    if (dateError) throw dateError

    const { data: briefing, error: briefingError } = await context.supabase
      .from('wmp_briefings')
      .select('id,contratante_nome,contratante_empresa,contratante_email,contratante_telefone,contratante_tipo_documento,contratante_documento,evento_tipo,evento_publico_estimado')
      .eq('tenant_id', tenantId)
      .eq('id', dateRow.briefing_id)
      .single()
    if (briefingError) throw briefingError

    return {
      briefing_date_id: dateRow.id,
      briefing_id: briefing.id,
      client: {
        name: briefing.contratante_nome,
        company: briefing.contratante_empresa,
        email: briefing.contratante_email,
        phone: briefing.contratante_telefone,
        document_type: briefing.contratante_tipo_documento,
        document: briefing.contratante_documento,
      },
      event: {
        type: briefing.evento_tipo,
        event_date: dateRow.event_date,
        start_time: dateRow.start_time,
        end_time: dateRow.end_time,
        audience: briefing.evento_publico_estimado,
        venue_name: dateRow.venue_name,
        venue_cep: dateRow.venue_cep,
        venue_address: dateRow.venue_address,
        venue_bairro: dateRow.venue_bairro,
        venue_city: dateRow.venue_city,
        venue_state: dateRow.venue_state,
        venue_municipio_ibge: dateRow.venue_municipio_ibge,
        notes: dateRow.notes,
      },
    }
  })

export const markWmpCorporateDateQuoted = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { briefing_date_id: string; proposal_id: string }) => z.object({
    briefing_date_id: z.string().uuid(),
    proposal_id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    const { data: proposal, error: proposalError } = await context.supabase
      .from('wmp_proposals')
      .select('id,briefing_id,proposal_number')
      .eq('tenant_id', tenantId)
      .eq('id', data.proposal_id)
      .single()
    if (proposalError) throw proposalError

    const { data: dateRow, error: dateError } = await context.supabase
      .from('wmp_briefing_dates')
      .select('id,briefing_id,status,notes')
      .eq('tenant_id', tenantId)
      .eq('id', data.briefing_date_id)
      .single()
    if (dateError) throw dateError
    if (proposal.briefing_id !== dateRow.briefing_id) throw new Error('A proposta não pertence ao briefing desta data corporativa.')

    const marker = `Proposta ${proposal.proposal_number} vinculada em ${new Date().toISOString()}`
    const nextNotes = [dateRow.notes, marker].filter(Boolean).join('\n')
    const { error: updateError } = await context.supabase
      .from('wmp_briefing_dates')
      .update({ status: 'QUOTED', notes: nextNotes, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', data.briefing_date_id)
    if (updateError) throw updateError

    return { ok: true, status: 'QUOTED', proposal_number: proposal.proposal_number }
  })
