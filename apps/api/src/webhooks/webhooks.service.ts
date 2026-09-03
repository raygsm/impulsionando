import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  WebhookEnvelopeSchema,
  redactWebhookPayloadRecord,
  resolveWebhookSecretEnvName,
  sha256Hex,
  shouldRejectReplay,
  verifyWebhookIngress,
  webhookIdempotencyScopeKey,
  type WebhookEnvelope,
  type WebhookVerifyFailureReason,
} from "@impulsionando/contracts";
import { randomUUID } from "node:crypto";
import { SupabaseService } from "../supabase/supabase.service";

export type WebhookIngressInput = {
  provider: string;
  rawBody: string;
  parsedBody: unknown;
  signatureHeader?: string;
  timestampHeader?: string;
  idempotencyKey?: string;
  correlationId?: string;
};

export type WebhookIngressAccepted = {
  status: "accepted";
  ingressId: string;
  correlationId: string;
  idempotencyKey: string;
  payloadSha256: string;
};

export type WebhookIngressRejected = {
  status: "rejected";
  reason: WebhookVerifyFailureReason;
  correlationId: string;
  httpHint: 400 | 401 | 409;
};

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async ingest(input: WebhookIngressInput): Promise<WebhookIngressAccepted | WebhookIngressRejected> {
    const correlationId = input.correlationId?.trim() || randomUUID();
    const receivedAt = new Date().toISOString();
    const envName = resolveWebhookSecretEnvName(input.provider);
    const secret = envName ? process.env[envName] : undefined;

    const verified = verifyWebhookIngress({
      provider: input.provider,
      rawBody: input.rawBody,
      signatureHeader: input.signatureHeader,
      timestampHeader: input.timestampHeader,
      idempotencyKey: input.idempotencyKey,
      secret,
    });

    const payloadSha256 = sha256Hex(input.rawBody);
    const idempotencyKey = input.idempotencyKey?.trim() || "";
    const scopeKey = idempotencyKey
      ? webhookIdempotencyScopeKey(input.provider, idempotencyKey)
      : "";

    if (!verified.ok) {
      await this.persistAudit({
        provider: input.provider,
        correlationId,
        idempotencyKey: idempotencyKey || null,
        scopeKey: scopeKey || null,
        signatureOk: false,
        replayRejected: verified.reason === "REPLAY_DUPLICATE",
        rejectReason: verified.reason,
        payloadSha256,
        payloadRedacted: null,
        receivedAt,
      });

      this.logger.warn(
        JSON.stringify({
          event: "webhook_rejected",
          provider: input.provider,
          reason: verified.reason,
          correlationId,
          payloadSha256,
          // never log raw body
        }),
      );

      return {
        status: "rejected",
        reason: verified.reason,
        correlationId,
        httpHint: httpHintFor(verified.reason),
      };
    }

    const payloadRedacted = redactWebhookPayloadRecord(input.parsedBody);
    const envelope: WebhookEnvelope = {
      provider: verified.provider,
      schemaVersion: 1,
      eventId: idempotencyKey,
      correlationId,
      idempotencyKey,
      receivedAt,
      timestampSeconds: Number(input.timestampHeader),
      payloadSha256,
      payloadRedacted,
    };

    const parsed = WebhookEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      await this.persistAudit({
        provider: input.provider,
        correlationId,
        idempotencyKey,
        scopeKey,
        signatureOk: true,
        replayRejected: false,
        rejectReason: "SCHEMA_INVALID",
        payloadSha256,
        payloadRedacted,
        receivedAt,
      });
      return {
        status: "rejected",
        reason: "SCHEMA_INVALID",
        correlationId,
        httpHint: 400,
      };
    }

    const persisted = await this.persistAudit({
      provider: verified.provider,
      correlationId,
      idempotencyKey,
      scopeKey,
      signatureOk: true,
      replayRejected: false,
      rejectReason: null,
      payloadSha256,
      payloadRedacted,
      receivedAt,
    });

    if (shouldRejectReplay(persisted.duplicate)) {
      this.logger.warn(
        JSON.stringify({
          event: "webhook_replay_rejected",
          provider: verified.provider,
          correlationId,
          payloadSha256,
          scopeKey,
        }),
      );
      return {
        status: "rejected",
        reason: "REPLAY_DUPLICATE",
        correlationId,
        httpHint: 409,
      };
    }

    this.logger.log(
      JSON.stringify({
        event: "webhook_accepted",
        provider: verified.provider,
        correlationId,
        ingressId: persisted.ingressId,
        payloadSha256,
        // durable processing handoff = ingress row; no outbound provider calls
      }),
    );

    return {
      status: "accepted",
      ingressId: persisted.ingressId,
      correlationId,
      idempotencyKey,
      payloadSha256,
    };
  }

  private async persistAudit(row: {
    provider: string;
    correlationId: string;
    idempotencyKey: string | null;
    scopeKey: string | null;
    signatureOk: boolean;
    replayRejected: boolean;
    rejectReason: string | null;
    payloadSha256: string;
    payloadRedacted: Record<string, unknown> | null;
    receivedAt: string;
  }): Promise<{ ingressId: string; duplicate: boolean }> {
    if (!this.supabase.configured()) {
      // Local / unit path without Supabase — still return a synthetic id.
      return { ingressId: randomUUID(), duplicate: false };
    }

    const { data, error } = await this.supabase.admin().rpc("record_reengineering_webhook_ingress", {
      p_provider: row.provider,
      p_correlation_id: row.correlationId,
      p_idempotency_key: row.idempotencyKey,
      p_scope_key: row.scopeKey,
      p_signature_ok: row.signatureOk,
      p_replay_rejected: row.replayRejected,
      p_reject_reason: row.rejectReason,
      p_payload_sha256: row.payloadSha256,
      p_payload_redacted: row.payloadRedacted,
      p_received_at: row.receivedAt,
    });

    if (error) throw error;

    const result = data as { ingress_id?: string; duplicate?: boolean } | null;
    return {
      ingressId: result?.ingress_id || randomUUID(),
      duplicate: Boolean(result?.duplicate),
    };
  }
}

function httpHintFor(reason: WebhookVerifyFailureReason): 400 | 401 | 409 {
  switch (reason) {
    case "SIGNATURE_MISMATCH":
    case "MISSING_SIGNATURE":
    case "UNKNOWN_PROVIDER":
      return 401;
    case "REPLAY_DUPLICATE":
      return 409;
    default:
      return 400;
  }
}
