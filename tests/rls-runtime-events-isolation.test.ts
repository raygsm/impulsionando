/**
 * RLS — runtime_events.
 * - Tenant A não vê eventos de tenant B.
 * - Tenant vê apenas seus próprios eventos.
 * - Service role grava livremente.
 */
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import {
  admin, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

const RUN = Date.now()
const emails = {
  a: `rls-obs-a-${RUN}@example.com`,
  b: `rls-obs-b-${RUN}@example.com`,
}

let companyA = '', companyB = ''
let userA = '', userB = ''
let clientA!: SupabaseClient, clientB!: SupabaseClient
let evA = '', evB = ''

beforeAll(async () => {
  companyA = await createCompany(`OBS-A-${RUN}`)
  companyB = await createCompany(`OBS-B-${RUN}`)
  const uA = await createUser(emails.a); userA = uA.id
  const uB = await createUser(emails.b); userB = uB.id
  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a })
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b })

  const { data: rA } = await admin.from('runtime_events').insert({
    level: 'error', scope: 'test.scope', message: `evento A ${RUN}`, company_id: companyA, user_id: userA,
  }).select('id').single()
  evA = (rA as any)!.id
  const { data: rB } = await admin.from('runtime_events').insert({
    level: 'error', scope: 'test.scope', message: `evento B ${RUN}`, company_id: companyB, user_id: userB,
  }).select('id').single()
  evB = (rB as any)!.id

  clientA = (await signIn(emails.a)).client
  clientB = (await signIn(emails.b)).client
})

afterAll(async () => {
  await admin.from('runtime_events').delete().in('id', [evA, evB])
  await deleteUser(userA); await deleteUser(userB)
  await deleteCompany(companyA); await deleteCompany(companyB)
})

describe('runtime_events RLS', () => {
  it('tenant A enxerga seu próprio evento', async () => {
    const { data } = await clientA.from('runtime_events').select('id, company_id').eq('id', evA).maybeSingle()
    expect(data?.id).toBe(evA)
  })

  it('tenant A NÃO enxerga evento de B', async () => {
    const { data } = await clientA.from('runtime_events').select('id').eq('id', evB).maybeSingle()
    expect(data).toBeNull()
  })

  it('tenant B NÃO enxerga evento de A', async () => {
    const { data } = await clientB.from('runtime_events').select('id').eq('id', evA).maybeSingle()
    expect(data).toBeNull()
  })
})
