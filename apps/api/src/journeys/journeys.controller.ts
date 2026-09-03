import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import {
  CreateInviteBodySchema,
  RecordFirstLoginBodySchema,
  RecordInviteClickBodySchema,
} from "@impulsionando/contracts";
import { randomUUID } from "node:crypto";
import { JourneysService } from "./journeys.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseService } from "../supabase/supabase.service";
import type { AuthedRequest } from "../auth/auth.types";

@Controller("journeys")
export class JourneysController {
  constructor(
    @Inject(JourneysService) private readonly journeys: JourneysService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  /**
   * Phase 5F — create expiring/revocable CRM invite for allowlisted synthetic recipients.
   * Auth required. Never sends real email/WhatsApp from this skeleton (sink default).
   */
  @Post("invites")
  @HttpCode(201)
  @UseGuards(SupabaseAuthGuard)
  async createInvite(
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    this.assertSupabase();
    const corr = correlationId || randomUUID();
    const parsed = CreateInviteBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid invite payload",
          details: parsed.error.flatten(),
          correlationId: corr,
        },
      });
    }

    const result = await this.journeys.createInvite(parsed.data, {
      correlationId: corr,
      actor: req.user ?? null,
      idempotencyKey,
    });

    return {
      data: {
        journeyId: result.journey.journeyId,
        inviteId: result.invite.inviteId,
        status: result.invite.status,
        journeyStatus: result.journey.status,
        expiresAt: result.invite.expiresAt,
        channel: result.invite.channel,
        /** Opaque token — returned once; never logged by service. */
        token: result.token,
        eventId: result.eventId,
        writeMode: result.mode,
      },
      meta: { correlationId: corr },
    };
  }

  /**
   * Record invite link click → CRM journey state update + invite.link_clicked outbox event.
   * Public to the invite token holder (no staff auth); token is the capability.
   */
  @Post("invites/:inviteId/click")
  @HttpCode(200)
  async recordClick(
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
  ) {
    this.assertSupabase();
    const corr = correlationId || randomUUID();
    const parsed = RecordInviteClickBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid click payload",
          details: parsed.error.flatten(),
          correlationId: corr,
        },
      });
    }

    const result = await this.journeys.recordClick(inviteId, parsed.data, {
      correlationId: corr,
    });

    return {
      data: {
        inviteId: result.invite.inviteId,
        inviteStatus: result.invite.status,
        journeyStatus: result.journey.status,
        effect: result.effect,
        eventId: result.eventId,
        writeMode: result.mode,
      },
      meta: { correlationId: corr },
    };
  }

  /**
   * First login / redeeming action — cancels incompatible reminders; emits account.first_login.
   */
  @Post("invites/:inviteId/first-login")
  @HttpCode(200)
  async recordFirstLogin(
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
    @Body() body: unknown,
    @Headers("authorization") authorization: string | undefined,
    @Headers("x-correlation-id") correlationId: string | undefined,
  ) {
    this.assertSupabase();
    const corr = correlationId || randomUUID();
    const parsed = RecordFirstLoginBodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid first-login payload",
          details: parsed.error.flatten(),
          correlationId: corr,
        },
      });
    }

    let actor = null;
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice("Bearer ".length).trim();
      try {
        const { data } = await this.supabase.admin().auth.getUser(token);
        if (data.user) {
          actor = { id: data.user.id, email: data.user.email ?? null };
        }
      } catch {
        actor = null;
      }
    }

    const result = await this.journeys.recordFirstLogin(inviteId, parsed.data, {
      correlationId: corr,
      actor,
    });

    return {
      data: {
        inviteId: result.invite.inviteId,
        inviteStatus: result.invite.status,
        journeyStatus: result.journey.status,
        newlyCancelled: result.newlyCancelled,
        activeReminderKeys: result.journey.activeReminderKeys,
        cancelledReminderKeys: result.journey.cancelledReminderKeys,
        eventId: result.eventId,
        writeMode: result.mode,
      },
      meta: { correlationId: corr },
    };
  }

  private assertSupabase() {
    if (!this.supabase.configured()) {
      throw new ServiceUnavailableException({
        error: {
          code: "SUPABASE_NOT_CONFIGURED",
          message: "Journey API unavailable",
        },
      });
    }
  }
}
