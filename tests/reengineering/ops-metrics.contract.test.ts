import { describe, expect, it } from "vitest";
import {
  INTEGRATION_REGISTRY_SEED,
  OPS_QUEUES,
  OPS_SCHEMA_VERSION,
  QueueMetricsEnvelopeSchema,
  IntegrationRegistryEnvelopeSchema,
  assertNoSecretFields,
  buildIntegrationRegistryEnvelope,
  computeFailureRate,
} from "@impulsionando/contracts";

describe("Phase 5G — ops metrics / registry contract", () => {
  it("OPS-01: validates QueueMetricsEnvelope v1", () => {
    const parsed = QueueMetricsEnvelopeSchema.safeParse({
      schemaVersion: OPS_SCHEMA_VERSION,
      scrapedAt: new Date().toISOString(),
      queues: [
        {
          queueName: OPS_QUEUES.jobs,
          backlog: 2,
          oldestJobAgeSeconds: 40,
          newestJobAgeSeconds: 5,
          totalMessages: 10,
          visibleLength: 2,
        },
        {
          queueName: OPS_QUEUES.dlq,
          backlog: 1,
          oldestJobAgeSeconds: 100,
          newestJobAgeSeconds: 100,
          totalMessages: 3,
          visibleLength: 1,
        },
      ],
      idempotency: { processing: 1, completed: 8, failed: 2 },
      failureRate: 0.2,
      dlqBacklog: 1,
      providerLatencyMsP50: null,
      providerLatencyMsP95: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("OPS-02: computeFailureRate handles zero denominator", () => {
    expect(computeFailureRate({ processing: 0, completed: 0, failed: 0 })).toBeNull();
    expect(computeFailureRate({ processing: 1, completed: 3, failed: 1 })).toBeCloseTo(0.25);
  });

  it("OPS-03: integration registry seed has named owners and env names only", () => {
    expect(INTEGRATION_REGISTRY_SEED.length).toBeGreaterThanOrEqual(3);
    for (const row of INTEGRATION_REGISTRY_SEED) {
      expect(row.owner).toBe("Cauã");
      expect(row.credentialEnvNames.length).toBeGreaterThan(0);
      for (const envName of row.credentialEnvNames) {
        expect(envName).toMatch(/^[A-Z][A-Z0-9_]*$/);
        expect(envName).not.toMatch(/eyJ/); // no JWT-looking values
      }
      expect(row.runbookRef.length).toBeGreaterThan(0);
    }
  });

  it("OPS-04: buildIntegrationRegistryEnvelope validates", () => {
    const envelope = buildIntegrationRegistryEnvelope();
    const parsed = IntegrationRegistryEnvelopeSchema.safeParse(envelope);
    expect(parsed.success).toBe(true);
    expect(envelope.schemaVersion).toBe(OPS_SCHEMA_VERSION);
  });

  it("OPS-05: assertNoSecretFields allows credentialEnvNames, rejects secret values keys", () => {
    expect(() =>
      assertNoSecretFields({
        credentialEnvNames: ["WEBHOOK_SECRET_REENGINEERING_SMOKE"],
        owner: "Cauã",
      }),
    ).not.toThrow();

    expect(() =>
      assertNoSecretFields({
        webhookSecret: "should-not-appear",
      }),
    ).toThrow(/OPS_SECRET_FIELD_LEAK/);
  });

  it("OPS-06: empty queue metrics still parse", () => {
    const parsed = QueueMetricsEnvelopeSchema.safeParse({
      schemaVersion: 1,
      scrapedAt: new Date().toISOString(),
      queues: [],
      failureRate: null,
      providerLatencyMsP50: null,
      providerLatencyMsP95: null,
    });
    expect(parsed.success).toBe(true);
  });
});
