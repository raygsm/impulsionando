/**
 * Phase 5E — communication.dispatch handler (policy → sink adapter → delivery RPC).
 * Behind WORKER_COMMUNICATION_ENABLED (default off); COMMUNICATION_SINK defaults to sink/noop.
 * Missing delivery RPC/table: log once, do not throw (job/outbox path stays healthy).
 */
import {
  COMMUNICATION_ENV_NAMES,
  CommunicationIntentSchema,
  DeliveryStatus,
  parseRecipientAllowlist,
  runCommunicationDispatch,
  type CommunicationIntent,
  type JobEnvelope,
} from "@impulsionando/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createOnceLogger,
  isSchemaOrRpcMissingError,
  schemaMissingErrorMessage,
} from "../schema-missing";
import { createSinkAdapter } from "./sink-adapters";

export type CommunicationDispatchStats = {
  delivered: number;
  skipped: number;
  failed: number;
};

const deliveryRpcMissingOnce = createOnceLogger(
  "communication_delivery_rpc_missing",
);

function isSinkMode(): boolean {
  const raw = process.env[COMMUNICATION_ENV_NAMES.SINK];
  // Default true when unset — never real-send unless operator explicitly disables sink.
  if (raw === undefined || raw === "") return true;
  return raw === "true" || raw === "1";
}

function resolveAllowlist(): string[] {
  return parseRecipientAllowlist(process.env[COMMUNICATION_ENV_NAMES.RECIPIENT_ALLOWLIST]);
}

export function isCommunicationWorkerEnabled(): boolean {
  return process.env[COMMUNICATION_ENV_NAMES.WORKER_ENABLED] === "true";
}

/**
 * Handle job type communication.dispatch.
 * Sink mode: policy gates then no-op mark delivered (or policy skip status).
 */
export async function handleCommunicationDispatchJob(
  client: SupabaseClient,
  envelope: JobEnvelope,
  stats: CommunicationDispatchStats,
): Promise<void> {
  const payload = envelope.payload ?? {};
  const intentRaw = (payload.intent as Record<string, unknown> | undefined) ?? payload;
  const parsed = CommunicationIntentSchema.safeParse(intentRaw);
  if (!parsed.success) {
    stats.failed += 1;
    console.log(
      JSON.stringify({
        ok: false,
        service: "impulsionando-worker",
        event: "communication_dispatch_invalid",
        jobId: envelope.jobId,
        at: new Date().toISOString(),
      }),
    );
    throw new Error("COMMUNICATION_INTENT_INVALID");
  }

  const intent = parsed.data;
  await dispatchCommunicationIntent(client, intent, stats, {
    correlationId: envelope.correlationId,
    jobId: envelope.jobId,
  });
}

/**
 * Handle outbox event communication.requested in sink mode (no-op mark delivered).
 */
export async function handleCommunicationRequestedEvent(
  client: SupabaseClient,
  input: {
    eventId: string;
    tenantId: string;
    correlationId: string;
    envelope: Record<string, unknown>;
  },
  stats: CommunicationDispatchStats,
): Promise<void> {
  const payload = (input.envelope.payload as Record<string, unknown> | undefined) ?? {};
  const intentCandidate =
    (payload.intent as Record<string, unknown> | undefined) ??
    ({
      intentId: input.eventId,
      schemaVersion: 1,
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      channel: payload.channel ?? "email",
      template: payload.template ?? {
        templateId: "reengineering.smoke",
        version: 1,
      },
      recipient: payload.recipient ?? { address: "denied@example.invalid" },
      consent: payload.consent ?? { granted: true, optedOut: false },
      idempotencyKey:
        (typeof payload.idempotencyKey === "string" && payload.idempotencyKey) ||
        `comm:${input.eventId}`,
      requestedAt:
        (typeof input.envelope.occurredAt === "string" && input.envelope.occurredAt) ||
        new Date().toISOString(),
      ...(typeof payload.dedupKey === "string" ? { dedupKey: payload.dedupKey } : {}),
      ...(payload.cooldown ? { cooldown: payload.cooldown } : {}),
      ...(payload.payload && typeof payload.payload === "object"
        ? { payload: payload.payload as Record<string, unknown> }
        : {}),
    } as Record<string, unknown>);

  const parsed = CommunicationIntentSchema.safeParse(intentCandidate);
  if (!parsed.success) {
    stats.failed += 1;
    console.log(
      JSON.stringify({
        ok: false,
        service: "impulsionando-worker",
        event: "communication_requested_invalid",
        eventId: input.eventId,
        at: new Date().toISOString(),
      }),
    );
    return;
  }

  if (!isSinkMode()) {
    // Non-sink path not implemented in Phase 5E repo slice — refuse real sends.
    stats.failed += 1;
    console.log(
      JSON.stringify({
        ok: false,
        service: "impulsionando-worker",
        event: "communication_real_send_refused",
        reason: "COMMUNICATION_SINK must be true for Phase 5E",
        eventId: input.eventId,
        at: new Date().toISOString(),
      }),
    );
    return;
  }

  await dispatchCommunicationIntent(client, parsed.data, stats, {
    correlationId: input.correlationId,
    eventId: input.eventId,
  });
}

