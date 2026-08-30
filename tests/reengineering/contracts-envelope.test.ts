/**
 * Phase 1 contracts — envelope + support.ticket.* Zod fixtures.
 * Imports the package via relative path until workspace wiring lands.
 */
import { describe, expect, it } from "vitest";
import {
  CORRELATION_ID_HEADER,
  CursorPaginationQuerySchema,
  ErrorEnvelopeSchema,
  successEnvelopeSchema,
  SupportTicketCreateBodySchema,
  SupportTicketListQuerySchema,
  SupportTicketUpdateStatusBodySchema,
} from "../../packages/contracts/src/index";
import { z } from "zod";

describe("@impulsionando/contracts http envelope", () => {
  it("exports X-Correlation-Id header constant", () => {
    expect(CORRELATION_ID_HEADER).toBe("X-Correlation-Id");
  });

  it("accepts success envelope with correlationId meta", () => {
    const schema = successEnvelopeSchema(z.object({ id: z.string() }));
    const parsed = schema.parse({
      data: { id: "t1" },
      meta: { correlationId: "01JTEST" },
    });
    expect(parsed.meta.correlationId).toBe("01JTEST");
  });

  it("accepts list meta with nextCursor null", () => {
    const schema = successEnvelopeSchema(z.array(z.string()));
    const parsed = schema.parse({
      data: [],
      meta: { correlationId: "01J", nextCursor: null, limit: 50 },
    });
    expect(parsed.meta.nextCursor).toBeNull();
  });

  it("accepts error envelope with stable code", () => {
    const parsed = ErrorEnvelopeSchema.parse({
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid email",
        correlationId: "01J",
        details: [{ path: "body.email", code: "invalid_string", message: "Invalid email" }],
      },
    });
    expect(parsed.error.code).toBe("VALIDATION_FAILED");
  });

  it("parses cursor pagination query", () => {
    expect(CursorPaginationQuerySchema.parse({ cursor: "abc", limit: "25" })).toEqual({
      cursor: "abc",
      limit: 25,
    });
  });
});

describe("@impulsionando/contracts support.ticket.*", () => {
  it("validates support.ticket.create body", () => {
    const body = SupportTicketCreateBodySchema.parse({
      subject: "Cannot login",
      description: "Reset link never arrives",
      type: "access",
      priority: "high",
      requester: { name: "Ada", email: "ada+support-pilot@example.com" },
    });
    expect(body.subject).toBe("Cannot login");
  });

  it("rejects client company_id on create (strict)", () => {
    const result = SupportTicketCreateBodySchema.safeParse({
      subject: "x".repeat(4),
      description: "y".repeat(10),
      company_id: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("validates support.ticket.list query", () => {
    const q = SupportTicketListQuerySchema.parse({
      status: "new",
      priority: "medium",
      limit: 20,
    });
    expect(q.status).toBe("new");
  });

  it("validates support.ticket.update-status body", () => {
    const body = SupportTicketUpdateStatusBodySchema.parse({
      status: "in_review",
      reason: "Triaged",
    });
    expect(body.status).toBe("in_review");
  });
});
