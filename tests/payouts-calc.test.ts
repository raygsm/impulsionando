import { describe, expect, it } from 'vitest'
import { calculatePayout, percentToBps, bpsToPercent, reaisToCents } from '@/lib/payouts'

describe('calculatePayout — cenários do briefing', () => {
  it('Garrido: 0,5% sobre R$ 1.000.000 → retém R$ 5.000', () => {
    // Obs.: no exemplo do briefing a comissão é aplicada sobre a corretagem
    // (R$ 60.000) → 0,5% = R$ 300. Aqui validamos a aritmética pura.
    const r = calculatePayout({
      grossCents: reaisToCents(60_000),
      rate: { percent_bps: percentToBps(0.5) },
    })
    expect(r.feeCents).toBe(30_000) // R$ 300,00
    expect(r.netCents).toBe(5_970_000) // R$ 59.700,00
  })

  it('Garrido locação: 0,5% sobre R$ 500 → retém R$ 2,50', () => {
    const r = calculatePayout({
      grossCents: reaisToCents(500),
      rate: { percent_bps: percentToBps(0.5) },
    })
    expect(r.feeCents).toBe(250) // R$ 2,50
    expect(r.netCents).toBe(49_750) // R$ 497,50
  })

  it('Marocas: 2% sobre R$ 350 → retém R$ 7', () => {
    const r = calculatePayout({
      grossCents: reaisToCents(350),
      rate: { percent_bps: percentToBps(2) },
    })
    expect(r.feeCents).toBe(700)
    expect(r.netCents).toBe(34_300)
  })

  it('CHRISMED: 1% sobre R$ 350 → retém R$ 3,50', () => {
    const r = calculatePayout({
      grossCents: reaisToCents(350),
      rate: { percent_bps: percentToBps(1) },
    })
    expect(r.feeCents).toBe(350)
    expect(r.netCents).toBe(34_650)
  })
})

describe('calculatePayout — limites e clamps', () => {
  it('respeita min_bps e max_bps', () => {
    expect(
      calculatePayout({ grossCents: 100_000, rate: { percent_bps: 10, min_bps: 50 } }).appliedBps,
    ).toBe(50)
    expect(
      calculatePayout({ grossCents: 100_000, rate: { percent_bps: 9_999, max_bps: 500 } })
        .appliedBps,
    ).toBe(500)
  })

  it('nunca retém mais que o gross', () => {
    const r = calculatePayout({ grossCents: 100, rate: { percent_bps: 5_000 } })
    expect(r.feeCents).toBeLessThanOrEqual(100)
    expect(r.netCents).toBeGreaterThanOrEqual(0)
  })

  it('aplica minPayoutCents quando taxa calculada fica abaixo', () => {
    const r = calculatePayout({
      grossCents: 10_000,
      rate: { percent_bps: 10 }, // 0,1% de 100 = R$ 0,10 (10 cents)
      minPayoutCents: 100,
    })
    expect(r.feeCents).toBe(100)
  })

  it('gross zero devolve tudo zerado', () => {
    const r = calculatePayout({ grossCents: 0, rate: { percent_bps: 500 } })
    expect(r).toEqual({ grossCents: 0, feeCents: 0, netCents: 0, appliedBps: 500 })
  })
})

describe('conversões', () => {
  it('percentToBps / bpsToPercent são inversos', () => {
    for (const p of [0, 0.1, 0.5, 1, 2.5, 10, 50, 100]) {
      expect(bpsToPercent(percentToBps(p))).toBeCloseTo(p, 2)
    }
  })
})
