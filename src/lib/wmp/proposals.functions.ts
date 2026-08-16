import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { dispatchN8nByEvent } from '@/lib/n8n-dispatch-by-event.server'

const WMP_TENANT_SLUG = 'wmp'

async function getWmpTenantId(supabase: any) {
  const { data, error } = await supabase.from('communication_tenants').select('id').eq('slug', WMP_TENANT_SLUG).eq('active', true).single()
  if (error) throw error
  return data.id as string
}

export const listWmpProposals = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string } = {}) => z.object({ status: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    let q = context.supabase.from('wmp_proposals').select('id, proposal_number, status, current_version, title, client_snapshot, event_snapshot, commercial_summary, opportunity_id, created_at, updated_at').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (data.status) q = q.eq('status', data.status)
    const { data: rows, error } = await q
    if (error) throw error
    return rows ?? []
  })

export const getWmpProposal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: { proposal_id: string }) => z.object({ proposal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    const { data: proposal, error } = await context.supabase.from('wmp_proposals').select('id, proposal_number, status, current_version, title, client_snapshot, event_snapshot, commercial_summary, opportunity_id, created_at, updated_at').eq('tenant_id', tenantId).eq('id', data.proposal_id).single()
    if (error) throw error
    const { data: versions, error: ve } = await context.supabase.from('wmp_proposal_versions').select('id, version, status, legal_terms_version, subtotal_cents, discount_cents, total_cents, generated_at, sent_at, accepted_at, signed_at, document_path, document_hash, created_at').eq('tenant_id', tenantId).eq('proposal_id', data.proposal_id).order('version', { ascending: false })
    if (ve) throw ve
    return { proposal, versions: versions ?? [] }
  })

export const listWmpServices = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const tenantId = await getWmpTenantId(context.supabase)
  const { data, error } = await context.supabase.from('wmp_service_catalog').select('id,code,name,category,description,default_price_cents').eq('tenant_id', tenantId).eq('active', true).order('name')
  if (error) throw error
  return data ?? []
})

export const createWmpProposalDraft = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; briefing_id?: string; opportunity_id?: string; contact_id?: string; client_snapshot?: Record<string, unknown>; event_snapshot?: Record<string, unknown>; commercial_summary?: Record<string, unknown> }) => z.object({ title: z.string().trim().min(3).max(200), briefing_id: z.string().uuid().optional(), opportunity_id: z.string().uuid().optional(), contact_id: z.string().uuid().optional(), client_snapshot: z.record(z.string(), z.unknown()).optional(), event_snapshot: z.record(z.string(), z.unknown()).optional(), commercial_summary: z.record(z.string(), z.unknown()).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    const { data: row, error } = await context.supabase.from('wmp_proposals').insert({ tenant_id: tenantId, proposal_number: 'AUTO', status: 'DRAFT', current_version: 1, title: data.title, briefing_id: data.briefing_id ?? null, opportunity_id: data.opportunity_id ?? null, contact_id: data.contact_id ?? null, client_snapshot: data.client_snapshot ?? {}, event_snapshot: data.event_snapshot ?? {}, commercial_summary: data.commercial_summary ?? {}, created_by: context.userId }).select('id, proposal_number, status, opportunity_id').single()
    if (error) throw error
    return row
  })

export const sendWmpProposal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: { proposal_id: string }) => z.object({ proposal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: outboxId, error } = await context.supabase.rpc('queue_wmp_proposal_email', { p_proposal_id: data.proposal_id })
    if (error) throw error
    const { flushOutboxByReference } = await import('@/lib/outboxFlush.server')
    const delivery = await flushOutboxByReference('wmp_proposal', data.proposal_id)
    const automation = await dispatchN8nByEvent('wmp.proposal.sent', {
      proposal_id: data.proposal_id,
      outbox_id: outboxId as string,
      delivery,
    }, null, 'wmp')
    return { outbox_id: outboxId as string, delivery, automation }
  })

type ProposalTransition = 'ACCEPTED' | 'SIGNED' | 'WON'

const transitionRules: Record<ProposalTransition, { allowed: string[]; event: string }> = {
  ACCEPTED: { allowed: ['SENT', 'VIEWED', 'ACCEPTED'], event: 'wmp.proposal.accepted' },
  SIGNED: { allowed: ['ACCEPTED', 'SIGNED'], event: 'wmp.proposal.signed' },
  WON: { allowed: ['SIGNED', 'WON'], event: 'wmp.proposal.won' },
}

export const transitionWmpProposal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: { proposal_id: string; transition: ProposalTransition }) => z.object({
    proposal_id: z.string().uuid(),
    transition: z.enum(['ACCEPTED', 'SIGNED', 'WON']),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await getWmpTenantId(context.supabase)
    const { data: proposal, error } = await context.supabase
      .from('wmp_proposals')
      .select('id,proposal_number,status,current_version,opportunity_id,event_snapshot')
      .eq('tenant_id', tenantId)
      .eq('id', data.proposal_id)
      .single()
    if (error) throw error

    const rule = transitionRules[data.transition]
    if (!rule.allowed.includes(proposal.status)) {
      throw new Error(`Transição inválida: ${proposal.status} → ${data.transition}`)
    }

    const now = new Date().toISOString()
    if (proposal.status !== data.transition) {
      const versionPatch: Record<string, unknown> = { status: data.transition }
      if (data.transition === 'ACCEPTED') versionPatch.accepted_at = now
      if (data.transition === 'SIGNED') versionPatch.signed_at = now

      const { error: versionError } = await context.supabase
        .from('wmp_proposal_versions')
        .update(versionPatch)
        .eq('tenant_id', tenantId)
        .eq('proposal_id', proposal.id)
        .eq('version', proposal.current_version)
      if (versionError) throw versionError

      const { error: proposalError } = await context.supabase
        .from('wmp_proposals')
        .update({ status: data.transition, updated_at: now })
        .eq('tenant_id', tenantId)
        .eq('id', proposal.id)
        .eq('status', proposal.status)
      if (proposalError) throw proposalError
    }

    if (data.transition === 'ACCEPTED') {
      const eventSnapshot = (proposal.event_snapshot ?? {}) as Record<string, unknown>
      const briefingDateId = typeof eventSnapshot.briefing_date_id === 'string' ? eventSnapshot.briefing_date_id : null
      if (briefingDateId) {
        const { error: dateError } = await context.supabase
          .from('wmp_briefing_dates')
          .update({ status: 'CONFIRMED', updated_at: now })
          .eq('tenant_id', tenantId)
          .eq('id', briefingDateId)
          .in('status', ['REQUESTED', 'QUOTED', 'CONFIRMED'])
        if (dateError) throw dateError
      }
    }

    const automation = await dispatchN8nByEvent(rule.event, {
      proposal_id: proposal.id,
      proposal_number: proposal.proposal_number,
      opportunity_id: proposal.opportunity_id,
      transition: data.transition,
      transitioned_at: now,
    }, null, 'wmp')

    return {
      proposal_id: proposal.id,
      proposal_number: proposal.proposal_number,
      status: data.transition,
      automation,
    }
  })
