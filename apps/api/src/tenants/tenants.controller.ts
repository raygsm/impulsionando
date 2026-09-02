import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Inject,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { TenantResolveQuerySchema } from "@impulsionando/tenant-context";
import { randomUUID } from "node:crypto";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(@Inject(TenantsService) private readonly tenants: TenantsService) {}

  /** Phase 4 seed — canonical hostname → tenant branding context (read-only). */
  @Get("resolve")
  async resolve(
    @Query() query: Record<string, string | undefined>,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    const corr = correlationId || randomUUID();
    const parsed = TenantResolveQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "host query param required",
          details: parsed.error.flatten(),
          correlationId: corr,
        },
      });
    }

    const tenant = await this.tenants.resolveByHost(parsed.data.host).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "TENANT_RESOLVE_RPC_MISSING") {
        throw new ServiceUnavailableException({
          error: {
            code: "TENANT_RESOLVE_UNAVAILABLE",
            message:
              "resolve_tenant_by_host RPC not present on staging — apply migration before use",
            correlationId: corr,
          },
        });
      }
      if (msg.startsWith("TENANT_RESOLVE_FAILED:")) {
        throw new ServiceUnavailableException({
          error: {
            code: "TENANT_RESOLVE_UNAVAILABLE",
            message:
              "resolve_tenant_by_host failed on staging — apply scripts/staging/phase4-resolve-tenant-rpc.sql",
            detail: msg.slice("TENANT_RESOLVE_FAILED:".length),
            correlationId: corr,
          },
        });
      }
      throw e;
    });
    return {
      data: tenant,
      meta: { correlationId: corr },
    };
  }
}
