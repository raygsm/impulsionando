import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  EventEnvelopeSchema,
  domainMutationToOutboxRow,
  type DomainMutationToOutboxInput,
  type EventEnvelope,
  type OutboxRowInsert,
} from "@impulsionando/contracts";
import { SupabaseService } from "../supabase/supabase.service";

export type WriteOutboxResult = {
  eventId: string;
  mode: "rpc" | "sequential_fallback";
};

/**
 * Phase 5C outbox writer.
 * Prefer `write_reengineering_event_outbox` RPC (same transaction when composed
 * with `create_support_ticket_with_outbox`). Direct table insert is a degraded
 * fallback only — dual-write atomicity then UNKNOWN.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  buildRow(input: DomainMutationToOutboxInput): OutboxRowInsert {
    return domainMutationToOutboxRow(input);
  }

  async writeEnvelope(envelope: EventEnvelope): Promise<WriteOutboxResult> {
    const parsed = EventEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      throw new Error("EVENT_ENVELOPE_INVALID");
    }

    const { data, error } = await this.supabase
      .admin()
      .rpc("write_reengineering_event_outbox", { p_envelope: parsed.data });

    if (!error && data) {
      return { eventId: data as string, mode: "rpc" };
    }

    // Fallback when migration not applied yet — sequential insert; not transactional.
    this.logger.warn(
      `OUTBOX_RPC_UNAVAILABLE:${error?.code || "unknown"} — sequential insert (atomicity UNKNOWN)`,
    );

    const row = domainMutationToOutboxRow({
      eventId: parsed.data.eventId,
      type: parsed.data.type,
      tenantId: parsed.data.tenantId,
      correlationId: parsed.data.correlationId,
      occurredAt: parsed.data.occurredAt,
      payload: parsed.data.payload,
      actor: parsed.data.actor,
      idempotencyKey: parsed.data.idempotencyKey,
      causationId: parsed.data.causationId,
      source: parsed.data.source,
    });

    const { error: insertErr } = await this.supabase.admin().from("reengineering_event_outbox").insert({
      event_id: row.eventId,
      event_type: row.eventType,
      schema_version: row.schemaVersion,
      tenant_id: row.tenantId,
      correlation_id: row.correlationId,
      idempotency_key: row.idempotencyKey,
      occurred_at: row.occurredAt,
      payload: row.payload,
      envelope: row.envelope,
      status: "pending",
    });

    if (insertErr) {
      throw new Error(
        `OUTBOX_INSERT_FAILED:${insertErr.code || "unknown"}:${insertErr.message || ""}`,
      );
    }

    return { eventId: row.eventId, mode: "sequential_fallback" };
  }

  async writeFromMutation(input: DomainMutationToOutboxInput): Promise<WriteOutboxResult> {
    const row = this.buildRow(input);
    return this.writeEnvelope(row.envelope);
  }
}
