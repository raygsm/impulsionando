/**
 * Integration tests for the public real-estate vitrine flow:
 *  - processInterest: creates lead + interest + internal message + history
 *    + property history + notifications + email_send_log rows
 *  - processSavedSearch: creates lead + intent + internal message + emails
 *  - suppression: a suppressed recipient is logged as 'suppressed' (not queued)
 *  - resend: re-enqueues a new email_send_log row
 *
 * These exercise the same code path as the public HTTP endpoints
 * (POST /api/public/realestate/interest and /saved-search).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { admin, createCompany, deleteCompany, createUser, deleteUser, assignProfile, PROFILES } from './helpers'
import { processInterest, processSavedSearch } from '@/lib/realestate-vitrine-flow.server'

const RUN = Date.now()
const SLUG = `vitrine-test-${RUN}`
const managerEmail = `re-vit-mgr-${RUN}@example.com`
const customerEmail = `re-vit-cust-${RUN}@example.com`
const suppressedEmail = `re-vit-supp-${RUN}@example.com`

let companyId = ''
let propertyId = ''
let managerUserId = ''
const createdIds: { interests: string[]; intents: string[]; leads: string[]; messages: string[]; emails: string[] } = {
  interests: [], intents: [], leads: [], messages: [], emails: [],
}

beforeAll(async () => {
  companyId = await createCompany(`Vitrine Test ${RUN}`)

  await admin.from('companies').update({
    public_slug: SLUG,
    vitrine_enabled: true,
  }).eq('id', companyId)

  // Manager user with realestate.interest.read via gestor profile.
  const mgr = await createUser(managerEmail)
  managerUserId = mgr.id
  await assignProfile({ userId: managerUserId, companyId, profileId: PROFILES.gestor, email: managerEmail })

  // Approved + published property.
  const { data: prop, error } = await admin
    .from('realestate_properties')
    .insert({
      company_id: companyId,
      title: `Apto Teste ${RUN}`,
      reference_code: `REF-${RUN}`,
      operation: 'venda',
      property_type: 'apartamento',
      sale_price: 500000,
      bedrooms: 2, bathrooms: 1, parking_spots: 1, suites: 0,
      city: 'São Paulo',
      neighborhood: 'Pinheiros',
      state: 'SP',
      is_published: true,
      status: 'ativo',
      approval_status: 'approved',
    })
    .select('id').single()
  if (error) throw error
  propertyId = prop.id

  // Pre-suppress one specific recipient for suppression test.
  // `reason` must satisfy the CHECK constraint: bounce | complaint | unsubscribe.
  await admin.from('suppressed_emails').upsert({
    email: suppressedEmail.toLowerCase(),
    reason: 'bounce',
  } as any, { onConflict: 'email' })
}, 90_000)

afterAll(async () => {
  for (const id of createdIds.interests) await admin.from('realestate_interests').delete().eq('id', id)
  for (const id of createdIds.intents) await admin.from('realestate_search_intents').delete().eq('id', id)
  for (const id of createdIds.messages) await admin.from('realestate_internal_messages').delete().eq('id', id)
  for (const id of createdIds.leads) await admin.from('crm_leads').delete().eq('id', id)
  await admin.from('realestate_property_history').delete().eq('property_id', propertyId)
  await admin.from('email_send_log').delete().in('recipient_email', [customerEmail, managerEmail, suppressedEmail])
  await admin.from('notifications').delete().eq('user_id', managerUserId)
  await admin.from('realestate_properties').delete().eq('id', propertyId)
  await admin.from('suppressed_emails').delete().eq('email', suppressedEmail.toLowerCase())
  await deleteUser(managerUserId)
  await deleteCompany(companyId)
}, 90_000)

describe('Vitrine pública — interesse', () => {
  it('cria lead, interesse, mensagem interna, histórico e e-mails (cliente + imobiliária)', async () => {
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      kind: 'interesse',
      contactName: 'Cliente Teste',
      contactEmail: customerEmail,
      contactPhone: '11999990000',
      message: 'Tenho interesse neste apartamento.',
      source: 'vitrine.test',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    createdIds.interests.push(r.interestId); createdIds.leads.push(r.leadId); createdIds.messages.push(r.messageId)

    // Lead
    const { data: lead } = await admin.from('crm_leads').select('*').eq('id', r.leadId).single()
    expect(lead?.company_id).toBe(companyId)
    expect(lead?.email).toBe(customerEmail)

    // Interest
    const { data: interest } = await admin.from('realestate_interests').select('*').eq('id', r.interestId).single()
    expect(interest?.status).toBe('novo')
    expect(interest?.property_id).toBe(propertyId)
    expect(interest?.kind).toBe('interesse')

    // Internal message
    const { data: msg } = await admin.from('realestate_internal_messages').select('*').eq('id', r.messageId).single()
    expect(msg?.interest_id).toBe(r.interestId)
    expect(msg?.status).toBe('nova')

    // Property history
    const { data: hist } = await admin.from('realestate_property_history')
      .select('*').eq('id', r.historyId).single()
    expect(hist?.event_code).toBe('interest.interesse')
    expect(hist?.actor_lead_id).toBe(r.leadId)

    // Email log: customer email registered as pending or suppressed.
    const { data: emailLogs } = await admin.from('email_send_log')
      .select('id, template_name, recipient_email, status')
      .eq('recipient_email', customerEmail)
    expect(emailLogs?.some((l) => l.template_name === 'realestate-vitrine-interest-customer')).toBe(true)

    // Notification for the manager.
    const { data: notif } = await admin.from('notifications')
      .select('*').eq('user_id', managerUserId).eq('category', 'realestate.interest.new')
    expect((notif ?? []).length).toBeGreaterThan(0)
  })

  it('falha com property_unavailable se o imóvel não estiver publicado', async () => {
    await admin.from('realestate_properties').update({ is_published: false }).eq('id', propertyId)
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      contactName: 'X', contactEmail: 'x-unavail@example.com',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('property_unavailable')
    await admin.from('realestate_properties').update({ is_published: true }).eq('id', propertyId)
    await admin.from('email_send_log').delete().eq('recipient_email', 'x-unavail@example.com')
  })

  it('falha com contact_required se não houver e-mail/telefone/whatsapp', async () => {
    const r = await processInterest({
      companySlug: SLUG, propertyId, contactName: 'Sem contato',
    } as any)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('contact_required')
  })

  it('respeita supressão: recipient suprimido é marcado como suppressed em email_send_log', async () => {
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      contactName: 'Suprimido', contactEmail: suppressedEmail,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    createdIds.interests.push(r.interestId); createdIds.leads.push(r.leadId); createdIds.messages.push(r.messageId)
    const { data: logs } = await admin.from('email_send_log')
      .select('status, template_name').eq('recipient_email', suppressedEmail)
    expect(logs?.some((l) => l.status === 'suppressed')).toBe(true)
  })
})

describe('Vitrine pública — busca salva', () => {
  it('cria lead, intent, mensagem interna e calcula contagem de matches', async () => {
    const r = await processSavedSearch({
      companySlug: SLUG,
      contactName: 'Buscador Teste',
      contactEmail: `re-vit-search-${RUN}@example.com`,
      operation: 'venda',
      propertyTypes: ['apartamento'],
      cities: ['São Paulo'],
      neighborhoods: [],
      bedroomsMin: 2,
      bathroomsMin: 0,
      parkingMin: 0,
      priceMax: 1000000,
      source: 'vitrine.test',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    createdIds.intents.push(r.intentId); createdIds.leads.push(r.leadId); createdIds.messages.push(r.messageId)
    expect(r.matchesCount).toBeGreaterThanOrEqual(1)

    const { data: intent } = await admin.from('realestate_search_intents').select('*').eq('id', r.intentId).single()
    expect(intent?.status).toBe('ativo')
    expect(intent?.cities).toEqual(['São Paulo'])

    const { data: msg } = await admin.from('realestate_internal_messages').select('*').eq('id', r.messageId).single()
    expect(msg?.request_kind).toBe('busca')

    // Email log (customer confirmation).
    const { data: logs } = await admin.from('email_send_log')
      .select('template_name')
      .eq('recipient_email', `re-vit-search-${RUN}@example.com`)
    expect(logs?.some((l) => l.template_name === 'realestate-vitrine-search-customer')).toBe(true)

    // Cleanup
    await admin.from('email_send_log').delete().eq('recipient_email', `re-vit-search-${RUN}@example.com`)
  })
})

describe('Reenvio de e-mail (admin)', () => {
  it('reenvia um e-mail registrando novo row em email_send_log e respeitando supressão', async () => {
    // Trigger one interest to create initial log entries.
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      contactName: 'Reenvio Teste',
      contactEmail: `re-vit-resend-${RUN}@example.com`,
      source: 'vitrine.test',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    createdIds.interests.push(r.interestId); createdIds.leads.push(r.leadId); createdIds.messages.push(r.messageId)

    const { data: original } = await admin.from('email_send_log')
      .select('id, template_name, recipient_email, status')
      .eq('recipient_email', `re-vit-resend-${RUN}@example.com`)
      .eq('template_name', 'realestate-vitrine-interest-customer')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    expect(original).toBeTruthy()

    // Call the resend helper logic directly (mirrors the server fn handler).
    const { sendVitrineEmail, APP_BASE_URL } = await import('@/lib/realestate-vitrine-notify.server')
    const before = await admin.from('email_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', `re-vit-resend-${RUN}@example.com`)
    const send = await sendVitrineEmail({
      templateName: original!.template_name,
      to: original!.recipient_email,
      templateData: {
        customerName: 'Reenvio Teste',
        propertyTitle: `Apto Teste ${RUN}`, referenceCode: `REF-${RUN}`,
        companyName: `Vitrine Test ${RUN}`,
        propertyUrl: `${APP_BASE_URL}/imoveis/${SLUG}/${propertyId}`,
        receivedAt: new Date().toISOString(),
      },
      idempotencyKey: `resend-test-${RUN}-${Date.now()}`,
    })
    expect(['queued', 'suppressed']).toContain(send.status)
    const after = await admin.from('email_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', `re-vit-resend-${RUN}@example.com`)
    expect((after.count ?? 0)).toBeGreaterThan(before.count ?? 0)

    await admin.from('email_send_log').delete().eq('recipient_email', `re-vit-resend-${RUN}@example.com`)
  })
})
