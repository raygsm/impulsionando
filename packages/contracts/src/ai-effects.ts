/**
 * Phase 6E — approval-gated effects (no autonomous writes).
 * Env var *names* only — never credential values. No Nest coupling.
 */
import { z } from "zod";
import { AI_SCHEMA_VERSION, AiRiskClass } from "./ai";
import { assertNoSecretFields } from "./ops";

/** Phase 5 job type enqueued after approval — worker may noop until a later wave. */
export const AI_EFFECT_EXECUTE_JOB_TYPE = "ai.effect.execute" as const;

/**
 * Environment variable *names* for gated effects (never values).
 */
export const AI_EFFECT_ENV_NAMES = {
  /** When "true"/"1", approve may enqueue execute jobs. Default off (deny-by-default). */
  EFFECTS_ENABLED: "AI_EFFECTS_ENABLED",
  /** Pending approval TTL in seconds (integer string). Default 3600 when unset. */
  APPROVAL_TTL_SECONDS: "AI_APPROVAL_TTL_SECONDS",
} as const;

export type AiEffectEnvName =
  (typeof AI_EFFECT_ENV_NAMES)[keyof typeof AI_EFFECT_ENV_NAMES];

export const AiEffectApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "executed",
  "expired",
]);
export type AiEffectApprovalStatus = z.infer<typeof AiEffectApprovalStatusSchema>;

export const AiEffectDecisionKindSchema = z.enum(["approve", "reject"]);
export type AiEffectDecisionKind = z.infer<typeof AiEffectDecisionKindSchema>;

export const AiEffectExecuteReasonSchema = z.enum([
  "ENQUEUED",
  "QUEUE_STUB",
  "EFFECTS_DISABLED",
  "NOT_APPROVED",
  "EXPIRED",
  "FORBIDDEN_TOOL",
]);
export type AiEffectExecuteReason = z.infer<typeof AiEffectExecuteReasonSchema>;

/** Tool ids allowed to enter the approval gate (APPROVAL_REQUIRED only). */
export const AiEffectGatedToolIdSchema = z.enum(["effect.gated.noop"]);
export type AiEffectGatedToolId = z.infer<typeof AiEffectGatedToolIdSchema>;

/**
 * Client shape for an APPROVAL_REQUIRED tool execution request.
 * Never executes — creates a pending approval only.
 */
export const AiApprovalRequiredToolExecRequestSchema = z
  .object({
    schemaVersion: z.literal(AI_SCHEMA_VERSION),
    riskClass: z.literal("APPROVAL_REQUIRED"),
    toolId: AiEffectGatedToolIdSchema,
    tenantId: z.string().uuid(),
    idempotencyKey: z.string().trim().min(1).max(200),
    input: z.record(z.unknown()).default({}),
    correlationId: z.string().min(1).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
export type AiApprovalRequiredToolExecRequest = z.infer<
  typeof AiApprovalRequiredToolExecRequestSchema
>;

/** HTTP body for POST /api/v1/ai/effects/requests (schemaVersion optional — server fills). */
export const AiEffectApprovalCreateBodySchema = z
  .object({
    toolId: AiEffectGatedToolIdSchema,
    tenantId: z.string().uuid(),
    idempotencyKey: z.string().trim().min(1).max(200),
    input: z.record(z.unknown()).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
export type AiEffectApprovalCreateBody = z.infer<typeof AiEffectApprovalCreateBodySchema>;

export const AiEffectApprovalDecisionBodySchema = z
  .object({
    decision: AiEffectDecisionKindSchema,
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
export type AiEffectApprovalDecisionBody = z.infer<
  typeof AiEffectApprovalDecisionBodySchema
>;

export const AiEffectDecisionRecordSchema = z.object({
  decision: AiEffectDecisionKindSchema,
  decidedAt: z.string().datetime(),
  decidedByUserId: z.string().uuid(),
  reason: z.string().nullable().optional(),
});
export type AiEffectDecisionRecord = z.infer<typeof AiEffectDecisionRecordSchema>;

export const AiEffectExecutionRecordSchema = z.object({
  executed: z.boolean(),
  reason: AiEffectExecuteReasonSchema,
  jobId: z.string().uuid().nullable(),
  jobType: z.literal(AI_EFFECT_EXECUTE_JOB_TYPE).nullable(),
  enqueuedAt: z.string().datetime().nullable(),
});
export type AiEffectExecutionRecord = z.infer<typeof AiEffectExecutionRecordSchema>;

export const AiEffectApprovalRequestSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  id: z.string().uuid(),
  status: AiEffectApprovalStatusSchema,
  riskClass: z.literal("APPROVAL_REQUIRED"),
  toolId: AiEffectGatedToolIdSchema,
  tenantId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  idempotencyKey: z.string().min(1),
  input: z.record(z.unknown()),
  correlationId: z.string().min(1),
  reason: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  decision: AiEffectDecisionRecordSchema.nullable(),
  execution: AiEffectExecutionRecordSchema.nullable(),
  /** Env *names* referenced by this surface (never values). */
  effectEnvNames: z.array(z.string().min(1)),
});
export type AiEffectApprovalRequest = z.infer<typeof AiEffectApprovalRequestSchema>;

/** Payload placed on the Phase 5 job envelope after approval. */
export const AiEffectExecuteJobPayloadSchema = z
  .object({
    approvalRequestId: z.string().uuid(),
    toolId: AiEffectGatedToolIdSchema,
    riskClass: z.literal("APPROVAL_REQUIRED"),
    actorUserId: z.string().uuid(),
    decidedByUserId: z.string().uuid(),
    input: z.record(z.unknown()),
  })
  .strict();
export type AiEffectExecuteJobPayload = z.infer<typeof AiEffectExecuteJobPayloadSchema>;

export function aiEffectIdempotencyScopeKey(input: {
  tenantId: string;
  toolId: string;
  idempotencyKey: string;
}): string {
  return `${input.tenantId}:ai.effect:${input.toolId}:${input.idempotencyKey}`;
}

/** Deny-by-default: only APPROVAL_REQUIRED gated tool ids may enter the gate. */
export function isGatedEffectToolId(toolId: string): toolId is AiEffectGatedToolId {
  return AiEffectGatedToolIdSchema.safeParse(toolId).success;
}

export function isAiEffectsEnqueueEnabled(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function parseApprovalTtlSeconds(raw: string | undefined, fallback = 3600): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 86_400);
}

export function isApprovalExpired(
  request: Pick<AiEffectApprovalRequest, "status" | "expiresAt">,
  now = new Date(),
): boolean {
  if (request.status === "expired") return true;
  if (request.status !== "pending") return false;
  return Date.parse(request.expiresAt) <= now.getTime();
}

/**
 * Status transitions allowed by the gate (no autonomous side effects here).
 * pending → approved|rejected|expired
 * approved → executed (after enqueue attempt recorded)
 */
export function canTransitionApprovalStatus(
  from: AiEffectApprovalStatus,
  to: AiEffectApprovalStatus,
): boolean {
  if (from === to) return true;
  switch (from) {
    case "pending":
      return to === "approved" || to === "rejected" || to === "expired";
    case "approved":
      return to === "executed";
    default:
      return false;
  }
}

/** Risk class constant for gated tools — FORBIDDEN/AUTO_SAFE never pass. */
export function assertApprovalRequiredRisk(riskClass: string): boolean {
  return riskClass === AiRiskClass.enum.APPROVAL_REQUIRED;
}

export { assertNoSecretFields };
