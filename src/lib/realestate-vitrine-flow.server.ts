/**
 * Real estate vitrine — extracted business flow (server-only).
 *
 * Reused by both the public HTTP routes (/api/public/realestate/*) and
 * integration tests so the same exact code path is exercised end-to-end.
 *
 * SERVER-ONLY: never import into client modules.
 */
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { notifyManagers, sendVitrineEmail, APP_BASE_URL } from '@/lib/realestate-vitrine-notify.server'

export type InterestKind = 'interesse' | 'visita' | 'avaliacao' | 'contato' | 'proposta'

export interface ProcessInterestInput {
  companySlug: string
  propertyId: string
  kind?: InterestKind
  contactName: string
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
  message?: string | null
  source?: string | null
  utm?: Record<string, string>
  ip?: string | null
  userAgent?: string | null
}

export interface ProcessInterestResult {
  ok: true
  interestId: string
  leadId: string
  messageId: string
  historyId: string
  emailsQueued: string[]
}

export type ProcessInterestError =
  | { ok: false; code: 'company_not_found' }
  | { ok: false; code: 'property_unavailable' }
  | { ok: false; code: 'contact_required' }

export async function processInterest(
  input: ProcessInterestInput,
): Promise<ProcessInterestResult | ProcessInterestError> {
  if (!input.contactEmail && !input.contactPhone && !input.contactWhatsapp) {
    return { ok: false, code: 'contact_required' }
  }

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name, vitrine_enabled, public_slug')
    .eq('public_slug', input.companySlug)
    .eq('vitrine_enabled', true)
    .maybeSingle()
  if (!company) return { ok: false, code: 'company_not_found' }
  const companyId = (company as any).id as string
  const companyName = (company as any).name as string

  const { data: property } = await supabaseAdmin
    .from('realestate_properties')
    .select('id, title, reference_code, broker_user_id, company_id, is_published, status, approval_status')
    .eq('id', input.propertyId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (
    !property ||
    (property as any).is_published !== true ||
    (property as any).status !== 'ativo' ||
    (property as any).approval_status !== 'approved'
  ) {
    return { ok: false, code: 'property_unavailable' }
  }
  const propertyTitle = (property as any).title as string
  const referenceCode = (property as any).reference_code as string | null
  const brokerUserId = (property as any).broker_user_id as string | null
  const kind: InterestKind = input.kind ?? 'interesse'

  const phoneOrWA = input.contactWhatsapp || input.contactPhone || null

  // Lead resolution / creation
  let leadId: string | null = null
  if (input.contactEmail) {
    const { data: existing } = await supabaseAdmin
      .from('crm_leads').select('id')
      .eq('company_id', companyId).eq('email', input.contactEmail).limit(1).maybeSingle()
    if (existing) leadId = (existing as any).id
  }
  if (!leadId && phoneOrWA) {
    const { data: existing } = await supabaseAdmin
      .from('crm_leads').select('id')
      .eq('company_id', companyId).eq('phone', phoneOrWA).limit(1).maybeSingle()
    if (existing) leadId = (existing as any).id
  }
  if (!leadId) {
    const { data: lead, error } = await supabaseAdmin.from('crm_leads').insert({
      company_id: companyId,
      name: input.contactName,
      email: input.contactEmail ?? null,
      phone: phoneOrWA,
      source: `vitrine:${input.source ?? 'vitrine'}`,
      status: 'new',
      tags: ['vitrine', 'interesse-imovel'],
      notes: input.message ?? null,
      owner_user_id: brokerUserId,
    }).select('id').single()
    if (error) throw error
    leadId = (lead as any).id as string
  }

  const { data: interest, error: intErr } = await supabaseAdmin
    .from('realestate_interests')
    .insert({
      company_id: companyId,
      property_id: input.propertyId,
      lead_id: leadId,
      broker_user_id: brokerUserId,
      kind,
      status: 'novo',
      contact_name: input.contactName,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_whatsapp: input.contactWhatsapp ?? null,
      message: input.message ?? null,
      source: input.source ?? 'vitrine',
      utm: input.utm ?? {},
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      last_action_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (intErr) throw intErr
  const interestId = (interest as any).id as string

  const { data: msg, error: msgErr } = await supabaseAdmin.from('realestate_internal_messages').insert({
    company_id: companyId,
    channel: 'vitrine',
    request_kind: kind === 'visita' ? 'visita' : kind === 'avaliacao' ? 'avaliacao' : kind === 'contato' ? 'contato' : 'interesse',
    status: 'nova',
    property_id: input.propertyId,
    interest_id: interestId,
    lead_id: leadId,
    contact_name: input.contactName,
    contact_email: input.contactEmail ?? null,
    contact_phone: phoneOrWA,
    subject: `${kind === 'visita' ? 'Pedido de visita' : kind === 'avaliacao' ? 'Pedido de avaliação' : kind === 'contato' ? 'Solicitação de contato' : 'Interesse no imóvel'}${referenceCode ? ` ${referenceCode}` : ''}`,
    body: input.message ?? `${input.contactName} demonstrou interesse no imóvel ${propertyTitle}.`,
    assigned_user_id: brokerUserId,
  }).select('id').single()
  if (msgErr) throw msgErr
  const messageId = (msg as any).id as string

  const { data: hist, error: histErr } = await supabaseAdmin.from('realestate_property_history').insert({
    company_id: companyId,
    property_id: input.propertyId,
    event_code: `interest.${kind}`,
    actor_lead_id: leadId,
    description: `${input.contactName} registrou ${kind} pela vitrine.`,
    payload: { interest_id: interestId, source: input.source, utm: input.utm ?? {} },
  }).select('id').single()
  if (histErr) throw histErr

  const actionUrl = `${APP_BASE_URL}/imobiliaria/interessados?id=${interestId}`
  const { contacts: managerContacts } = await notifyManagers({
    companyId,
    title: 'Novo interessado',
    message: `${input.contactName} — ${propertyTitle}${referenceCode ? ` (${referenceCode})` : ''}`,
    category: 'realestate.interest.new',
    severity: 'info',
    actionUrl,
    actionLabel: 'Abrir interessado',
  })

  const brokerContacts: Array<{ email: string | null }> = []
  if (brokerUserId) {
    const { data: brokerRow } = await supabaseAdmin
      .from('user_profiles').select('email').eq('user_id', brokerUserId).maybeSingle()
    if (brokerRow && (brokerRow as any).email) brokerContacts.push({ email: (brokerRow as any).email })
  }
  const allEmails = new Set<string>()
  for (const c of managerContacts) if (c.email) allEmails.add(c.email)
  for (const c of brokerContacts) if (c.email) allEmails.add(c.email)
  const emailsQueued: string[] = []
  for (const email of allEmails) {
    const r = await sendVitrineEmail({
      templateName: 'realestate-vitrine-interest-agency',
      to: email,
      templateData: {
        propertyTitle, referenceCode,
        customerName: input.contactName,
        customerEmail: input.contactEmail,
        customerPhone: phoneOrWA,
        message: input.message, kind, source: input.source,
        actionUrl, receivedAt: new Date().toISOString(),
      },
      idempotencyKey: `re-vitrine-interest-agency-${interestId}-${email}`,
    })
    if (r.status === 'queued' || r.status === 'suppressed') emailsQueued.push(email)
  }
  if (input.contactEmail) {
    const r = await sendVitrineEmail({
      templateName: 'realestate-vitrine-interest-customer',
      to: input.contactEmail,
      templateData: {
        customerName: input.contactName,
        propertyTitle, referenceCode,
        companyName,
        propertyUrl: `${APP_BASE_URL}/imoveis/${input.companySlug}/${input.propertyId}`,
        receivedAt: new Date().toISOString(),
      },
      idempotencyKey: `re-vitrine-interest-customer-${interestId}`,
    })
    if (r.status === 'queued' || r.status === 'suppressed') emailsQueued.push(input.contactEmail)
  }

  return { ok: true, interestId, leadId: leadId!, messageId, historyId: (hist as any).id as string, emailsQueued }
}

// ---------------------------------------------------------------------------

export interface ProcessSavedSearchInput {
  companySlug: string
  contactName: string
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
  operation: 'venda' | 'locacao' | 'venda_ou_locacao'
  propertyTypes: string[]
  cities: string[]
  neighborhoods: string[]
  priceMin?: number | null
  priceMax?: number | null
  bedroomsMin: number
  bathroomsMin: number
  parkingMin: number
  areaMin?: number | null
  notes?: string | null
  source?: string | null
  utm?: Record<string, string>
  ip?: string | null
  userAgent?: string | null
}

export interface ProcessSavedSearchResult {
  ok: true
  intentId: string
  leadId: string
  messageId: string
  matchesCount: number
  emailsQueued: string[]
}

export type ProcessSavedSearchError =
  | { ok: false; code: 'company_not_found' }
  | { ok: false; code: 'contact_required' }

export async function processSavedSearch(
  input: ProcessSavedSearchInput,
): Promise<ProcessSavedSearchResult | ProcessSavedSearchError> {
  if (!input.contactEmail && !input.contactPhone && !input.contactWhatsapp) {
    return { ok: false, code: 'contact_required' }
  }
  const { data: company } = await supabaseAdmin
    .from('companies').select('id, name')
    .eq('public_slug', input.companySlug).eq('vitrine_enabled', true).maybeSingle()
  if (!company) return { ok: false, code: 'company_not_found' }
  const companyId = (company as any).id as string
  const companyName = (company as any).name as string
  const phoneOrWA = input.contactWhatsapp || input.contactPhone || null

  let leadId: string | null = null
  if (input.contactEmail) {
    const { data: existing } = await supabaseAdmin.from('crm_leads').select('id')
      .eq('company_id', companyId).eq('email', input.contactEmail).limit(1).maybeSingle()
    if (existing) leadId = (existing as any).id
  }
  if (!leadId && phoneOrWA) {
    const { data: existing } = await supabaseAdmin.from('crm_leads').select('id')
      .eq('company_id', companyId).eq('phone', phoneOrWA).limit(1).maybeSingle()
    if (existing) leadId = (existing as any).id
  }
  if (!leadId) {
    const { data: lead, error } = await supabaseAdmin.from('crm_leads').insert({
      company_id: companyId,
      name: input.contactName,
      email: input.contactEmail ?? null,
      phone: phoneOrWA,
      source: `vitrine:${input.source ?? 'vitrine'}`,
      status: 'new',
      tags: ['vitrine', 'busca-salva'],
      notes: input.notes ?? null,
    }).select('id').single()
    if (error) throw error
    leadId = (lead as any).id as string
  }

  const { data: intent, error: intentErr } = await supabaseAdmin.from('realestate_search_intents').insert({
    company_id: companyId,
    lead_id: leadId,
    contact_name: input.contactName,
    contact_email: input.contactEmail ?? null,
    contact_phone: phoneOrWA,
    whatsapp: input.contactWhatsapp ?? null,
    operation: input.operation,
    property_types: input.propertyTypes,
    price_min: input.priceMin ?? null,
    price_max: input.priceMax ?? null,
    area_min: input.areaMin ?? null,
    bedrooms_min: input.bedroomsMin,
    bathrooms_min: input.bathroomsMin,
    parking_min: input.parkingMin,
    cities: input.cities,
    neighborhoods: input.neighborhoods,
    status: 'ativo',
    notes: input.notes ?? null,
    source: input.source ?? 'vitrine',
    utm: input.utm ?? {},
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
  }).select('id').single()
  if (intentErr) throw intentErr
  const intentId = (intent as any).id as string

  let matchesCount = 0
  try {
    let q = supabaseAdmin.from('realestate_properties').select('id', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('is_published', true).eq('status', 'ativo').eq('approval_status', 'approved')
    if (input.operation !== 'venda_ou_locacao') q = q.eq('operation', input.operation)
    if (input.propertyTypes.length) q = q.in('property_type', input.propertyTypes as any)
    if (input.cities.length) q = q.in('city', input.cities)
    if (input.bedroomsMin > 0) q = q.gte('bedrooms', input.bedroomsMin)
    const { count } = await q
    matchesCount = count ?? 0
  } catch (err) { console.warn('matches count failed', err) }

  const { data: msg, error: msgErr } = await supabaseAdmin.from('realestate_internal_messages').insert({
    company_id: companyId,
    channel: 'vitrine',
    request_kind: 'busca',
    status: 'nova',
    intent_id: intentId,
    lead_id: leadId,
    contact_name: input.contactName,
    contact_email: input.contactEmail ?? null,
    contact_phone: phoneOrWA,
    subject: `Nova busca cadastrada — ${input.contactName}`,
    body: `Cliente cadastrou busca pela vitrine. Imóveis compatíveis no estoque: ${matchesCount}.${input.notes ? `\n\nObservações: ${input.notes}` : ''}`,
  }).select('id').single()
  if (msgErr) throw msgErr
  const messageId = (msg as any).id as string

  const actionUrl = `${APP_BASE_URL}/imobiliaria/intencoes?id=${intentId}`
  const { contacts: managerContacts } = await notifyManagers({
    companyId,
    title: 'Nova busca salva',
    message: `${input.contactName} cadastrou uma nova busca (${matchesCount} compatíveis).`,
    category: 'realestate.search.new',
    severity: matchesCount > 0 ? 'success' : 'info',
    actionUrl,
    actionLabel: 'Abrir busca',
  })

  const emailsQueued: string[] = []
  for (const c of managerContacts) {
    if (!c.email) continue
    const r = await sendVitrineEmail({
      templateName: 'realestate-vitrine-search-agency',
      to: c.email,
      templateData: {
        customerName: input.contactName,
        customerEmail: input.contactEmail,
        customerPhone: phoneOrWA,
        operation: input.operation,
        cities: input.cities,
        neighborhoods: input.neighborhoods,
        priceMin: input.priceMin ?? null,
        priceMax: input.priceMax ?? null,
        bedrooms: input.bedroomsMin,
        notes: input.notes,
        matchesCount,
        source: input.source,
        actionUrl,
        receivedAt: new Date().toISOString(),
      },
      idempotencyKey: `re-vitrine-search-agency-${intentId}-${c.email}`,
    })
    if (r.status === 'queued' || r.status === 'suppressed') emailsQueued.push(c.email)
  }
  if (input.contactEmail) {
    const r = await sendVitrineEmail({
      templateName: 'realestate-vitrine-search-customer',
      to: input.contactEmail,
      templateData: {
        customerName: input.contactName,
        operation: input.operation,
        cities: input.cities,
        neighborhoods: input.neighborhoods,
        priceMin: input.priceMin ?? null,
        priceMax: input.priceMax ?? null,
        bedrooms: input.bedroomsMin,
        companyName,
        receivedAt: new Date().toISOString(),
      },
      idempotencyKey: `re-vitrine-search-customer-${intentId}`,
    })
    if (r.status === 'queued' || r.status === 'suppressed') emailsQueued.push(input.contactEmail)
  }

  return { ok: true, intentId, leadId: leadId!, messageId, matchesCount, emailsQueued }
}
