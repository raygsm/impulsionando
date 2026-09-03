import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  AI_EFFECT_ENV_NAMES,
  AI_EFFECT_EXECUTE_JOB_TYPE,
  AI_SCHEMA_VERSION,
  AiEffectApprovalCreateBodySchema,
  AiEffectApprovalDecisionBodySchema,
  AiEffectApprovalRequestSchema,
  AiEffectExecuteJobPayloadSchema,
  aiEffectIdempotencyScopeKey,
  assertNoSecretFields,
  canTransitionApprovalStatus,
  isAiEffectsEnqueueEnabled,
  isApprovalExpired,
  parseApprovalTtlSeconds,
  type AiEffectApprovalCreateBody,
  type AiEffectApprovalDecisionBody,
  type AiEffectApprovalRequest,
  type AiEffectExecutionRecord,
} from "@impulsionando/contracts";
import type { AuthUser } from "../auth/auth.types";
import { JobsService } from "../jobs/jobs.service";
import { SupportService } from "../support/support.service";
import { TenantsService, TenantAccessDeniedError } from "../tenants/tenants.service";

const STORE_MAX = 500;

/**
 * Phase 6E — approval-gated effects.
 * In-memory audit store (staging scaffold). No autonomous writes:
 * approve only enqueues `ai.effect.execute` (or records QUEUE_STUB).
 *
 * Create requires tenant membership. Decide uses Support staff check.
 * Staging note: without staff membership, decide returns 403.
 */
@Injectable()
export class AiEffectsService {
  private readonly byId = new Map<string, AiEffectApprovalRequest>();
  private readonly byScope = new Map<string, string>();

  constructor(
    @Inject(JobsService) private readonly jobs: JobsService,
    @Inject(SupportService) private readonly support: SupportService,
    @Inject(TenantsService) private readonly tenants: TenantsService,
  ) {}

