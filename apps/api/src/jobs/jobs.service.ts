import { Inject, Injectable } from "@nestjs/common";
import {
  JobEnvelopeSchema,
  REENGINEERING_JOBS_QUEUE,
  idempotencyScopeKey,
  type JobEnvelope,
} from "@impulsionando/contracts";
import { randomUUID } from "node:crypto";
import { SupabaseService } from "../supabase/supabase.service";

export type EnqueueJobInput = {
  type: string;
  tenantId: string;
  correlationId: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
};

export type EnqueueJobResult = {
  jobId: string;
  queue: typeof REENGINEERING_JOBS_QUEUE;
  scopeKey: string;
  enqueuedAt: string;
};

@Injectable()
export class JobsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async enqueue(input: EnqueueJobInput): Promise<EnqueueJobResult> {
    const enqueuedAt = new Date().toISOString();
    const jobId = randomUUID();
    const envelope: JobEnvelope = {
      jobId,
      type: input.type,
      schemaVersion: 1,
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      enqueuedAt,
      payload: input.payload,
    };

    const parsed = JobEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      throw new Error("JOB_ENVELOPE_INVALID");
    }

    const { data, error } = await this.supabase
      .admin()
      .rpc("enqueue_reengineering_job", { payload: parsed.data });

    if (error) throw error;

    return {
      jobId,
      queue: REENGINEERING_JOBS_QUEUE,
      scopeKey: idempotencyScopeKey({
        tenantId: input.tenantId,
        jobType: input.type,
        idempotencyKey: input.idempotencyKey,
      }),
      enqueuedAt,
    };
  }
}
