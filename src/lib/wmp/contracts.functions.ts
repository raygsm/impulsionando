import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { flushOutboxByReference } from '@/lib/outboxFlush.server'

const WMP_HOST = 'https://wmp.impulsionando.com.br'

async function wmpTenantId(supabase: any) {
  const { data, error } = await supabase.from('communication_tenants').select('id').eq('slug', 'wmp').eq('active', true).single()
  if (error) throw error
  return data.id as string
}

export const listWmpContracts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await wmpTenantId(context.supabase)
    const { data, error } = await context.supabase
      .from('wmp_contracts')
      .select('id,proposal_id,contract_number,status,client_snapshot,event_snapshot,commercial_snapshot,sent_at,viewed_at,signed_at,token_expires_at,created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return data ?? []
  })

export const generateAndSendWmpContract = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { proposal_id: string }) => z.object({ proposal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await wmpTenantId(context.supabase)
    const { data: proposal, error: proposalError } = await context.supabase
      .from('wmp_proposals')
      .select('id,status,proposal_number,client_snapshot,event_snapshot,commercial_summary')
      .eq('tenant_id', tenantId)
      .eq('id', data.proposal_id)
      .single()
    if (proposalError) throw proposalError
    if (!['ACCEPTED', 'SIGNED', 'WON'].includes(proposal.status)) throw new Error('A proposta precisa estar aceita antes da geração do contrato.')

    const { data: rows, error: contractError } = await context.supabase.rpc('create_wmp_contract_from_accepted_proposal', { p_proposal_id: data.proposal_id })
    if (contractError) {
      if (String(contractError.message).includes('legal_terms_not_configured')) {
        throw new Error('Contrato bloqueado: ainda não há cláusulas jurídicas WMP ativas e aprovadas.')
      }
      throw contractError
    }
    const created = Array.isArray(rows) ? rows[0] : rows
    if (!created?.contract_id || !created?.access_token) throw new Error('Contrato não retornou token seguro de assinatura.')

    const client = (proposal.client_snapshot ?? {}) as Record<string, unknown>
    const email = String(client.email ?? '').trim().toLowerCase()
    const name = String(client.name ?? client.razao_social ?? 'Cliente').trim()
    if (!email || !email.includes('@')) throw new Error('O cliente da proposta não possui e-mail válido para receber o contrato.')

    const publicUrl = `${WMP_HOST}/contrato/${encodeURIComponent(created.access_token)}`
    const referenceId = String(created.contract_id)
    const idempotencyKey = `wmp-contract-${referenceId}-send`
    const { data: outbox, error: outboxError } = await context.supabase
      .from('message_outbox')
      .upsert({
        event_code: 'wmp.contract.sent',
        channel: 'email',
        recipient_email: email,
        recipient_name: name,
        subject: `Contrato ${created.contract_number} — WMP`,
        body: [
          `Olá, ${name}.`,
          '',
          `A proposta comercial ${proposal.proposal_number} foi aceita e o contrato correspondente está disponível para revisão e assinatura.`,
          '',
          `Acessar contrato: ${publicUrl}`,
          '',
          'O link é individual, seguro e possui validade limitada.',
          '',
          'WMP — Wagner Miller Produções',
          'sac@wagnermiller.com.br',
        ].join('\n'),
        payload: { tenant_slug: 'wmp', contract_id: referenceId, proposal_id: data.proposal_id, contract_number: created.contract_number, public_url: publicUrl, agent: 'Milito' },
        status: 'queued',
        reference_type: 'wmp_contract',
        reference_id: referenceId,
        idempotency_key: idempotencyKey,
        correlation_id: referenceId,
      }, { onConflict: 'idempotency_key', ignoreDuplicates: true })
      .select('id')
      .maybeSingle()
    if (outboxError) throw outboxError

    const delivery = await flushOutboxByReference('wmp_contract', referenceId)
    if (delivery.sent > 0) {
      await context.supabase.from('wmp_contracts').update({ status: 'SENT', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', referenceId).in('status', ['READY', 'SENT'])
    }

    return { contract_id: referenceId, contract_number: created.contract_number, public_url: publicUrl, outbox_id: outbox?.id ?? null, delivery }
  })

export const loadPublicWmpContract = createServerFn({ method: 'POST' })
  .inputValidator((d: { token: string }) => z.object({ token: z.string().min(40).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: contract, error } = await supabaseAdmin.rpc('get_wmp_contract_by_token', { p_token: data.token })
    if (error) throw error
    return contract
  })

export const signPublicWmpContract = createServerFn({ method: 'POST' })
  .inputValidator((d: { token: string; signer_name: string; signer_document?: string; user_agent?: string }) => z.object({
    token: z.string().min(40).max(200),
    signer_name: z.string().trim().min(3).max(200),
    signer_document: z.string().trim().max(40).optional(),
    user_agent: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin.rpc('sign_wmp_contract_by_token', {
      p_token: data.token,
      p_signer_name: data.signer_name,
      p_signer_document: data.signer_document ?? '',
      p_ip: null,
      p_user_agent: data.user_agent ?? null,
    })
    if (error) throw error
    return result
  })
