/**
 * Pure decision logic for the dedupe-threshold crossing detector.
 *
 * The server logs a crossing event only when BOTH conditions hold:
 *   1. The classified state changed vs the most recent stored event
 *      (below / normal / above), AND
 *   2. Enough time has passed since the last event to avoid spamming
 *      repeated near-boundary oscillations (cooldown window).
 *
 * Extracted from the server handler so it can be unit-tested without
 * a database — see tests/dedupe-threshold-detector.test.ts.
 */

export type DedupeState = 'below' | 'normal' | 'above'

export const DEFAULT_COOLDOWN_MS = 60_000 // 1 min between writes per user

export function classifyDedupe(pct: number, min: number, max: number): DedupeState {
  if (pct > max) return 'above'
  if (pct < min) return 'below'
  return 'normal'
}

export type LastEvent = {
  state: DedupeState
  createdAtMs: number
} | null

export type CrossingDecision =
  | { kind: 'log'; state: DedupeState; prevState: DedupeState | null }
  | { kind: 'skip_same_state'; state: DedupeState; prevState: DedupeState }
  | {
      kind: 'skip_cooldown'
      state: DedupeState
      prevState: DedupeState
      msSinceLast: number
      cooldownMs: number
    }

export function decideCrossingAction(opts: {
  currentPct: number
  min: number
  max: number
  last: LastEvent
  nowMs: number
  cooldownMs?: number
}): CrossingDecision {
  const cooldownMs = opts.cooldownMs ?? DEFAULT_COOLDOWN_MS
  const state = classifyDedupe(opts.currentPct, opts.min, opts.max)
  const prev = opts.last?.state ?? null

  // No prior event → always log the first sample.
  if (!opts.last) {
    return { kind: 'log', state, prevState: null }
  }

  if (prev === state) {
    return { kind: 'skip_same_state', state, prevState: prev as DedupeState }
  }

  const msSinceLast = opts.nowMs - opts.last.createdAtMs
  if (msSinceLast < cooldownMs) {
    return {
      kind: 'skip_cooldown',
      state,
      prevState: prev as DedupeState,
      msSinceLast,
      cooldownMs,
    }
  }

  return { kind: 'log', state, prevState: prev }
}

/**
 * Build a "possible causes" breakdown for a crossing event, using
 * recent funnel deltas. Pure — server fn passes in pre-aggregated counts.
 */
export type CauseInputs = {
  state: DedupeState
  /** dedupe % observed for this event */
  dedupePct: number
  /** tracker counters for the same window */
  attempted: number
  sent: number
  deduped: number
  dropped: number
  batches: number
  samples: number
  /** funnel counts from catalog_intents in the same window */
  intents: number
  consumed: number
  converted: number
}

export type CauseFinding = {
  code: string
  label: string
  severity: 'info' | 'warn' | 'high'
}

export function buildCauseBreakdown(i: CauseInputs): {
  summary: string
  findings: CauseFinding[]
} {
  const findings: CauseFinding[] = []

  if (i.samples === 0) {
    return {
      summary: 'Sem amostras de tracker_stats no período — verifique se o catálogo está emitindo eventos.',
      findings: [
        {
          code: 'no_tracker_samples',
          label: 'Nenhuma amostra de tracker_stats recebida na janela.',
          severity: 'warn',
        },
      ],
    }
  }

  const dropRatio = i.attempted > 0 ? i.dropped / i.attempted : 0
  const consumeRatio = i.intents > 0 ? i.consumed / i.intents : 0
  const conversionRatio = i.consumed > 0 ? i.converted / i.consumed : 0
  const sentRatio = i.attempted > 0 ? i.sent / i.attempted : 0

  if (i.state === 'above') {
    findings.push({
      code: 'high_dedupe_undercount_risk',
      label: `Dedupe de ${i.dedupePct.toFixed(1)}% pode estar agrupando cliques legítimos como duplicatas (subcontagem).`,
      severity: 'high',
    })
    if (consumeRatio > 0 && sentRatio < 0.5) {
      findings.push({
        code: 'low_sent_ratio',
        label: `Apenas ${(sentRatio * 100).toFixed(0)}% das tentativas foram enviadas — janela de 800 ms muito agressiva.`,
        severity: 'warn',
      })
    }
    if (i.intents > 0 && consumeRatio < 0.2) {
      findings.push({
        code: 'low_consume_ratio',
        label: `Apenas ${(consumeRatio * 100).toFixed(0)}% das intents foram abertas — usuários podem estar reclicando antes da navegação.`,
        severity: 'warn',
      })
    }
  } else if (i.state === 'below') {
    findings.push({
      code: 'low_dedupe_overcount_risk',
      label: `Dedupe de ${i.dedupePct.toFixed(1)}% está abaixo do esperado — risco de supercontagem de cliques.`,
      severity: 'high',
    })
    if (i.batches > i.samples * 5) {
      findings.push({
        code: 'too_many_batches',
        label: `${i.batches} lotes para ${i.samples} amostras — sessionToken pode estar trocando entre cliques.`,
        severity: 'warn',
      })
    }
    if (consumeRatio > 0 && conversionRatio < 0.1) {
      findings.push({
        code: 'low_conversion_ratio',
        label: `Conversão sobre abertas em apenas ${(conversionRatio * 100).toFixed(0)}% — pode haver duplicação inflando o denominador.`,
        severity: 'warn',
      })
    }
  } else {
    findings.push({
      code: 'recovered',
      label: 'Dedupe voltou ao intervalo configurado.',
      severity: 'info',
    })
  }

  if (dropRatio > 0.05) {
    findings.push({
      code: 'high_drop_ratio',
      label: `${(dropRatio * 100).toFixed(1)}% dos eventos foram descartados por falha de rede — pode distorcer os KPIs.`,
      severity: 'warn',
    })
  }

  const summary =
    i.state === 'above'
      ? 'Possível subcontagem por dedupe agressivo.'
      : i.state === 'below'
        ? 'Possível supercontagem por dedupe insuficiente.'
        : 'Dedupe dentro do intervalo configurado.'

  return { summary, findings }
}
