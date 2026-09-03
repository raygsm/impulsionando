import { describe, expect, it } from "vitest";
import {
  AI_SCHEMA_VERSION,
  AiRiskClass,
  AiToolIdSchema,
  AiToolJourneyGetInputSchema,
  AiToolMetaSchema,
  AiToolSupportGetInputSchema,
  AiToolSupportListInputSchema,
  AiToolTenantResolveHostInputSchema,
  AiToolsEnvelopeSchema,
  defaultAiToolAllowPolicy,
  isToolAllowed,
} from "@impulsionando/contracts";

const READ_TOOLS = [
  "support.tickets.list",
  "support.tickets.get",
  "tenants.resolve_by_host",
  "tenants.resolve_active_context",
  "journeys.get_by_id",
] as const;

const FORBIDDEN_TOOLS = [
  "forbidden.arbitrary_sql",
  "forbidden.unrestricted_http",
  "forbidden.service_role_expose",
] as const;

describe("Phase 6B — AI tool registry contract", () => {
  it("AI-T01: risk class enum is complete", () => {
    expect(AiRiskClass.options).toEqual([
      "READ",
      "RECOMMEND",
      "AUTO_SAFE",
      "APPROVAL_REQUIRED",
      "FORBIDDEN",
    ]);
  });

  it("AI-T02: READ tool ids parse; FORBIDDEN ids parse", () => {
    for (const id of READ_TOOLS) {
      expect(AiToolIdSchema.safeParse(id).success).toBe(true);
    }
    for (const id of FORBIDDEN_TOOLS) {
      expect(AiToolIdSchema.safeParse(id).success).toBe(true);
    }
    expect(AiToolIdSchema.safeParse("arbitrary.sql").success).toBe(false);
  });

  it("AI-T03: tools envelope lists READ executable + FORBIDDEN non-executable", () => {
    const scrapedAt = new Date().toISOString();
    const tools = [
      ...READ_TOOLS.map((id) => ({
        id,
        riskClass: "READ" as const,
        description: `READ tool ${id}`,
        executable: true,
      })),
      ...FORBIDDEN_TOOLS.map((id) => ({
        id,
        riskClass: "FORBIDDEN" as const,
        description: `Forbidden ${id}`,
        executable: false,
      })),
    ];
    const envelope = {
      schemaVersion: AI_SCHEMA_VERSION,
      scrapedAt,
      tools,
    };
    expect(AiToolsEnvelopeSchema.safeParse(envelope).success).toBe(true);
    for (const t of tools) {
      expect(AiToolMetaSchema.safeParse(t).success).toBe(true);
    }
  });

  it("AI-T04: risk class deny — FORBIDDEN never allowed; RECOMMEND denied by default", () => {
    const policy = defaultAiToolAllowPolicy(false);
    expect(isToolAllowed("FORBIDDEN", policy)).toBe(false);
    expect(isToolAllowed("RECOMMEND", policy)).toBe(false);
    expect(isToolAllowed("AUTO_SAFE", policy)).toBe(false);
    expect(isToolAllowed("APPROVAL_REQUIRED", policy)).toBe(false);
    expect(isToolAllowed("READ", policy)).toBe(true);
  });

  it("AI-T05: support list/get I/O Zod", () => {
    expect(AiToolSupportListInputSchema.safeParse({ limit: 10 }).success).toBe(
      true,
    );
    expect(
      AiToolSupportListInputSchema.safeParse({ limit: 999 }).success,
    ).toBe(false);
    expect(
      AiToolSupportGetInputSchema.safeParse({
        ticketId: "00000000-0000-4000-8000-000000000099",
      }).success,
    ).toBe(true);
    expect(AiToolSupportGetInputSchema.safeParse({ ticketId: "bad" }).success).toBe(
      false,
    );
  });

  it("AI-T06: tenant resolve + journey get I/O Zod", () => {
    expect(
      AiToolTenantResolveHostInputSchema.safeParse({
        host: "tenant.stg.impulsionando.com.br",
      }).success,
    ).toBe(true);
    expect(
      AiToolJourneyGetInputSchema.safeParse({
        journeyId: "00000000-0000-4000-8000-000000000011",
        tenantId: "00000000-0000-4000-8000-000000000022",
      }).success,
    ).toBe(true);
    expect(
      AiToolJourneyGetInputSchema.safeParse({
        journeyId: "00000000-0000-4000-8000-000000000011",
      }).success,
    ).toBe(false);
  });

  it("AI-T07: optional allow flags for higher risk classes", () => {
    const open = {
      killSwitchEnabled: false,
      allowReadOnly: true,
      allowRecommend: true,
      allowAutoSafe: true,
      allowApprovalRequired: true,
    };
    expect(isToolAllowed("RECOMMEND", open)).toBe(true);
    expect(isToolAllowed("AUTO_SAFE", open)).toBe(true);
    expect(isToolAllowed("APPROVAL_REQUIRED", open)).toBe(true);
    expect(isToolAllowed("FORBIDDEN", open)).toBe(false);
  });
});
