import { Inject, Injectable } from "@nestjs/common";
import {
  AI_SCHEMA_VERSION,
  AiCapabilitiesEnvelopeSchema,
  AiPilotReplySchema,
  AiToolsEnvelopeSchema,
  assertNoSecretFields,
  buildDefaultCapabilities,
  type AiCapabilitiesEnvelope,
  type AiChatRequestBody,
  type AiMetricsEnvelope,
  type AiPilotReply,
  type AiPolicyEnvelope,
  type AiTenantAgentConfig,
  type AiToolsEnvelope,
} from "@impulsionando/contracts";
import { AiPolicyService } from "./ai-policy.service";
import { AiPilotService } from "./ai-pilot.service";
import { AiTelemetryService } from "./ai-telemetry.service";
import { AiAgentService } from "./ai-agent.service";
import {
  StubOpenAiCompatibleAdapter,
  type AiProviderAdapter,
} from "./ai-provider.adapter";
import { executeAiTool, listRegisteredTools, type AiToolServices } from "./tools/registry";
import { SupportService } from "../support/support.service";
import { TenantsService, TenantAccessDeniedError } from "../tenants/tenants.service";
import { JourneysService } from "../journeys/journeys.service";
import type { AuthUser } from "../auth/auth.types";

@Injectable()
export class AiService {
  private readonly provider: AiProviderAdapter;

  constructor(
    @Inject(AiPolicyService) private readonly policy: AiPolicyService,
    @Inject(AiPilotService) private readonly pilot: AiPilotService,
    @Inject(AiTelemetryService) private readonly telemetry: AiTelemetryService,
    @Inject(AiAgentService) private readonly agents: AiAgentService,
    @Inject(SupportService) private readonly support: SupportService,
    @Inject(TenantsService) private readonly tenants: TenantsService,
    @Inject(JourneysService) private readonly journeys: JourneysService,
  ) {
    this.provider = new StubOpenAiCompatibleAdapter(() =>
      this.policy.isKillSwitchEnabled(),
    );
  }

  private toolServices(): AiToolServices {
    return {
      support: this.support,
      tenants: this.tenants,
      journeys: this.journeys,
    };
  }

  getCapabilities(): AiCapabilitiesEnvelope {
    const envelope = buildDefaultCapabilities({
      killSwitchEnabled: this.policy.isKillSwitchEnabled(),
      chatEnabled: this.policy.isChatEnabled(),
      capabilityAllowlist: this.policy.getCapabilityAllowlist(),
    });
    const parsed = AiCapabilitiesEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      throw new Error("AI_CAPABILITIES_INVALID");
    }
    assertNoSecretFields(parsed.data);
    return parsed.data;
  }

  getPolicy(): AiPolicyEnvelope {
    return this.policy.getPolicy();
  }

  getTools(): AiToolsEnvelope {
    const envelope = listRegisteredTools();
    const parsed = AiToolsEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      throw new Error("AI_TOOLS_INVALID");
    }
    assertNoSecretFields(parsed.data);
    return parsed.data;
  }

  getMetrics(): AiMetricsEnvelope {
    return this.telemetry.getMetrics();
  }

  /**
   * Phase 6D — resolve seeded tenant agent (membership rechecked in AiAgentService).
   * Returns null when no agent configured for tenant → controller maps to 404.
   */
  async getTenantAgent(opts: {
    actorUserId: string;
    tenantId: string;
  }): Promise<AiTenantAgentConfig | null> {
    return this.agents.resolveForTenant(opts);
  }

  /**
   * Phase 6C — tool-grounded pilot chat.
   * Phase 6D — when body.tenantId is present, membership is rechecked and
   * seeded agent config (if any) is applied by the pilot.
   */
  async runChat(opts: {
    actor: AuthUser;
    body: AiChatRequestBody;
    correlationId: string;
  }): Promise<AiPilotReply> {
    let agentConfig: AiTenantAgentConfig | null = null;
    if (opts.body.tenantId) {
      try {
        agentConfig = await this.agents.resolveForTenant({
          actorUserId: opts.actor.id,
          tenantId: opts.body.tenantId,
        });
      } catch (err) {
        if (err instanceof TenantAccessDeniedError) {
          const started = Date.now();
          const refuse: AiPilotReply = {
            schemaVersion: AI_SCHEMA_VERSION,
            refused: true,
            code: "AI_UNAUTHORIZED",
            message: "Actor is not a member of the requested tenant",
            answer: null,
            sources: [],
            promptVersion: "pilot-v1",
            modelId: "deterministic-pilot-v1",
            correlationId: opts.correlationId,
            tokensUsed: null,
            latencyMs: Date.now() - started,
          };
          const parsed = AiPilotReplySchema.safeParse(refuse);
          if (!parsed.success) throw new Error("AI_CHAT_AUTH_REFUSE_INVALID");
          assertNoSecretFields(parsed.data);
          return parsed.data;
        }
        throw err;
      }
    }
    return this.pilot.runPilotChat({
      ...opts,
      agentConfig,
    });
  }

  getProvider(): AiProviderAdapter {
    return this.provider;
  }

  async runTool(opts: {
    toolId: string;
    input: unknown;
    actor: AuthUser;
    correlationId: string;
  }) {
    return executeAiTool({
      ...opts,
      killSwitchEnabled: this.policy.isKillSwitchEnabled(),
      services: this.toolServices(),
    });
  }
}
