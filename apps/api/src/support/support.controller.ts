import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import {
  SupportTicketCreateBodySchema,
  SupportTicketListQuerySchema,
  SupportTicketUpdateStatusBodySchema,
} from "@impulsionando/contracts";
import { randomUUID } from "node:crypto";
import { SupportService } from "./support.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SupabaseService } from "../supabase/supabase.service";
import type { AuthUser, AuthedRequest } from "../auth/auth.types";

@Controller("support/tickets")
export class SupportController {
  constructor(
    @Inject(SupportService) private readonly support: SupportService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  /** Use case: support.ticket.create — public create (AuthZ does not trust client company_id). */
  @Post()
  @HttpCode(201)
  async create(
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey?: string,
    @Headers("x-correlation-id") correlationId?: string,
    @Headers("authorization") authorization?: string,
  ) {
    const parsed = SupportTicketCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid support ticket payload",
          details: parsed.error.flatten(),
          correlationId: correlationId || randomUUID(),
        },
      });
    }

    const corr = correlationId || randomUUID();
    let actor: AuthUser | null = null;
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

    try {
      const ticket = await this.support.createTicket(parsed.data, {
        idempotencyKey,
        correlationId: corr,
        actor,
      });
      return {
        data: {
          id: ticket.id,
          protocol: ticket.protocol,
          status: ticket.status,
        },
        meta: {
          correlationId: corr,
          ...(ticket.replay ? { idempotencyReplay: true } : {}),
        },
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "SUPABASE_NOT_CONFIGURED") {
        throw new ServiceUnavailableException({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "SUPABASE_URL / SERVICE_ROLE not configured for api",
            correlationId: corr,
          },
        });
      }
      throw e;
    }
  }

  /** Use case: support.ticket.list */
  @Get()
  @UseGuards(SupabaseAuthGuard)
  async list(
    @Query() query: Record<string, string | undefined>,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    const parsed = SupportTicketListQuerySchema.safeParse(query);
    const corr = correlationId || randomUUID();
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid list query",
          details: parsed.error.flatten(),
          correlationId: corr,
        },
      });
    }
    if (!req.user) {
      throw new BadRequestException({
        error: { code: "UNAUTHENTICATED", message: "Missing user", correlationId: corr },
      });
    }

    const result = await this.support.listTickets(parsed.data, req.user);
    return {
      data: result.tickets,
      meta: {
        correlationId: corr,
        nextCursor: result.nextCursor,
        limit: result.limit,
      },
    };
  }

  /** Use case: support.ticket.update-status — staff only */
  @Patch(":ticketId/status")
  @UseGuards(SupabaseAuthGuard)
  async updateStatus(
    @Param("ticketId", ParseUUIDPipe) ticketId: string,
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    const corr = correlationId || randomUUID();
    const parsed = SupportTicketUpdateStatusBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid status payload",
          details: parsed.error.flatten(),
          correlationId: corr,
        },
      });
    }
    if (!req.user) {
      throw new BadRequestException({
        error: { code: "UNAUTHENTICATED", message: "Missing user", correlationId: corr },
      });
    }

    const data = await this.support.updateStatus(ticketId, parsed.data, {
      correlationId: corr,
      actor: req.user,
      idempotencyKey,
    });
    return { data, meta: { correlationId: corr } };
  }
}
