import {
  BadRequestException,
  ConflictException,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  WEBHOOK_IDEMPOTENCY_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "@impulsionando/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { WebhooksService } from "./webhooks.service";

type RawBodyRequest = {
  body?: unknown;
  rawBody?: string | Buffer;
};

@Controller("webhooks")
export class WebhooksController {
  constructor(
    @Inject(WebhooksService) private readonly webhooks: WebhooksService,
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  /**
   * Phase 5D — secure webhook ingress (staging-oriented).
   * Fast 202 ack; durable audit via RPC. No outbound provider calls.
   */
  @Post(":provider")
  @HttpCode(202)
  async ingest(
    @Param("provider") provider: string,
    @Req() req: RawBodyRequest,
    @Headers(WEBHOOK_SIGNATURE_HEADER) signatureHeader?: string,
    @Headers(WEBHOOK_TIMESTAMP_HEADER) timestampHeader?: string,
    @Headers(WEBHOOK_IDEMPOTENCY_HEADER) idempotencyKey?: string,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    if (!this.supabase.configured()) {
      throw new ServiceUnavailableException({
        error: { code: "SUPABASE_NOT_CONFIGURED", message: "Webhook ingress unavailable" },
      });
    }

    const rawBody = resolveRawBody(req);
    const parsedBody = req.body ?? {};

    try {
      const result = await this.webhooks.ingest({
        provider,
        rawBody,
        parsedBody,
        signatureHeader,
        timestampHeader,
        idempotencyKey,
        correlationId,
      });

      if (result.status === "rejected") {
        const error = {
          error: {
            code: result.reason,
            message: `Webhook rejected: ${result.reason}`,
            correlationId: result.correlationId,
          },
        };
        if (result.httpHint === 401) throw new UnauthorizedException(error);
        if (result.httpHint === 409) throw new ConflictException(error);
        throw new BadRequestException(error);
      }

      return {
        data: {
          accepted: true,
          ingressId: result.ingressId,
          payloadSha256: result.payloadSha256,
        },
        meta: {
          correlationId: result.correlationId,
          idempotencyKey: result.idempotencyKey,
        },
      };
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof ConflictException ||
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      const message = err instanceof Error ? err.message : "WEBHOOK_INGEST_FAILED";
      throw new ServiceUnavailableException({
        error: { code: "WEBHOOK_INGEST_FAILED", message, correlationId: correlationId || null },
      });
    }
  }
}

function resolveRawBody(req: RawBodyRequest): string {
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody.toString("utf8");
  // Fallback: stable stringify of already-parsed body (smoke / contract path).
  try {
    return JSON.stringify(req.body ?? {});
  } catch {
    return "";
  }
}
