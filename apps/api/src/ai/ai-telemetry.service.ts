import { Injectable } from "@nestjs/common";
import {
  AI_ENV_NAMES,
  AiMetricsEnvelopeSchema,
  AiTelemetryEventSchema,
  assertNoSecretFields,
  buildAiMetricsEnvelope,
  isTruthyEnv,
  redactAiPayload,
  type AiMetricsEnvelope,
  type AiTelemetryEvent,
} from "@impulsionando/contracts";

const RING_MAX = 500;

/** Telemetry default-on unless explicitly disabled. */
export function isAiTelemetryEnabled(): boolean {
  const raw = process.env[AI_ENV_NAMES.AI_TELEMETRY_ENABLED];
  if (raw === undefined || raw.trim() === "") return true;
  return isTruthyEnv(raw);
}

@Injectable()
export class AiTelemetryService {
  private readonly ring: AiTelemetryEvent[] = [];

  record(event: AiTelemetryEvent): void {
    if (!isAiTelemetryEnabled()) return;
    const safe = redactAiPayload(event);
    const parsed = AiTelemetryEventSchema.safeParse(safe);
    if (!parsed.success) return;
    assertNoSecretFields(parsed.data);
    this.ring.push(parsed.data);
    while (this.ring.length > RING_MAX) {
      this.ring.shift();
    }
  }

  getMetrics(scrapedAt = new Date().toISOString()): AiMetricsEnvelope {
    const envelope = buildAiMetricsEnvelope(this.ring, scrapedAt);
    const parsed = AiMetricsEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      throw new Error("AI_METRICS_INVALID");
    }
    assertNoSecretFields(parsed.data);
    return parsed.data;
  }

  /** Test helper — do not expose via HTTP. */
  snapshotCount(): number {
    return this.ring.length;
  }
}
