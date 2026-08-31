import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { SupportTicketCreateBodySchema } from "@impulsionando/contracts";
import { SupportService } from "./support.service";
import { randomUUID } from "node:crypto";

@Controller("support/tickets")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  /** Use case: support.ticket.create — public create (tenant attribution server-side later). */
  @Post()
  async create(
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey?: string,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    const parsed = SupportTicketCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid support ticket payload",
          details: parsed.error.flatten(),
        },
      });
    }

    const corr = correlationId || randomUUID();
    try {
      const ticket = await this.support.createTicket(parsed.data, {
        idempotencyKey,
        correlationId: corr,
      });
      return {
        ok: true,
        data: ticket,
        meta: { correlationId: corr },
      };
    } catch (e: any) {
      if (e?.message === "SUPABASE_NOT_CONFIGURED") {
        throw new ServiceUnavailableException({
          ok: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "SUPABASE_URL / SERVICE_ROLE not configured for api",
          },
          meta: { correlationId: corr },
        });
      }
      throw e;
    }
  }
}