async function dispatchCommunicationIntent(
  client: SupabaseClient,
  intent: CommunicationIntent,
  stats: CommunicationDispatchStats,
  meta: { correlationId: string; jobId?: string; eventId?: string },
): Promise<void> {
  if (!isSinkMode()) {
    stats.failed += 1;
    throw new Error("COMMUNICATION_REAL_SEND_DISABLED");
  }

  const adapter = createSinkAdapter(intent.channel);
  const deliveryId = intent.intentId;
  const allowlist = resolveAllowlist();

  const outcome = await runCommunicationDispatch({
    intent,
    adapter,
    deliveryId,
    allowlist,
  });

  const result = outcome.result;
  const status = result?.status ?? DeliveryStatus.Failed;

  try {
    await recordDelivery(client, {
      intent,
      status,
      skipReason: outcome.decision.allow ? null : outcome.decision.reason,
      provider: result?.provider ?? "sink",
      providerMessageId: result?.providerMessageId ?? null,
      errorCode: result?.errorCode ?? null,
      errorMessage: result?.errorMessage ?? null,
    });
    deliveryRpcMissingOnce.reset();
  } catch (err) {
    // Ledger RPC/table may be absent until 5E migration — degrade, never crash worker.
    if (isSchemaOrRpcMissingError(err)) {
      deliveryRpcMissingOnce.log(schemaMissingErrorMessage(err), {
        note: "Phase 5E delivery RPC/table missing — sink continues without ledger write",
        intentId: intent.intentId,
      });
    } else {
      console.log(
        JSON.stringify({
          ok: false,
          service: "impulsionando-worker",
          event: "communication_delivery_record_failed",
          message: err instanceof Error ? err.message : String(err),
          intentId: intent.intentId,
          at: new Date().toISOString(),
        }),
      );
    }
  }

  if (outcome.decision.allow && result?.ok) {
    stats.delivered += 1;
  } else if (!outcome.decision.allow) {
    stats.skipped += 1;
  } else {
    stats.failed += 1;
  }

  console.log(
    JSON.stringify({
      ok: Boolean(result?.ok),
      service: "impulsionando-worker",
      event: "communication_dispatch",
      mode: "sink",
      intentId: intent.intentId,
      channel: intent.channel,
      status,
      policyAllow: outcome.decision.allow,
      correlationId: meta.correlationId,
      jobId: meta.jobId ?? null,
      eventId: meta.eventId ?? null,
      at: new Date().toISOString(),
    }),
  );
}

async function recordDelivery(
  client: SupabaseClient,
  input: {
    intent: CommunicationIntent;
    status: string;
    skipReason: string | null;
    provider: string;
    providerMessageId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  },
): Promise<void> {
  const { error } = await client.rpc("upsert_reengineering_communication_delivery", {
    p_intent_id: input.intent.intentId,
    p_tenant_id: input.intent.tenantId,
    p_correlation_id: input.intent.correlationId,
    p_channel: input.intent.channel,
    p_template_id: input.intent.template.templateId,
    p_template_version: input.intent.template.version,
    p_recipient_address: input.intent.recipient.address,
    p_status: input.status,
    p_skip_reason: input.skipReason,
    p_provider: input.provider,
    p_provider_message_id: input.providerMessageId,
    p_dedup_key: input.intent.dedupKey ?? null,
    p_cooldown_key: input.intent.cooldown?.key ?? null,
    p_idempotency_key: input.intent.idempotencyKey,
    p_error_code: input.errorCode,
    p_error_message: input.errorMessage,
    p_requested_at: input.intent.requestedAt,
  });
  if (error) throw error;
}