  async createRequest(opts: {
    body: AiEffectApprovalCreateBody;
    actor: AuthUser;
    correlationId: string;
  }): Promise<AiEffectApprovalRequest> {
    const parsed = AiEffectApprovalCreateBodySchema.safeParse(opts.body);
    if (!parsed.success) {
      throw new ForbiddenException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid approval request body",
          correlationId: opts.correlationId,
        },
      });
    }

    try {
      await this.tenants.assertMembership(opts.actor.id, parsed.data.tenantId);
    } catch (err) {
      if (err instanceof TenantAccessDeniedError) {
        throw new ForbiddenException({
          error: {
            code: err.code,
            message:
              err.code === "NO_MEMBERSHIP"
                ? "User has no tenant memberships"
                : "User is not a member of this tenant",
            correlationId: opts.correlationId,
          },
        });
      }
      throw err;
    }

    const scope = aiEffectIdempotencyScopeKey({
      tenantId: parsed.data.tenantId,
      toolId: parsed.data.toolId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    const existingId = this.byScope.get(scope);
    if (existingId) {
      const existing = this.byId.get(existingId);
      if (existing) {
        return this.materialize(existing);
      }
    }

    const now = new Date();
    const ttlSec = parseApprovalTtlSeconds(
      process.env[AI_EFFECT_ENV_NAMES.APPROVAL_TTL_SECONDS],
    );
    const expiresAt = new Date(now.getTime() + ttlSec * 1000).toISOString();
    const row: AiEffectApprovalRequest = {
      schemaVersion: AI_SCHEMA_VERSION,
      id: randomUUID(),
      status: "pending",
      riskClass: "APPROVAL_REQUIRED",
      toolId: parsed.data.toolId,
      tenantId: parsed.data.tenantId,
      actorUserId: opts.actor.id,
      idempotencyKey: parsed.data.idempotencyKey,
      input: parsed.data.input ?? {},
      correlationId: opts.correlationId,
      reason: parsed.data.reason ?? null,
      createdAt: now.toISOString(),
      expiresAt,
      decision: null,
      execution: null,
      effectEnvNames: [
        AI_EFFECT_ENV_NAMES.EFFECTS_ENABLED,
        AI_EFFECT_ENV_NAMES.APPROVAL_TTL_SECONDS,
      ],
    };

    const validated = AiEffectApprovalRequestSchema.parse(row);
    assertNoSecretFields(validated);
    this.remember(validated);
    return validated;
  }

  getRequestAuthorized(
    id: string,
    actor: AuthUser,
  ): Promise<AiEffectApprovalRequest> {
    return this.resolveAuthorized(id, actor);
  }

  private async resolveAuthorized(
    id: string,
    actor: AuthUser,
  ): Promise<AiEffectApprovalRequest> {
    const row = this.byId.get(id);
    if (!row) {
      throw new NotFoundException({
        error: { code: "AI_EFFECT_NOT_FOUND", message: "Approval request not found" },
      });
    }
    if (row.actorUserId === actor.id) {
      return this.materialize(row);
    }
    const staff = await this.support.isStaff(actor.id);
    if (!staff) {
      throw new ForbiddenException({
        error: {
          code: "AI_EFFECT_FORBIDDEN",
          message: "Actor or platform staff required to read approval",
        },
      });
    }
    return this.materialize(row);
  }

  async decide(opts: {
    id: string;
    body: AiEffectApprovalDecisionBody;
    actor: AuthUser;
    correlationId: string;
  }): Promise<AiEffectApprovalRequest> {
    const parsed = AiEffectApprovalDecisionBodySchema.safeParse(opts.body);
    if (!parsed.success) {
      throw new ForbiddenException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid decision body",
          correlationId: opts.correlationId,
        },
      });
    }

    const staff = await this.support.isStaff(opts.actor.id);
    if (!staff) {
      throw new ForbiddenException({
        error: {
          code: "AI_EFFECT_STAFF_REQUIRED",
          message:
            "Approval decide requires platform staff (is_impulsionando_staff). Staging: grant staff before smoke.",
          correlationId: opts.correlationId,
        },
      });
    }

    const row = this.byId.get(opts.id);
    if (!row) {
      throw new NotFoundException({
        error: {
          code: "AI_EFFECT_NOT_FOUND",
          message: "Approval request not found",
          correlationId: opts.correlationId,
        },
      });
    }

    const current = this.materialize(row);
    if (current.status === "expired") {
      throw new ForbiddenException({
        error: {
          code: "AI_EFFECT_EXPIRED",
          message: "Approval request expired",
          correlationId: opts.correlationId,
        },
      });
    }
    if (current.status !== "pending") {
      throw new ForbiddenException({
        error: {
          code: "AI_EFFECT_NOT_PENDING",
          message: `Cannot decide request in status=${current.status}`,
          correlationId: opts.correlationId,
        },
      });
    }

    const decidedAt = new Date().toISOString();
    const nextStatus = parsed.data.decision === "approve" ? "approved" : "rejected";
    if (!canTransitionApprovalStatus("pending", nextStatus)) {
      throw new ForbiddenException({
        error: {
          code: "AI_EFFECT_INVALID_TRANSITION",
          message: `Invalid transition pending → ${nextStatus}`,
          correlationId: opts.correlationId,
        },
      });
    }

    let updated: AiEffectApprovalRequest = {
      ...current,
      status: nextStatus,
      decision: {
        decision: parsed.data.decision,
        decidedAt,
        decidedByUserId: opts.actor.id,
        reason: parsed.data.reason ?? null,
      },
    };

    if (parsed.data.decision === "approve") {
      updated = await this.tryEnqueueExecute(updated, opts.actor, opts.correlationId);
    }

    const validated = AiEffectApprovalRequestSchema.parse(updated);
    assertNoSecretFields(validated);
    this.remember(validated);
    return validated;
  }

  /** Test helper — do not expose via HTTP. */
  snapshotCount(): number {
    return this.byId.size;
  }

  private async tryEnqueueExecute(
    request: AiEffectApprovalRequest,
    decider: AuthUser,
    correlationId: string,
  ): Promise<AiEffectApprovalRequest> {
    if (!isAiEffectsEnqueueEnabled(process.env[AI_EFFECT_ENV_NAMES.EFFECTS_ENABLED])) {
      return {
        ...request,
        status: "approved",
        execution: stubExecution("EFFECTS_DISABLED"),
      };
    }

    const payloadParsed = AiEffectExecuteJobPayloadSchema.safeParse({
      approvalRequestId: request.id,
      toolId: request.toolId,
      riskClass: "APPROVAL_REQUIRED",
      actorUserId: request.actorUserId,
      decidedByUserId: decider.id,
      input: request.input,
    });
    if (!payloadParsed.success) {
      return {
        ...request,
        status: "approved",
        execution: stubExecution("QUEUE_STUB"),
      };
    }

    try {
      const enqueued = await this.jobs.enqueue({
        type: AI_EFFECT_EXECUTE_JOB_TYPE,
        tenantId: request.tenantId,
        correlationId,
        idempotencyKey: `ai-effect:${request.id}`,
        payload: payloadParsed.data,
      });
      const execution: AiEffectExecutionRecord = {
        executed: true,
        reason: "ENQUEUED",
        jobId: enqueued.jobId,
        jobType: AI_EFFECT_EXECUTE_JOB_TYPE,
        enqueuedAt: enqueued.enqueuedAt,
      };
      return {
        ...request,
        status: "executed",
        execution,
      };
    } catch (err) {
      // Prefer soft QUEUE_STUB over breaking approve when queue unavailable.
      void err;
      return {
        ...request,
        status: "approved",
        execution: stubExecution("QUEUE_STUB"),
      };
    }
  }

  private materialize(row: AiEffectApprovalRequest): AiEffectApprovalRequest {
    if (isApprovalExpired(row) && row.status === "pending") {
      const expired: AiEffectApprovalRequest = { ...row, status: "expired" };
      this.remember(expired);
      return expired;
    }
    return row;
  }

  private remember(row: AiEffectApprovalRequest): void {
    this.byId.set(row.id, row);
    const scope = aiEffectIdempotencyScopeKey({
      tenantId: row.tenantId,
      toolId: row.toolId,
      idempotencyKey: row.idempotencyKey,
    });
    this.byScope.set(scope, row.id);
    while (this.byId.size > STORE_MAX) {
      const first = this.byId.keys().next().value as string | undefined;
      if (!first) break;
      const old = this.byId.get(first);
      this.byId.delete(first);
      if (old) {
        const s = aiEffectIdempotencyScopeKey({
          tenantId: old.tenantId,
          toolId: old.toolId,
          idempotencyKey: old.idempotencyKey,
        });
        if (this.byScope.get(s) === first) this.byScope.delete(s);
      }
    }
  }
}

function stubExecution(
  reason: "QUEUE_STUB" | "EFFECTS_DISABLED",
): AiEffectExecutionRecord {
  return {
    executed: false,
    reason,
    jobId: null,
    jobType: null,
    enqueuedAt: null,
  };
}

/** Guard helper when Supabase is missing. */
export function assertEffectsSupabaseConfigured(configured: boolean): void {
  if (!configured) {
    throw new ServiceUnavailableException({
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "AI effects unavailable" },
    });
  }
}
