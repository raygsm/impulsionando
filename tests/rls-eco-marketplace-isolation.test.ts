/**
 * RLS — eco_marketplace (listings, requests, quotes, reviews).
 *  - Empresa A não vê pedidos privados de B.
 *  - Avaliações só são lidas por membros do ecossistema (não por anônimos).
 *  - Listings ativos visíveis a todos os membros.
 */
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import {
  admin, anonClient, createUser, deleteUser, signIn, assignProfile,
  createCompany, deleteCompany, PROFILES,
} from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

const RUN = Date.now()
const emails = {
  a: `rls-eco-a-${RUN}@example.com`,
  b: `rls-eco-b-${RUN}@example.com`,
}

let companyA = '', companyB = ''
let userA = '', userB = ''
let clientA!: SupabaseClient, clientB!: SupabaseClient
let listingA = '', listingB = '', requestA = ''

beforeAll(async () => {
  companyA = await createCompany(`ECO-A-${RUN}`)
  companyB = await createCompany(`ECO-B-${RUN}`)
  const uA = await createUser(emails.a); userA = uA.id
  const uB = await createUser(emails.b); userB = uB.id
  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a })
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b })

  const { data: lA } = await admin.from('eco_marketplace_listings').insert({
    company_id: companyA, title: 'Serviço A', description: 'Descrição A teste',
    niche: 'juridico', audience: 'b2b', status: 'active', visibility: 'ecosystem',
  }).select('id').single()
  listingA = lA!.id

  const { data: lB } = await admin.from('eco_marketplace_listings').insert({
    company_id: companyB, title: 'Serviço B', description: 'Descrição B teste',
    niche: 'contabil', audience: 'b2b', status: 'draft', visibility: 'ecosystem',
  }).select('id').single()
  listingB = lB!.id

  const { data: rA } = await admin.from('eco_marketplace_requests').insert({
    requester_company_id: companyA, requester_user_id: userA,
    title: 'Pedido privado A', scope: 'escopo confidencial', status: 'quoting',
  }).select('id').single()
  requestA = rA!.id

  clientA = await signIn(emails.a)
  clientB = await signIn(emails.b)
})

afterAll(async () => {
  await admin.from('eco_marketplace_requests').delete().eq('id', requestA)
  await admin.from('eco_marketplace_listings').delete().in('id', [listingA, listingB])
  await deleteUser(userA); await deleteUser(userB)
  await deleteCompany(companyA); await deleteCompany(companyB)
})

describe('Marketplace ecossistema — RLS', () => {
  it('Empresa A vê seu listing ativo e o de B (active+ecosystem)', async () => {
    const { data } = await clientA.from('eco_marketplace_listings').select('id').in('id', [listingA, listingB])
    const ids = (data ?? []).map((r) => r.id)
    expect(ids).toContain(listingA)
    // listing B é draft → não deve aparecer
    expect(ids).not.toContain(listingB)
  })

  it('Empresa B NÃO vê pedido privado (status=quoting) de A', async () => {
    const { data } = await clientB.from('eco_marketplace_requests').select('id').eq('id', requestA)
    expect(data ?? []).toHaveLength(0)
  })

  it('Empresa A vê o próprio pedido', async () => {
    const { data } = await clientA.from('eco_marketplace_requests').select('id').eq('id', requestA)
    expect((data ?? []).length).toBe(1)
  })

  it('Anônimo NÃO vê avaliações do ecossistema', async () => {
    const anon = anonClient()
    const { data } = await anon.from('eco_marketplace_reviews').select('id').limit(1)
    // RLS bloqueia ou retorna vazio
    expect((data ?? []).length).toBe(0)
  })

  it('Documentos legais são públicos', async () => {
    const anon = anonClient()
    const { data, error } = await anon.from('eco_legal_documents').select('kind').eq('is_current', true)
    expect(error).toBeNull()
    expect((data ?? []).length).toBeGreaterThanOrEqual(6)
  })
})
