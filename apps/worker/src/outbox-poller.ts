import { EventType } from "@impulsionando/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  handleCommunicationRequestedEvent,
  isCommunicationWorkerEnabled,
  type CommunicationDispatchStats,
} from "./communication/dispatch";
import {
  createOnceLogger,
  isSchemaOrRpcMissingError,
  schemaMissingErrorMessage,
} from "./schema-missing";

export type OutboxClaimedRow = {
  id: string;
  eventId: string;
  eventType: string;
  tenantId: string;
  correlationId: string;
  envelope: Record<string, unknown>;
  publishAttempts: number;
};

/**
 * Phase 5C outbox poller stub — marks pending rows published.
 * Phase 5E: optional sink dispatch for communication.requested when
 * WORKER_COMMUNICATION_ENABLED=true (default off).
 * Behind WORKER_OUTBOX_ENABLED; default off so 5B job consumer is unaffected.
 *
 * When 5C migration/RPCs are missing: degrade (log once, skip ticks),
 * probe periodically so enabling WORKER_OUTBOX_ENABLED before DDL does not
 * crash or spam logs; resumes when claim RPC succeeds.
 */
export class OutboxPoller {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private claimed = 0;
  private published = 0;
  private failed = 0;
  private degraded = false;
  private nextProbeAtMs = 0;
  private communication: CommunicationDispatchStats = {
    delivered: 0,
    skipped: 0,
    failed: 0,
  };
  private readonly degradeOnce = createOnceLogger("outbox_poll_degraded");
  private readonly degradeProbeMs: number;

  constructor(
    private readonly client: SupabaseClient,
    private readonly opts: { batchSize: number; pollIntervalMs: number },
  ) {
    this.degradeProbeMs = Number(
      process.env.WORKER_OUTBOX_DEGRADE_PROBE_MS || 60_000,
    );
  }

  getStats() {
    return {
      claimed: this.claimed,
      published: this.published,
      failed: this.failed,
      running: this.running,
      degraded: this.degraded,
      communication: this.communication,
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.opts.pollIntervalMs);
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    if (!this.running) return;
    if (this.degraded && Date.now() < this.nextProbeAtMs) return;

    try {
      const rows = await this.claimBatch();
      this.clearDegradedIfNeeded();

      for (const row of rows) {
        this.claimed += 1;
        try {
          // Stub publisher: durable mark only. Real dispatch → jobs/webhooks later.
          await this.markPublished(row.eventId);
          this.published += 1;

          // Phase 5E — sink/noop for communication.requested (flag default off).
          if (
            row.eventType === EventType.CommunicationRequested &&
            isCommunicationWorkerEnabled()
          ) {
            await handleCommunicationRequestedEvent(
              this.client,
              {
                eventId: row.eventId,
                tenantId: row.tenantId,
                correlationId: row.correlationId,
                envelope: row.envelope,
              },
              this.communication,
            );
          }

          console.log(
            JSON.stringify({
              ok: true,
              service: "impulsionando-worker",
              event: "outbox_published",
              eventId: row.eventId,
              eventType: row.eventType,
              correlationId: row.correlationId,
              tenantId: row.tenantId,
              at: new Date().toISOString(),
            }),
          );
        } catch (err) {
          this.failed += 1;
          try {
            await this.markFailed(
              row.eventId,
              err instanceof Error ? err.message : String(err),
            );
          } catch (markErr) {
            if (isSchemaOrRpcMissingError(markErr)) {
              this.enterDegraded(markErr);
            }
            // Avoid nested spam; publish path already counted failed.
          }
        }
      }
    } catch (err) {
      if (isSchemaOrRpcMissingError(err)) {
        this.enterDegraded(err);
        return;
      }
      console.error(
        JSON.stringify({
          ok: false,
          service: "impulsionando-worker",
          event: "outbox_poll_failed",
          message: err instanceof Error ? err.message : String(err),
          at: new Date().toISOString(),
        }),
      );
    }
  }

  private enterDegraded(err: unknown) {
    this.degraded = true;
    this.nextProbeAtMs = Date.now() + this.degradeProbeMs;
    this.degradeOnce.log(schemaMissingErrorMessage(err), {
      note: "Phase 5C migration/RPC missing — poller paused; will probe periodically. Job consumer unaffected.",
      probeMs: this.degradeProbeMs,
    });
  }

  private clearDegradedIfNeeded() {
    if (!this.degraded) return;
    this.degraded = false;
    this.nextProbeAtMs = 0;
    this.degradeOnce.reset();
    console.log(
      JSON.stringify({
        ok: true,
        service: "impulsionando-worker",
        event: "outbox_poll_recovered",
        note: "claim_reengineering_outbox_batch succeeded after degrade",
        at: new Date().toISOString(),
      }),
    );
  }

  private async claimBatch(): Promise<OutboxClaimedRow[]> {
    const { data, error } = await this.client.rpc("claim_reengineering_outbox_batch", {
      p_batch_size: this.opts.batchSize,
    });
    if (error) throw error;
    return (data ?? []).map(
      (row: {
        id: string;
        event_id: string;
        event_type: string;
        tenant_id: string;
        correlation_id: string;
        envelope: Record<string, unknown>;
        publish_attempts: number;
      }) => ({
        id: row.id,
        eventId: row.event_id,
        eventType: row.event_type,
        tenantId: row.tenant_id,
        correlationId: row.correlation_id,
        envelope: row.envelope,
        publishAttempts: row.publish_attempts,
      }),
    );
  }

  private async markPublished(eventId: string) {
    const { error } = await this.client.rpc("mark_reengineering_outbox_published", {
      p_event_id: eventId,
    });
    if (error) throw error;
  }

  private async markFailed(eventId: string, message: string) {
    const { error } = await this.client.rpc("mark_reengineering_outbox_failed", {
      p_event_id: eventId,
      p_error: message,
    });
    if (error) throw error;
  }
}
