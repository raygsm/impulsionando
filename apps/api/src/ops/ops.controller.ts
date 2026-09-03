import {
  Controller,
  Get,
  Headers,
  Inject,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseService } from "../supabase/supabase.service";
import { OpsService } from "./ops.service";

@Controller("ops")
@UseGuards(SupabaseAuthGuard)
export class OpsController {
  constructor(
    @Inject(OpsService) private readonly ops: OpsService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  /**
   * Phase 5G — read-only queue metrics (service-role RPC).
   * Auth required. Response contains counts only — never secrets.
   */
  @Get("queue-metrics")
  async queueMetrics(@Headers("x-correlation-id") correlationId?: string) {
    if (!this.supabase.configured()) {
      throw new ServiceUnavailableException({
        error: { code: "SUPABASE_NOT_CONFIGURED", message: "Ops metrics unavailable" },
      });
    }

    const corr = correlationId?.trim() || randomUUID();

    try {
      const data = await this.ops.getQueueMetrics();
      return {
        data,
        meta: { correlationId: corr },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "OPS_QUEUE_METRICS_FAILED";
      throw new ServiceUnavailableException({
        error: { code: "OPS_QUEUE_METRICS_FAILED", message, correlationId: corr },
      });
    }
  }

  /**
   * Phase 5G — integration registry (static seed + env *names* only).
   * Auth required. No credential values in response.
   */
  @Get("integrations")
  integrations(@Headers("x-correlation-id") correlationId?: string) {
    const corr = correlationId?.trim() || randomUUID();
    const data = this.ops.getIntegrations();
    return {
      data,
      meta: { correlationId: corr },
    };
  }
}
