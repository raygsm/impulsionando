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

  const { data: todaysEntry, error: entryError } = await supabaseAdmin
    .from('wmp_whereabouts_entries')
    .select('id,event_date,venue_name,venue_address,start_time,end_time,status')
    .eq('tenant_id', tenant.id)
    .eq('event_date', date)
    .eq('status', 'PUBLISHED')
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (entryError) throw entryError

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('wmp_whereabouts_daily_requests')
    .select('id,access_token,status,recipient_email,publication_date,sent_at,existing_entry_id')
    .eq('tenant_id', tenant.id)
    .eq('publication_date', date)
    .maybeSingle()
  if (existingError) throw existingError

  let request = existing
  if (!request) {
    const { data, error } = await supabaseAdmin
      .from('wmp_whereabouts_daily_requests')
      .insert({ tenant_id: tenant.id, publication_date: date, recipient_email: email, existing_entry_id: todaysEntry?.id ?? null })
      .select('id,access_token,status,recipient_email,publication_date,sent_at,existing_entry_id')
      .single()
    if (error) throw error
    request = data
  }

  if (!request) throw new Error('whereabouts_request_unavailable')
  if (request.status === 'COMPLETED' || request.sent_at) return { request, delivery: null, alreadyHandled: true }

  const formUrl = `${BASE_URL}/wmp/onde-estou/atualizar?token=${encodeURIComponent(request.access_token)}`
  const dateLabel = new Date(`${date}T12:00:00-03:00`).toLocaleDateString('pt-BR')
  const body = todaysEntry
    ? [
        'Olá, Wagner.',
        '',
        `Sou o Milito. Para hoje (${dateLabel}) sua agenda está cadastrada assim:`,
        `${todaysEntry.venue_name} — ${todaysEntry.venue_address}`,
        `Horário: ${String(todaysEntry.start_time).slice(0, 5)}${todaysEntry.end_time ? ` às ${String(todaysEntry.end_time).slice(0, 5)}` : ''}`,
        '',
        'Continua igual? Abra o link e confirme. Se mudou, altere os dados e salve.',
        '',
        `Confirmar ou alterar: ${formUrl}`,
        '',
        'Milito',
        'WMP — Wagner Miller Produções',
      ].join('\n')
    : [
        'Olá, Wagner.',
        '',
        `Sou o Milito. Ainda não há Onde Estou cadastrado para hoje (${dateLabel}).`,
        'Informe apenas o nome do local, o endereço e os horários.',
        '',
        `Cadastrar Onde Estou: ${formUrl}`,
        '',
        'Assim que você salvar, eu publico automaticamente no site.',
        '',
        'Milito',
        'WMP — Wagner Miller Produções',
      ].join('\n')

  const { data: outbox, error: outboxError } = await supabaseAdmin
    .from('message_outbox')
    .insert({
      event_code: todaysEntry ? 'wmp.whereabouts.daily_confirmation' : 'wmp.whereabouts.daily_request',
      channel: 'email',
      recipient_email: email,
      recipient_name: 'Wagner Miller',
      subject: todaysEntry ? `Milito — confirme seu Onde Estou de ${dateLabel}` : `Milito — Onde Estou de ${dateLabel}`,
      body,
      payload: { tenant_slug: TENANT_SLUG, publication_date: date, request_id: request.id, existing_entry_id: todaysEntry?.id ?? null, agent: 'Milito' },
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
      .update({ status: 'SENT', sent_at: new Date().toISOString(), existing_entry_id: todaysEntry?.id ?? null, updated_at: new Date().toISOString() })
      .eq('id', request.id)
  }

  return { request, outboxId: outbox?.id ?? null, delivery, alreadyHandled: false, hadExistingEntry: Boolean(todaysEntry) }
}

export async function getWhereaboutsRequest(token: string) {
  const { data, error } = await supabaseAdmin
    .from('wmp_whereabouts_daily_requests')
    .select('id,tenant_id,publication_date,status,expires_at,completed_at,existing_entry_id')
    .eq('access_token', token)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  let entry = null
  if (data.existing_entry_id) {
    const { data: existingEntry, error: existingEntryError } = await supabaseAdmin
      .from('wmp_whereabouts_entries')
      .select('id,event_date,venue_name,venue_address,start_time,end_time,status')
      .eq('id', data.existing_entry_id)
      .maybeSingle()
    if (existingEntryError) throw existingEntryError
    entry = existingEntry
  }

  if (new Date(data.expires_at).getTime() < Date.now() && data.status !== 'COMPLETED') return { ...data, entry, expired: true }
  return { ...data, entry, expired: false }
}

export async function confirmWhereabouts(token: string) {
  const request = await getWhereaboutsRequest(token)
  if (!request) throw new Error('invalid_token')
  if (request.expired) throw new Error('expired_token')
  if (!request.entry?.id) throw new Error('no_existing_entry')
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('wmp_whereabouts_entries').update({ confirmed_at: now, updated_at: now }).eq('id', request.entry.id)
  if (error) throw error
  await supabaseAdmin.from('wmp_whereabouts_daily_requests').update({ status: 'COMPLETED', completed_at: now, updated_at: now }).eq('id', request.id)
  return { ok: true }
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
  let entry
  if (request.entry?.id) {
    const { data, error } = await supabaseAdmin
      .from('wmp_whereabouts_entries')
      .update({ venue_name: venueName, venue_address: venueAddress, start_time: input.start_time, end_time: input.end_time || null, status: 'PUBLISHED', source: 'daily_confirmation', published_at: now, confirmed_at: now, updated_at: now })
      .eq('id', request.entry.id)
      .select('id,event_date,venue_name,venue_address,start_time,end_time,status,published_at')
      .single()
    if (error) throw error
    entry = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('wmp_whereabouts_entries')
      .insert({ tenant_id: request.tenant_id, request_id: request.id, event_date: request.publication_date, venue_name: venueName, venue_address: venueAddress, start_time: input.start_time, end_time: input.end_time || null, timezone: 'America/Sao_Paulo', status: 'PUBLISHED', source: 'daily_request', published_at: now, confirmed_at: now, updated_at: now })
      .select('id,event_date,venue_name,venue_address,start_time,end_time,status,published_at')
      .single()
    if (error) throw error
    entry = data
  }

  await supabaseAdmin.from('wmp_whereabouts_daily_requests').update({ status: 'COMPLETED', completed_at: now, updated_at: now }).eq('id', request.id)
  return entry
}

export async function listPublicWhereabouts() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const tenant = await getTenant()
  const { data, error } = await supabaseAdmin
    .from('wmp_whereabouts_entries')
    .select('id,event_date,venue_name,venue_address,start_time,end_time,published_at,confirmed_at')
    .eq('tenant_id', tenant.id)
    .eq('status', 'PUBLISHED')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(60)
  if (error) throw error
  return data ?? []
}
