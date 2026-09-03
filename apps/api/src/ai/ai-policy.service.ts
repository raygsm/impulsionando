import { Injectable } from "@nestjs/common";
import {
  AI_ENV_NAMES,
  AI_SCHEMA_VERSION,
  AiPolicyEnvelopeSchema,
  assertNoSecretFields,
  isTruthyEnv,
  parseNonNegativeIntEnv,
  parsePositiveIntEnv,
  type AiBudgetEnvelope,
  type AiPolicyEnvelope,
} from "@impulsionando/contracts";

@Injectable()
export class AiPolicyService {
  isKillSwitchEnabled(): boolean {
    return isTruthyEnv(process.env[AI_ENV_NAMES.KILL_SWITCH]);
  }

  isChatEnabled(): boolean {
    return isTruthyEnv(process.env[AI_ENV_NAMES.AI_CHAT_ENABLED]);
  }

  getBudgets(): AiBudgetEnvelope {
    return {
      maxTokensPerRequest: parsePositiveIntEnv(
        process.env[AI_ENV_NAMES.BUDGET_MAX_TOKENS],
      ),
      maxCostCentsPerRequest: parseNonNegativeIntEnv(
        process.env[AI_ENV_NAMES.BUDGET_MAX_COST_CENTS],
      ),
      ratePerMinute: parsePositiveIntEnv(
        process.env[AI_ENV_NAMES.BUDGET_RATE_PER_MINUTE],
      ),
    };
  }

  getPolicy(scrapedAt = new Date().toISOString()): AiPolicyEnvelope {
    const envelope: AiPolicyEnvelope = {
      schemaVersion: AI_SCHEMA_VERSION,
      scrapedAt,
      killSwitch: {
        enabled: this.isKillSwitchEnabled(),
        envName: AI_ENV_NAMES.KILL_SWITCH,
      },
      budgets: this.getBudgets(),
      chatEnabled: this.isChatEnabled(),
      policyEnvNames: [
        AI_ENV_NAMES.KILL_SWITCH,
        AI_ENV_NAMES.CAPABILITY_ALLOWLIST,
        AI_ENV_NAMES.BUDGET_MAX_TOKENS,
        AI_ENV_NAMES.BUDGET_MAX_COST_CENTS,
        AI_ENV_NAMES.BUDGET_RATE_PER_MINUTE,
        AI_ENV_NAMES.AI_CHAT_ENABLED,
        AI_ENV_NAMES.AI_PROMPT_VERSION,
        AI_ENV_NAMES.AI_TELEMETRY_ENABLED,
        AI_ENV_NAMES.OPENAI_API_KEY,
        AI_ENV_NAMES.OPENAI_BASE_URL,
        AI_ENV_NAMES.AI_MODEL,
      ],
    };
    const parsed = AiPolicyEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      throw new Error("AI_POLICY_INVALID");
    }
    assertNoSecretFields(parsed.data);
    return parsed.data;
  }
}
