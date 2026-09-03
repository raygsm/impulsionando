import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateInviteBodySchema,
  EventType,
  JOURNEY_DEFAULT_REMINDER_KEYS,
  JOURNEY_ENV_NAMES,
  JOURNEY_SCHEMA_VERSION,
  InviteV1Schema,
  JourneyStateV1Schema,
  RecordFirstLoginBodySchema,
  RecordInviteClickBodySchema,
  applyInviteClick,
  applyJourneyTransition,
  cancelIncompatibleReminders,
  domainMutationToOutboxRow,
  evaluateInviteAction,
  isJourneyRecipientAllowlisted,
  parseJourneyRecipientAllowlist,
  type CreateInviteBody,
  type InviteV1,
  type JourneyStateV1,
  type RecordFirstLoginBody,
  type RecordInviteClickBody,
} from "@impulsionando/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { OutboxService } from "../outbox/outbox.service";
import { TenantsService, TenantAccessDeniedError } from "../tenants/tenants.service";
import type { AuthUser } from "../auth/auth.types";

type InviteRow = {
  id: string;
  tenant_id: string;
  journey_id: string;
  correlation_id: string;
  recipient_address: string;
  token_hash: string;
  status: string;
  expires_at: string;
  revoked_at: string | null;
  clicked_at: string | null;
  redeemed_at: string | null;
  channel: string;
  created_at: string;
  schema_version: number;
};

type JourneyRow = {
  id: string;
  tenant_id: string;
  correlation_id: string;
  contact_ref: string;
  status: string;
  invite_id: string | null;
  active_reminder_keys: string[] | null;
  cancelled_reminder_keys: string[] | null;
  support_context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  schema_version: number;
};

@Injectable()
export class JourneysService {
  private readonly logger = new Logger(JourneysService.name);

  constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
    @Inject(OutboxService) private readonly outbox: OutboxService,
    @Inject(TenantsService) private readonly tenants: TenantsService,
  ) {}

  private admin() {
    return this.supabase.admin();
  }

  private recipientAllowlist(): string[] {
    return parseJourneyRecipientAllowlist(process.env[JOURNEY_ENV_NAMES.RECIPIENT_ALLOWLIST]);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }

  private mapInvite(row: InviteRow): InviteV1 {
    return InviteV1Schema.parse({
      inviteId: row.id,
      schemaVersion: JOURNEY_SCHEMA_VERSION,
      tenantId: row.tenant_id,
      journeyId: row.journey_id,
      correlationId: row.correlation_id,
      recipientAddress: row.recipient_address,
      tokenHash: row.token_hash,
      status: row.status,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      clickedAt: row.clicked_at,
      redeemedAt: row.redeemed_at,
      createdAt: row.created_at,
      channel: row.channel,
    });
  }

  private mapJourney(row: JourneyRow): JourneyStateV1 {
    return JourneyStateV1Schema.parse({
      journeyId: row.id,
      schemaVersion: JOURNEY_SCHEMA_VERSION,
      tenantId: row.tenant_id,
      correlationId: row.correlation_id,
      contactRef: row.contact_ref,
      status: row.status,
      inviteId: row.invite_id,
      activeReminderKeys: row.active_reminder_keys ?? [],
      cancelledReminderKeys: row.cancelled_reminder_keys ?? [],
      supportContext: row.support_context,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async createInvite(
    body: CreateInviteBody,
    opts: { correlationId: string; actor?: AuthUser | null; idempotencyKey?: string },
  ): Promise<{
    journey: JourneyStateV1;
    invite: InviteV1;
    /** Opaque token returned once — never logged. */
    token: string;
    eventId: string;
    mode: "rpc" | "sequential_fallback";
  }> {
    const parsed = CreateInviteBodySchema.parse(body);
    if (!isJourneyRecipientAllowlisted(parsed.recipientAddress, this.recipientAllowlist())) {
      throw new ForbiddenException({
        error: {
          code: "ALLOWLIST_DENIED",
          message: "Recipient not on JOURNEY_RECIPIENT_ALLOWLIST (default deny)",
          correlationId: opts.correlationId,
        },
      });
    }

    const journeyId = randomUUID();
    const inviteId = randomUUID();
    const eventId = randomUUID();
    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const nowIso = new Date().toISOString();
    const expiresAt =
      parsed.expiresAt ??
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const reminderKeys = parsed.reminderKeys ?? [...JOURNEY_DEFAULT_REMINDER_KEYS];
    const channel = parsed.channel === "sink" || process.env[JOURNEY_ENV_NAMES.SINK] !== "false"
      ? "sink"
      : parsed.channel;

    const outboxRow = domainMutationToOutboxRow({
      eventId,
      type: EventType.InviteCreated,
      tenantId: parsed.tenantId,
      correlationId: opts.correlationId,
      occurredAt: nowIso,
      payload: {
        inviteId,
        journeyId,
        contactRef: parsed.contactRef,
        channel,
        expiresAt,
      },
      actor: opts.actor
        ? { actorType: "user", actorId: opts.actor.id }
        : { actorType: "service", actorId: "api.v1.journeys" },
      idempotencyKey: opts.idempotencyKey,
      source: "api.v1.journeys",
    });

    const journeyPayload = {
      id: journeyId,
      tenant_id: parsed.tenantId,
      correlation_id: opts.correlationId,
      contact_ref: parsed.contactRef,
      status: "invite_created",
      invite_id: inviteId,
      active_reminder_keys: reminderKeys,
      cancelled_reminder_keys: [] as string[],
      support_context: null,
      schema_version: JOURNEY_SCHEMA_VERSION,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const invitePayload = {
      id: inviteId,
      tenant_id: parsed.tenantId,
      journey_id: journeyId,
      correlation_id: opts.correlationId,
      recipient_address: parsed.recipientAddress.trim().toLowerCase(),
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
      revoked_at: null,
      clicked_at: null,
      redeemed_at: null,
      channel,
      schema_version: JOURNEY_SCHEMA_VERSION,
      created_at: nowIso,
    };

    const { data: rpcData, error: rpcError } = await this.admin().rpc(
      "create_crm_invite_with_outbox",
      {
        p_journey: journeyPayload,
        p_invite: invitePayload,
        p_outbox_envelope: outboxRow.envelope,
      },
    );

    if (!rpcError && rpcData) {
      const row = rpcData as { journeyId: string; inviteId: string; eventId: string };
      return {
        journey: this.mapJourney({ ...journeyPayload, id: row.journeyId } as JourneyRow),
        invite: this.mapInvite({ ...invitePayload, id: row.inviteId } as InviteRow),
        token,
        eventId: row.eventId,
        mode: "rpc",
      };
    }

    // Fallback when Phase 5F migration not applied — sequential inserts; atomicity UNKNOWN.
    this.logger.warn(
      `JOURNEY_CREATE_RPC_UNAVAILABLE:${rpcError?.code || "unknown"} — sequential create (atomicity UNKNOWN)`,
    );

    const { error: jErr } = await this.admin()
      .from("reengineering_crm_journey")
      .insert(journeyPayload);
    if (jErr) {
      throw new Error(`JOURNEY_INSERT_FAILED:${jErr.code || "unknown"}:${jErr.message || ""}`);
    }

    const { error: iErr } = await this.admin()
      .from("reengineering_crm_invite")
      .insert(invitePayload);
    if (iErr) {
      throw new Error(`INVITE_INSERT_FAILED:${iErr.code || "unknown"}:${iErr.message || ""}`);
    }

    let writtenEventId = eventId;
    try {
      const out = await this.outbox.writeEnvelope(outboxRow.envelope);
      writtenEventId = out.eventId;
    } catch (e) {
      this.logger.warn(
        `JOURNEY_OUTBOX_FALLBACK_FAILED:${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Sink-only dispatch signal — never real email/WhatsApp from this skeleton.
    const afterDispatch = applyJourneyTransition(
      this.mapJourney(journeyPayload as JourneyRow),
      "invite.dispatched",
      { nowIso },
    );

    return {
      journey: afterDispatch,
      invite: this.mapInvite(invitePayload as InviteRow),
      token,
      eventId: writtenEventId,
      mode: "sequential_fallback",
    };
  }

  async recordClick(
    inviteId: string,
    body: RecordInviteClickBody,
    opts: { correlationId: string },
  ): Promise<{
    invite: InviteV1;
    journey: JourneyStateV1;
    effect: "applied" | "noop";
    eventId: string | null;
    mode: "rpc" | "sequential_fallback" | "noop";
  }> {
    const parsed = RecordInviteClickBodySchema.parse(body);
    const tokenHash = this.hashToken(parsed.token);

    const { data: inviteRow, error } = await this.admin()
      .from("reengineering_crm_invite")
      .select("*")
      .eq("id", inviteId)
      .maybeSingle();

    if (error) {
      throw new Error(`INVITE_LOOKUP_FAILED:${error.code || "unknown"}:${error.message || ""}`);
    }
    if (!inviteRow) {
      throw new NotFoundException({
        error: { code: "NOT_FOUND", message: "Invite not found", correlationId: opts.correlationId },
      });
    }

    const invite = this.mapInvite(inviteRow as InviteRow);
    if (invite.tokenHash !== tokenHash) {
      throw new ForbiddenException({
        error: {
          code: "TOKEN_MISMATCH",
          message: "Invite token mismatch",
          correlationId: opts.correlationId,
        },
      });
    }

    const click = applyInviteClick(invite);
    if (click.effect === "denied") {
      throw new ForbiddenException({
        error: {
          code: click.reason,
          message: `Invite action denied: ${click.reason}`,
          correlationId: opts.correlationId,
        },
      });
    }

    if (click.effect === "noop") {
      const { data: journeyRow } = await this.admin()
        .from("reengineering_crm_journey")
        .select("*")
        .eq("id", invite.journeyId)
        .maybeSingle();
      return {
        invite,
        journey: journeyRow
          ? this.mapJourney(journeyRow as JourneyRow)
          : JourneyStateV1Schema.parse({
              journeyId: invite.journeyId,
              schemaVersion: JOURNEY_SCHEMA_VERSION,
              tenantId: invite.tenantId,
              correlationId: invite.correlationId,
              contactRef: "unknown",
              status: "link_clicked",
              inviteId: invite.inviteId,
              activeReminderKeys: [],
              cancelledReminderKeys: [],
              createdAt: invite.createdAt,
              updatedAt: invite.createdAt,
            }),
        effect: "noop",
        eventId: null,
        mode: "noop",
      };
    }

    const eventId = randomUUID();
    const nowIso = new Date().toISOString();
    const outboxRow = domainMutationToOutboxRow({
      eventId,
      type: EventType.InviteLinkClicked,
      tenantId: invite.tenantId,
      correlationId: opts.correlationId,
      occurredAt: nowIso,
      payload: { inviteId: invite.inviteId, journeyId: invite.journeyId },
      source: "api.v1.journeys",
      idempotencyKey: `click:${invite.inviteId}`,
    });

    const { data: rpcData, error: rpcError } = await this.admin().rpc(
      "record_crm_invite_click_with_outbox",
      {
        p_invite_id: invite.inviteId,
        p_clicked_at: nowIso,
        p_outbox_envelope: outboxRow.envelope,
      },
    );

    if (!rpcError && rpcData) {
      const result = rpcData as {
        invite: InviteRow;
        journey: JourneyRow;
        eventId: string;
        effect: string;
      };
      return {
        invite: this.mapInvite(result.invite),
        journey: this.mapJourney(result.journey),
        effect: result.effect === "noop" ? "noop" : "applied",
        eventId: result.eventId,
        mode: "rpc",
      };
    }

    this.logger.warn(
      `JOURNEY_CLICK_RPC_UNAVAILABLE:${rpcError?.code || "unknown"} — sequential update (atomicity UNKNOWN)`,
    );

    await this.admin()
      .from("reengineering_crm_invite")
      .update({ status: "clicked", clicked_at: nowIso })
      .eq("id", invite.inviteId)
      .eq("status", "pending");

    const { data: journeyRow } = await this.admin()
      .from("reengineering_crm_journey")
      .select("*")
      .eq("id", invite.journeyId)
      .maybeSingle();

    let journey = journeyRow
      ? applyJourneyTransition(this.mapJourney(journeyRow as JourneyRow), "invite.link_clicked", {
          nowIso,
        })
      : null;

    if (journey) {
      await this.admin()
        .from("reengineering_crm_journey")
        .update({ status: journey.status, updated_at: nowIso })
        .eq("id", journey.journeyId);
    }

    try {
      await this.outbox.writeEnvelope(outboxRow.envelope);
    } catch (e) {
      this.logger.warn(
        `JOURNEY_CLICK_OUTBOX_FAILED:${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return {
      invite: { ...invite, status: "clicked", clickedAt: nowIso },
      journey:
        journey ??
        JourneyStateV1Schema.parse({
          journeyId: invite.journeyId,
          schemaVersion: JOURNEY_SCHEMA_VERSION,
          tenantId: invite.tenantId,
          correlationId: invite.correlationId,
          contactRef: "unknown",
          status: "link_clicked",
          inviteId: invite.inviteId,
          activeReminderKeys: [],
          cancelledReminderKeys: [],
          createdAt: invite.createdAt,
          updatedAt: nowIso,
        }),
      effect: "applied",
      eventId,
      mode: "sequential_fallback",
    };
  }

  async recordFirstLogin(
    inviteId: string,
    body: RecordFirstLoginBody,
    opts: { correlationId: string; actor?: AuthUser | null },
  ): Promise<{
    invite: InviteV1;
    journey: JourneyStateV1;
    newlyCancelled: string[];
    eventId: string;
    mode: "rpc" | "sequential_fallback";
  }> {
    RecordFirstLoginBodySchema.parse(body);

    const { data: inviteRow, error } = await this.admin()
      .from("reengineering_crm_invite")
      .select("*")
      .eq("id", inviteId)
      .maybeSingle();

    if (error) {
      throw new Error(`INVITE_LOOKUP_FAILED:${error.code || "unknown"}:${error.message || ""}`);
    }
    if (!inviteRow) {
      throw new NotFoundException({
        error: { code: "NOT_FOUND", message: "Invite not found", correlationId: opts.correlationId },
      });
    }

    const invite = this.mapInvite(inviteRow as InviteRow);
    if (body.token) {
      const tokenHash = this.hashToken(body.token);
      if (invite.tokenHash !== tokenHash) {
        throw new ForbiddenException({
          error: {
            code: "TOKEN_MISMATCH",
            message: "Invite token mismatch",
            correlationId: opts.correlationId,
          },
        });
      }
    }

    const decision = evaluateInviteAction(invite);
    // Redeemed is ok for idempotent first-login replay; expired/revoked still deny.
    if (!decision.allow && decision.reason !== "REDEEMED") {
      throw new ForbiddenException({
        error: {
          code: decision.reason,
          message: `Invite action denied: ${decision.reason}`,
          correlationId: opts.correlationId,
        },
      });
    }

    const { data: journeyRow } = await this.admin()
      .from("reengineering_crm_journey")
      .select("*")
      .eq("id", invite.journeyId)
      .maybeSingle();

    if (!journeyRow) {
      throw new NotFoundException({
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
          correlationId: opts.correlationId,
        },
      });
    }

    const journey = this.mapJourney(journeyRow as JourneyRow);
    const nowIso = new Date().toISOString();
    const cancelled = cancelIncompatibleReminders({
      activeReminderKeys: journey.activeReminderKeys,
      cancelledReminderKeys: journey.cancelledReminderKeys,
      trigger: "account.first_login",
    });
    const nextJourney = applyJourneyTransition(journey, "account.first_login", { nowIso });
    const eventId = randomUUID();

    const outboxRow = domainMutationToOutboxRow({
      eventId,
      type: EventType.AccountFirstLogin,
      tenantId: invite.tenantId,
      correlationId: opts.correlationId,
      occurredAt: nowIso,
      payload: {
        inviteId: invite.inviteId,
        journeyId: journey.journeyId,
        newlyCancelled: cancelled.newlyCancelled,
        userId: body.userId ?? opts.actor?.id ?? null,
      },
      source: "api.v1.journeys",
      idempotencyKey: `first-login:${invite.inviteId}`,
    });

    const { data: rpcData, error: rpcError } = await this.admin().rpc(
      "record_crm_first_login_with_outbox",
      {
        p_invite_id: invite.inviteId,
        p_redeemed_at: nowIso,
        p_active_reminder_keys: nextJourney.activeReminderKeys,
        p_cancelled_reminder_keys: nextJourney.cancelledReminderKeys,
        p_outbox_envelope: outboxRow.envelope,
      },
    );

    if (!rpcError && rpcData) {
      const result = rpcData as {
        invite: InviteRow;
        journey: JourneyRow;
        eventId: string;
        newlyCancelled: string[];
      };
      return {
        invite: this.mapInvite(result.invite),
        journey: this.mapJourney(result.journey),
        newlyCancelled: result.newlyCancelled ?? cancelled.newlyCancelled,
        eventId: result.eventId,
        mode: "rpc",
      };
    }

    this.logger.warn(
      `JOURNEY_FIRST_LOGIN_RPC_UNAVAILABLE:${rpcError?.code || "unknown"} — sequential update (atomicity UNKNOWN)`,
    );

    await this.admin()
      .from("reengineering_crm_invite")
      .update({ status: "redeemed", redeemed_at: nowIso })
      .eq("id", invite.inviteId);

    await this.admin()
      .from("reengineering_crm_journey")
      .update({
        status: nextJourney.status,
        active_reminder_keys: nextJourney.activeReminderKeys,
        cancelled_reminder_keys: nextJourney.cancelledReminderKeys,
        updated_at: nowIso,
      })
      .eq("id", journey.journeyId);

    try {
      await this.outbox.writeEnvelope(outboxRow.envelope);
    } catch (e) {
      this.logger.warn(
        `JOURNEY_FIRST_LOGIN_OUTBOX_FAILED:${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return {
      invite: { ...invite, status: "redeemed", redeemedAt: nowIso },
      journey: nextJourney,
      newlyCancelled: cancelled.newlyCancelled,
      eventId,
      mode: "sequential_fallback",
    };
  }

  /**
   * Phase 6B READ — get journey by id with tenant membership recheck.
   * Never returns invite token hashes to AI callers (strip via JourneyStateV1 only).
   */
  async getJourneyById(
    journeyId: string,
    opts: { tenantId: string; actor: AuthUser; correlationId: string },
  ): Promise<JourneyStateV1> {
    try {
      await this.tenants.assertMembership(opts.actor.id, opts.tenantId);
    } catch (e) {
      if (e instanceof TenantAccessDeniedError) {
        throw new ForbiddenException({
          error: {
            code: "FORBIDDEN",
            message: "Actor is not a member of tenant",
            correlationId: opts.correlationId,
          },
        });
      }
      throw e;
    }

    const { data: journeyRow, error } = await this.admin()
      .from("reengineering_crm_journey")
      .select("*")
      .eq("id", journeyId)
      .eq("tenant_id", opts.tenantId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `JOURNEY_GET_FAILED:${error.code || "unknown"}:${error.message || ""}`,
      );
    }
    if (!journeyRow) {
      throw new NotFoundException({
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
          correlationId: opts.correlationId,
        },
      });
    }

    return this.mapJourney(journeyRow as JourneyRow);
  }

  /** Support handoff — attach authorized context without n8n owning CRM state. */
  async attachSupportHandoff(
    journeyId: string,
    input: { ticketId?: string; correlationId: string; authorizedScopes?: string[] },
  ): Promise<JourneyStateV1> {
    const { data: journeyRow, error } = await this.admin()
      .from("reengineering_crm_journey")
      .select("*")
      .eq("id", journeyId)
      .maybeSingle();

    if (error || !journeyRow) {
      throw new NotFoundException({
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
          correlationId: input.correlationId,
        },
      });
    }

    const journey = this.mapJourney(journeyRow as JourneyRow);
    const supportContext = {
      ticketId: input.ticketId,
      correlationId: input.correlationId,
      authorizedScopes: input.authorizedScopes ?? ["support.read", "journey.read"],
      handoffAt: new Date().toISOString(),
    };
    const next = applyJourneyTransition(journey, "support.ticket.created", {
      supportContext,
    });

    await this.admin()
      .from("reengineering_crm_journey")
      .update({
        support_context: supportContext,
        updated_at: next.updatedAt,
      })
      .eq("id", journeyId);

    return next;
  }
}
