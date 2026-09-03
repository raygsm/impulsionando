import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AiChatRequestBodySchema, assertNoSecretFields } from "@impulsionando/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseService } from "../supabase/supabase.service";
import type { AuthedRequest } from "../auth/auth.types";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(
    @Inject(AiService) private readonly ai: AiService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  @Get("capabilities")
  capabilities(@Headers("x-correlation-id") correlationId?: string) {
    this.assertSupabase();
    const corr = correlationId?.trim() || randomUUID();
    const data = this.ai.getCapabilities();
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }

  @Get("policy")
  policy(@Headers("x-correlation-id") correlationId?: string) {
    this.assertSupabase();
    const corr = correlationId?.trim() || randomUUID();
    const data = this.ai.getPolicy();
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }

  @Get("tools")
  tools(@Headers("x-correlation-id") correlationId?: string) {
    this.assertSupabase();
    const corr = correlationId?.trim() || randomUUID();
    const data = this.ai.getTools();
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }

  /**
   * Phase 6F — in-memory AI telemetry metrics (auth required).
   * Retention is ring-buffer only; canaryStatus remains UNKNOWN.
   */
  @Get("metrics")
  metrics(@Headers("x-correlation-id") correlationId?: string) {
    this.assertSupabase();
    const corr = correlationId?.trim() || randomUUID();
    const data = this.ai.getMetrics();
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }

  /**
   * Phase 6C — deterministic READ pilot chat.
   * 200 on grounded answer or structured refuse body; 503 kill switch; 403 when chat disabled.
   */
  @Post("chat")
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    this.assertSupabase();
    const corr = correlationId?.trim() || randomUUID();

    const parsed = AiChatRequestBodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new ForbiddenException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid chat payload",
          correlationId: corr,
        },
      });
    }

    if (!req.user) {
      throw new ForbiddenException({
        error: { code: "UNAUTHENTICATED", message: "Actor required", correlationId: corr },
      });
    }

    const reply = await this.ai.runChat({
      actor: req.user,
      body: parsed.data,
      correlationId: corr,
    });
    assertNoSecretFields(reply);

    if (reply.refused && reply.code === "AI_KILL_SWITCH") {
      throw new ServiceUnavailableException({
        error: {
          code: reply.code,
          message: reply.message,
          correlationId: corr,
        },
        data: reply,
      });
    }

    if (reply.refused && reply.code === "AI_CHAT_NOT_ENABLED") {
      throw new ForbiddenException({
        error: {
          code: reply.code,
          message: reply.message,
          correlationId: corr,
        },
        data: reply,
      });
    }

    // Ambiguous / fact unavailable / unauthorized → 200 with refused:true (pilot contract)
    return { data: reply, meta: { correlationId: corr } };
  }

  private assertSupabase() {
    if (!this.supabase.configured()) {
      throw new ServiceUnavailableException({
        error: { code: "SUPABASE_NOT_CONFIGURED", message: "AI gateway unavailable" },
      });
    }
  }
}
