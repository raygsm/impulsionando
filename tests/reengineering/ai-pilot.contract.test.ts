import { describe, expect, it } from "vitest";
import {
  AI_DETERMINISTIC_MODEL_ID,
  AI_EVAL_FIXTURES,
  AI_SCHEMA_VERSION,
  AiPilotReplySchema,
  assertNoSecretFields,
  routePilotIntent,
  synthesizePilotAnswer,
} from "@impulsionando/contracts";

describe("Phase 6C — AI pilot contract", () => {
  it("PILOT-01: eval fixtures route to expected intents", () => {
    for (const c of AI_EVAL_FIXTURES) {
      const plan = routePilotIntent(c.inputMessage);
      if (c.expectedIntent) {
        expect(plan.intent).toBe(c.expectedIntent);
      }
      if (c.expectedRefuseCodes?.length) {
        expect(c.expectedRefuseCodes).toContain(plan.refuseCode);
      }
    }
  });

  it("PILOT-02: ambiguous messages refuse without inventing", () => {
    const plan = routePilotIntent("tell me everything about the business");
    expect(plan.intent).toBe("refuse.ambiguous");
    expect(plan.toolId).toBeNull();
    expect(plan.refuseCode).toBe("AI_AMBIGUOUS");
  });

  it("PILOT-03: synthesizer only uses tool JSON fields", () => {
    const answer = synthesizePilotAnswer("support.tickets.list", {
      tickets: [{ id: "a", protocol: "T-1", status: "new", subject: "Hello" }],
    });
    expect(answer).toContain("T-1");
    expect(answer).toContain("Hello");
    expect(answer).not.toContain("service_role");
  });

  it("PILOT-04: pilot reply envelope validates", () => {
    const reply = {
      schemaVersion: AI_SCHEMA_VERSION,
      refused: false,
      answer: "Support tickets (from canonical API):\n- T-1 [new] Hello",
      sources: [
        {
          toolId: "support.tickets.list" as const,
          fetchedAt: new Date().toISOString(),
          degraded: false,
          reason: null,
        },
      ],
      promptVersion: "pilot-v1",
      modelId: AI_DETERMINISTIC_MODEL_ID,
      correlationId: "corr-1",
      tokensUsed: null,
      latencyMs: 12,
    };
    expect(AiPilotReplySchema.safeParse(reply).success).toBe(true);
    expect(() => assertNoSecretFields(reply)).not.toThrow();
  });

  it("PILOT-05: empty list does not invent tickets", () => {
    const answer = synthesizePilotAnswer("support.tickets.list", { tickets: [] });
    expect(answer.toLowerCase()).toContain("no support tickets");
  });
});
