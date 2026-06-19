/**
 * Pure decision helpers for catalog intent lifecycle.
 * Extracted so the idempotency rules can be unit-tested without Supabase.
 *
 * Rules:
 * - An intent is "consumed" the first time someone opens it from onboarding.
 * - Re-opening a consumed intent NEVER re-consumes it; it only increments
 *   `reuse_attempts` and is logged as `intent_reuse_attempt`.
 * - An intent is "converted" only the first time a downstream success
 *   happens (onboarding_completed | contract_signed | payment_captured).
 *   Subsequent calls are no-ops.
 */

export type IntentRow = {
  id: string
  consumed_at: string | null
  reuse_attempts: number | null
  converted_at?: string | null
  conversion_kind?: string | null
}

export type ConsumeAction =
  | { kind: 'not_found' }
  | { kind: 'first_consume' }
  | { kind: 'reuse'; nextAttempts: number }

export function decideConsumeAction(
  existing: Pick<IntentRow, 'consumed_at' | 'reuse_attempts'> | null,
): ConsumeAction {
  if (!existing) return { kind: 'not_found' }
  if (existing.consumed_at) {
    return { kind: 'reuse', nextAttempts: (existing.reuse_attempts ?? 0) + 1 }
  }
  return { kind: 'first_consume' }
}

export type ConversionKind =
  | 'onboarding_completed'
  | 'contract_signed'
  | 'payment_captured'

export type ConvertAction =
  | { kind: 'not_found' }
  | { kind: 'first_conversion'; conversionKind: ConversionKind }
  | { kind: 'already_converted' }

export function decideConversionAction(
  existing: Pick<IntentRow, 'converted_at'> | null,
  next: ConversionKind,
): ConvertAction {
  if (!existing) return { kind: 'not_found' }
  if (existing.converted_at) return { kind: 'already_converted' }
  return { kind: 'first_conversion', conversionKind: next }
}
