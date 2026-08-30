/**
 * P1-E HTTP envelope schemas (Phase 1 contracts — no Nest).
 * Source: docs/reengineering/04-migration/phase-1/CONTRACT-HTTP-API.md
 */
import { z } from "zod";

/** Optional on request; always echoed in response meta / error. */
export const CORRELATION_ID_HEADER = "X-Correlation-Id" as const;

/** Mutating POSTs (create / update-status) per P1-E §5. */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key" as const;

export const StableErrorCode = z.enum([
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "CONFLICT",
  "IDEMPOTENCY_REPLAY",
  "RATE_LIMITED",
  "INTERNAL",
]);
export type StableErrorCode = z.infer<typeof StableErrorCode>;

/** Namespaced module codes allowed as UPPER_SNAKE_CASE strings. */
export const ErrorCode = z.union([
  StableErrorCode,
  z
    .string()
    .regex(/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/, "UPPER_SNAKE_CASE error code"),
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ErrorDetailSchema = z.object({
  path: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

export const ErrorBodySchema = z.object({
  code: ErrorCode,
  message: z.string().min(1),
  correlationId: z.string().min(1),
  details: z.array(ErrorDetailSchema).optional(),
});
export type ErrorBody = z.infer<typeof ErrorBodySchema>;

export const ErrorEnvelopeSchema = z.object({
  error: ErrorBodySchema,
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * Pagination fields live on success `meta` (cursor style).
 * `nextCursor` absent or null → no further page.
 */
export const PaginationMetaSchema = z.object({
  nextCursor: z.string().nullable().optional(),
  limit: z.number().int().positive().optional(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const SuccessMetaSchema = z
  .object({
    correlationId: z.string().min(1),
    requestId: z.string().min(1).optional(),
  })
  .merge(PaginationMetaSchema);
export type SuccessMeta = z.infer<typeof SuccessMetaSchema>;

export function successEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: SuccessMetaSchema,
  });
}

export type SuccessEnvelope<T> = {
  data: T;
  meta: SuccessMeta;
};

/** Opaque cursor query params for list endpoints. */
export const CursorPaginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().optional(),
});
export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;

export const CursorPaginationMetaSchema = PaginationMetaSchema;
export type CursorPaginationMeta = PaginationMeta;
