import { Inject, Injectable } from "@nestjs/common";
import {
  AI_DEFAULT_PROMPT_VERSION,
  AI_DETERMINISTIC_MODEL_ID,
  AI_ENV_NAMES,
  AI_SCHEMA_VERSION,
  AiPilotReplySchema,
  assertNoSecretFields,
  routePilotIntent,
  synthesizePilotAnswer,
  type AiChatRequestBody,
  type AiPilotReply,
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
   * Refuses unknowns; never invents facts beyond tool JSON.
   */
  async runPilotChat(opts: {
    actor: AuthUser;
    body: AiChatRequestBody;
    correlationId: string;
  }): Promise<AiPilotReply> {
    const started = Date.now();
    const promptVersion = this.promptVersion();

    if (this.policy.isKillSwitchEnabled()) {
      return this.finishRefuse({
        code: "AI_KILL_SWITCH",
        message: "AI kill switch is enabled",
        correlationId: opts.correlationId,
        promptVersion,
        started,
        tenantId: opts.body.tenantId ?? null,
        toolIds: [],
      });
    }

    if (!this.policy.isChatEnabled()) {
      return this.finishRefuse({
        code: "AI_CHAT_NOT_ENABLED",
        message: "Chat is not enabled (set AI_CHAT_ENABLED)",
        correlationId: opts.correlationId,
        promptVersion,
        started,
        tenantId: opts.body.tenantId ?? null,
        toolIds: [],
      });
    }

    const plan = routePilotIntent(opts.body.message);
    if (plan.intent === "refuse.ambiguous" || !plan.toolId) {
      return this.finishRefuse({
        code: plan.refuseCode ?? "AI_AMBIGUOUS",
        message: plan.refuseMessage ?? "Ambiguous request",
        correlationId: opts.correlationId,
        promptVersion,
        started,
        tenantId: opts.body.tenantId ?? null,
        toolIds: [],
      });
    }

    const toolId = plan.toolId as AiToolId;
    const fetchedAt = new Date().toISOString();
    const exec = await executeAiTool({
      toolId,
      input: plan.input ?? {},
      actor: opts.actor,
      correlationId: opts.correlationId,
      killSwitchEnabled: false,
      services: this.toolServices(),
    });

    if (!exec.ok) {
      const code =
        exec.code === "AI_TOOL_FORBIDDEN"
          ? "AI_UNAUTHORIZED"
          : exec.code === "AI_KILL_SWITCH"
            ? "AI_KILL_SWITCH"
            : "AI_FACT_UNAVAILABLE";
      return this.finishRefuse({
        code,
        message: exec.message,
        correlationId: opts.correlationId,
        promptVersion,
        started,
        tenantId: opts.body.tenantId ?? null,
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
        started,
        tenantId: opts.body.tenantId ?? null,
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
      modelId: AI_DETERMINISTIC_MODEL_ID,
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
      tenantId: opts.body.tenantId ?? null,
      latencyMs,
      outcome: "ok",
      tokensUsed: null,
      costCentsEstimate: null,
      toolIds: [toolId],
      promptVersion,
      modelId: AI_DETERMINISTIC_MODEL_ID,
    });
    return parsed.data;
  }

  private finishRefuse(opts: {
    code: AiPilotReply["code"];
    message: string;
    correlationId: string;
    promptVersion: string;
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
      modelId: AI_DETERMINISTIC_MODEL_ID,
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
      modelId: AI_DETERMINISTIC_MODEL_ID,
      refuseCode: opts.code,
    });
    return parsed.data;
  }
}
