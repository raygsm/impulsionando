import { Inject, Injectable } from "@nestjs/common";
import {
  AiCapabilitiesEnvelopeSchema,
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
import { TenantsService } from "../tenants/tenants.service";
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
   * Phase 6C — tool-grounded pilot chat (deterministic synthesizer).
   * Phase 6D additive: when body.tenantId is present, optionally resolve agent config.
   * Pilot does not yet consume agentConfig (merge note for …-phase6cf) — resolve is
   * side-effect free and must not break chat when seed is absent.
   */
  async runChat(opts: {
    actor: AuthUser;
    body: AiChatRequestBody;
    correlationId: string;
  }): Promise<AiPilotReply> {
    if (opts.body.tenantId) {
      // Optional resolve — peek only (membership recheck lives on GET /agents/:tenantId).
      void this.agents.peekConfigForTenant(opts.body.tenantId);
    }
    return this.pilot.runPilotChat(opts);
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
