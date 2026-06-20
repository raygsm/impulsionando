// Motor puro de cálculo de comissão (Revenue Share).
// Sem I/O — recebe gross + regra, devolve fee/net em centavos.
// Toda matemática em inteiros (bps + cents) para evitar float.

export type PayoutEventType =
  | 'sale'
  | 'rent'
  | 'recurring'
  | 'service'
  | 'subscription'
  | 'event'
  | 'product'

export interface PayoutRate {
  /** Basis points (100 bps = 1%). Ex.: 50 = 0,5%. */
  percent_bps: number
  /** Clamp inferior (em bps). Opcional. */
  min_bps?: number | null
  /** Clamp superior (em bps). Opcional. */
  max_bps?: number | null
}

export interface PayoutInput {
  /** Valor bruto da transação em centavos. */
  grossCents: number
  rate: PayoutRate
  /** Mínimo absoluto de comissão em centavos (override do modelo). */
  minPayoutCents?: number
}

export interface PayoutResult {
  grossCents: number
  feeCents: number
  netCents: number
  appliedBps: number
}

function clampBps(bps: number, min?: number | null, max?: number | null): number {
  let v = bps
  if (typeof min === 'number') v = Math.max(v, min)
  if (typeof max === 'number') v = Math.min(v, max)
  return Math.max(0, Math.min(10_000, v))
}

/**
 * Calcula a comissão a reter (`feeCents`) e o líquido a repassar (`netCents`).
 * Arredonda half-up para favorecer transparência.
 */
export function calculatePayout(input: PayoutInput): PayoutResult {
  const gross = Math.max(0, Math.trunc(input.grossCents))
  const applied = clampBps(input.rate.percent_bps, input.rate.min_bps, input.rate.max_bps)
  // gross * bps / 10000, arredondado matematicamente (half-up).
  let fee = Math.floor((gross * applied + 5_000) / 10_000)
  if (input.minPayoutCents && fee > 0 && fee < input.minPayoutCents) {
    fee = Math.min(input.minPayoutCents, gross)
  }
  fee = Math.min(fee, gross)
  const net = gross - fee
  return { grossCents: gross, feeCents: fee, netCents: net, appliedBps: applied }
}

/** Converte percentual humano (0,5) para basis points (50). */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100)
}

/** Converte basis points (50) para percentual humano (0,5). */
export function bpsToPercent(bps: number): number {
  return Math.round(bps) / 100
}

/** Converte reais (1234.56) para centavos (123456). */
export function reaisToCents(value: number): number {
  return Math.round(value * 100)
}

/** Formata centavos como BRL ("R$ 1.234,56"). */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )
}
