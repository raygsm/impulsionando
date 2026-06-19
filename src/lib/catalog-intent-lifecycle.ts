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
 * - For onboarding_completed, the conversion is ONLY valid when every
 *   required Step 4 field is true in `validatedFields`. Skipping any
 *   required field must not count as a conversion, even if the user
 *   ends up on Step 4 by clicking around.
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

export const REQUIRED_STEP4_FIELDS = [
  'goal',
  'niche',
  'mainPain',
  'metric',
  'target',
] as const

export type Step4Field = (typeof REQUIRED_STEP4_FIELDS)[number]

export type ValidatedFields = Partial<Record<Step4Field, boolean>>

export function isStep4Complete(v: ValidatedFields | null | undefined): boolean {
  if (!v) return false
  return REQUIRED_STEP4_FIELDS.every((k) => v[k] === true)
}

export type ConvertAction =
  | { kind: 'not_found' }
  | { kind: 'first_conversion'; conversionKind: ConversionKind; validatedFields: ValidatedFields | null }
  | { kind: 'already_converted' }
  | { kind: 'incomplete'; missing: Step4Field[] }

export function decideConversionAction(
  existing: Pick<IntentRow, 'converted_at'> | null,
  next: ConversionKind,
  validatedFields?: ValidatedFields | null,
): ConvertAction {
  if (!existing) return { kind: 'not_found' }
  if (existing.converted_at) return { kind: 'already_converted' }
  // Only `onboarding_completed` is gated by the Step 4 snapshot —
  // contract_signed / payment_captured are downstream and trustworthy on their own.
  if (next === 'onboarding_completed') {
    const missing = REQUIRED_STEP4_FIELDS.filter((k) => !validatedFields?.[k])
    if (missing.length > 0) return { kind: 'incomplete', missing }
  }
  return { kind: 'first_conversion', conversionKind: next, validatedFields: validatedFields ?? null }
}
