import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { flushOutboxByReference } from '@/lib/outboxFlush.server'
import { dispatchN8nByEvent } from '@/lib/n8n-dispatch-by-event.server'

const WMP_HOST = 'https://wmp.impulsionando.com.br'

export const sendWmpDjInvitation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { booking_id: string }) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: invite, error } = await context.supabase.rpc('create_wmp_dj_invitation', { p_booking_id: data.booking_id })
    if (error) throw error
    if (!invite?.token || !invite?.partner_email) throw new Error('Convite DJ não retornou token ou e-mail.')

    const url = `${WMP_HOST}/dj/convite/${encodeURIComponent(invite.token)}`
    const date = new Date(`${invite.event_date}T12:00:00`).toLocaleDateString('pt-BR')
    const fee = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(invite.fee_cents) || 0) / 100)
    const meal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(invite.meal_allowance_cents) || 0) / 100)
    const parking = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(invite.parking_allowance_cents) || 0) / 100)
    const referenceId = String(invite.booking_id)

    const { data: outbox, error: outboxError } = await context.supabase
      .from('message_outbox')
      .upsert({
        event_code: 'wmp.dj.offered', channel: 'email', recipient_email: invite.partner_email, recipient_name: invite.partner_name,
        subject: `Convite WMP — ${invite.event_name} em ${date}`,
        body: [
          `Olá, ${invite.partner_name}.`, '',
          `A WMP gostaria de verificar sua disponibilidade para ${invite.event_name}.`,
          `Data: ${date}`,
          `Local: ${[invite.venue_name, invite.city, invite.state].filter(Boolean).join(' · ') || 'a confirmar'}`,
          `Cachê: ${fee}`,
          `Alimentação: ${meal}`,
          `Estacionamento: ${parking}`,
          '',
          'Use o link individual abaixo para aceitar ou recusar dentro do prazo:',
          url, '',
          'Milito', 'WMP — Wagner Miller Produções', 'sac@wagnermiller.com.br',
        ].join('\n'),
        payload: { tenant_slug: 'wmp', booking_id: referenceId, event_name: invite.event_name, response_url: url, expires_at: invite.expires_at, agent: 'Milito' },
        status: 'queued', reference_type: 'wmp_dj_booking', reference_id: referenceId,
        idempotency_key: `wmp-dj-offer-${referenceId}-${String(invite.expires_at)}`, correlation_id: referenceId,
      }, { onConflict: 'idempotency_key', ignoreDuplicates: true })
      .select('id').maybeSingle()
    if (outboxError) throw outboxError

    const delivery = await flushOutboxByReference('wmp_dj_booking', referenceId)
    const automation = await dispatchN8nByEvent('wmp.dj.offered', { booking_id: referenceId, event_name: invite.event_name, event_date: invite.event_date, partner_email: invite.partner_email, expires_at: invite.expires_at }, null, 'wmp')
    return { booking_id: referenceId, delivery, automation, outbox_id: outbox?.id ?? null }
  })

export const loadPublicWmpDjInvitation = createServerFn({ method: 'POST' })
  .inputValidator((d: { token: string }) => z.object({ token: z.string().min(40).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: invite, error } = await supabaseAdmin.rpc('get_wmp_dj_invitation_by_token', { p_token: data.token })
    if (error) throw error
    return invite
  })

export const respondPublicWmpDjInvitation = createServerFn({ method: 'POST' })
  .inputValidator((d: { token: string; decision: 'ACCEPT' | 'DECLINE'; reason?: string }) => z.object({ token: z.string().min(40).max(200), decision: z.enum(['ACCEPT','DECLINE']), reason: z.string().trim().max(500).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin.rpc('respond_wmp_dj_invitation', { p_token: data.token, p_decision: data.decision, p_reason: data.reason ?? null })
    if (error) throw error
    if (result?.booking_id) {
      await dispatchN8nByEvent(data.decision === 'ACCEPT' ? 'wmp.dj.accepted' : 'wmp.dj.declined', { booking_id: result.booking_id, status: result.status, event_name: result.event_name, event_date: result.event_date, source: 'secure_link' }, null, 'wmp')
    }
    return result
  })
