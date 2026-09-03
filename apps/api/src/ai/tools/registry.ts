import {
  AiToolIdSchema,
  AiToolJourneyGetInputSchema,
  AiToolSupportGetInputSchema,
  AiToolSupportListInputSchema,
  AiToolTenantActiveContextInputSchema,
  AiToolTenantResolveHostInputSchema,
  SupportTicketListQuerySchema,
  defaultAiToolAllowPolicy,
  isToolAllowed,
  type AiRiskClassName,
  type AiToolId,
  type AiToolMeta,
  type AiToolsEnvelope,
  AI_SCHEMA_VERSION,
} from "@impulsionando/contracts";
import type { AuthUser } from "../../auth/auth.types";
import type { SupportService } from "../../support/support.service";
import type { TenantsService } from "../../tenants/tenants.service";
import type { JourneysService } from "../../journeys/journeys.service";

export type AiToolServices = {
  support: SupportService;
  tenants: TenantsService;
  journeys: JourneysService;
};

export type AiToolExecResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      code:
        | "AI_TOOL_FORBIDDEN"
        | "AI_TOOL_UNKNOWN"
        | "AI_TOOL_VALIDATION"
        | "AI_KILL_SWITCH"
        | "AI_TOOL_EXEC_FAILED"
        | "AI_TOOL_UNAUTHORIZED";
      message: string;
    };

const TOOL_META: readonly AiToolMeta[] = [
  {
    id: "support.tickets.list",
    riskClass: "READ",
    description: "List support tickets visible to the actor",
    executable: true,
  },
  {
    id: "support.tickets.get",
    riskClass: "READ",
    description: "Get one support ticket with auth recheck",
    executable: true,
  },
  {
    id: "tenants.resolve_by_host",
    riskClass: "READ",
    description: "Resolve tenant context by hostname",
    executable: true,
  },
  {
    id: "tenants.resolve_active_context",
    riskClass: "READ",
    description: "Resolve active tenant context for actor + host",
    executable: true,
  },
  {
    id: "journeys.get_by_id",
    riskClass: "READ",
    description: "Get CRM journey by id with tenant membership recheck",
    executable: true,
  },
  {
    id: "effect.gated.noop",
    riskClass: "APPROVAL_REQUIRED",
    description:
      "Phase 6E gated noop — not executable via registry; requires /ai/effects approval",
    executable: false,
  },
  {
    id: "forbidden.arbitrary_sql",
    riskClass: "FORBIDDEN",
    description: "Arbitrary SQL — never registered as executable",
    executable: false,
  },
  {
    id: "forbidden.unrestricted_http",
    riskClass: "FORBIDDEN",
    description: "Unrestricted HTTP — never registered as executable",
    executable: false,
  },
  {
    id: "forbidden.service_role_expose",
    riskClass: "FORBIDDEN",
    description: "Service-role key exposure — never registered as executable",
    executable: false,
  },
] as const;

export function listRegisteredTools(scrapedAt = new Date().toISOString()): AiToolsEnvelope {
  return {
    schemaVersion: AI_SCHEMA_VERSION,
    scrapedAt,
    tools: [...TOOL_META],
  };
}

export function getToolMeta(toolId: string): AiToolMeta | undefined {
  return TOOL_META.find((t) => t.id === toolId);
}

/**
 * Execute a registered tool. Authorization is rechecked inside each READ handler.
 * FORBIDDEN / kill-switch / non-READ always denied at the registry gate.
 */
