import {
  DEFAULT_MAX_JOB_ATTEMPTS,
  DEFAULT_VISIBILITY_TIMEOUT_SECONDS,
  JobEnvelopeSchema,
  computeBackoffMs,
  idempotencyScopeKey,
  shouldMoveToDlq,
  type JobEnvelope,
} from "@impulsionando/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  claimIdempotency,
  completeIdempotency,
  deleteJobMessage,
  failIdempotency,
  moveJobToDlq,
  readJobBatch,
  recordJobEffect,
  type QueueMessage,
} from "./queue-client";

export type ConsumerStats = {
  processed: number;
  skipped: number;
  failed: number;
  dlq: number;
};

const SMOKE_JOB_TYPE = "reengineering.smoke.echo";

export class JobConsumer {
  private running = false;
  private stats: ConsumerStats = { processed: 0, skipped: 0, failed: 0, dlq: 0 };

  constructor(
    private readonly client: SupabaseClient,
    private readonly options: {
      batchSize?: number;
      visibilityTimeoutSeconds?: number;
      pollIntervalMs?: number;
    } = {},
  ) {}

  getStats(): ConsumerStats {
    return { ...this.stats };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private async loop(): Promise<void> {
    const pollMs = this.options.pollIntervalMs ?? 2_000;
    while (this.running) {
      try {
        await this.pollOnce();
      } catch (err) {
        console.error(
          JSON.stringify({
            ok: false,
            service: "impulsionando-worker",
            event: "poll_error",
            message: err instanceof Error ? err.message : String(err),
            at: new Date().toISOString(),
          }),
        );
      }
      await sleep(pollMs);
    }
  }

  async pollOnce(): Promise<void> {
    const batch = await readJobBatch(
      this.client,
      this.options.batchSize ?? 5,
      this.options.visibilityTimeoutSeconds ?? DEFAULT_VISIBILITY_TIMEOUT_SECONDS,
    );

    for (const msg of batch) {
      await this.handleMessage(msg);
    }
  }

  private async handleMessage(msg: QueueMessage): Promise<void> {
    const parsed = JobEnvelopeSchema.safeParse(msg.message);
    if (!parsed.success) {
      await moveJobToDlq(this.client, msg.msgId, {
        ...msg.message,
        dlqReason: "INVALID_ENVELOPE",
      });
      this.stats.dlq += 1;
      return;
    }

    const envelope = parsed.data;
    const scopeKey = idempotencyScopeKey({
      tenantId: envelope.tenantId,
      jobType: envelope.type,
      idempotencyKey: envelope.idempotencyKey,
    });

    const claim = await claimIdempotency(this.client, {
      scopeKey,
      tenantId: envelope.tenantId,
      jobType: envelope.type,
      idempotencyKey: envelope.idempotencyKey,
      jobId: envelope.jobId,
    });

    if (claim === "skip_completed") {
      await deleteJobMessage(this.client, msg.msgId);
      this.stats.skipped += 1;
      return;
    }

    if (claim === "skip_processing") {
      await deleteJobMessage(this.client, msg.msgId);
      this.stats.skipped += 1;
      return;
    }

    try {
      await this.executeJob(envelope, scopeKey);
      await completeIdempotency(this.client, scopeKey);
      await deleteJobMessage(this.client, msg.msgId);
      this.stats.processed += 1;
    } catch (err) {
      const attempt = msg.readCt;
      if (shouldMoveToDlq(attempt, DEFAULT_MAX_JOB_ATTEMPTS)) {
        await moveJobToDlq(this.client, msg.msgId, {
          ...envelope,
          dlqReason: err instanceof Error ? err.message : "JOB_FAILED",
          attempt,
        });
        await failIdempotency(this.client, scopeKey);
        this.stats.dlq += 1;
        return;
      }

      await failIdempotency(this.client, scopeKey);
      this.stats.failed += 1;
      const backoff = computeBackoffMs(attempt);
      console.log(
        JSON.stringify({
          ok: false,
          service: "impulsionando-worker",
          event: "job_retry_scheduled",
          jobId: envelope.jobId,
          attempt,
          backoffMs: backoff,
          at: new Date().toISOString(),
        }),
      );
    }
  }

  private async executeJob(envelope: JobEnvelope, scopeKey: string): Promise<void> {
    if (envelope.type === SMOKE_JOB_TYPE) {
      const inserted = await recordJobEffect(this.client, {
        scopeKey,
        tenantId: envelope.tenantId,
        effectType: SMOKE_JOB_TYPE,
        jobId: envelope.jobId,
      });
      console.log(
        JSON.stringify({
          ok: true,
          service: "impulsionando-worker",
          event: "smoke_echo",
          jobId: envelope.jobId,
          tenantId: envelope.tenantId,
          correlationId: envelope.correlationId,
          singleEffect: inserted,
          at: new Date().toISOString(),
        }),
      );
      return;
    }

    console.log(
      JSON.stringify({
        ok: true,
        service: "impulsionando-worker",
        event: "job_noop",
        type: envelope.type,
        jobId: envelope.jobId,
        at: new Date().toISOString(),
      }),
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
