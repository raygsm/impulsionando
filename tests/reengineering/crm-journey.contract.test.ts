import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  CreateInviteBodySchema,
  EventType,
  InviteV1Schema,
  JOURNEY_DEFAULT_REMINDER_KEYS,
  JOURNEY_ENV_NAMES,
  JOURNEY_INCOMPATIBLE_ON_FIRST_LOGIN,
  JOURNEY_SCHEMA_VERSION,
  JourneyStateV1Schema,
  applyInviteClick,
  applyJourneyTransition,
  cancelIncompatibleReminders,
  domainMutationToOutboxRow,
  evaluateInviteAction,
  isInviteExpired,
  isInviteRevoked,
  isJourneyRecipientAllowlisted,
  parseJourneyRecipientAllowlist,
  type InviteV1,
  type JourneyStateV1,
} from "@impulsionando/contracts";

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const JOURNEY_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function hash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function baseInvite(overrides: Partial<InviteV1> = {}): InviteV1 {
  const now = Date.now();
  return InviteV1Schema.parse({
    inviteId: INVITE_ID,
    schemaVersion: JOURNEY_SCHEMA_VERSION,
    tenantId: TENANT_ID,
    journeyId: JOURNEY_ID,
    correlationId: "corr-journey-1",
    recipientAddress: "synthetic+phase5f@example.test",
    tokenHash: hash("phase5f-synthetic-token"),
    status: "pending",
    expiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
    revokedAt: null,
    clickedAt: null,
    redeemedAt: null,
    createdAt: new Date(now).toISOString(),
    channel: "sink",
    ...overrides,
  });
}

function baseJourney(overrides: Partial<JourneyStateV1> = {}): JourneyStateV1 {
  const now = new Date().toISOString();
  return JourneyStateV1Schema.parse({
    journeyId: JOURNEY_ID,
    schemaVersion: JOURNEY_SCHEMA_VERSION,
    tenantId: TENANT_ID,
    correlationId: "corr-journey-1",
    contactRef: "synthetic-contact-1",
    status: "selected",
    inviteId: INVITE_ID,
    activeReminderKeys: [...JOURNEY_DEFAULT_REMINDER_KEYS],
    cancelledReminderKeys: [],
    supportContext: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe("Phase 5F — CRM invitation journey contract", () => {
  it("CJ-01: happy path state machine invite → click → first login", () => {
    let state = baseJourney();
    state = applyJourneyTransition(state, "invite.created");
    expect(state.status).toBe("invite_created");

    state = applyJourneyTransition(state, "invite.dispatched");
    expect(state.status).toBe("dispatched");

    state = applyJourneyTransition(state, "invite.link_clicked");
    expect(state.status).toBe("link_clicked");

    state = applyJourneyTransition(state, "account.first_login");
    expect(state.status).toBe("first_login");
    expect(state.activeReminderKeys).toEqual([]);
    expect(state.cancelledReminderKeys).toEqual(
      expect.arrayContaining([...JOURNEY_INCOMPATIBLE_ON_FIRST_LOGIN]),
    );

    const invite = baseInvite({ status: "dispatched" });
    const click = applyInviteClick(invite);
    expect(click.effect).toBe("applied");
    expect(click.invite.status).toBe("clicked");

    const outbox = domainMutationToOutboxRow({
      eventId: randomUUID(),
      type: EventType.InviteCreated,
      tenantId: TENANT_ID,
      correlationId: "corr-journey-1",
      payload: { inviteId: INVITE_ID, journeyId: JOURNEY_ID },
    });
    expect(outbox.eventType).toBe("invite.created");
    expect(outbox.status).toBe("pending");
  });

  it("CJ-02: expired invite deny", () => {
    const invite = baseInvite({
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(isInviteExpired(invite)).toBe(true);
    expect(evaluateInviteAction(invite)).toEqual({ allow: false, reason: "EXPIRED" });
    expect(applyInviteClick(invite).effect).toBe("denied");
  });

  it("CJ-03: revoked invite deny", () => {
    const invite = baseInvite({
      status: "revoked",
      revokedAt: new Date().toISOString(),
    });
    expect(isInviteRevoked(invite)).toBe(true);
    expect(evaluateInviteAction(invite)).toEqual({ allow: false, reason: "REVOKED" });
  });

  it("CJ-04: duplicate click single-effect", () => {
    const pending = baseInvite({ status: "pending" });
    const first = applyInviteClick(pending);
    expect(first.effect).toBe("applied");
    const second = applyInviteClick(first.invite);
    expect(second.effect).toBe("noop");
    expect(second.invite.status).toBe("clicked");
  });

  it("CJ-05: first-login cancels incompatible reminders", () => {
    const result = cancelIncompatibleReminders({
      activeReminderKeys: [...JOURNEY_DEFAULT_REMINDER_KEYS, "nurture.keep"],
      cancelledReminderKeys: [],
      trigger: "account.first_login",
    });
    expect(result.newlyCancelled).toEqual(
      expect.arrayContaining([...JOURNEY_INCOMPATIBLE_ON_FIRST_LOGIN]),
    );
    expect(result.activeReminderKeys).toEqual(["nurture.keep"]);
    expect(result.cancelledReminderKeys).toEqual(
      expect.arrayContaining([...JOURNEY_INCOMPATIBLE_ON_FIRST_LOGIN]),
    );

    // Idempotent second call
    const again = cancelIncompatibleReminders({
      activeReminderKeys: result.activeReminderKeys,
      cancelledReminderKeys: result.cancelledReminderKeys,
      trigger: "account.first_login",
    });
    expect(again.newlyCancelled).toEqual([]);
  });

  it("CJ-06: unknown recipient deny (default-deny allowlist)", () => {
    expect(parseJourneyRecipientAllowlist(undefined)).toEqual([]);
    expect(parseJourneyRecipientAllowlist("")).toEqual([]);
    expect(isJourneyRecipientAllowlisted("anyone@example.com", [])).toBe(false);
    expect(isJourneyRecipientAllowlisted("anyone@example.com", undefined)).toBe(false);

    const allow = parseJourneyRecipientAllowlist(
      "synthetic+phase5f@example.test, other+test@example.test",
    );
    expect(isJourneyRecipientAllowlisted("synthetic+phase5f@example.test", allow)).toBe(true);
    expect(isJourneyRecipientAllowlisted("real-customer@example.com", allow)).toBe(false);
    expect(JOURNEY_ENV_NAMES.RECIPIENT_ALLOWLIST).toBe("JOURNEY_RECIPIENT_ALLOWLIST");
  });

  it("CJ-07: CreateInviteBody + schemas validate", () => {
    const body = CreateInviteBodySchema.safeParse({
      tenantId: TENANT_ID,
      contactRef: "synthetic-contact-1",
      recipientAddress: "synthetic+phase5f@example.test",
      channel: "sink",
    });
    expect(body.success).toBe(true);

    const support = applyJourneyTransition(baseJourney({ status: "first_login" }), "support.ticket.created", {
      supportContext: {
        correlationId: "corr-support",
        authorizedScopes: ["support.read", "journey.read"],
        ticketId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      },
    });
    expect(support.supportContext?.authorizedScopes).toContain("journey.read");
  });
});