export async function executeAiTool(opts: {
  toolId: string;
  input: unknown;
  actor: AuthUser;
  correlationId: string;
  killSwitchEnabled: boolean;
  services: AiToolServices;
  /**
   * When true (chat path with tenantId), resolve_by_host also requires
   * actor membership on the resolved tenant — closes host-only gap.
   */
  requireMembershipOnHostResolve?: boolean;
}): Promise<AiToolExecResult> {
  const idParsed = AiToolIdSchema.safeParse(opts.toolId);
  if (!idParsed.success) {
    return { ok: false, code: "AI_TOOL_UNKNOWN", message: "Unknown tool id" };
  }
  const toolId: AiToolId = idParsed.data;
  const meta = getToolMeta(toolId);
  if (!meta) {
    return { ok: false, code: "AI_TOOL_UNKNOWN", message: "Tool not registered" };
  }

  const riskClass = meta.riskClass as AiRiskClassName;
  const allow = defaultAiToolAllowPolicy(opts.killSwitchEnabled);
  if (!isToolAllowed(riskClass, allow) || !meta.executable) {
    return {
      ok: false,
      code: opts.killSwitchEnabled ? "AI_KILL_SWITCH" : "AI_TOOL_FORBIDDEN",
      message: `Tool ${toolId} denied (riskClass=${riskClass})`,
    };
  }

  try {
    switch (toolId) {
      case "support.tickets.list": {
        const parsed = AiToolSupportListInputSchema.safeParse(opts.input ?? {});
        if (!parsed.success) {
          return { ok: false, code: "AI_TOOL_VALIDATION", message: "Invalid list input" };
        }
        const query = SupportTicketListQuerySchema.safeParse(parsed.data);
        if (!query.success) {
          return { ok: false, code: "AI_TOOL_VALIDATION", message: "Invalid list query" };
        }
        // Auth recheck inside SupportService.listTickets
        const data = await opts.services.support.listTickets(query.data, opts.actor);
        return { ok: true, data };
      }
      case "support.tickets.get": {
        const parsed = AiToolSupportGetInputSchema.safeParse(opts.input);
        if (!parsed.success) {
          return { ok: false, code: "AI_TOOL_VALIDATION", message: "Invalid get input" };
        }
        const data = await opts.services.support.getTicketById(parsed.data.ticketId, opts.actor, {
          correlationId: opts.correlationId,
        });
        return { ok: true, data };
      }
      case "tenants.resolve_by_host": {
        const parsed = AiToolTenantResolveHostInputSchema.safeParse(opts.input);
        if (!parsed.success) {
          return { ok: false, code: "AI_TOOL_VALIDATION", message: "Invalid host input" };
        }
        const tenant = await opts.services.tenants.resolveByHost(parsed.data.host);
        if (tenant && opts.requireMembershipOnHostResolve) {
          try {
            await opts.services.tenants.assertMembership(opts.actor.id, tenant.id);
          } catch {
            return {
              ok: false,
              code: "AI_TOOL_UNAUTHORIZED",
              message: "Actor is not a member of the resolved tenant",
            };
          }
        }
        return { ok: true, data: { tenant } };
      }
      case "tenants.resolve_active_context": {
        const parsed = AiToolTenantActiveContextInputSchema.safeParse(opts.input);
        if (!parsed.success) {
          return { ok: false, code: "AI_TOOL_VALIDATION", message: "Invalid host input" };
        }
        // Auth recheck: membership decision for this actor
        const ctx = await opts.services.tenants.resolveActiveContext(
          parsed.data.host,
          opts.actor.id,
        );
        return {
          ok: true,
          data: {
            tenant: ctx.tenant,
            decision: ctx.decision,
            // memberships roles only — no secrets
            membershipCount: ctx.memberships.length,
          },
        };
      }
      case "journeys.get_by_id": {
        const parsed = AiToolJourneyGetInputSchema.safeParse(opts.input);
        if (!parsed.success) {
          return { ok: false, code: "AI_TOOL_VALIDATION", message: "Invalid journey input" };
        }
        // Auth recheck inside JourneysService.getJourneyById (assertMembership)
        const data = await opts.services.journeys.getJourneyById(parsed.data.journeyId, {
          tenantId: parsed.data.tenantId,
          actor: opts.actor,
          correlationId: opts.correlationId,
        });
        return { ok: true, data };
      }
      default:
        return {
          ok: false,
          code: "AI_TOOL_FORBIDDEN",
          message: `Tool ${toolId} is not executable`,
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI_TOOL_EXEC_FAILED";
    return { ok: false, code: "AI_TOOL_EXEC_FAILED", message };
  }
}
