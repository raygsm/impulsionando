import { describe, expect, it } from "vitest";
import {
  AI_EVAL_FIXTURES,
  AiEvalCaseSchema,
  isToolAllowed,
  defaultAiToolAllowPolicy,
  routePilotIntent,
  synthesizePilotAnswer,
} from "@impulsionando/contracts";

describe("Phase 6F — offline AI eval fixtures", () => {
  it("EVAL-01: all fixtures validate", () => {
    for (const c of AI_EVAL_FIXTURES) {
      expect(AiEvalCaseSchema.safeParse(c).success).toBe(true);
    }
  });

  it("EVAL-02: router outcomes match fixtures (fail closed)", () => {
    for (const c of AI_EVAL_FIXTURES) {
      const plan = routePilotIntent(c.inputMessage);
      if (c.expectedOutcome === "refuse") {
        expect(plan.intent).toBe("refuse.ambiguous");
        expect(plan.refuseCode).toBeTruthy();
      } else if (c.expectedOutcome === "ok") {
        expect(plan.toolId).toBeTruthy();
        expect(plan.intent).not.toBe("refuse.ambiguous");
      }
      for (const banned of c.mustNotContain ?? []) {
        expect(JSON.stringify(plan)).not.toContain(banned);
      }
    }
  });

  it("EVAL-03: kill switch denies READ tools", () => {
    const policy = defaultAiToolAllowPolicy(true);
    expect(isToolAllowed("READ", policy)).toBe(false);
  });

  it("EVAL-04: synthesizer never invents ticket protocols", () => {
    const answer = synthesizePilotAnswer("support.tickets.list", {
      tickets: [{ id: "x", status: "open" }],
    });
    expect(answer).not.toMatch(/T-\d{4}/);
    expect(answer).toContain("x");
  });
});
