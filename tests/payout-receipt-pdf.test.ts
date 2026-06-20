import { describe, it, expect } from 'vitest'
import { generatePayoutReceiptPdf } from '../src/lib/payout-receipt.server'

describe('payout receipt PDF', () => {
  it('gera um PDF válido com cabeçalho %PDF-', async () => {
    const bytes = await generatePayoutReceiptPdf({
      id: '11111111-1111-1111-1111-111111111111',
      company_id: '22222222-2222-2222-2222-222222222222',
      period_start: '2026-06-01T00:00:00Z',
      period_end: '2026-06-30T00:00:00Z',
      gross_cents: 150000,
      fee_cents: 750,
      net_cents: 149250,
      event_count: 12,
      status: 'paid',
      provider: 'mercadopago',
      provider_payout_id: 'MP-TR-99',
      paid_at: '2026-07-01T12:00:00Z',
      retention_reason: null,
      companies: { name: 'Empresa Teste', niche: 'restaurante' },
    })
    expect(bytes.byteLength).toBeGreaterThan(500)
    const head = new TextDecoder().decode(bytes.slice(0, 8))
    expect(head.startsWith('%PDF-')).toBe(true)
  })
})
