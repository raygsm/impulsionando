import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { resolveFlagValue } from "@impulsionando/contracts";
import { TenantResolveQuerySchema } from "@impulsionando/tenant-context";
import { randomUUID } from "node:crypto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import type { AuthedRequest } from "../auth/auth.types";
import { TenantEntitlementsService } from "./tenant-entitlements.service";
import { TenantAccessDeniedError, TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(
    @Inject(TenantsService) private readonly tenants: TenantsService,
    @Inject(TenantEntitlementsService) private readonly entitlements: TenantEntitlementsService,
  ) {}

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

  /** Phase 4B — host ∩ membership → active tenant context (authenticated). */
  @Get("context")
  @UseGuards(SupabaseAuthGuard)
  async context(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthedRequest,
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

    const { tenant, decision } = await this.tenants
      .resolveActiveContext(parsed.data.host, req.user!.id)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.startsWith("TENANT_MEMBERSHIP_LOAD_FAILED:")) {
          throw new ServiceUnavailableException({
            error: {
              code: "TENANT_MEMBERSHIP_UNAVAILABLE",
              message: "user_roles lookup failed on staging",
              detail: msg.slice("TENANT_MEMBERSHIP_LOAD_FAILED:".length),
              correlationId: corr,
            },
          });
        }
        throw e;
      });

    if (!decision.ok) {
      throw new ForbiddenException({
        error: {
          code: decision.code,
          message:
            decision.code === "TENANT_NOT_FOUND"
              ? "Hostname did not resolve to an active tenant"
              : decision.code === "NO_MEMBERSHIP"
                ? "User has no tenant memberships"
                : "User is not a member of the resolved tenant",
          correlationId: corr,
        },
      });
    }

    return {
      data: {
        host: parsed.data.host,
        tenant,
        membership: decision.membership,
      },
      meta: { correlationId: corr },
    };
  }

  /** Phase 4B — typed tenant configuration (authenticated + membership). */
  @Get(":tenantId/config")
  @UseGuards(SupabaseAuthGuard)
  async config(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Req() req: AuthedRequest,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    const corr = correlationId || randomUUID();
    await this.requireTenantMembership(req.user!.id, tenantId, corr);

    const config = await this.entitlements.getConfig(tenantId).catch((e: unknown) => {
      this.rethrowEntitlementsUnavailable(e, corr);
    });
    if (!config) {
      throw new NotFoundException({
        error: { code: "NOT_FOUND", message: "Tenant not found", correlationId: corr },
      });
    }

    return { data: config, meta: { correlationId: corr } };
  }

  /** Phase 4B — plans/modules/flags entitlements (authenticated + membership). */
  @Get(":tenantId/entitlements")
  @UseGuards(SupabaseAuthGuard)
  async entitlementsForTenant(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Req() req: AuthedRequest,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    const corr = correlationId || randomUUID();
    await this.requireTenantMembership(req.user!.id, tenantId, corr);

    const entitlements = await this.entitlements.getEntitlements(tenantId).catch((e: unknown) => {
      this.rethrowEntitlementsUnavailable(e, corr);
    });
    if (!entitlements) {
      throw new NotFoundException({
        error: { code: "NOT_FOUND", message: "Tenant not found", correlationId: corr },
      });
    }

    return { data: entitlements, meta: { correlationId: corr } };
  }

  /** Phase 4B-1 — read alias inventory for a tenant (authenticated + membership). */
  @Get(":tenantId/aliases")
  @UseGuards(SupabaseAuthGuard)
  async aliases(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Req() req: AuthedRequest,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    const corr = correlationId || randomUUID();
    await this.requireTenantMembership(req.user!.id, tenantId, corr);

    const rows = await this.tenants.listAliases(tenantId).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("TENANT_ALIASES_LOAD_FAILED:")) {
        throw new ServiceUnavailableException({
          error: {
            code: "TENANT_ALIASES_UNAVAILABLE",
            message: "Tenant alias lookup failed on staging",
            detail: msg.slice("TENANT_ALIASES_LOAD_FAILED:".length),
            correlationId: corr,
          },
        });
      }
      throw e;
    });

    return { data: rows, meta: { correlationId: corr } };
  }

  /** Phase 4B — single flag check with default-deny for unknown keys. */
  @Get(":tenantId/flags/:flagKey")
  @UseGuards(SupabaseAuthGuard)
  async flag(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("flagKey") flagKey: string,
    @Req() req: AuthedRequest,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    const corr = correlationId || randomUUID();
    await this.requireTenantMembership(req.user!.id, tenantId, corr);

    const entitlements = await this.entitlements.getEntitlements(tenantId).catch((e: unknown) => {
      this.rethrowEntitlementsUnavailable(e, corr);
    });
    if (!entitlements) {
      throw new NotFoundException({
        error: { code: "NOT_FOUND", message: "Tenant not found", correlationId: corr },
      });
    }

    const value = resolveFlagValue(entitlements.flags, flagKey);
    return {
      data: { key: flagKey, value, known: Object.prototype.hasOwnProperty.call(entitlements.flags, flagKey) },
      meta: { correlationId: corr },
    };
  }

  private async requireTenantMembership(userId: string, tenantId: string, correlationId: string) {
    try {
      await this.tenants.assertMembership(userId, tenantId);
    } catch (e) {
      if (e instanceof TenantAccessDeniedError) {
        throw new ForbiddenException({
          error: {
            code: e.code,
            message:
              e.code === "NO_MEMBERSHIP"
                ? "User has no tenant memberships"
                : "User is not a member of this tenant",
            correlationId,
          },
        });
      }
      throw e;
    }
  }

  private rethrowEntitlementsUnavailable(e: unknown, correlationId: string): never {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("_LOAD_FAILED:")) {
      throw new ServiceUnavailableException({
        error: {
          code: "TENANT_ENTITLEMENTS_UNAVAILABLE",
          message: "Tenant config/entitlements lookup failed on staging",
          detail: msg,
          correlationId,
        },
      });
    }
    throw e;
  }
}
