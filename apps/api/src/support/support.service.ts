import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  EventType,
  domainMutationToOutboxRow,
  type SupportTicketCreateBody,
  type SupportTicketListQuery,
  type SupportTicketStatus,
  type SupportTicketSummary,
  type SupportTicketUpdateStatusBody,
} from "@impulsionando/contracts";
import { randomUUID } from "node:crypto";
import { SupabaseService } from "../supabase/supabase.service";
import { OutboxService } from "../outbox/outbox.service";
import type { AuthUser } from "../auth/auth.types";
import {
  categoryToType,
  priorityFromDb,
  priorityToDb,
  statusFromDb,
  statusToDb,
} from "./support-schema.map";

type TicketRow = {
  id: string;
  ticket_code: string;
  company_id: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolution_due_at: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
    @Inject(OutboxService) private readonly outbox: OutboxService,
  ) {}

  private admin() {
    return this.supabase.admin();
  }

  async isStaff(userId: string): Promise<boolean> {
    const { data, error } = await this.admin().rpc("is_impulsionando_staff", {
      _user: userId,
    });
    if (error) return false;
    return Boolean(data);
  }

  /** Resolve platform company for public/API creates (company_id NOT NULL). */
  private async resolvePlatformCompanyId(): Promise<string> {
    const fromEnv = process.env.SUPPORT_PLATFORM_COMPANY_ID?.trim();
    if (fromEnv) return fromEnv;

    const { data, error } = await this.admin()
      .from("companies")
      .select("id")
      .eq("is_master", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `SUPPORT_COMPANY_RESOLVE_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }
    const id = (data as { id?: string } | null)?.id;
    if (!id) {
      throw new Error(
        "SUPPORT_COMPANY_MISSING: set SUPPORT_PLATFORM_COMPANY_ID or ensure a companies row with is_master=true",
      );
    }
    return id;
  }

  private mapSummary(row: TicketRow): SupportTicketSummary {
    return {
      id: row.id,
      protocol: row.ticket_code,
      companyId: row.company_id,
      subject: row.subject,
      type: categoryToType(row.category),
      priority: priorityFromDb(row.priority),
      status: statusFromDb(row.status),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      slaDueAt: row.resolution_due_at,
    };
  }

  async createTicket(
    body: SupportTicketCreateBody,
    opts: {
      idempotencyKey?: string;
      correlationId: string;
      actor?: AuthUser | null;
    },
  ) {
    const sb = this.admin();

    if (opts.idempotencyKey) {
      const { data: existing, error: idemErr } = await sb
        .from("support_tickets")
        .select("id, ticket_code, status")
        .filter("metadata->>idempotency_key", "eq", opts.idempotencyKey)
        .limit(1)
        .maybeSingle();
      if (idemErr) {
        throw new Error(
          `SUPPORT_IDEMPOTENCY_LOOKUP_FAILED:${idemErr.code || "unknown"}:${idemErr.message || ""}`,
        );
      }
      if (existing) {
        return {
          id: existing.id as string,
          protocol: existing.ticket_code as string,
          status: "new" as const,
          replay: true,
        };
      }
    }

    const companyId = await this.resolvePlatformCompanyId();
    const dbPriority = priorityToDb(body.priority);
    const category = body.type ?? "other";
    const sourceChannel = body.source ?? "api";
    // Explicit ticket_code avoids DEFAULT nextval('support_ticket_seq') when the
    // API role lacks USAGE on that sequence (staging restore residual).
    const ticketCode = `IMP-P3-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

    const metadata: Record<string, unknown> = {
      requester_name: body.requester?.name ?? null,
      requester_email: body.requester?.email ?? null,
      requester_phone: body.requester?.phone ?? null,
      phone: body.requester?.phone ?? null,
      page: body.page ?? null,
      source: body.source ?? "api.v1.support",
      correlation_id: opts.correlationId,
      pilot: "phase3",
      ticket_code_source: "api_explicit",
    };
    if (opts.idempotencyKey) metadata.idempotency_key = opts.idempotencyKey;

    const insert = {
      company_id: companyId,
      category,
      priority: dbPriority,
      status: "open" as const,
      subject: body.subject,
      description: body.description,
      source_channel: sourceChannel,
      requester_user_id: opts.actor?.id ?? null,
      ticket_code: ticketCode,
      metadata,
    };

    const eventId = randomUUID();
    const outboxRow = domainMutationToOutboxRow({
      eventId,
      type: EventType.SupportTicketCreated,
      tenantId: companyId,
      correlationId: opts.correlationId,
      payload: {
        ticketId: null,
        protocol: ticketCode,
        subject: body.subject,
        source: body.source ?? "api.v1.support",
      },
      actor: opts.actor?.id
        ? { actorType: "user", actorId: opts.actor.id }
        : { actorType: "anonymous" },
      idempotencyKey: opts.idempotencyKey,
      source: "support",
    });

    // Prefer true transactional RPC (ticket + outbox + audit event).
    const { data: txData, error: txError } = await sb.rpc(
      "create_support_ticket_with_outbox",
      {
        p_ticket: insert,
        p_outbox_envelope: outboxRow.envelope,
      },
    );

    if (!txError && txData) {
      const row = txData as {
        id: string;
        ticket_code: string;
        status?: string;
        eventId?: string;
      };
      return {
        id: row.id,
        protocol: row.ticket_code,
        status: "new" as const,
        replay: false,
      };
    }

    // Fallback when Phase 5C migration not applied: sequential ticket write + best-effort outbox.
    // Atomicity of ticket+outbox is UNKNOWN in this path.
    this.logger.warn(
      `SUPPORT_OUTBOX_TX_UNAVAILABLE:${txError?.code || "unknown"} — sequential create (atomicity UNKNOWN)`,
    );

    const { data, error } = await sb
      .from("support_tickets")
      .insert(insert)
      .select("id, ticket_code, status")
      .single();

    if (error || !data) {
      throw new Error(
        `SUPPORT_INSERT_FAILED:${error?.code || "unknown"}:${error?.message || ""}:${error?.details || ""}:${error?.hint || ""}`,
      );
    }

    await sb.from("support_ticket_events").insert({
      ticket_id: data.id,
      event_type: "support.ticket.created",
      actor_user_id: opts.actor?.id ?? null,
      from_value: null,
      to_value: "new",
      metadata: {
        schemaVersion: 1,
        eventId,
        correlationId: opts.correlationId,
        action: "support.ticket.created",
        source: body.source ?? "api.v1.support",
      },
    });

    try {
      await this.outbox.writeEnvelope({
        ...outboxRow.envelope,
        payload: {
          ...outboxRow.envelope.payload,
          ticketId: data.id as string,
          protocol: data.ticket_code as string,
        },
      });
    } catch (outboxErr) {
      this.logger.warn(
        `SUPPORT_OUTBOX_WRITE_FAILED:${outboxErr instanceof Error ? outboxErr.message : String(outboxErr)}`,
      );
    }

    return {
      id: data.id as string,
      protocol: data.ticket_code as string,
      status: "new" as const,
      replay: false,
    };
  }

  async listTickets(query: SupportTicketListQuery, actor: AuthUser) {
    const sb = this.admin();
    const staff = await this.isStaff(actor.id);
    const limit = Math.min(query.limit ?? 50, 100);

    let q = sb
      .from("support_tickets")
      .select(
        "id, ticket_code, company_id, subject, category, priority, status, created_at, updated_at, resolution_due_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (query.status) q = q.eq("status", statusToDb(query.status));
    if (query.priority) q = q.eq("priority", priorityToDb(query.priority));

    if (query.cursor) {
      // cursor = created_at ISO of last row (opaque string)
      q = q.lt("created_at", query.cursor);
    }

    if (!staff) {
      let companyId: string | null = null;
      const { data: prof, error: profErr } = await sb
        .from("user_profiles")
        .select("company_id")
        .eq("user_id", actor.id)
        .maybeSingle();
      if (profErr) {
        // Staging restore may lack user_profiles row — fall back to user_roles
        const { data: roleRow, error: roleErr } = await sb
          .from("user_roles")
          .select("company_id")
          .eq("user_id", actor.id)
          .limit(1)
          .maybeSingle();
        if (!roleErr) {
          companyId = (roleRow as { company_id?: string | null } | null)?.company_id ?? null;
        }
      } else {
        companyId = (prof as { company_id?: string | null } | null)?.company_id ?? null;
      }
      if (companyId) {
        q = q.or(`company_id.eq.${companyId},requester_user_id.eq.${actor.id}`);
      } else {
        q = q.eq("requester_user_id", actor.id);
      }
    }

    const { data, error } = await q;
    if (error) {
      throw new Error(
        `SUPPORT_LIST_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }

    const rows = (data ?? []) as TicketRow[];
    const page = rows.slice(0, limit);
    const nextCursor =
      rows.length > limit ? page[page.length - 1]?.created_at ?? null : null;

    return {
      tickets: page.map((r) => this.mapSummary(r)),
      nextCursor,
      limit,
    };
  }

  /**
   * Phase 6B READ tool — get single ticket with the same auth boundary as listTickets.
   */
  async getTicketById(
    ticketId: string,
    actor: AuthUser,
    opts?: { correlationId?: string },
  ): Promise<SupportTicketSummary> {
    const sb = this.admin();
    const staff = await this.isStaff(actor.id);
    const corr = opts?.correlationId ?? randomUUID();

    const { data, error } = await sb
      .from("support_tickets")
      .select(
        "id, ticket_code, company_id, subject, category, priority, status, created_at, updated_at, resolution_due_at, requester_user_id",
      )
      .eq("id", ticketId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `SUPPORT_GET_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }
    if (!data) {
      throw new NotFoundException({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
          correlationId: corr,
        },
      });
    }

    const row = data as TicketRow & { requester_user_id?: string | null };

    if (!staff) {
      let companyId: string | null = null;
      const { data: prof } = await sb
        .from("user_profiles")
        .select("company_id")
        .eq("user_id", actor.id)
        .maybeSingle();
      companyId = (prof as { company_id?: string | null } | null)?.company_id ?? null;
      if (!companyId) {
        const { data: roleRow } = await sb
          .from("user_roles")
          .select("company_id")
          .eq("user_id", actor.id)
          .limit(1)
          .maybeSingle();
        companyId = (roleRow as { company_id?: string | null } | null)?.company_id ?? null;
      }

      const allowed =
        row.requester_user_id === actor.id ||
        (companyId !== null && row.company_id === companyId);
      if (!allowed) {
        throw new ForbiddenException({
          error: {
            code: "FORBIDDEN",
            message: "Ticket not visible to actor",
            correlationId: corr,
          },
        });
      }
    }

    return this.mapSummary(row);
  }

  async updateStatus(
    ticketId: string,
    body: SupportTicketUpdateStatusBody,
    opts: { correlationId: string; actor: AuthUser; idempotencyKey?: string },
  ) {
    const sb = this.admin();
    const staff = await this.isStaff(opts.actor.id);
    if (!staff) {
      throw new ForbiddenException({
        error: {
          code: "FORBIDDEN",
          message: "support.ticket.update_status requires platform staff",
          correlationId: opts.correlationId,
        },
      });
    }

    const { data: current, error: readErr } = await sb
      .from("support_tickets")
      .select("id, status, updated_at, metadata")
      .eq("id", ticketId)
      .maybeSingle();

    if (readErr) {
      throw new Error(
        `SUPPORT_READ_FAILED:${readErr.code || "unknown"}:${readErr.message || ""}`,
      );
    }
    if (!current) {
      throw new NotFoundException({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
          correlationId: opts.correlationId,
        },
      });
    }

    const fromStatusContract = statusFromDb(current.status as string);
    if (fromStatusContract === body.status) {
      return {
        id: current.id as string,
        status: body.status,
        updatedAt: current.updated_at as string,
      };
    }

    const dbStatus = statusToDb(body.status);
    const now = new Date().toISOString();

    const meta = {
      ...((current.metadata as Record<string, unknown>) || {}),
      last_status_reason: body.reason ?? null,
      last_correlation_id: opts.correlationId,
      last_contract_status: body.status,
      ...(opts.idempotencyKey
        ? { last_idempotency_key: opts.idempotencyKey }
        : {}),
    };

    const patch: Record<string, unknown> = {
      status: dbStatus,
      metadata: meta,
      updated_at: now,
    };
    if (dbStatus === "resolved") {
      patch.resolved_at = now;
    }
    if (dbStatus === "closed") {
      patch.closed_at = now;
    }
    if (dbStatus === "reopened" || dbStatus === "open" || dbStatus === "waiting_customer" || dbStatus === "waiting_internal") {
      if (dbStatus === "reopened" || dbStatus === "open") {
        patch.resolved_at = null;
        patch.closed_at = null;
      }
    }

    const { data: updated, error } = await sb
      .from("support_tickets")
      .update(patch)
      .eq("id", ticketId)
      .select("id, status, updated_at")
      .single();

    if (error || !updated) {
      throw new Error(
        `SUPPORT_UPDATE_FAILED:${error?.code || "unknown"}:${error?.message || ""}:${error?.details || ""}`,
      );
    }

    await sb.from("support_ticket_events").insert({
      ticket_id: ticketId,
      event_type: "support.ticket.status_changed",
      actor_user_id: opts.actor.id,
      from_value: fromStatusContract,
      to_value: body.status,
      metadata: {
        schemaVersion: 1,
        eventId: randomUUID(),
        correlationId: opts.correlationId,
        action: "support.ticket.status_changed",
        reason: body.reason ?? null,
        dbStatus,
      },
    });

    return {
      id: updated.id as string,
      status: body.status,
      updatedAt: updated.updated_at as string,
    };
  }
}
