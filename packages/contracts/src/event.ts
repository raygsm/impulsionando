/**
 * Phase 5C — domain event envelope + outbox row helpers.
 * Aligns with Phase 1 CONTRACT-EVENTS-JOBS.md §3 (required subset) and job.ts style.
 */
import { z } from "zod";

export const EVENT_SCHEMA_VERSION = 1 as const;
export const REENGINEERING_EVENT_OUTBOX_TABLE = "reengineering_event_outbox" as const;

/** Initial Phase 5C event catalog (PRODUCT-INTAKE-ACTION-PLAN § Phase 5C). */
export const EventType = {
  SupportTicketCreated: "support.ticket.created",
  InviteCreated: "invite.created",
  InviteLinkClicked: "invite.link_clicked",
  AccountFirstLogin: "account.first_login",
  CommunicationRequested: "communication.requested",
  CommunicationDelivered: "communication.delivered",
  CommunicationFailed: "communication.failed",
} as const;

export type EventTypeName = (typeof EventType)[keyof typeof EventType];

export const EVENT_TYPE_CATALOG = [
  EventType.SupportTicketCreated,
  EventType.InviteCreated,
  EventType.InviteLinkClicked,
  EventType.AccountFirstLogin,
  EventType.CommunicationRequested,
  EventType.CommunicationDelivered,
  EventType.CommunicationFailed,
] as const;

export const EventTypeSchema = z.enum(EVENT_TYPE_CATALOG);
export type EventTypeCatalog = z.infer<typeof EventTypeSchema>;

export const EventActorTypeSchema = z.enum([
  "user",
  "system",
  "service",
  "integration",
  "anonymous",
]);
export type EventActorType = z.infer<typeof EventActorTypeSchema>;

export const EventActorSchema = z.object({
  actorType: EventActorTypeSchema,
  actorId: z.string().min(1).optional(),
  membershipId: z.string().uuid().optional(),
  role: z.string().min(1).optional(),
});
export type EventActor = z.infer<typeof EventActorSchema>;

export const OutboxStatusSchema = z.enum(["pending", "published", "failed"]);
export type OutboxStatus = z.infer<typeof OutboxStatusSchema>;

/** EventEnvelope v1 — required fields per Phase 5C + optional Phase 1 audit fields. */
export const EventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  type: z.string().min(1),
  schemaVersion: z.literal(EVENT_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  correlationId: z.string().min(1),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()),
  payloadSchemaRef: z.string().min(1).optional(),
  actor: EventActorSchema.optional(),
  idempotencyKey: z.string().min(1).optional(),
  causationId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
});
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

/** Row shape written to `reengineering_event_outbox` (API → DB). */
export const OutboxRowInsertSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  schemaVersion: z.literal(EVENT_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1).nullable().optional(),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()),
  envelope: EventEnvelopeSchema,
  status: z.literal("pending").default("pending"),
});
export type OutboxRowInsert = z.infer<typeof OutboxRowInsertSchema>;

export function payloadSchemaRefFor(type: string, schemaVersion = EVENT_SCHEMA_VERSION): string {
  return `${type}.v${schemaVersion}`;
}

export type DomainMutationToOutboxInput = {
  eventId: string;
  type: string;
  tenantId: string;
  correlationId: string;
  occurredAt?: string;
  payload: Record<string, unknown>;
  actor?: EventActor;
  idempotencyKey?: string;
  causationId?: string;
  source?: string;
};

/**
 * Map a domain mutation into a validated EventEnvelope + outbox insert row.
 * Callers must persist the row in the same DB transaction as the domain write when possible.
 */
export function domainMutationToOutboxRow(input: DomainMutationToOutboxInput): OutboxRowInsert {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const envelope: EventEnvelope = {
    eventId: input.eventId,
    type: input.type,
    schemaVersion: EVENT_SCHEMA_VERSION,
    tenantId: input.tenantId,
    correlationId: input.correlationId,
    occurredAt,
    payload: input.payload,
    payloadSchemaRef: payloadSchemaRefFor(input.type),
    ...(input.actor ? { actor: input.actor } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    ...(input.causationId ? { causationId: input.causationId } : {}),
    ...(input.source ? { source: input.source } : {}),
  };

  const parsed = EventEnvelopeSchema.safeParse(envelope);
  if (!parsed.success) {
    throw new Error("EVENT_ENVELOPE_INVALID");
  }

  return {
    eventId: parsed.data.eventId,
    eventType: parsed.data.type,
    schemaVersion: EVENT_SCHEMA_VERSION,
    tenantId: parsed.data.tenantId,
    correlationId: parsed.data.correlationId,
    idempotencyKey: parsed.data.idempotencyKey ?? null,
    occurredAt: parsed.data.occurredAt,
    payload: parsed.data.payload,
    envelope: parsed.data,
    status: "pending",
  };
}

export function outboxIdempotencyScopeKey(input: {
  tenantId: string;
  eventType: string;
  idempotencyKey: string;
}): string {
  return `${input.tenantId}:${input.eventType}:${input.idempotencyKey}`;
}
