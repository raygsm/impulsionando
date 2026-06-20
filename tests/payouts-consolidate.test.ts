// Testa consolidação de lotes: agrupamento, idempotência e mínimo retido.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { admin } from './helpers'
import { runConsolidation } from '../src/lib/payout-batches.functions'

const PERIOD_START = '2026-06-01T00:00:00Z'
const PERIOD_END = '2026-06-30T00:00:00Z'

let companyA: string
let companyB: string

beforeAll(async () => {
  const { data: a } = await admin.from('companies').insert({ name: 'TST PayoutA' }).select('id').single()
  const { data: b } = await admin.from('companies').insert({ name: 'TST PayoutB' }).select('id').single()
  companyA = a!.id
  companyB = b!.id

  // Modelo com mínimo R$ 50,00 (5000 cents) para A
  await admin.from('core_monetization_models').insert({
    company_id: companyA, model: 'revshare', min_payout_cents: 0, payout_frequency: 'monthly',
  })
  // Modelo com mínimo R$ 1000 para B (vai reter)
  await admin.from('core_monetization_models').insert({
    company_id: companyB, model: 'revshare', min_payout_cents: 100_000, payout_frequency: 'monthly',
  })

  // Eventos aprovados de A (2 eventos, líquido = 9000)
  await admin.from('core_payout_events').insert([
    { company_id: companyA, event_type: 'sale', gross_cents: 10_000, fee_cents: 500, status: 'approved', occurred_at: '2026-06-10T00:00:00Z' },
    { company_id: companyA, event_type: 'sale', gross_cents: 5_000, fee_cents: 500, status: 'approved', occurred_at: '2026-06-15T00:00:00Z' },
    // Pendente — não deve entrar no lote
    { company_id: companyA, event_type: 'sale', gross_cents: 1_000, fee_cents: 50, status: 'pending', occurred_at: '2026-06-20T00:00:00Z' },
  ])
  // 1 evento aprovado de B (líquido baixo → retido)
  await admin.from('core_payout_events').insert({
    company_id: companyB, event_type: 'sale', gross_cents: 1_000, fee_cents: 50, status: 'approved', occurred_at: '2026-06-12T00:00:00Z',
  })
})

afterAll(async () => {
  await admin.from('core_payout_events').delete().in('company_id', [companyA, companyB])
  await admin.from('core_payout_ledger').delete().in('company_id', [companyA, companyB])
  await admin.from('core_monetization_models').delete().in('company_id', [companyA, companyB])
  await admin.from('companies').delete().in('id', [companyA, companyB])
})

describe('runConsolidation', () => {
  it('cria 1 lote por empresa, marca eventos como consolidated, respeita pending', async () => {
    const r = await runConsolidation(admin, { period_start: PERIOD_START, period_end: PERIOD_END })
    expect(r.batches).toBe(2)
    expect(r.events).toBe(3) // 2 de A + 1 de B
    expect(r.retained).toBe(1) // B abaixo do mínimo

    const { data: ledgerA } = await admin
      .from('core_payout_ledger')
      .select('*').eq('company_id', companyA).single()
    expect(ledgerA!.status).toBe('scheduled')
    expect(ledgerA!.event_count).toBe(2)
    expect(ledgerA!.gross_cents).toBe(15_000)

    const { data: ledgerB } = await admin
      .from('core_payout_ledger')
      .select('*').eq('company_id', companyB).single()
    expect(ledgerB!.status).toBe('retained')

    const { data: stillPending } = await admin
      .from('core_payout_events')
      .select('id').eq('company_id', companyA).eq('status', 'pending')
    expect(stillPending!.length).toBe(1)
  })

  it('é idempotente — segunda execução não cria novos lotes nem reabre', async () => {
    const r = await runConsolidation(admin, { period_start: PERIOD_START, period_end: PERIOD_END })
    expect(r.batches).toBe(0)
    expect(r.events).toBe(0)

    const { data: all } = await admin
      .from('core_payout_ledger')
      .select('id').in('company_id', [companyA, companyB])
    expect(all!.length).toBe(2)
  })
})
