import { describe, expect, it } from "vitest";
import {
  AI_EFFECT_ENV_NAMES,
  AI_EFFECT_EXECUTE_JOB_TYPE,
  AI_SCHEMA_VERSION,
  AiApprovalRequiredToolExecRequestSchema,
  AiEffectApprovalCreateBodySchema,
  AiEffectApprovalDecisionBodySchema,
  AiEffectApprovalRequestSchema,
  AiEffectApprovalStatusSchema,
  AiEffectExecuteJobPayloadSchema,
  AiRiskClass,
  JobEnvelopeSchema,
  aiEffectIdempotencyScopeKey,
  assertApprovalRequiredRisk,
  canTransitionApprovalStatus,
  defaultAiToolAllowPolicy,
  isAiEffectsEnqueueEnabled,
  isApprovalExpired,
  isGatedEffectToolId,
  isToolAllowed,
  parseApprovalTtlSeconds,
} from "@impulsionando/contracts";

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACTOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("Phase 6E — gated effects contract", () => {
  it("AI-E01: approval status enum is complete", () => {
    expect(AiEffectApprovalStatusSchema.options).toEqual([
      "pending",
      "approved",
      "rejected",
      "executed",
      "expired",
    ]);
  });

  it("AI-E02: APPROVAL_REQUIRED tool exec request shape", () => {
    const ok = AiApprovalRequiredToolExecRequestSchema.safeParse({
      schemaVersion: AI_SCHEMA_VERSION,
      riskClass: "APPROVAL_REQUIRED",
      toolId: "effect.gated.noop",
      tenantId: TENANT_ID,
      idempotencyKey: "idem-1",
      input: { note: "no write" },
      correlationId: "corr-1",
    });
    expect(ok.success).toBe(true);

    const badRisk = AiApprovalRequiredToolExecRequestSchema.safeParse({
      schemaVersion: AI_SCHEMA_VERSION,
      riskClass: "AUTO_SAFE",
      toolId: "effect.gated.noop",
      tenantId: TENANT_ID,
      idempotencyKey: "idem-1",
      input: {},
    });
    expect(badRisk.success).toBe(false);

    const forbiddenTool = AiApprovalRequiredToolExecRequestSchema.safeParse({
      schemaVersion: AI_SCHEMA_VERSION,
      riskClass: "APPROVAL_REQUIRED",
      toolId: "forbidden.arbitrary_sql",
      tenantId: TENANT_ID,
      idempotencyKey: "idem-1",
      input: {},
    });
    expect(forbiddenTool.success).toBe(false);
  });

  it("AI-E03: create / decide body Zod + idempotency scope", () => {
    expect(
      AiEffectApprovalCreateBodySchema.safeParse({
        toolId: "effect.gated.noop",
        tenantId: TENANT_ID,
        idempotencyKey: "k1",
        input: {},
      }).success,
    ).toBe(true);
    expect(
      AiEffectApprovalCreateBodySchema.safeParse({
        toolId: "support.tickets.list",
        tenantId: TENANT_ID,
        idempotencyKey: "k1",
      }).success,
    ).toBe(false);
    expect(
      AiEffectApprovalDecisionBodySchema.safeParse({ decision: "approve" }).success,
    ).toBe(true);
    expect(
      AiEffectApprovalDecisionBodySchema.safeParse({ decision: "maybe" }).success,
    ).toBe(false);
    expect(
      aiEffectIdempotencyScopeKey({
        tenantId: TENANT_ID,
        toolId: "effect.gated.noop",
        idempotencyKey: "k1",
      }),
    ).toBe(`${TENANT_ID}:ai.effect:effect.gated.noop:k1`);
  });

  it("AI-E04: approval request envelope + no secret fields shape", () => {
    const scraped = {
      schemaVersion: AI_SCHEMA_VERSION,
      id: REQUEST_ID,
      status: "pending" as const,
      riskClass: "APPROVAL_REQUIRED" as const,
      toolId: "effect.gated.noop" as const,
      tenantId: TENANT_ID,
      actorUserId: ACTOR_ID,
      idempotencyKey: "k1",
      input: {},
      correlationId: "corr-1",
      reason: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      decision: null,
      execution: null,
      effectEnvNames: [
        AI_EFFECT_ENV_NAMES.EFFECTS_ENABLED,
        AI_EFFECT_ENV_NAMES.APPROVAL_TTL_SECONDS,
      ],
    };
    expect(AiEffectApprovalRequestSchema.safeParse(scraped).success).toBe(true);
  });

  it("AI-E05: deny-by-default — APPROVAL_REQUIRED / AUTO_SAFE / FORBIDDEN not executable", () => {
    const policy = defaultAiToolAllowPolicy(false);
    expect(isToolAllowed("APPROVAL_REQUIRED", policy)).toBe(false);
    expect(isToolAllowed("AUTO_SAFE", policy)).toBe(false);
    expect(isToolAllowed("FORBIDDEN", policy)).toBe(false);
    expect(assertApprovalRequiredRisk("APPROVAL_REQUIRED")).toBe(true);
    expect(assertApprovalRequiredRisk("FORBIDDEN")).toBe(false);
    expect(isGatedEffectToolId("effect.gated.noop")).toBe(true);
    expect(isGatedEffectToolId("forbidden.arbitrary_sql")).toBe(false);
  });

  it("AI-E06: status transitions + expiry helpers", () => {
    expect(canTransitionApprovalStatus("pending", "approved")).toBe(true);
    expect(canTransitionApprovalStatus("pending", "rejected")).toBe(true);
    expect(canTransitionApprovalStatus("pending", "expired")).toBe(true);
    expect(canTransitionApprovalStatus("approved", "executed")).toBe(true);
    expect(canTransitionApprovalStatus("rejected", "executed")).toBe(false);
    expect(canTransitionApprovalStatus("executed", "pending")).toBe(false);

    const pending = {
      status: "pending" as const,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    expect(isApprovalExpired(pending)).toBe(true);
    expect(
      isApprovalExpired({
        status: "pending",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(false);
  });

  it("AI-E07: enqueue job type + payload + env names only", () => {
    expect(AI_EFFECT_EXECUTE_JOB_TYPE).toBe("ai.effect.execute");
    expect(AI_EFFECT_ENV_NAMES.EFFECTS_ENABLED).toBe("AI_EFFECTS_ENABLED");
    expect(AI_EFFECT_ENV_NAMES.APPROVAL_TTL_SECONDS).toBe("AI_APPROVAL_TTL_SECONDS");
    expect(isAiEffectsEnqueueEnabled(undefined)).toBe(false);
    expect(isAiEffectsEnqueueEnabled("true")).toBe(true);
    expect(parseApprovalTtlSeconds(undefined)).toBe(3600);
    expect(parseApprovalTtlSeconds("120")).toBe(120);

    const payload = {
      approvalRequestId: REQUEST_ID,
      toolId: "effect.gated.noop" as const,
      riskClass: "APPROVAL_REQUIRED" as const,
      actorUserId: ACTOR_ID,
      decidedByUserId: ACTOR_ID,
      input: {},
    };
    expect(AiEffectExecuteJobPayloadSchema.safeParse(payload).success).toBe(true);

    const envelope = JobEnvelopeSchema.safeParse({
      jobId: "11111111-1111-4111-8111-111111111111",
      type: AI_EFFECT_EXECUTE_JOB_TYPE,
      schemaVersion: 1,
      tenantId: TENANT_ID,
      correlationId: "corr-1",
      idempotencyKey: `ai-effect:${REQUEST_ID}`,
      enqueuedAt: new Date().toISOString(),
      payload,
    });
    expect(envelope.success).toBe(true);
    expect(AiRiskClass.options).toContain("APPROVAL_REQUIRED");
  });

  it("AI-E08: QUEUE_STUB execution record shape is valid on request", () => {
    const row = {
      schemaVersion: AI_SCHEMA_VERSION,
      id: REQUEST_ID,
      status: "approved" as const,
      riskClass: "APPROVAL_REQUIRED" as const,
      toolId: "effect.gated.noop" as const,
      tenantId: TENANT_ID,
      actorUserId: ACTOR_ID,
      idempotencyKey: "k1",
      input: {},
      correlationId: "corr-1",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      decision: {
        decision: "approve" as const,
        decidedAt: new Date().toISOString(),
        decidedByUserId: ACTOR_ID,
        reason: null,
      },
      execution: {
        executed: false,
        reason: "QUEUE_STUB" as const,
        jobId: null,
        jobType: null,
        enqueuedAt: null,
      },
      effectEnvNames: [AI_EFFECT_ENV_NAMES.EFFECTS_ENABLED],
    };
    expect(AiEffectApprovalRequestSchema.safeParse(row).success).toBe(true);
  });
});
