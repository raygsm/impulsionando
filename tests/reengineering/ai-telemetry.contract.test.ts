import { describe, expect, it } from "vitest";
import {
  AI_DETERMINISTIC_MODEL_ID,
  AI_SCHEMA_VERSION,
  AiMetricsEnvelopeSchema,
  AiTelemetryEventSchema,
  assertNoSecretFields,
  buildAiMetricsEnvelope,
  redactAiPayload,
} from "@impulsionando/contracts";

describe("Phase 6F — AI telemetry / redaction contract", () => {
  it("TEL-01: validates telemetry event", () => {
    const event = {
      schemaVersion: AI_SCHEMA_VERSION,
      recordedAt: new Date().toISOString(),
      correlationId: "c1",
      capability: "ai.chat",
      tenantId: null,
      latencyMs: 40,
      outcome: "ok" as const,
      tokensUsed: null,
      costCentsEstimate: null,
      toolIds: ["support.tickets.list"],
      promptVersion: "pilot-v1",
      modelId: AI_DETERMINISTIC_MODEL_ID,
    };
    expect(AiTelemetryEventSchema.safeParse(event).success).toBe(true);
    expect(() => assertNoSecretFields(event)).not.toThrow();
  });

  it("TEL-02: buildAiMetricsEnvelope aggregates outcomes + latency", () => {
    const events = [10, 20, 100].map((latencyMs, i) => ({
      schemaVersion: AI_SCHEMA_VERSION,
      recordedAt: new Date().toISOString(),
      correlationId: `c${i}`,
      capability: "ai.chat",
      tenantId: null,
      latencyMs,
      outcome: (i === 2 ? "refuse" : "ok") as "ok" | "refuse",
      tokensUsed: null,
      costCentsEstimate: null,
      toolIds: [],
      promptVersion: "pilot-v1",
      modelId: AI_DETERMINISTIC_MODEL_ID,
    }));
    const envelope = buildAiMetricsEnvelope(events);
    const parsed = AiMetricsEnvelopeSchema.safeParse(envelope);
    expect(parsed.success).toBe(true);
    expect(envelope.outcomes.ok).toBe(2);
    expect(envelope.outcomes.refuse).toBe(1);
    expect(envelope.latencyMsP50).not.toBeNull();
    expect(envelope.canaryStatus).toBe("UNKNOWN");
    expect(envelope.retention).toBe("in-memory-ring");
  });

  it("TEL-03: redactAiPayload strips secret-like keys and JWTs", () => {
    const redacted = redactAiPayload({
      answer: "ok",
      apiKey: "sk-leak",
      nested: { access_token: "tok", safe: "yes" },
      jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.nested.access_token).toBe("[REDACTED]");
    expect(redacted.nested.safe).toBe("yes");
    expect(redacted.jwt).toBe("[REDACTED_JWT]");
  });
});
