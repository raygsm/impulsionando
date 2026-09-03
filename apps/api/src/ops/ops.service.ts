import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  QueueMetricsEnvelopeSchema,
  assertNoSecretFields,
  buildIntegrationRegistryEnvelope,
  computeFailureRate,
  type IdempotencyCounts,
  type IntegrationRegistryEnvelope,
  type QueueMetricsEnvelope,
} from "@impulsionando/contracts";
import { SupabaseService } from "../supabase/supabase.service";

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async getQueueMetrics(): Promise<QueueMetricsEnvelope> {
    const { data, error } = await this.supabase
      .admin()
      .rpc("get_reengineering_queue_metrics");

    if (error) {
      this.logger.warn(
        JSON.stringify({
          event: "ops_queue_metrics_rpc_failed",
          code: error.code ?? null,
          message: error.message,
          // never log keys / secrets
        }),
      );
      throw error;
    }

    const raw = normalizeRpcPayload(data);
    const idempotency = raw.idempotency as IdempotencyCounts | undefined;
    const failureRate =
      idempotency && typeof idempotency === "object"
        ? computeFailureRate({
            processing: Number(idempotency.processing ?? 0),
            completed: Number(idempotency.completed ?? 0),
            failed: Number(idempotency.failed ?? 0),
          })
        : null;

    const candidate = {
      ...raw,
      // Postgres jsonb timestamps may include microseconds / +00:00; Zod datetime() wants ISO-8601 ms.
      scrapedAt: coerceIsoTimestamp(raw.scrapedAt),
      failureRate,
      providerLatencyMsP50: raw.providerLatencyMsP50 ?? null,
      providerLatencyMsP95: raw.providerLatencyMsP95 ?? null,
    };

    const parsed = QueueMetricsEnvelopeSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error("OPS_QUEUE_METRICS_INVALID");
    }

    assertNoSecretFields(parsed.data);
    return parsed.data;
  }

  getIntegrations(): IntegrationRegistryEnvelope {
    const envelope = buildIntegrationRegistryEnvelope();
    assertNoSecretFields(envelope);
    return envelope;
  }
}

function coerceIsoTimestamp(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function normalizeRpcPayload(data: unknown): Record<string, unknown> {
  if (data === null || data === undefined) {
    return {
      schemaVersion: 1,
      scrapedAt: new Date().toISOString(),
      queues: [],
    };
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {
        schemaVersion: 1,
        scrapedAt: new Date().toISOString(),
        queues: [],
      };
    }
  }
  if (typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {
    schemaVersion: 1,
    scrapedAt: new Date().toISOString(),
    queues: [],
  };
}
