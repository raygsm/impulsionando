import { Injectable } from "@nestjs/common";
import {
  AI_ENV_NAMES,
  AI_SCHEMA_VERSION,
  AiPolicyEnvelopeSchema,
  assertNoSecretFields,
  evaluateChatBudget,
  isCapabilityAllowed,
  isTruthyEnv,
  parseCapabilityAllowlist,
  parseNonNegativeIntEnv,
  parsePositiveIntEnv,
  type AiBudgetEnvelope,
  type AiPolicyEnvelope,
} from "@impulsionando/contracts";

/** In-memory sliding window of request timestamps per actor (rate budget). */
const RATE_WINDOW_MS = 60_000;

@Injectable()
export class AiPolicyService {
  private readonly rateByActor = new Map<string, number[]>();

  isKillSwitchEnabled(): boolean {
    return isTruthyEnv(process.env[AI_ENV_NAMES.KILL_SWITCH]);
  }

  isChatEnabled(): boolean {
    return isTruthyEnv(process.env[AI_ENV_NAMES.AI_CHAT_ENABLED]);
  }

  /** null = unset (no extra filter). */
  getCapabilityAllowlist(): string[] | null {
    return parseCapabilityAllowlist(process.env[AI_ENV_NAMES.CAPABILITY_ALLOWLIST]);
  }

  isCapabilityEnabled(capabilityId: string): boolean {
    return isCapabilityAllowed(capabilityId, this.getCapabilityAllowlist());
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

  /**
   * Count prior requests in the last minute for this actor (excludes the current one).
   * Call `recordRateHit` only after a request is admitted.
   */
  countRateInWindow(actorUserId: string, now = Date.now()): number {
    const cutoff = now - RATE_WINDOW_MS;
    const prev = this.rateByActor.get(actorUserId) ?? [];
    const kept = prev.filter((t) => t >= cutoff);
    this.rateByActor.set(actorUserId, kept);
    return kept.length;
  }

  recordRateHit(actorUserId: string, now = Date.now()): void {
    const cutoff = now - RATE_WINDOW_MS;
    const prev = this.rateByActor.get(actorUserId) ?? [];
    const kept = prev.filter((t) => t >= cutoff);
    kept.push(now);
    this.rateByActor.set(actorUserId, kept);
  }

  /**
   * Enforce token + rate budgets for a chat message.
   * Returns AI_BUDGET_EXCEEDED when over limit; otherwise ok and records the rate hit.
   */
  checkAndConsumeChatBudget(opts: {
    actorUserId: string;
    message: string;
  }): { ok: true } | { ok: false; code: "AI_BUDGET_EXCEEDED"; message: string } {
    const budgets = this.getBudgets();
    const rateCountInWindow = this.countRateInWindow(opts.actorUserId);
    const gate = evaluateChatBudget({
      budgets,
      message: opts.message,
      rateCountInWindow,
    });
    if (!gate.ok) return gate;
    this.recordRateHit(opts.actorUserId);
    return { ok: true };
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
