import { describe, expect, it } from "vitest";
import {
  AI_ENV_NAMES,
  AI_SCHEMA_VERSION,
  AiCapabilitiesEnvelopeSchema,
  AiChatContextAssemblySchema,
  AiChatRefuseSchema,
  AiChatRequestBodySchema,
  AiPolicyEnvelopeSchema,
  assertNoSecretFields,
  buildDefaultCapabilities,
  defaultAiToolAllowPolicy,
  estimatePromptTokens,
  evaluateChatBudget,
  isCapabilityAllowed,
  isToolAllowed,
  isTruthyEnv,
  parseCapabilityAllowlist,
  parsePositiveIntEnv,
} from "@impulsionando/contracts";

describe("Phase 6A — AI gateway / policy contract", () => {
  it("AI-01: validates capabilities envelope v1", () => {
    const envelope = buildDefaultCapabilities({
      killSwitchEnabled: false,
      chatEnabled: false,
    });
    const parsed = AiCapabilitiesEnvelopeSchema.safeParse(envelope);
    expect(parsed.success).toBe(true);
    expect(envelope.schemaVersion).toBe(AI_SCHEMA_VERSION);
    expect(envelope.providerAdapter).toBe("openai-compatible");
  });

  it("AI-02: validates policy envelope with kill switch + budgets", () => {
    const policy = {
      schemaVersion: AI_SCHEMA_VERSION,
      scrapedAt: new Date().toISOString(),
      killSwitch: { enabled: false, envName: AI_ENV_NAMES.KILL_SWITCH },
      budgets: {
        maxTokensPerRequest: 4096,
        maxCostCentsPerRequest: 50,
        ratePerMinute: 30,
      },
      chatEnabled: false,
      policyEnvNames: [
        AI_ENV_NAMES.KILL_SWITCH,
        AI_ENV_NAMES.BUDGET_MAX_TOKENS,
        AI_ENV_NAMES.BUDGET_MAX_COST_CENTS,
        AI_ENV_NAMES.BUDGET_RATE_PER_MINUTE,
        AI_ENV_NAMES.AI_CHAT_ENABLED,
      ],
    };
    expect(AiPolicyEnvelopeSchema.safeParse(policy).success).toBe(true);
    expect(() => assertNoSecretFields(policy)).not.toThrow();
  });

  it("AI-03: kill switch denies all executable risk classes", () => {
    const policy = defaultAiToolAllowPolicy(true);
    expect(isToolAllowed("READ", policy)).toBe(false);
    expect(isToolAllowed("RECOMMEND", policy)).toBe(false);
    expect(isToolAllowed("AUTO_SAFE", policy)).toBe(false);
    expect(isToolAllowed("APPROVAL_REQUIRED", policy)).toBe(false);
    expect(isToolAllowed("FORBIDDEN", policy)).toBe(false);
  });

  it("AI-04: FORBIDDEN always denied even when kill switch off", () => {
    const policy = defaultAiToolAllowPolicy(false);
    expect(isToolAllowed("FORBIDDEN", policy)).toBe(false);
    expect(isToolAllowed("READ", policy)).toBe(true);
    expect(isToolAllowed("RECOMMEND", policy)).toBe(false);
  });

  it("AI-05: env names only — AI_ENV_NAMES match SCREAMING_SNAKE", () => {
    for (const name of Object.values(AI_ENV_NAMES)) {
      expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
      expect(name).not.toMatch(/eyJ/);
      expect(name.length).toBeLessThan(80);
    }
  });

  it("AI-06: assertNoSecretFields rejects leaked apiKey keys", () => {
    expect(() =>
      assertNoSecretFields({
        credentialEnvNames: [AI_ENV_NAMES.OPENAI_API_KEY],
      }),
    ).not.toThrow();
    expect(() => assertNoSecretFields({ apiKey: "sk-leak" })).toThrow(
      /OPS_SECRET_FIELD_LEAK/,
    );
  });

  it("AI-07: chat refuse stub schema", () => {
    const refuse = {
      schemaVersion: AI_SCHEMA_VERSION,
      refused: true as const,
      code: "AI_CHAT_NOT_ENABLED" as const,
      message: "Chat disabled until 6C",
      correlationId: "corr-1",
    };
    expect(AiChatRefuseSchema.safeParse(refuse).success).toBe(true);
  });

  it("AI-08: chat request rejects unknown keys (no client context assembly)", () => {
    expect(
      AiChatRequestBodySchema.safeParse({ message: "hello" }).success,
    ).toBe(true);
    expect(
      AiChatRequestBodySchema.safeParse({
        message: "hello",
        actorUserId: "00000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(false);
  });

  it("AI-09: server-side context assembly validates", () => {
    const ctx = {
      schemaVersion: AI_SCHEMA_VERSION,
      actorUserId: "00000000-0000-4000-8000-000000000001",
      tenantId: null,
      correlationId: "corr-1",
      capabilityIds: ["ai.capabilities" as const],
      modelId: null,
      promptVersion: null,
    };
    expect(AiChatContextAssemblySchema.safeParse(ctx).success).toBe(true);
  });

  it("AI-10: isTruthyEnv + parsePositiveIntEnv helpers", () => {
    expect(isTruthyEnv("true")).toBe(true);
    expect(isTruthyEnv("0")).toBe(false);
    expect(parsePositiveIntEnv("100")).toBe(100);
    expect(parsePositiveIntEnv("")).toBeNull();
    expect(parsePositiveIntEnv("-1")).toBeNull();
  });

  it("AI-11: chat capability disabled when chatEnabled false", () => {
    const envelope = buildDefaultCapabilities({
      killSwitchEnabled: false,
      chatEnabled: false,
    });
    const chat = envelope.capabilities.find((c) => c.id === "ai.chat");
    expect(chat?.enabled).toBe(false);
  });

  it("AI-12: capability allowlist disables unlisted capabilities", () => {
    expect(parseCapabilityAllowlist(undefined)).toBeNull();
    expect(parseCapabilityAllowlist("ai.capabilities, ai.policy")).toEqual([
      "ai.capabilities",
      "ai.policy",
    ]);
    const filtered = buildDefaultCapabilities({
      killSwitchEnabled: false,
      chatEnabled: true,
      capabilityAllowlist: ["ai.capabilities", "ai.policy"],
    });
    expect(filtered.capabilities.find((c) => c.id === "ai.chat")?.enabled).toBe(false);
    expect(filtered.capabilities.find((c) => c.id === "ai.policy")?.enabled).toBe(true);
    expect(isCapabilityAllowed("ai.chat", null)).toBe(true);
    expect(isCapabilityAllowed("ai.chat", ["ai.policy"])).toBe(false);
  });

  it("AI-13: evaluateChatBudget enforces token and rate limits", () => {
    const budgets = {
      maxTokensPerRequest: 2,
      maxCostCentsPerRequest: null,
      ratePerMinute: 1,
    };
    expect(
      evaluateChatBudget({
        budgets,
        message: "abcdefghij", // ~3 tokens
        rateCountInWindow: 0,
      }).ok,
    ).toBe(false);
    expect(
      evaluateChatBudget({
        budgets: { ...budgets, maxTokensPerRequest: 100 },
        message: "hi",
        rateCountInWindow: 1,
      }).ok,
    ).toBe(false);
    expect(
      evaluateChatBudget({
        budgets: { ...budgets, maxTokensPerRequest: 100 },
        message: "hi",
        rateCountInWindow: 0,
      }).ok,
    ).toBe(true);
    expect(estimatePromptTokens("abcd")).toBe(1);
  });
});
