import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseService } from "../supabase/supabase.service";
import { JobsService } from "./jobs.service";

const EnqueueJobBodySchema = z
  .object({
    type: z.string().min(1),
    tenantId: z.string().uuid(),
    payload: z.record(z.unknown()).optional(),
  })
  .strict();

@Controller("jobs")
export class JobsController {
  constructor(
    @Inject(JobsService) private readonly jobs: JobsService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  /** Phase 5B — publish durable job to reengineering_jobs queue. */
  @Post("enqueue")
  @HttpCode(202)
  @UseGuards(SupabaseAuthGuard)
  async enqueue(
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey?: string,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    if (!this.supabase.configured()) {
      throw new ServiceUnavailableException({
        error: { code: "SUPABASE_NOT_CONFIGURED", message: "Job publisher unavailable" },
      });
    }

    const parsed = EnqueueJobBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid job enqueue payload",
          details: parsed.error.flatten(),
          correlationId: correlationId || randomUUID(),
        },
      });
    }

    const corr = correlationId || randomUUID();
    const idem = idempotencyKey || randomUUID();

    try {
      const result = await this.jobs.enqueue({
        type: parsed.data.type,
        tenantId: parsed.data.tenantId,
        correlationId: corr,
        idempotencyKey: idem,
        payload: parsed.data.payload,
      });

      return {
        data: result,
        meta: { correlationId: corr, idempotencyKey: idem },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "JOB_ENQUEUE_FAILED";
      throw new ServiceUnavailableException({
        error: { code: "JOB_ENQUEUE_FAILED", message, correlationId: corr },
      });
    }
  }
}
