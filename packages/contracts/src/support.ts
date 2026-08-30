/**
 * P1-H Support pilot payloads (Phase 1 contracts — no Nest).
 * Source: docs/reengineering/04-migration/phase-1/PILOT-SUPPORT.md
 *
 * Status / priority / type enums align with legacy STATIC vocabulary in
 * `src/lib/support-tickets.functions.ts` (expand/contract before inventing a second set).
 */
import { z } from "zod";
import {
  CursorPaginationQuerySchema,
  successEnvelopeSchema,
} from "./http-envelope";

export const SupportTicketType = z.enum([
  "financial",
  "payment",
  "payout",
  "commission",
  "contract",
  "access",
  "technical",
  "whatsapp",
  "email",
  "mercadopago",
  "dashboard",
  "permission",
  "registration",
  "marketplace",
  "clube",
  "consumer",
  "lgpd",
  "suggestion",
  "question",
  "commercial",
  "other",
]);
export type SupportTicketType = z.infer<typeof SupportTicketType>;

export const SupportTicketPriority = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export type SupportTicketPriority = z.infer<typeof SupportTicketPriority>;

export const SupportTicketStatus = z.enum([
  "new",
  "received",
  "in_review",
  "waiting_customer",
  "waiting_core",
  "waiting_third_party",
  "in_development",
  "resolved",
  "closed",
  "reopened",
  "cancelled",
]);
export type SupportTicketStatus = z.infer<typeof SupportTicketStatus>;

export const SupportTicketRequesterSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
});
export type SupportTicketRequester = z.infer<typeof SupportTicketRequesterSchema>;

/** Use case: `support.ticket.create` — POST /api/v1/support/tickets */
export const SupportTicketCreateBodySchema = z
  .object({
    subject: z.string().trim().min(3).max(200),
    description: z.string().trim().min(5).max(8000),
    type: SupportTicketType.optional(),
    priority: SupportTicketPriority.optional(),
    requester: SupportTicketRequesterSchema.optional(),
    source: z.string().trim().max(120).optional(),
    page: z.string().trim().max(300).optional(),
  })
  .strict();
export type SupportTicketCreateBody = z.infer<
  typeof SupportTicketCreateBodySchema
>;

export const SupportTicketCreateDataSchema = z.object({
  id: z.string().uuid(),
  protocol: z.string().min(1),
  status: z.literal("new"),
});
export type SupportTicketCreateData = z.infer<
  typeof SupportTicketCreateDataSchema
>;

export const SupportTicketCreateResponseSchema = successEnvelopeSchema(
  SupportTicketCreateDataSchema,
);
export type SupportTicketCreateResponse = z.infer<
  typeof SupportTicketCreateResponseSchema
>;

/** Use case: `support.ticket.list` — GET /api/v1/support/tickets */
export const SupportTicketListQuerySchema = CursorPaginationQuerySchema.extend({
  status: SupportTicketStatus.optional(),
  priority: SupportTicketPriority.optional(),
}).strict();
export type SupportTicketListQuery = z.infer<typeof SupportTicketListQuerySchema>;

export const SupportTicketSummarySchema = z.object({
  id: z.string().uuid(),
  protocol: z.string().min(1),
  companyId: z.string().uuid().nullable().optional(),
  subject: z.string(),
  type: SupportTicketType,
  priority: SupportTicketPriority,
  status: SupportTicketStatus,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  slaDueAt: z.string().datetime({ offset: true }).nullable().optional(),
});
export type SupportTicketSummary = z.infer<typeof SupportTicketSummarySchema>;

export const SupportTicketListResponseSchema = successEnvelopeSchema(
  z.array(SupportTicketSummarySchema),
);
export type SupportTicketListResponse = z.infer<
  typeof SupportTicketListResponseSchema
>;

/** Use case: `support.ticket.update-status` — PATCH …/tickets/{ticketId}/status */
export const SupportTicketUpdateStatusBodySchema = z
  .object({
    status: SupportTicketStatus,
    reason: z.string().trim().max(2000).optional(),
  })
  .strict();
export type SupportTicketUpdateStatusBody = z.infer<
  typeof SupportTicketUpdateStatusBodySchema
>;

export const SupportTicketUpdateStatusDataSchema = z.object({
  id: z.string().uuid(),
  status: SupportTicketStatus,
  updatedAt: z.string().datetime({ offset: true }),
});
export type SupportTicketUpdateStatusData = z.infer<
  typeof SupportTicketUpdateStatusDataSchema
>;

export const SupportTicketUpdateStatusResponseSchema = successEnvelopeSchema(
  SupportTicketUpdateStatusDataSchema,
);
export type SupportTicketUpdateStatusResponse = z.infer<
  typeof SupportTicketUpdateStatusResponseSchema
>;

/** Pilot audit sketch (mutation side effect) — schemaVersion 1. */
export const SupportTicketAuditAction = z.enum([
  "support.ticket.created",
  "support.ticket.status_changed",
]);
export type SupportTicketAuditAction = z.infer<typeof SupportTicketAuditAction>;

export const SupportTicketAuditV1Schema = z.object({
  schemaVersion: z.literal(1),
  eventId: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  tenantId: z.string().uuid().nullable().optional(),
  actorId: z.string().uuid().nullable().optional(),
  correlationId: z.string().min(1),
  action: SupportTicketAuditAction,
  resourceType: z.literal("support_tickets"),
  resourceId: z.string().min(1),
  payload: z
    .object({
      fromStatus: SupportTicketStatus.optional(),
      toStatus: SupportTicketStatus.optional(),
      source: z.string().optional(),
    })
    .optional(),
});
export type SupportTicketAuditV1 = z.infer<typeof SupportTicketAuditV1Schema>;
