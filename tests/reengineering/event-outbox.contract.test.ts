import { describe, expect, it } from "vitest";
import {
  EVENT_SCHEMA_VERSION,
  EVENT_TYPE_CATALOG,
  EventEnvelopeSchema,
  EventType,
  EventTypeSchema,
  OutboxRowInsertSchema,
  OutboxStatusSchema,
  REENGINEERING_EVENT_OUTBOX_TABLE,
  domainMutationToOutboxRow,
  outboxIdempotencyScopeKey,
  payloadSchemaRefFor,
} from "@impulsionando/contracts";

const TENANT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("Phase 5C — event outbox contract", () => {
  it("EO-01: validates EventEnvelope v1", () => {
    const parsed = EventEnvelopeSchema.safeParse({
      eventId: "22222222-2222-4222-8222-222222222222",
      type: EventType.SupportTicketCreated,
      schemaVersion: EVENT_SCHEMA_VERSION,
      tenantId: TENANT_ID,
      correlationId: "corr-outbox-1",
      occurredAt: new Date().toISOString(),
      payload: { ticketId: "33333333-3333-4333-8333-333333333333" },
    });
    expect(parsed.success).toBe(true);
  });

  it("EO-02: rejects wrong schemaVersion", () => {
    const parsed = EventEnvelopeSchema.safeParse({
      eventId: "22222222-2222-4222-8222-222222222222",
      type: EventType.InviteCreated,
      schemaVersion: 2,
      tenantId: TENANT_ID,
      correlationId: "corr-2",
      occurredAt: new Date().toISOString(),
      payload: {},
    });
    expect(parsed.success).toBe(false);
  });

  it("EO-03: initial event catalog has 7 types", () => {
    expect(EVENT_TYPE_CATALOG).toHaveLength(7);
    expect(EventTypeSchema.safeParse("support.ticket.created").success).toBe(true);
    expect(EventTypeSchema.safeParse("invite.created").success).toBe(true);
    expect(EventTypeSchema.safeParse("invite.link_clicked").success).toBe(true);
    expect(EventTypeSchema.safeParse("account.first_login").success).toBe(true);
    expect(EventTypeSchema.safeParse("communication.requested").success).toBe(true);
    expect(EventTypeSchema.safeParse("communication.delivered").success).toBe(true);
    expect(EventTypeSchema.safeParse("communication.failed").success).toBe(true);
    expect(EventTypeSchema.safeParse("unknown.event").success).toBe(false);
  });

  it("EO-04: domainMutationToOutboxRow maps to pending insert", () => {
    const row = domainMutationToOutboxRow({
      eventId: "44444444-4444-4444-8444-444444444444",
      type: EventType.SupportTicketCreated,
      tenantId: TENANT_ID,
      correlationId: "corr-map",
      payload: { ticketId: "55555555-5555-4555-8555-555555555555" },
      idempotencyKey: "idem-ticket-1",
      source: "support",
    });
    const parsed = OutboxRowInsertSchema.safeParse(row);
    expect(parsed.success).toBe(true);
    expect(row.status).toBe("pending");
    expect(row.eventType).toBe("support.ticket.created");
    expect(row.envelope.payloadSchemaRef).toBe("support.ticket.created.v1");
    expect(row.idempotencyKey).toBe("idem-ticket-1");
  });

  it("EO-05: outbox idempotency scope key", () => {
    expect(
      outboxIdempotencyScopeKey({
        tenantId: TENANT_ID,
        eventType: EventType.InviteCreated,
        idempotencyKey: "invite-1",
      }),
    ).toBe(`${TENANT_ID}:invite.created:invite-1`);
  });

  it("EO-06: payloadSchemaRefFor + table + status constants", () => {
    expect(payloadSchemaRefFor(EventType.CommunicationFailed)).toBe(
      "communication.failed.v1",
    );
    expect(REENGINEERING_EVENT_OUTBOX_TABLE).toBe("reengineering_event_outbox");
    expect(OutboxStatusSchema.safeParse("pending").success).toBe(true);
    expect(OutboxStatusSchema.safeParse("published").success).toBe(true);
    expect(OutboxStatusSchema.safeParse("failed").success).toBe(true);
    expect(OutboxStatusSchema.safeParse("queued").success).toBe(false);
  });

  it("EO-07: optional actor / causation fields accepted", () => {
    const parsed = EventEnvelopeSchema.safeParse({
      eventId: "66666666-6666-4666-8666-666666666666",
      type: EventType.AccountFirstLogin,
      schemaVersion: 1,
      tenantId: TENANT_ID,
      correlationId: "corr-actor",
      occurredAt: new Date().toISOString(),
      payload: { userId: "77777777-7777-4777-8777-777777777777" },
      actor: { actorType: "user", actorId: "77777777-7777-4777-8777-777777777777" },
      causationId: "66666666-6666-4666-8666-666666666666",
      source: "identity",
    });
    expect(parsed.success).toBe(true);
  });
});
