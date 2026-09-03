import { Inject, Injectable } from "@nestjs/common";
import {
  AI_DEFAULT_PROMPT_VERSION,
  AI_DEFAULT_TENANT_AGENT_ID,
  AI_DETERMINISTIC_MODEL_ID,
  AI_ENV_NAMES,
  AiTenantAgentConfigSchema,
  assertNoSecretFields,
  buildSeededTenantAgentConfig,
  isTruthyEnv,
  parseTenantAgentAllowlist,
  type AiTenantAgentConfig,
} from "@impulsionando/contracts";
import { TenantsService, TenantAccessDeniedError } from "../tenants/tenants.service";

/**
 * Phase 6D — first tenant agent instance on the shared gateway.
 * Seeds one Impulsionito-oriented READ-only config from env names (no secrets).
 * Full RAG / multi-agent catalog is out of scope.
 */
@Injectable()
export class AiAgentService {
  constructor(@Inject(TenantsService) private readonly tenants: TenantsService) {}

  /**
   * Build the staging seed config from process.env (names documented in AI_ENV_NAMES).
   * Returns null when AI_TENANT_AGENT_TENANT_ID is unset or not a UUID-shaped string.
   */
  getSeededConfig(): AiTenantAgentConfig | null {
    const tenantId = process.env[AI_ENV_NAMES.AI_TENANT_AGENT_TENANT_ID]?.trim();
    if (!tenantId || !UUID_RE.test(tenantId)) {
      return null;
    }

    const agentId =
      process.env[AI_ENV_NAMES.AI_TENANT_AGENT_ID]?.trim() || AI_DEFAULT_TENANT_AGENT_ID;
    const promptVersion =
      process.env[AI_ENV_NAMES.AI_TENANT_AGENT_PROMPT_VERSION]?.trim() ||
      process.env[AI_ENV_NAMES.AI_PROMPT_VERSION]?.trim() ||
      AI_DEFAULT_PROMPT_VERSION;
    const modelId =
      process.env[AI_ENV_NAMES.AI_TENANT_AGENT_MODEL_ID]?.trim() ||
      AI_DETERMINISTIC_MODEL_ID;
    const enabled = isTruthyEnv(process.env[AI_ENV_NAMES.AI_TENANT_AGENT_ENABLED]);
    const capabilityAllowlist = parseTenantAgentAllowlist(
      process.env[AI_ENV_NAMES.AI_TENANT_AGENT_CAPABILITY_ALLOWLIST],
    );

    const config = buildSeededTenantAgentConfig({
      tenantId,
      agentId,
      enabled,
      promptVersion,
      modelId,
      capabilityAllowlist,
    });

    const parsed = AiTenantAgentConfigSchema.safeParse(config);
    if (!parsed.success) {
      return null;
    }
    assertNoSecretFields(parsed.data);
    return parsed.data;
  }

  /** Lookup seeded config by tenantId (no auth). Null when no seed or mismatch. */
  peekConfigForTenant(tenantId: string): AiTenantAgentConfig | null {
    const seeded = this.getSeededConfig();
    if (!seeded || seeded.tenantId !== tenantId) {
      return null;
    }
    return seeded;
  }

  /**
   * Auth-gated resolve: membership recheck via TenantsService, then seeded config.
   * Throws TenantAccessDeniedError on membership failure.
   * Returns null when membership ok but no agent configured for tenant (→ 404).
   */
  async resolveForTenant(opts: {
    actorUserId: string;
    tenantId: string;
  }): Promise<AiTenantAgentConfig | null> {
    await this.tenants.assertMembership(opts.actorUserId, opts.tenantId);
    return this.peekConfigForTenant(opts.tenantId);
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
