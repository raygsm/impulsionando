import { Inject, Injectable } from "@nestjs/common";
import {
  AI_DEFAULT_PROMPT_VERSION,
  AI_DETERMINISTIC_MODEL_ID,
  AI_ENV_NAMES,
  AI_SCHEMA_VERSION,
  AiChatContextAssemblySchema,
  AiPilotReplySchema,
  assertNoSecretFields,
  isToolIdOnAllowlist,
  routePilotIntent,
  synthesizePilotAnswer,
  type AiChatContextAssembly,
  type AiChatRequestBody,
  type AiPilotReply,
  type AiTenantAgentConfig,
  type AiToolId,
} from "@impulsionando/contracts";
import type { AuthUser } from "../auth/auth.types";
import { AiPolicyService } from "./ai-policy.service";
import { AiTelemetryService } from "./ai-telemetry.service";
import { executeAiTool, type AiToolServices } from "./tools/registry";
import { SupportService } from "../support/support.service";
import { TenantsService } from "../tenants/tenants.service";
import { JourneysService } from "../journeys/journeys.service";

@Injectable()
export class AiPilotService {
  constructor(
    @Inject(AiPolicyService) private readonly policy: AiPolicyService,
    @Inject(AiTelemetryService) private readonly telemetry: AiTelemetryService,
    @Inject(SupportService) private readonly support: SupportService,
    @Inject(TenantsService) private readonly tenants: TenantsService,
    @Inject(JourneysService) private readonly journeys: JourneysService,
  ) {}

  private toolServices(): AiToolServices {
    return {
      support: this.support,
      tenants: this.tenants,
      journeys: this.journeys,
    };
  }

  promptVersion(): string {
    const raw = process.env[AI_ENV_NAMES.AI_PROMPT_VERSION]?.trim();
    return raw && raw.length > 0 ? raw : AI_DEFAULT_PROMPT_VERSION;
  }

  /**
   * Phase 6C — deterministic tool-grounded pilot.
   * Phase 6A — budgets + capability allowlist + server context assembly.
   * Phase 6D — optional agentConfig applies prompt/model/tool allowlist.
   */
  async runPilotChat(opts: {
    actor: AuthUser;
    body: AiChatRequestBody;
    correlationId: string;
    /** Membership-checked seed config when body.tenantId matches; null = none. */
    agentConfig?: AiTenantAgentConfig | null;
  }): Promise<AiPilotReply> {
    const started = Date.now();
    const agent = opts.agentConfig ?? null;
    const promptVersion = agent?.enabled
      ? agent.promptVersion
      : this.promptVersion();
    const modelId = agent?.enabled ? agent.modelId : AI_DETERMINISTIC_MODEL_ID;
    const tenantId = opts.body.tenantId ?? null;

    if (this.policy.isKillSwitchEnabled()) {
      return this.finishRefuse({
        code: "AI_KILL_SWITCH",
        message: "AI kill switch is enabled",
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [],
      });
    }

    if (!this.policy.isChatEnabled()) {
      return this.finishRefuse({
        code: "AI_CHAT_NOT_ENABLED",
        message: "Chat is not enabled (set AI_CHAT_ENABLED)",
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [],
      });
    }

    if (!this.policy.isCapabilityEnabled("ai.chat")) {
      return this.finishRefuse({
        code: "AI_CAPABILITY_DENIED",
        message: "Capability ai.chat is not on AI_CAPABILITY_ALLOWLIST",
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [],
      });
    }

    if (agent && !agent.enabled) {
      return this.finishRefuse({
        code: "AI_POLICY_REFUSED",
        message: "Tenant agent is configured but disabled",
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [],
      });
    }

    const budget = this.policy.checkAndConsumeChatBudget({
      actorUserId: opts.actor.id,
      message: opts.body.message,
    });
    if (!budget.ok) {
      return this.finishRefuse({
        code: budget.code,
        message: budget.message,
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [],
      });
    }

    // Server-side context only — never trust client-assembled fields.
    const context = this.assembleContext({
      actor: opts.actor,
      tenantId,
      correlationId: opts.correlationId,
      promptVersion,
      modelId,
    });
    void context;

    const plan = routePilotIntent(opts.body.message);
    if (plan.intent === "refuse.ambiguous" || !plan.toolId) {
      return this.finishRefuse({
        code: plan.refuseCode ?? "AI_AMBIGUOUS",
        message: plan.refuseMessage ?? "Ambiguous request",
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [],
      });
    }

    const toolId = plan.toolId as AiToolId;

    if (agent?.enabled && !isToolIdOnAllowlist(toolId, agent.capabilityAllowlist)) {
      return this.finishRefuse({
        code: "AI_TOOL_FORBIDDEN",
        message: `Tool ${toolId} is outside tenant agent allowlist`,
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [toolId],
      });
    }

    if (!this.policy.isCapabilityEnabled("ai.tools.read")) {
      return this.finishRefuse({
        code: "AI_CAPABILITY_DENIED",
        message: "Capability ai.tools.read is not on AI_CAPABILITY_ALLOWLIST",
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [toolId],
      });
    }

    const fetchedAt = new Date().toISOString();
    const exec = await executeAiTool({
      toolId,
      input: plan.input ?? {},
      actor: opts.actor,
      correlationId: opts.correlationId,
      killSwitchEnabled: false,
      services: this.toolServices(),
      requireMembershipOnHostResolve: Boolean(tenantId),
    });

    if (!exec.ok) {
      const code =
        exec.code === "AI_TOOL_FORBIDDEN"
          ? "AI_UNAUTHORIZED"
          : exec.code === "AI_KILL_SWITCH"
            ? "AI_KILL_SWITCH"
            : exec.code === "AI_TOOL_UNAUTHORIZED"
              ? "AI_UNAUTHORIZED"
              : "AI_FACT_UNAVAILABLE";
      return this.finishRefuse({
        code,
        message: exec.message,
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [toolId],
        sources: [
          {
            toolId,
            fetchedAt,
            degraded: true,
            reason: exec.code,
          },
        ],
      });
    }

    const answer = synthesizePilotAnswer(toolId, exec.data);
    if (answer.includes("refusing to invent")) {
      return this.finishRefuse({
        code: "AI_FACT_UNAVAILABLE",
        message: answer,
        correlationId: opts.correlationId,
        promptVersion,
        modelId,
        started,
        tenantId,
        toolIds: [toolId],
        sources: [{ toolId, fetchedAt, degraded: true, reason: "no_synthesizer" }],
      });
    }

    const latencyMs = Date.now() - started;
    const reply: AiPilotReply = {
      schemaVersion: AI_SCHEMA_VERSION,
      refused: false,
      answer,
      sources: [{ toolId, fetchedAt, degraded: false, reason: null }],
      promptVersion,
      modelId,
      correlationId: opts.correlationId,
      tokensUsed: null,
      latencyMs,
    };
    const parsed = AiPilotReplySchema.safeParse(reply);
    if (!parsed.success) {
      throw new Error("AI_PILOT_REPLY_INVALID");
    }
    assertNoSecretFields(parsed.data);
    this.telemetry.record({
      schemaVersion: AI_SCHEMA_VERSION,
      recordedAt: new Date().toISOString(),
      correlationId: opts.correlationId,
      capability: "ai.chat",
      tenantId,
      latencyMs,
      outcome: "ok",
      tokensUsed: null,
      costCentsEstimate: null,
      toolIds: [toolId],
      promptVersion,
      modelId,
    });
    return parsed.data;
  }

