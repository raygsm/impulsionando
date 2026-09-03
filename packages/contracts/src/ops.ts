/**
 * Phase 5G — operational readiness contracts (metrics envelope + integration registry).
 * Env var *names* only — never credential values. No Nest coupling.
 */
import { z } from "zod";
import { REENGINEERING_JOBS_DLQ, REENGINEERING_JOBS_QUEUE } from "./job";
import { COMMUNICATION_ENV_NAMES } from "./communication";
import { WEBHOOK_SECRET_ENV_NAMES } from "./webhook";

export const OPS_SCHEMA_VERSION = 1 as const;

export const OPS_QUEUES = {
  jobs: REENGINEERING_JOBS_QUEUE,
  dlq: REENGINEERING_JOBS_DLQ,
} as const;

/** Single queue scrape row (pgmq.metrics-compatible). */
export const QueueMetricRowSchema = z.object({
  queueName: z.string().min(1),
  backlog: z.number().int().nonnegative(),
  oldestJobAgeSeconds: z.number().int().nonnegative().nullable(),
  newestJobAgeSeconds: z.number().int().nonnegative().nullable(),
  totalMessages: z.number().int().nonnegative().nullable(),
  visibleLength: z.number().int().nonnegative().nullable().optional(),
});
export type QueueMetricRow = z.infer<typeof QueueMetricRowSchema>;

export const IdempotencyCountsSchema = z.object({
  processing: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});
export type IdempotencyCounts = z.infer<typeof IdempotencyCountsSchema>;

/**
 * Queue metrics envelope for GET /api/v1/ops/queue-metrics.
 * providerLatency* remain nullable until provider telemetry is wired (UNKNOWN).
 */
export const QueueMetricsEnvelopeSchema = z.object({
  schemaVersion: z.literal(OPS_SCHEMA_VERSION),
  scrapedAt: z.string().datetime(),
  queues: z.array(QueueMetricRowSchema),
  idempotency: IdempotencyCountsSchema.optional(),
  /** failed / (completed + failed); null when denominator is 0. */
  failureRate: z.number().min(0).max(1).nullable().optional(),
  dlqBacklog: z.number().int().nonnegative().optional(),
  /** Placeholder until adapter latency telemetry exists. */
  providerLatencyMsP50: z.number().nonnegative().nullable().optional(),
  providerLatencyMsP95: z.number().nonnegative().nullable().optional(),
});
export type QueueMetricsEnvelope = z.infer<typeof QueueMetricsEnvelopeSchema>;

export const IntegrationEnvironmentSchema = z.enum(["local", "staging", "production"]);
export type IntegrationEnvironment = z.infer<typeof IntegrationEnvironmentSchema>;

export const IntegrationStatusSchema = z.enum([
  "planned",
  "staging",
  "live",
  "deprecated",
  "outage",
]);
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

/** Registry row — credentialEnvNames are env *names* only (never values). */
export const IntegrationRegistryRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Named owner (operator-assigned). */
  owner: z.string().min(1),
  environment: IntegrationEnvironmentSchema,
  credentialEnvNames: z.array(z.string().min(1)),
  status: IntegrationStatusSchema,
  runbookRef: z.string().min(1),
});
export type IntegrationRegistryRow = z.infer<typeof IntegrationRegistryRowSchema>;

export const IntegrationRegistryEnvelopeSchema = z.object({
  schemaVersion: z.literal(OPS_SCHEMA_VERSION),
  scrapedAt: z.string().datetime(),
  integrations: z.array(IntegrationRegistryRowSchema),
});
export type IntegrationRegistryEnvelope = z.infer<typeof IntegrationRegistryEnvelopeSchema>;

/**
 * Static staging-oriented registry (repo source of truth).
 * Owners assigned 2026-09-03 — see INTEGRATION-REGISTRY.md.
 * Live API may still show TBD until image redeploy.
 */
export const INTEGRATION_REGISTRY_SEED: readonly IntegrationRegistryRow[] = [
  {
    id: "pgmq-reengineering-jobs",
    name: "Supabase Queues (reengineering_jobs)",
    owner: "Cauã",
    environment: "staging",
    credentialEnvNames: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    status: "staging",
    runbookRef: "docs/reengineering/04-migration/phase-5/RUNBOOKS.md#queue-dlq",
  },
  {
    id: "webhook-reengineering-smoke",
    name: "Webhook ingress (reengineering.smoke)",
    owner: "Cauã",
    environment: "staging",
    credentialEnvNames: [WEBHOOK_SECRET_ENV_NAMES["reengineering.smoke"]],
    status: "staging",
    runbookRef: "docs/reengineering/04-migration/phase-5/RUNBOOKS.md#safe-replay",
  },
  {
    id: "communication-sink",
    name: "Communication adapters (email/whatsapp sink)",
    owner: "Cauã",
    environment: "staging",
    credentialEnvNames: [
      COMMUNICATION_ENV_NAMES.SINK,
      COMMUNICATION_ENV_NAMES.RECIPIENT_ALLOWLIST,
      COMMUNICATION_ENV_NAMES.WORKER_ENABLED,
    ],
    status: "staging",
    runbookRef: "docs/reengineering/04-migration/phase-5/RUNBOOKS.md#provider-outage-drill",
  },
  {
    id: "event-outbox",
    name: "Transactional event outbox",
    owner: "Cauã",
    environment: "staging",
    credentialEnvNames: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "WORKER_OUTBOX_ENABLED"],
    status: "staging",
    runbookRef: "docs/reengineering/04-migration/phase-5/RUNBOOKS.md#safe-replay",
  },
] as const;

export function buildIntegrationRegistryEnvelope(
  scrapedAt = new Date().toISOString(),
): IntegrationRegistryEnvelope {
  return {
    schemaVersion: OPS_SCHEMA_VERSION,
    scrapedAt,
    integrations: [...INTEGRATION_REGISTRY_SEED],
  };
}

export function computeFailureRate(counts: IdempotencyCounts): number | null {
  const denom = counts.completed + counts.failed;
  if (denom === 0) return null;
  return counts.failed / denom;
}

/** Strip accidental secret-like keys from metrics/registry payloads before respond. */
const SECRET_KEY_RE =
  /(secret|password|token|api[_-]?key|authorization|credential|private[_-]?key)/i;

/** Safe metric / budget field names that contain "token" but are not secrets. */
const ALLOWED_TOKEN_METRIC_KEYS = new Set([
  "maxTokensPerRequest",
  "promptTokens",
  "completionTokens",
  "totalTokens",
  "tokensUsed",
]);

export function assertNoSecretFields(value: unknown, path = "$"): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoSecretFields(item, `${path}[${i}]`));
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (
        SECRET_KEY_RE.test(key) &&
        !/EnvNames?$/i.test(key) &&
        key !== "credentialEnvNames" &&
        !ALLOWED_TOKEN_METRIC_KEYS.has(key)
      ) {
        throw new Error(`OPS_SECRET_FIELD_LEAK:${path}.${key}`);
      }
      assertNoSecretFields(child, `${path}.${key}`);
    }
  }
}
