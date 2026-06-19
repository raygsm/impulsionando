import { describe, it, expect } from 'vitest'
import {
  decideConsumeAction,
  decideConversionAction,
  isStep4Complete,
  REQUIRED_STEP4_FIELDS,
} from '@/lib/catalog-intent-lifecycle'

describe('catalog intent idempotency — consume', () => {
  it('returns not_found when the intent does not exist', () => {
    expect(decideConsumeAction(null)).toEqual({ kind: 'not_found' })
  })

  it('first call on an unconsumed intent yields first_consume', () => {
    expect(decideConsumeAction({ consumed_at: null, reuse_attempts: 0 })).toEqual({
      kind: 'first_consume',
    })
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

const ALL_VALID = {
  goal: true,
  niche: true,
  mainPain: true,
  metric: true,
  target: true,
}

describe('catalog intent idempotency — convert', () => {
  it('returns not_found when the intent does not exist', () => {
    expect(decideConversionAction(null, 'onboarding_completed', ALL_VALID)).toEqual({
      kind: 'not_found',
    })
  })

  it('first call with all required fields records the conversion kind', () => {
    expect(
      decideConversionAction({ converted_at: null }, 'onboarding_completed', ALL_VALID),
    ).toEqual({
      kind: 'first_conversion',
      conversionKind: 'onboarding_completed',
      validatedFields: ALL_VALID,
    })
  })

  it('does not overwrite an existing conversion (even with a different kind)', () => {
    expect(
      decideConversionAction(
        { converted_at: '2026-01-01T00:00:00Z' },
        'payment_captured',
        ALL_VALID,
      ),
    ).toEqual({ kind: 'already_converted' })
  })

  it('is idempotent across many repeated calls', () => {
    const row = { converted_at: '2026-01-01T00:00:00Z' }
    for (const k of ['onboarding_completed', 'contract_signed', 'payment_captured'] as const) {
      expect(decideConversionAction(row, k, ALL_VALID)).toEqual({ kind: 'already_converted' })
    }
  })

  it('contract_signed / payment_captured do NOT require Step 4 validation', () => {
    for (const k of ['contract_signed', 'payment_captured'] as const) {
      const a = decideConversionAction({ converted_at: null }, k)
      expect(a.kind).toBe('first_conversion')
    }
  })
})

describe('Step 4 conversion gate (onboarding_completed)', () => {
  it('refuses conversion when no validatedFields are provided', () => {
    const a = decideConversionAction({ converted_at: null }, 'onboarding_completed')
    expect(a.kind).toBe('incomplete')
    if (a.kind === 'incomplete') {
      expect(a.missing.sort()).toEqual([...REQUIRED_STEP4_FIELDS].sort())
    }
  })

  it.each(REQUIRED_STEP4_FIELDS)(
    'refuses conversion when only "%s" is missing (simulates skip-and-jump-to-step-4)',
    (skipped) => {
      const partial = { ...ALL_VALID, [skipped]: false }
      const a = decideConversionAction({ converted_at: null }, 'onboarding_completed', partial)
      expect(a.kind).toBe('incomplete')
      if (a.kind === 'incomplete') expect(a.missing).toEqual([skipped])
    },
  )

  it('accepts conversion after user returns and fills missing fields', () => {
    // simulate: user reached Step 4 first time with metric+target empty
    const first = decideConversionAction(
      { converted_at: null },
      'onboarding_completed',
      { ...ALL_VALID, metric: false, target: false },
    )
    expect(first.kind).toBe('incomplete')

    // user goes back, completes Step 3, returns to Step 4 — now all valid
    const second = decideConversionAction(
      { converted_at: null },
      'onboarding_completed',
      ALL_VALID,
    )
    expect(second.kind).toBe('first_conversion')
  })

  it('isStep4Complete mirrors the gating decision', () => {
    expect(isStep4Complete(ALL_VALID)).toBe(true)
    expect(isStep4Complete({ ...ALL_VALID, mainPain: false })).toBe(false)
    expect(isStep4Complete(null)).toBe(false)
    expect(isStep4Complete({})).toBe(false)
  })
})
