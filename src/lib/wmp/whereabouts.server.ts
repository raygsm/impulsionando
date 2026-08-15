import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { flushOutboxByReference } from '@/lib/outboxFlush.server'

const TENANT_SLUG = 'wmp'
const DEFAULT_EMAIL = 'wagner.miller_contato@outlook.com'
const BASE_URL = 'https://wmp.impulsionando.com.br'

async function getTenant() {
  const { data, error } = await supabaseAdmin
    .from('communication_tenants')
    .select('id,settings')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .single()
  if (error) throw error
  return data as { id: string; settings: Record<string, unknown> | null }
}

export async function ensureDailyWhereaboutsRequest(date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })) {
  const tenant = await getTenant()
  const email = String(tenant.settings?.whereabouts_manager_email || DEFAULT_EMAIL).trim().toLowerCase()

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('wmp_whereabouts_daily_requests')
    .select('id,access_token,status,recipient_email,publication_date,sent_at')
    .eq('tenant_id', tenant.id)
    .eq('publication_date', date)
    .maybeSingle()
  if (existingError) throw existingError

  let request = existing
  if (!request) {
    const { data, error } = await supabaseAdmin
      .from('wmp_whereabouts_daily_requests')
      .insert({ tenant_id: tenant.id, publication_date: date, recipient_email: email })
      .select('id,access_token,status,recipient_email,publication_date,sent_at')
      .single()
    if (error) throw error
    request = data
  }

  if (!request) throw new Error('whereabouts_request_unavailable')
  if (request.status === 'COMPLETED' || request.sent_at) return { request, delivery: null, alreadyHandled: true }

  const formUrl = `${BASE_URL}/wmp/onde-estou/atualizar?token=${encodeURIComponent(request.access_token)}`
  const body = [
    'Olá, Wagner.',
    '',
    'Sou o Milito. Preciso atualizar o Onde Estou de hoje para manter sua agenda pública correta no site da WMP.',
    '',
    'Leva menos de um minuto: informe apenas o nome do local, o endereço e os horários.',
    '',
    `Atualizar Onde Estou: ${formUrl}`,
    '',
    'Assim que você salvar, eu publico automaticamente no site.',
    '',
    'Milito',
    'WMP — Wagner Miller Produções',
  ].join('\n')

  const { data: outbox, error: outboxError } = await supabaseAdmin
    .from('message_outbox')
    .insert({
      event_code: 'wmp.whereabouts.daily_request',
      channel: 'email',
      recipient_email: email,
      recipient_name: 'Wagner Miller',
      subject: `Milito — Onde Estou de ${new Date(`${date}T12:00:00-03:00`).toLocaleDateString('pt-BR')}`,
      body,
      payload: { tenant_slug: TENANT_SLUG, publication_date: date, request_id: request.id, agent: 'Milito' },
      status: 'queued',
      reference_type: 'wmp_whereabouts_daily',
      reference_id: request.id,
      idempotency_key: `wmp-whereabouts-${date}`,
      correlation_id: request.id,
    })
    .select('id')
    .single()

  if (outboxError && !String(outboxError.message).toLowerCase().includes('duplicate')) throw outboxError

  const delivery = await flushOutboxByReference('wmp_whereabouts_daily', request.id)
  if (delivery.sent > 0) {
    await supabaseAdmin
      .from('wmp_whereabouts_daily_requests')
      .update({ status: 'SENT', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', request.id)
  }

  return { request, outboxId: outbox?.id ?? null, delivery, alreadyHandled: false }
}

export async function getWhereaboutsRequest(token: string) {
  const { data, error } = await supabaseAdmin
    .from('wmp_whereabouts_daily_requests')
    .select('id,tenant_id,publication_date,status,expires_at,completed_at')
    .eq('access_token', token)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  if (new Date(data.expires_at).getTime() < Date.now() && data.status !== 'COMPLETED') return { ...data, expired: true }
  return { ...data, expired: false }
}

export async function publishWhereabouts(input: { token: string; venue_name: string; venue_address: string; start_time: string; end_time?: string | null }) {
  const request = await getWhereaboutsRequest(input.token)
  if (!request) throw new Error('invalid_token')
  if (request.expired) throw new Error('expired_token')

  const venueName = input.venue_name.trim()
  const venueAddress = input.venue_address.trim()
  if (venueName.length < 2 || venueAddress.length < 5) throw new Error('invalid_location')
  if (!/^\d{2}:\d{2}$/.test(input.start_time)) throw new Error('invalid_start_time')
  if (input.end_time && !/^\d{2}:\d{2}$/.test(input.end_time)) throw new Error('invalid_end_time')

  const now = new Date().toISOString()
  const { data: entry, error } = await supabaseAdmin
    .from('wmp_whereabouts_entries')
    .upsert({
      tenant_id: request.tenant_id,
      request_id: request.id,
      event_date: request.publication_date,
      venue_name: venueName,
      venue_address: venueAddress,
      start_time: input.start_time,
      end_time: input.end_time || null,
      timezone: 'America/Sao_Paulo',
      status: 'PUBLISHED',
      published_at: now,
      updated_at: now,
    }, { onConflict: 'tenant_id,event_date,venue_name,start_time' })
    .select('id,event_date,venue_name,venue_address,start_time,end_time,status,published_at')
    .single()
  if (error) throw error

  await supabaseAdmin
    .from('wmp_whereabouts_daily_requests')
    .update({ status: 'COMPLETED', completed_at: now, updated_at: now })
    .eq('id', request.id)

  return entry
}

export async function listPublicWhereabouts() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const tenant = await getTenant()
  const { data, error } = await supabaseAdmin
    .from('wmp_whereabouts_entries')
    .select('id,event_date,venue_name,venue_address,start_time,end_time,published_at')
    .eq('tenant_id', tenant.id)
    .eq('status', 'PUBLISHED')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(30)
  if (error) throw error
  return data ?? []
}
