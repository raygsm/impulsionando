/**
 * RLS tests para support_tickets:
 *  - Cliente A só vê tickets da empresa A.
 *  - Cliente A NÃO vê tickets da empresa B.
 *  - Consumidor C só vê os próprios tickets.
 *  - Mensagens internas (is_internal) ficam ocultas para cliente/consumidor.
 */
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

const RUN = Date.now()
const emails = {
  a: `rls-tk-a-${RUN}@example.com`,
  b: `rls-tk-b-${RUN}@example.com`,
  c: `rls-tk-c-${RUN}@example.com`,
}

let companyA = ''
let companyB = ''
let userA = '', userB = '', userC = ''
let clientA!: SupabaseClient, clientB!: SupabaseClient, clientC!: SupabaseClient
let ticketA = '', ticketB = '', ticketC = ''

beforeAll(async () => {
  companyA = await createCompany(`TK-A-${RUN}`)
  companyB = await createCompany(`TK-B-${RUN}`)

  const uA = await createUser(emails.a); userA = uA.id
  const uB = await createUser(emails.b); userB = uB.id
  const uC = await createUser(emails.c); userC = uC.id

  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a })
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b })
  // userC = consumidor (sem user_profiles)

  const { data: tA } = await admin.from('support_tickets').insert({
    company_id: companyA, requester_user_id: userA, requester_email: emails.a,
    subject: 'A: financeiro', description: 'desc A', type: 'financial', priority: 'medium',
  }).select('id').single()
  ticketA = tA!.id

  const { data: tB } = await admin.from('support_tickets').insert({
    company_id: companyB, requester_user_id: userB, requester_email: emails.b,
    subject: 'B: técnico', description: 'desc B', type: 'technical', priority: 'high',
  }).select('id').single()
  ticketB = tB!.id

  const { data: tC } = await admin.from('support_tickets').insert({
    consumer_user_id: userC, requester_user_id: userC, requester_email: emails.c,
    subject: 'C: clube', description: 'desc C', type: 'clube', priority: 'low',
  }).select('id').single()
  ticketC = tC!.id

  // Mensagens em ticket A: 1 normal staff, 1 interna staff
  await admin.from('support_ticket_messages').insert([
    { ticket_id: ticketA, author_user_id: null, author_role: 'staff', body: 'pública', is_internal: false },
    { ticket_id: ticketA, author_user_id: null, author_role: 'staff', body: 'interna-secreta', is_internal: true },
  ])

  const sa = await signIn(emails.a); clientA = sa.client
  const sb = await signIn(emails.b); clientB = sb.client
  const sc = await signIn(emails.c); clientC = sc.client
}, 120_000)

afterAll(async () => {
  await admin.from('support_ticket_messages').delete().in('ticket_id', [ticketA, ticketB, ticketC])
  await admin.from('support_tickets').delete().in('id', [ticketA, ticketB, ticketC])
  await deleteUser(userA); await deleteUser(userB); await deleteUser(userC)
  await deleteCompany(companyA); await deleteCompany(companyB)
}, 60_000)

describe('support_tickets RLS', () => {
  it('Cliente A vê seu ticket', async () => {
    const { data } = await clientA.from('support_tickets').select('id').eq('id', ticketA)
    expect(data?.length).toBe(1)
  })

  it('Cliente A NÃO vê ticket da empresa B', async () => {
    const { data } = await clientA.from('support_tickets').select('id').eq('id', ticketB)
    expect(data?.length ?? 0).toBe(0)
  })

  it('Consumidor C vê apenas o próprio ticket', async () => {
    const { data: own } = await clientC.from('support_tickets').select('id').eq('id', ticketC)
    expect(own?.length).toBe(1)
    const { data: notMine } = await clientC.from('support_tickets').select('id').in('id', [ticketA, ticketB])
    expect(notMine?.length ?? 0).toBe(0)
  })

  it('Cliente A NÃO vê mensagens internas do próprio ticket', async () => {
    const { data } = await clientA
      .from('support_ticket_messages')
      .select('body, is_internal')
      .eq('ticket_id', ticketA)
    const bodies = (data ?? []).map((r) => r.body)
    expect(bodies).toContain('pública')
    expect(bodies).not.toContain('interna-secreta')
  })
})
