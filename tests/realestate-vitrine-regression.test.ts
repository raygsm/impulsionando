/**
 * Regression tests for the vitrine flow.
 *
 * Locks in the fixes made on 2026-06-19:
 *  - getCompanyManagerUserIds must NOT rely on the broken PostgREST embed
 *    `user_profiles -> profile_permissions:profile_id(...)` (no FK chain).
 *    A gestor user MUST receive an in-app notification when a vitrine
 *    interest is created.
 *  - sendVitrineEmail must mark the email_send_log row as `suppressed`
 *    for any recipient present in `suppressed_emails`. (Suppression rows
 *    must use a valid reason — bounce/complaint/unsubscribe — otherwise
 *    the CHECK constraint silently rejects the insert.)
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { admin, createCompany, deleteCompany, createUser, deleteUser, assignProfile, PROFILES } from './helpers'
import { processInterest } from '@/lib/realestate-vitrine-flow.server'

const RUN = Date.now()
const SLUG = `vit-reg-${RUN}`
const managerEmail = `vit-reg-mgr-${RUN}@example.com`
const suppressedEmail = `vit-reg-supp-${RUN}@example.com`

let companyId = ''
let propertyId = ''
let managerUserId = ''

beforeAll(async () => {
  companyId = await createCompany(`Vitrine Reg ${RUN}`)
  await admin.from('companies').update({ public_slug: SLUG, vitrine_enabled: true }).eq('id', companyId)

  const mgr = await createUser(managerEmail)
  managerUserId = mgr.id
  await assignProfile({ userId: managerUserId, companyId, profileId: PROFILES.gestor, email: managerEmail })

  const { data: prop, error } = await admin.from('realestate_properties').insert({
    company_id: companyId,
    title: `Reg Apto ${RUN}`,
    reference_code: `RREF-${RUN}`,
    operation: 'venda',
    property_type: 'apartamento',
    sale_price: 100000,
    bedrooms: 1, bathrooms: 1, parking_spots: 0, suites: 0,
    city: 'São Paulo', state: 'SP', neighborhood: 'Centro',
    is_published: true, status: 'ativo', approval_status: 'approved',
  }).select('id').single()
  if (error) throw error
  propertyId = prop.id

  await admin.from('suppressed_emails').upsert(
    { email: suppressedEmail.toLowerCase(), reason: 'bounce' } as any,
    { onConflict: 'email' },
  )
}, 90_000)

afterAll(async () => {
  await admin.from('email_send_log').delete().in('recipient_email', [managerEmail, suppressedEmail])
  await admin.from('notifications').delete().eq('user_id', managerUserId)
  await admin.from('realestate_property_history').delete().eq('property_id', propertyId)
  await admin.from('realestate_interests').delete().eq('property_id', propertyId)
  await admin.from('realestate_internal_messages').delete().eq('property_id', propertyId)
  await admin.from('crm_leads').delete().eq('company_id', companyId)
  await admin.from('realestate_properties').delete().eq('id', propertyId)
  await admin.from('suppressed_emails').delete().eq('email', suppressedEmail.toLowerCase())
  await deleteUser(managerUserId)
  await deleteCompany(companyId)
}, 90_000)

describe('regression: vitrine notifications + suppression', () => {
  it('gestor receives an in-app notification when interest is created', async () => {
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      contactName: 'Regression One',
      contactEmail: `vit-reg-cust-${RUN}@example.com`,
      source: 'regression',
    })
    expect(r.ok).toBe(true)
    const { data: notif } = await admin.from('notifications')
      .select('id, category, action_url')
      .eq('user_id', managerUserId)
      .eq('category', 'realestate.interest.new')
    expect((notif ?? []).length).toBeGreaterThan(0)
    // Cleanup leftover customer log row
    await admin.from('email_send_log').delete().eq('recipient_email', `vit-reg-cust-${RUN}@example.com`)
  })

  it('email_send_log row for a suppressed recipient has status=suppressed', async () => {
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      contactName: 'Regression Suppressed',
      contactEmail: suppressedEmail,
      source: 'regression',
    })
    expect(r.ok).toBe(true)
    const { data: logs } = await admin.from('email_send_log')
      .select('status, template_name')
      .eq('recipient_email', suppressedEmail)
    expect(logs?.some((l) => l.status === 'suppressed' && l.template_name === 'realestate-vitrine-interest-customer')).toBe(true)
  })

  it('processInterest emits structured audit_logs entries for the request lifecycle', async () => {
    const requestId = `vit-reg-req-${RUN}-${Math.random().toString(36).slice(2, 8)}`
    const r = await processInterest({
      companySlug: SLUG, propertyId,
      contactName: 'Regression Audit',
      contactEmail: `vit-reg-audit-${RUN}@example.com`,
      requestId,
    })
    expect(r.ok).toBe(true)
    // Find audit entries that carry our requestId.
    const { data: audits } = await admin.from('audit_logs')
      .select('action, before, after')
      .eq('entity', 'realestate_interest')
      .order('created_at', { ascending: false })
      .limit(50)
    const ours = (audits ?? []).filter((a: any) =>
      a.before?.request_id === requestId || a.after?.request_id === requestId)
    const actions = ours.map((a: any) => a.action)
    expect(actions).toContain('vitrine.interest.requested')
    expect(actions).toContain('vitrine.interest.completed')
    await admin.from('email_send_log').delete().eq('recipient_email', `vit-reg-audit-${RUN}@example.com`)
  })
})
