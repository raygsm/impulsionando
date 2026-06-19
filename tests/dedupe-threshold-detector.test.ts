import { describe, it, expect } from 'vitest'
import {
  classifyDedupe,
  decideCrossingAction,
  buildCauseBreakdown,
  DEFAULT_COOLDOWN_MS,
} from '@/lib/dedupe-threshold-lifecycle'

const NOW = Date.UTC(2026, 5, 19, 12, 0, 0)

describe('classifyDedupe', () => {
  it('returns above when pct > max', () => {
    expect(classifyDedupe(50, 5, 40)).toBe('above')
  })
  it('returns below when pct < min', () => {
    expect(classifyDedupe(3, 5, 40)).toBe('below')
  })
  it('returns normal when min <= pct <= max', () => {
    expect(classifyDedupe(5, 5, 40)).toBe('normal')
    expect(classifyDedupe(40, 5, 40)).toBe('normal')
    expect(classifyDedupe(20, 5, 40)).toBe('normal')
  })
})

describe('decideCrossingAction — crossing detection', () => {
  it('logs when there is no previous event', () => {
    const r = decideCrossingAction({
      currentPct: 20,
      min: 5,
      max: 40,
      last: null,
      nowMs: NOW,
    })
    expect(r).toEqual({ kind: 'log', state: 'normal', prevState: null })
  })

  it('skips when current state matches the last event (no crossing)', () => {
    const r = decideCrossingAction({
      currentPct: 20,
      min: 5,
      max: 40,
      last: { state: 'normal', createdAtMs: NOW - 10 * 60_000 },
      nowMs: NOW,
    })
    expect(r.kind).toBe('skip_same_state')
  })

  it('logs when state transitions from normal to above', () => {
    const r = decideCrossingAction({
      currentPct: 60,
      min: 5,
      max: 40,
      last: { state: 'normal', createdAtMs: NOW - 10 * 60_000 },
      nowMs: NOW,
    })
    expect(r).toEqual({ kind: 'log', state: 'above', prevState: 'normal' })
  })

  it('logs when state transitions from above to below (cross both ways)', () => {
    const r = decideCrossingAction({
      currentPct: 2,
      min: 5,
      max: 40,
      last: { state: 'above', createdAtMs: NOW - 5 * 60_000 },
      nowMs: NOW,
    })
    expect(r).toEqual({ kind: 'log', state: 'below', prevState: 'above' })
  })
})

describe('decideCrossingAction — rate limit / cooldown', () => {
  it('skips a crossing that happens within the cooldown window', () => {
    const r = decideCrossingAction({
      currentPct: 60,
      min: 5,
      max: 40,
      last: { state: 'normal', createdAtMs: NOW - 10_000 }, // 10s ago
      nowMs: NOW,
    })
    expect(r.kind).toBe('skip_cooldown')
    if (r.kind === 'skip_cooldown') {
      expect(r.msSinceLast).toBe(10_000)
      expect(r.cooldownMs).toBe(DEFAULT_COOLDOWN_MS)
    }
  })

  it('logs a crossing once cooldown has elapsed', () => {
    const r = decideCrossingAction({
      currentPct: 60,
      min: 5,
      max: 40,
      last: { state: 'normal', createdAtMs: NOW - (DEFAULT_COOLDOWN_MS + 1) },
      nowMs: NOW,
    })
    expect(r.kind).toBe('log')
  })

  it('does not log even repeated polling ticks at the same state', () => {
    // Simulate a polling loop that fires every 5 seconds for 1 minute.
    const last = { state: 'normal' as const, createdAtMs: NOW - 30 * 60_000 }
    for (let t = 0; t < 60_000; t += 5_000) {
      const r = decideCrossingAction({
        currentPct: 20,
        min: 5,
        max: 40,
        last,
        nowMs: NOW + t,
      })
      expect(r.kind).toBe('skip_same_state')
    }
  })

  it('respects a custom cooldown window', () => {
    const r = decideCrossingAction({
      currentPct: 60,
      min: 5,
      max: 40,
      last: { state: 'normal', createdAtMs: NOW - 2_000 },
      nowMs: NOW,
      cooldownMs: 1_000,
    })
    expect(r.kind).toBe('log')
  })
})

describe('decideCrossingAction — oscillation guard', () => {
  it('debounces rapid above ↔ normal flapping inside the cooldown', () => {
    // First crossing into above is logged.
    let last = { state: 'normal' as const, createdAtMs: NOW - 10 * 60_000 }
    const first = decideCrossingAction({
      currentPct: 50,
      min: 5,
      max: 40,
      last,
      nowMs: NOW,
    })
    expect(first.kind).toBe('log')

    // Then it bounces back to normal 2s later → must be skipped by cooldown.
    last = { state: 'above' as const, createdAtMs: NOW }
    const bounce = decideCrossingAction({
      currentPct: 20,
      min: 5,
      max: 40,
      last,
      nowMs: NOW + 2_000,
    })
    expect(bounce.kind).toBe('skip_cooldown')
  })
})

describe('buildCauseBreakdown', () => {
  it('reports no samples when tracker is empty', () => {
    const out = buildCauseBreakdown({
      state: 'normal',
      dedupePct: 0,
      attempted: 0,
      sent: 0,
      deduped: 0,
      dropped: 0,
      batches: 0,
      samples: 0,
      intents: 0,
      consumed: 0,
      converted: 0,
    })
    expect(out.findings.some((f) => f.code === 'no_tracker_samples')).toBe(true)
  })

  it('flags subcontagem (high) when state is above', () => {
    const out = buildCauseBreakdown({
      state: 'above',
      dedupePct: 55,
      attempted: 1000,
      sent: 400,
      deduped: 550,
      dropped: 50,
      batches: 10,
      samples: 5,
      intents: 100,
      consumed: 10,
      converted: 5,
    })
    expect(out.findings.find((f) => f.code === 'high_dedupe_undercount_risk')?.severity).toBe('high')
    expect(out.findings.some((f) => f.code === 'low_sent_ratio')).toBe(true)
    expect(out.findings.some((f) => f.code === 'low_consume_ratio')).toBe(true)
  })

  it('flags supercontagem (high) when state is below', () => {
    const out = buildCauseBreakdown({
      state: 'below',
      dedupePct: 1,
      attempted: 1000,
      sent: 990,
      deduped: 10,
      dropped: 0,
      batches: 60,
      samples: 5,
      intents: 100,
      consumed: 100,
      converted: 5,
    })
    expect(out.findings.find((f) => f.code === 'low_dedupe_overcount_risk')?.severity).toBe('high')
    expect(out.findings.some((f) => f.code === 'too_many_batches')).toBe(true)
    expect(out.findings.some((f) => f.code === 'low_conversion_ratio')).toBe(true)
  })

  it('flags high drop ratio regardless of state', () => {
    const out = buildCauseBreakdown({
      state: 'normal',
      dedupePct: 20,
      attempted: 1000,
      sent: 800,
      deduped: 100,
      dropped: 100,
      batches: 10,
      samples: 5,
      intents: 50,
      consumed: 20,
      converted: 5,
    })
    expect(out.findings.some((f) => f.code === 'high_drop_ratio')).toBe(true)
  })

  it('emits a recovered finding when state is normal', () => {
    const out = buildCauseBreakdown({
      state: 'normal',
      dedupePct: 20,
      attempted: 1000,
      sent: 800,
      deduped: 200,
      dropped: 0,
      batches: 5,
      samples: 5,
      intents: 50,
      consumed: 20,
      converted: 5,
    })
    expect(out.findings.some((f) => f.code === 'recovered')).toBe(true)
  })
})
