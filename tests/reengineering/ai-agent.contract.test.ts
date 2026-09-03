import { describe, expect, it } from "vitest";
import {
  AI_DEFAULT_PROMPT_VERSION,
  AI_DEFAULT_TENANT_AGENT_ALLOWLIST,
  AI_DEFAULT_TENANT_AGENT_ID,
  AI_DETERMINISTIC_MODEL_ID,
  AI_ENV_NAMES,
  AI_SCHEMA_VERSION,
  AiTenantAgentConfigSchema,
  assertNoSecretFields,
  buildSeededTenantAgentConfig,
  parseTenantAgentAllowlist,
} from "@impulsionando/contracts";

const SAMPLE_TENANT = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("Phase 6D — AI tenant agent contract", () => {
  it("AGENT-01: validates seeded Impulsionito READ config", () => {
    const config = buildSeededTenantAgentConfig({
      tenantId: SAMPLE_TENANT,
      enabled: true,
    });
    const parsed = AiTenantAgentConfigSchema.safeParse(config);
    expect(parsed.success).toBe(true);
    expect(config.schemaVersion).toBe(AI_SCHEMA_VERSION);
    expect(config.agentId).toBe(AI_DEFAULT_TENANT_AGENT_ID);
    expect(config.riskCeiling).toBe("READ");
    expect(config.modelId).toBe(AI_DETERMINISTIC_MODEL_ID);
    expect(config.promptVersion).toBe(AI_DEFAULT_PROMPT_VERSION);
    expect(config.capabilityAllowlist).toEqual([...AI_DEFAULT_TENANT_AGENT_ALLOWLIST]);
    expect(() => assertNoSecretFields(config)).not.toThrow();
  });

  it("AGENT-02: riskCeiling is fixed at READ (rejects WRITE/AUTO)", () => {
    const bad = {
      ...buildSeededTenantAgentConfig({ tenantId: SAMPLE_TENANT }),
      riskCeiling: "AUTO_SAFE",
    };
    expect(AiTenantAgentConfigSchema.safeParse(bad).success).toBe(false);
  });

  it("AGENT-03: env names only — tenant agent keys are SCREAMING_SNAKE", () => {
    const agentEnvKeys = [
      AI_ENV_NAMES.AI_TENANT_AGENT_TENANT_ID,
      AI_ENV_NAMES.AI_TENANT_AGENT_ID,
      AI_ENV_NAMES.AI_TENANT_AGENT_ENABLED,
      AI_ENV_NAMES.AI_TENANT_AGENT_PROMPT_VERSION,
      AI_ENV_NAMES.AI_TENANT_AGENT_MODEL_ID,
      AI_ENV_NAMES.AI_TENANT_AGENT_CAPABILITY_ALLOWLIST,
    ];
    for (const name of agentEnvKeys) {
      expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
      expect(name).toContain("AI_TENANT_AGENT");
    }
    const config = buildSeededTenantAgentConfig({ tenantId: SAMPLE_TENANT });
    expect(config.configEnvNames).toEqual(expect.arrayContaining(agentEnvKeys));
    expect(JSON.stringify(config)).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
    expect(JSON.stringify(config)).not.toContain("sk-");
  });

  it("AGENT-04: parseTenantAgentAllowlist falls back to default READ list", () => {
    expect(parseTenantAgentAllowlist(undefined)).toEqual([
      ...AI_DEFAULT_TENANT_AGENT_ALLOWLIST,
    ]);
    expect(parseTenantAgentAllowlist("")).toEqual([...AI_DEFAULT_TENANT_AGENT_ALLOWLIST]);
    expect(parseTenantAgentAllowlist("ai.chat, support.tickets.list")).toEqual([
      "ai.chat",
      "support.tickets.list",
    ]);
  });

  it("AGENT-05: default allowlist never includes FORBIDDEN tools", () => {
    for (const id of AI_DEFAULT_TENANT_AGENT_ALLOWLIST) {
      expect(id).not.toMatch(/^forbidden\./);
      expect(id).not.toContain("service_role");
      expect(id).not.toContain("arbitrary_sql");
    }
  });

  it("AGENT-06: custom agentId / promptVersion / modelId accepted", () => {
    const config = buildSeededTenantAgentConfig({
      tenantId: SAMPLE_TENANT,
      agentId: "impulsionito-stg",
      promptVersion: "impulsionito-v1",
      modelId: AI_DETERMINISTIC_MODEL_ID,
      enabled: false,
      capabilityAllowlist: ["ai.chat", "ai.tools.read"],
    });
    expect(AiTenantAgentConfigSchema.safeParse(config).success).toBe(true);
    expect(config.agentId).toBe("impulsionito-stg");
    expect(config.enabled).toBe(false);
    expect(config.capabilityAllowlist).toHaveLength(2);
  });
});