  private assembleContext(opts: {
    actor: AuthUser;
    tenantId: string | null;
    correlationId: string;
    promptVersion: string;
    modelId: string;
  }): AiChatContextAssembly {
    const capabilityIds = (
      ["ai.capabilities", "ai.policy", "ai.tools.list", "ai.tools.read", "ai.chat"] as const
    ).filter((id) => this.policy.isCapabilityEnabled(id));

    const assembled: AiChatContextAssembly = {
      schemaVersion: AI_SCHEMA_VERSION,
      actorUserId: opts.actor.id,
      tenantId: opts.tenantId,
      correlationId: opts.correlationId,
      capabilityIds,
      modelId: opts.modelId,
      promptVersion: opts.promptVersion,
      sourceFreshness: {
        assembledAt: new Date().toISOString(),
        degraded: false,
        reason: null,
      },
    };
    const parsed = AiChatContextAssemblySchema.safeParse(assembled);
    if (!parsed.success) {
      throw new Error("AI_CONTEXT_ASSEMBLY_INVALID");
    }
    assertNoSecretFields(parsed.data);
    return parsed.data;
  }

  private finishRefuse(opts: {
    code: AiPilotReply["code"];
    message: string;
    correlationId: string;
    promptVersion: string;
    modelId: string;
    started: number;
    tenantId: string | null;
    toolIds: string[];
    sources?: AiPilotReply["sources"];
  }): AiPilotReply {
    const latencyMs = Date.now() - opts.started;
    const reply: AiPilotReply = {
      schemaVersion: AI_SCHEMA_VERSION,
      refused: true,
      code: opts.code,
      message: opts.message,
      answer: null,
      sources: opts.sources ?? [],
      promptVersion: opts.promptVersion,
      modelId: opts.modelId,
      correlationId: opts.correlationId,
      tokensUsed: null,
      latencyMs,
    };
    const parsed = AiPilotReplySchema.safeParse(reply);
    if (!parsed.success) {
      throw new Error("AI_PILOT_REFUSE_INVALID");
    }
    assertNoSecretFields(parsed.data);
    this.telemetry.record({
      schemaVersion: AI_SCHEMA_VERSION,
      recordedAt: new Date().toISOString(),
      correlationId: opts.correlationId,
      capability: "ai.chat",
      tenantId: opts.tenantId,
      latencyMs,
      outcome: opts.code === "AI_KILL_SWITCH" ? "error" : "refuse",
      tokensUsed: null,
      costCentsEstimate: null,
      toolIds: opts.toolIds,
      promptVersion: opts.promptVersion,
      modelId: opts.modelId,
      refuseCode: opts.code,
    });
    return parsed.data;
  }
}
