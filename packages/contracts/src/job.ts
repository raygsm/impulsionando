import { z } from "zod";

export const JOB_SCHEMA_VERSION = 1 as const;
export const REENGINEERING_JOBS_QUEUE = "reengineering_jobs" as const;
export const REENGINEERING_JOBS_DLQ = "reengineering_jobs_dlq" as const;

export const JobEnvelopeSchema = z.object({
  jobId: z.string().uuid(),
  type: z.string().min(1),
  schemaVersion: z.literal(JOB_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  enqueuedAt: z.string().datetime(),
  payload: z.record(z.unknown()).optional(),
});
export type JobEnvelope = z.infer<typeof JobEnvelopeSchema>;

export const JobMessageSchema = z.object({
  jobId: z.string().uuid(),
  queue: z.string().min(1),
  enqueuedAt: z.string().datetime(),
  attempt: z.number().int().positive(),
  visibilityTimeoutSeconds: z.number().int().positive(),
  envelope: JobEnvelopeSchema,
});
export type JobMessage = z.infer<typeof JobMessageSchema>;

export const DEFAULT_MAX_JOB_ATTEMPTS = 3;
export const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 30;
/** Worker DLQ reason when pgmq payload fails JobEnvelopeSchema. */
export const INVALID_ENVELOPE_DLQ_REASON = "INVALID_ENVELOPE" as const;

export type QueueMessageDisposition =
  | { kind: "process"; envelope: JobEnvelope }
  | { kind: "dlq_invalid_envelope"; reason: typeof INVALID_ENVELOPE_DLQ_REASON };

export function computeBackoffMs(attempt: number, baseMs = 1_000, capMs = 60_000): number {
  const exp = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(1_000, exp * 0.1));
  return exp + jitter;
}

export function shouldMoveToDlq(attempt: number, maxAttempts = DEFAULT_MAX_JOB_ATTEMPTS): boolean {
  return attempt >= maxAttempts;
}

/** Invalid envelopes go to reengineering_jobs_dlq immediately (no retry budget). */
export function dispositionForQueueMessage(payload: unknown): QueueMessageDisposition {
  const parsed = JobEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return { kind: "dlq_invalid_envelope", reason: INVALID_ENVELOPE_DLQ_REASON };
  }
  return { kind: "process", envelope: parsed.data };
}

export function idempotencyScopeKey(input: {
  tenantId: string;
  jobType: string;
  idempotencyKey: string;
}): string {
  return `${input.tenantId}:${input.jobType}:${input.idempotencyKey}`;
}

export type IdempotencyState = "processing" | "completed" | "failed";

export function shouldSkipDuplicate(state: IdempotencyState | null): boolean {
  return state === "completed";
}
