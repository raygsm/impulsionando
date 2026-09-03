import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  AiEffectApprovalCreateBodySchema,
  AiEffectApprovalDecisionBodySchema,
  assertNoSecretFields,
} from "@impulsionando/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseService } from "../supabase/supabase.service";
import type { AuthedRequest } from "../auth/auth.types";
import {
  AiEffectsService,
  assertEffectsSupabaseConfigured,
} from "./ai-effects.service";

/**
 * Phase 6E — gated effects routes under /api/v1/ai/effects.
 * Auth required. Create has no side effect; decide may enqueue Phase 5 job.
 */
@Controller("ai/effects")
@UseGuards(SupabaseAuthGuard)
export class AiEffectsController {
  constructor(
    @Inject(AiEffectsService) private readonly effects: AiEffectsService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  @Post("requests")
  async createRequest(
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    assertEffectsSupabaseConfigured(this.supabase.configured());
    const corr = correlationId?.trim() || randomUUID();
    if (!req.user) {
      throw new ForbiddenException({
        error: { code: "UNAUTHENTICATED", message: "Actor required", correlationId: corr },
      });
    }
    const parsed = AiEffectApprovalCreateBodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new ForbiddenException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid approval request body",
          correlationId: corr,
        },
      });
    }
    const data = await this.effects.createRequest({
      body: parsed.data,
      actor: req.user,
      correlationId: corr,
    });
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }

  @Get("requests/:id")
  async getRequest(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    assertEffectsSupabaseConfigured(this.supabase.configured());
    const corr = correlationId?.trim() || randomUUID();
    if (!req.user) {
      throw new ForbiddenException({
        error: { code: "UNAUTHENTICATED", message: "Actor required", correlationId: corr },
      });
    }
    const data = await this.effects.getRequestAuthorized(id, req.user);
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }

  @Post("requests/:id/decide")
  async decide(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    assertEffectsSupabaseConfigured(this.supabase.configured());
    const corr = correlationId?.trim() || randomUUID();
    if (!req.user) {
      throw new ForbiddenException({
        error: { code: "UNAUTHENTICATED", message: "Actor required", correlationId: corr },
      });
    }
    const parsed = AiEffectApprovalDecisionBodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new ForbiddenException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid decision body",
          correlationId: corr,
        },
      });
    }
    const data = await this.effects.decide({
      id,
      body: parsed.data,
      actor: req.user,
      correlationId: corr,
    });
    assertNoSecretFields(data);
    return { data, meta: { correlationId: corr } };
  }
}
