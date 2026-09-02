import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_JOB_ATTEMPTS,
  JobEnvelopeSchema,
  JobMessageSchema,
  REENGINEERING_JOBS_DLQ,
  REENGINEERING_JOBS_QUEUE,
  computeBackoffMs,
  idempotencyScopeKey,
  shouldMoveToDlq,
  shouldSkipDuplicate,
} from "@impulsionando/contracts";

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("Phase 5B — job queue contract", () => {
  it("JQ-01: validates JobEnvelope v1", () => {
    const parsed = JobEnvelopeSchema.safeParse({
      jobId: "11111111-1111-4111-8111-111111111111",
      type: "reengineering.smoke.echo",
      schemaVersion: 1,
      tenantId: TENANT_ID,
      correlationId: "corr-1",
      idempotencyKey: "idem-1",
      enqueuedAt: new Date().toISOString(),
      payload: { hello: "world" },
    });
    expect(parsed.success).toBe(true);
  });

  it("JQ-02: validates JobMessage wrapper", () => {
    const envelope = {
      jobId: "11111111-1111-4111-8111-111111111111",
      type: "reengineering.smoke.echo",
      schemaVersion: 1 as const,
      tenantId: TENANT_ID,
      correlationId: "corr-1",
      idempotencyKey: "idem-1",
      enqueuedAt: new Date().toISOString(),
    };
    const parsed = JobMessageSchema.safeParse({
      jobId: envelope.jobId,
      queue: REENGINEERING_JOBS_QUEUE,
      enqueuedAt: envelope.enqueuedAt,
      attempt: 1,
      visibilityTimeoutSeconds: 30,
      envelope,
    });
    expect(parsed.success).toBe(true);
  });

  it("JQ-03: idempotency scope key is tenant:type:key", () => {
    expect(
      idempotencyScopeKey({
        tenantId: TENANT_ID,
        jobType: "reengineering.smoke.echo",
        idempotencyKey: "smoke-1",
      }),
    ).toBe(`${TENANT_ID}:reengineering.smoke.echo:smoke-1`);
  });

  it("JQ-04: shouldSkipDuplicate only on completed", () => {
    expect(shouldSkipDuplicate("completed")).toBe(true);
    expect(shouldSkipDuplicate("processing")).toBe(false);
    expect(shouldSkipDuplicate("failed")).toBe(false);
    expect(shouldSkipDuplicate(null)).toBe(false);
  });

  it("JQ-05: shouldMoveToDlq at max attempts", () => {
    expect(shouldMoveToDlq(DEFAULT_MAX_JOB_ATTEMPTS - 1)).toBe(false);
    expect(shouldMoveToDlq(DEFAULT_MAX_JOB_ATTEMPTS)).toBe(true);
  });

  it("JQ-06: computeBackoffMs grows with attempt", () => {
    const a1 = computeBackoffMs(1, 1_000, 60_000);
    const a3 = computeBackoffMs(3, 1_000, 60_000);
    expect(a3).toBeGreaterThanOrEqual(a1);
  });

  it("JQ-07: queue constants", () => {
    expect(REENGINEERING_JOBS_QUEUE).toBe("reengineering_jobs");
    expect(REENGINEERING_JOBS_DLQ).toBe("reengineering_jobs_dlq");
  });
});
