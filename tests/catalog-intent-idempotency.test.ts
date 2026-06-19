import { describe, it, expect } from 'vitest'
import {
  decideConsumeAction,
  decideConversionAction,
} from '@/lib/catalog-intent-lifecycle'

describe('catalog intent idempotency — consume', () => {
  it('returns not_found when the intent does not exist', () => {
    expect(decideConsumeAction(null)).toEqual({ kind: 'not_found' })
  })

  it('first call on an unconsumed intent yields first_consume', () => {
    expect(
      decideConsumeAction({ consumed_at: null, reuse_attempts: 0 }),
    ).toEqual({ kind: 'first_consume' })
  })

  it('second call on a consumed intent yields reuse with attempts=1', () => {
    expect(
      decideConsumeAction({ consumed_at: '2026-01-01T00:00:00Z', reuse_attempts: 0 }),
    ).toEqual({ kind: 'reuse', nextAttempts: 1 })
  })

  it('reuse increments existing reuse_attempts monotonically', () => {
    expect(
      decideConsumeAction({ consumed_at: '2026-01-01T00:00:00Z', reuse_attempts: 4 }),
    ).toEqual({ kind: 'reuse', nextAttempts: 5 })
  })

  it('treats null reuse_attempts as 0 on first reuse', () => {
    expect(
      decideConsumeAction({ consumed_at: '2026-01-01T00:00:00Z', reuse_attempts: null }),
    ).toEqual({ kind: 'reuse', nextAttempts: 1 })
  })

  it('repeated reuse decisions never flip back to first_consume', () => {
    const consumed = '2026-01-01T00:00:00Z'
    let attempts = 0
    for (let i = 0; i < 10; i++) {
      const a = decideConsumeAction({ consumed_at: consumed, reuse_attempts: attempts })
      expect(a.kind).toBe('reuse')
      if (a.kind === 'reuse') attempts = a.nextAttempts
    }
    expect(attempts).toBe(10)
  })
})

describe('catalog intent idempotency — convert', () => {
  it('returns not_found when the intent does not exist', () => {
    expect(decideConversionAction(null, 'onboarding_completed')).toEqual({
      kind: 'not_found',
    })
  })

  it('first call records the conversion kind', () => {
    expect(
      decideConversionAction({ converted_at: null }, 'onboarding_completed'),
    ).toEqual({ kind: 'first_conversion', conversionKind: 'onboarding_completed' })
  })

  it('does not overwrite an existing conversion (even with a different kind)', () => {
    expect(
      decideConversionAction({ converted_at: '2026-01-01T00:00:00Z' }, 'payment_captured'),
    ).toEqual({ kind: 'already_converted' })
  })

  it('is idempotent across many repeated calls', () => {
    const row = { converted_at: '2026-01-01T00:00:00Z' }
    for (const k of ['onboarding_completed', 'contract_signed', 'payment_captured'] as const) {
      expect(decideConversionAction(row, k)).toEqual({ kind: 'already_converted' })
    }
  })
})
