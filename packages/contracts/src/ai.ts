/**
 * Phase 6A/6B — governed AI gateway + tool registry contracts.
 * Env var *names* only — never credential values. No Nest coupling.
 */
import { z } from "zod";
import { assertNoSecretFields } from "./ops";

export const AI_SCHEMA_VERSION = 1 as const;

/** Tool / action risk classes (Phase 6B). */
export const AiRiskClass = z.enum([
  "READ",
  "RECOMMEND",
  "AUTO_SAFE",
  "APPROVAL_REQUIRED",
  "FORBIDDEN",
]);
export type AiRiskClassName = z.infer<typeof AiRiskClass>;

/**
 * Environment variable *names* for AI gateway (never values).
 * Documented for operators; Nest reads via process.env[name].
 */
export const AI_ENV_NAMES = {
  /** Global kill switch — when "true"/"1", all AI chat/tool invocation refuses. */
  KILL_SWITCH: "AI_KILL_SWITCH",
  /** Per-capability allowlist CSV (empty = default deny for chat until 6C). */
  CAPABILITY_ALLOWLIST: "AI_CAPABILITY_ALLOWLIST",
  /** Max tokens per request (integer string). */
  BUDGET_MAX_TOKENS: "AI_BUDGET_MAX_TOKENS",
  /** Max USD-cents cost estimate per request (integer string). */
  BUDGET_MAX_COST_CENTS: "AI_BUDGET_MAX_COST_CENTS",
  /** Max requests per actor per minute (integer string). */
  BUDGET_RATE_PER_MINUTE: "AI_BUDGET_RATE_PER_MINUTE",
  /** Provider API key — name only; value never in contracts/responses. */
  OPENAI_API_KEY: "OPENAI_API_KEY",
  /** Optional OpenAI-compatible base URL. */
  OPENAI_BASE_URL: "OPENAI_BASE_URL",
  /** Default model id (non-secret). */
  AI_MODEL: "AI_MODEL",
  /** Enable chat endpoint beyond refuse stub ("true"/"1"). Default off for 6A. */
  AI_CHAT_ENABLED: "AI_CHAT_ENABLED",
  /** Prompt/version marker for pilot replies (non-secret string). */
  AI_PROMPT_VERSION: "AI_PROMPT_VERSION",
  /** Enable in-process telemetry recording ("true"/"1"). Default on when unset for 6F. */
  AI_TELEMETRY_ENABLED: "AI_TELEMETRY_ENABLED",
  /** Phase 6D — staging seed tenant UUID for the first Impulsionito agent instance. */
  AI_TENANT_AGENT_TENANT_ID: "AI_TENANT_AGENT_TENANT_ID",
  /** Phase 6D — agent id string (e.g. impulsionito). */
  AI_TENANT_AGENT_ID: "AI_TENANT_AGENT_ID",
  /** Phase 6D — enable seeded tenant agent ("true"/"1"). */
  AI_TENANT_AGENT_ENABLED: "AI_TENANT_AGENT_ENABLED",
  /** Phase 6D — per-agent prompt version override (non-secret). */
  AI_TENANT_AGENT_PROMPT_VERSION: "AI_TENANT_AGENT_PROMPT_VERSION",
  /** Phase 6D — per-agent model id override (non-secret). */
  AI_TENANT_AGENT_MODEL_ID: "AI_TENANT_AGENT_MODEL_ID",
  /** Phase 6D — CSV capability/tool allowlist for the seeded agent. */
  AI_TENANT_AGENT_CAPABILITY_ALLOWLIST: "AI_TENANT_AGENT_CAPABILITY_ALLOWLIST",
} as const;

/** Deterministic Impulsionito-oriented pilot model id (no live LLM in 6C). */
export const AI_DETERMINISTIC_MODEL_ID = "deterministic-pilot-v1" as const;
export const AI_DEFAULT_PROMPT_VERSION = "pilot-v1" as const;
/** Default agent id for the first tenant agent (Impulsionito-oriented READ pilot). */
export const AI_DEFAULT_TENANT_AGENT_ID = "impulsionito" as const;

/**
 * Default READ-only capability/tool allowlist for the Impulsionito staging seed.
 * Static — no secrets; FORBIDDEN tools never listed.
 */
export const AI_DEFAULT_TENANT_AGENT_ALLOWLIST = [
  "ai.capabilities",
  "ai.policy",
  "ai.tools.list",
  "ai.tools.read",
  "ai.chat",
  "support.tickets.list",
  "support.tickets.get",
  "tenants.resolve_by_host",
  "tenants.resolve_active_context",
  "journeys.get_by_id",
] as const;

export type AiEnvName = (typeof AI_ENV_NAMES)[keyof typeof AI_ENV_NAMES];

export const AiBudgetEnvelopeSchema = z.object({
  maxTokensPerRequest: z.number().int().positive().nullable(),
  maxCostCentsPerRequest: z.number().int().nonnegative().nullable(),
  ratePerMinute: z.number().int().positive().nullable(),
});
export type AiBudgetEnvelope = z.infer<typeof AiBudgetEnvelopeSchema>;

export const AiKillSwitchSchema = z.object({
  enabled: z.boolean(),
  /** Env name that controls the switch (never the value). */
  envName: z.literal(AI_ENV_NAMES.KILL_SWITCH),
});
export type AiKillSwitch = z.infer<typeof AiKillSwitchSchema>;

export const AiPolicyEnvelopeSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  scrapedAt: z.string().datetime(),
  killSwitch: AiKillSwitchSchema,
  budgets: AiBudgetEnvelopeSchema,
  chatEnabled: z.boolean(),
  /** Env *names* referenced by this policy surface. */
  policyEnvNames: z.array(z.string().min(1)),
});
export type AiPolicyEnvelope = z.infer<typeof AiPolicyEnvelopeSchema>;

export const AiCapabilityIdSchema = z.enum([
  "ai.capabilities",
  "ai.policy",
  "ai.tools.list",
  "ai.chat",
  "ai.tools.read",
]);
export type AiCapabilityId = z.infer<typeof AiCapabilityIdSchema>;

export const AiCapabilityRowSchema = z.object({
  id: AiCapabilityIdSchema,
  enabled: z.boolean(),
  riskClass: AiRiskClass,
  description: z.string().min(1),
});
export type AiCapabilityRow = z.infer<typeof AiCapabilityRowSchema>;

export const AiCapabilitiesEnvelopeSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  scrapedAt: z.string().datetime(),
  killSwitchEnabled: z.boolean(),
  capabilities: z.array(AiCapabilityRowSchema),
  providerAdapter: z.literal("openai-compatible"),
  credentialEnvNames: z.array(z.string().min(1)),
});
export type AiCapabilitiesEnvelope = z.infer<typeof AiCapabilitiesEnvelopeSchema>;

/**
 * Server-side chat context assembly shape.
 * Assembled only on the server — never accept these fields from the client trust boundary.
 */
export const AiChatContextAssemblySchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  actorUserId: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  correlationId: z.string().min(1),
  capabilityIds: z.array(AiCapabilityIdSchema),
  /** Model/prompt version markers for traceability (non-secret). */
  modelId: z.string().min(1).nullable(),
  promptVersion: z.string().min(1).nullable(),
  /** Freshness / degrade flags for 6C — placeholders in 6A. */
  sourceFreshness: z
    .object({
      assembledAt: z.string().datetime(),
      degraded: z.boolean(),
      reason: z.string().nullable().optional(),
    })
    .optional(),
});
export type AiChatContextAssembly = z.infer<typeof AiChatContextAssemblySchema>;

export const AiChatRefuseCodeSchema = z.enum([
  "AI_CHAT_NOT_ENABLED",
  "AI_POLICY_REFUSED",
  "AI_KILL_SWITCH",
  "AI_BUDGET_EXCEEDED",
  "AI_TOOL_FORBIDDEN",
  "AI_CAPABILITY_DENIED",
  "AI_FACT_UNAVAILABLE",
  "AI_UNAUTHORIZED",
  "AI_AMBIGUOUS",
]);
export type AiChatRefuseCode = z.infer<typeof AiChatRefuseCodeSchema>;

export const AiChatRefuseSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  refused: z.literal(true),
  code: AiChatRefuseCodeSchema,
  message: z.string().min(1),
  correlationId: z.string().min(1),
});
export type AiChatRefuse = z.infer<typeof AiChatRefuseSchema>;

export const AiChatRequestBodySchema = z
  .object({
    message: z.string().trim().min(1).max(8000),
    tenantId: z.string().uuid().optional(),
    /** Client must not send assembled context; rejected if present. */
  })
  .strict();
export type AiChatRequestBody = z.infer<typeof AiChatRequestBodySchema>;

/* --- Phase 6D — first tenant agent instance (shared gateway, READ ceiling) --- */

/**
 * One configured tenant agent on the shared AI gateway.
 * Impulsionito-oriented READ-only MVP — not full RAG product.
 */
export const AiTenantAgentConfigSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  agentId: z.string().min(1).max(64),
  capabilityAllowlist: z.array(z.string().min(1)).min(1),
  promptVersion: z.string().min(1),
  modelId: z.string().min(1),
  enabled: z.boolean(),
  /** 6D MVP: risk ceiling fixed at READ (no writes / gated effects). */
  riskCeiling: z.literal("READ"),
  /** Env *names* used to seed this config (never credential values). */
  configEnvNames: z.array(z.string().min(1)),
});
export type AiTenantAgentConfig = z.infer<typeof AiTenantAgentConfigSchema>;

/** Parse CSV allowlist from env; empty/missing → default Impulsionito READ allowlist. */
export function parseTenantAgentAllowlist(raw: string | undefined): string[] {
  if (!raw || raw.trim() === "") {
    return [...AI_DEFAULT_TENANT_AGENT_ALLOWLIST];
  }
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : [...AI_DEFAULT_TENANT_AGENT_ALLOWLIST];
}

/**
 * Build a seeded tenant agent config from env *values* read by Nest
 * (contracts only document names + pure helpers — no process.env here).
 */
export function buildSeededTenantAgentConfig(opts: {
  tenantId: string;
  agentId?: string;
  enabled?: boolean;
  promptVersion?: string;
  modelId?: string;
  capabilityAllowlist?: string[];
}): AiTenantAgentConfig {
  return {
    schemaVersion: AI_SCHEMA_VERSION,
    tenantId: opts.tenantId,
    agentId: opts.agentId?.trim() || AI_DEFAULT_TENANT_AGENT_ID,
    capabilityAllowlist:
      opts.capabilityAllowlist && opts.capabilityAllowlist.length > 0
        ? opts.capabilityAllowlist
        : [...AI_DEFAULT_TENANT_AGENT_ALLOWLIST],
    promptVersion: opts.promptVersion?.trim() || AI_DEFAULT_PROMPT_VERSION,
    modelId: opts.modelId?.trim() || AI_DETERMINISTIC_MODEL_ID,
    enabled: opts.enabled ?? false,
    riskCeiling: "READ",
    configEnvNames: [
      AI_ENV_NAMES.AI_TENANT_AGENT_TENANT_ID,
      AI_ENV_NAMES.AI_TENANT_AGENT_ID,
      AI_ENV_NAMES.AI_TENANT_AGENT_ENABLED,
      AI_ENV_NAMES.AI_TENANT_AGENT_PROMPT_VERSION,
      AI_ENV_NAMES.AI_TENANT_AGENT_MODEL_ID,
      AI_ENV_NAMES.AI_TENANT_AGENT_CAPABILITY_ALLOWLIST,
    ],
  };
}

/** Tool registry metadata (ids + risk — no secrets). */
export const AiToolIdSchema = z.enum([
  "support.tickets.list",
  "support.tickets.get",
  "tenants.resolve_by_host",
  "tenants.resolve_active_context",
  "journeys.get_by_id",
  /**
   * Phase 6E — APPROVAL_REQUIRED stub. Never executable via tool registry;
   * must go through /api/v1/ai/effects approval gate.
   */
  "effect.gated.noop",
  /** Explicitly registered FORBIDDEN stubs — never executable. */
  "forbidden.arbitrary_sql",
  "forbidden.unrestricted_http",
  "forbidden.service_role_expose",
]);
export type AiToolId = z.infer<typeof AiToolIdSchema>;

/* --- Phase 6C pilot reply + intent routing --- */

export const AiPilotIntentSchema = z.enum([
  "support.list",
  "support.get",
  "tenant.host",
  "journey.get",
  "refuse.ambiguous",
]);
export type AiPilotIntent = z.infer<typeof AiPilotIntentSchema>;

export const AiPilotToolPlanSchema = z.object({
  intent: AiPilotIntentSchema,
  toolId: AiToolIdSchema.nullable(),
  input: z.record(z.unknown()).nullable(),
  refuseCode: AiChatRefuseCodeSchema.optional(),
  refuseMessage: z.string().optional(),
});
export type AiPilotToolPlan = z.infer<typeof AiPilotToolPlanSchema>;

export const AiPilotSourceSchema = z.object({
  toolId: AiToolIdSchema,
  fetchedAt: z.string().datetime(),
  degraded: z.boolean(),
  reason: z.string().nullable().optional(),
});
export type AiPilotSource = z.infer<typeof AiPilotSourceSchema>;

export const AiPilotReplySchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  refused: z.boolean(),
  code: AiChatRefuseCodeSchema.optional(),
  message: z.string().min(1).optional(),
  answer: z.string().nullable(),
  sources: z.array(AiPilotSourceSchema),
  promptVersion: z.string().min(1),
  modelId: z.literal(AI_DETERMINISTIC_MODEL_ID),
  correlationId: z.string().min(1),
  tokensUsed: z.number().int().nonnegative().nullable(),
  latencyMs: z.number().nonnegative().nullable(),
});
export type AiPilotReply = z.infer<typeof AiPilotReplySchema>;

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const HOST_RE =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/i;

/**
 * Server-side intent router (pure). Never invents facts — only picks a tool plan or refuse.
 */
export function routePilotIntent(message: string): AiPilotToolPlan {
  const text = message.trim().toLowerCase();
  const uuidMatch = message.match(UUID_RE);
  const hostMatch = message.match(HOST_RE);
  const allIds = [...message.matchAll(new RegExp(UUID_RE.source, "gi"))].map((m) => m[0]);

  if (/\bjourney\b/.test(text) && allIds.length >= 2) {
    return {
      intent: "journey.get",
      toolId: "journeys.get_by_id",
      input: { journeyId: allIds[0], tenantId: allIds[1] },
    };
  }

  if (/\b(ticket|support)\b/.test(text) && uuidMatch && /\b(get|show|detail|status)\b/.test(text)) {
    return {
      intent: "support.get",
      toolId: "support.tickets.get",
      input: { ticketId: uuidMatch[0] },
    };
  }

  if (/\b(list|show|my)\b/.test(text) && /\b(ticket|support)\b/.test(text)) {
    return {
      intent: "support.list",
      toolId: "support.tickets.list",
      input: { limit: 10 },
    };
  }

  if (/\b(tenant|host|hostname)\b/.test(text) && hostMatch) {
    return {
      intent: "tenant.host",
      toolId: "tenants.resolve_by_host",
      input: { host: hostMatch[0].toLowerCase() },
    };
  }

  if (/\bjourney\b/.test(text) && uuidMatch) {
    return {
      intent: "refuse.ambiguous",
      toolId: null,
      input: null,
      refuseCode: "AI_AMBIGUOUS",
      refuseMessage: "Journey lookup requires both journeyId and tenantId UUIDs",
    };
  }

  return {
    intent: "refuse.ambiguous",
    toolId: null,
    input: null,
    refuseCode: "AI_AMBIGUOUS",
    refuseMessage:
      "Ambiguous request — ask to list support tickets, get a ticket by id, resolve a tenant host, or get a journey by journeyId+tenantId",
  };
}

/**
 * Deterministic synthesis from tool JSON only — no invented fields.
 */
export function synthesizePilotAnswer(toolId: string, data: unknown): string {
  if (toolId === "support.tickets.list") {
    const tickets = (data as { tickets?: unknown[] } | null)?.tickets;
    if (!Array.isArray(tickets)) return "No ticket list available from source.";
    if (tickets.length === 0) return "No support tickets visible for this actor.";
    const lines = tickets.slice(0, 10).map((t) => {
      const row = t as { id?: string; protocol?: string; status?: string; subject?: string };
      return `- ${row.protocol ?? row.id ?? "?"} [${row.status ?? "?"}] ${row.subject ?? ""}`.trim();
    });
    return `Support tickets (from canonical API):\n${lines.join("\n")}`;
  }
  if (toolId === "support.tickets.get") {
    const row = data as {
      id?: string;
      protocol?: string;
      status?: string;
      subject?: string;
    } | null;
    if (!row?.id) return "Ticket not found in source.";
    return `Ticket ${row.protocol ?? row.id}: status=${row.status ?? "?"} subject=${row.subject ?? "(none)"}`;
  }
  if (toolId === "tenants.resolve_by_host") {
    const tenant = (data as { tenant?: { id?: string; slug?: string; name?: string } | null })
      ?.tenant;
    if (!tenant?.id) return "No tenant resolved for that host.";
    return `Tenant resolved: id=${tenant.id} slug=${tenant.slug ?? "?"} name=${tenant.name ?? "?"}`;
  }
  if (toolId === "journeys.get_by_id") {
    const j = data as { id?: string; status?: string; tenantId?: string } | null;
    if (!j?.id) return "Journey not found in source.";
    return `Journey ${j.id}: status=${j.status ?? "?"} tenantId=${j.tenantId ?? "?"}`;
  }
  return "Source returned data but no synthesizer mapping exists — refusing to invent.";
}

/* --- Phase 6F telemetry / evals / redaction --- */

export const AiTelemetryOutcomeSchema = z.enum(["ok", "refuse", "error"]);
export type AiTelemetryOutcome = z.infer<typeof AiTelemetryOutcomeSchema>;

export const AiTelemetryEventSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  recordedAt: z.string().datetime(),
  correlationId: z.string().min(1),
  capability: z.string().min(1),
  tenantId: z.string().uuid().nullable(),
  latencyMs: z.number().nonnegative(),
  outcome: AiTelemetryOutcomeSchema,
  tokensUsed: z.number().int().nonnegative().nullable(),
  costCentsEstimate: z.number().nonnegative().nullable(),
  toolIds: z.array(z.string().min(1)),
  promptVersion: z.string().min(1).nullable(),
  modelId: z.string().min(1).nullable(),
  refuseCode: AiChatRefuseCodeSchema.optional(),
});
export type AiTelemetryEvent = z.infer<typeof AiTelemetryEventSchema>;

export const AiMetricsEnvelopeSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  scrapedAt: z.string().datetime(),
  eventCount: z.number().int().nonnegative(),
  outcomes: z.object({
    ok: z.number().int().nonnegative(),
    refuse: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
  }),
  latencyMsP50: z.number().nonnegative().nullable(),
  latencyMsP95: z.number().nonnegative().nullable(),
  promptVersions: z.record(z.number().int().nonnegative()),
  modelIds: z.record(z.number().int().nonnegative()),
  retention: z.literal("in-memory-ring"),
  /** Canary/deploy automation not built — UNKNOWN. */
  canaryStatus: z.literal("UNKNOWN"),
});
export type AiMetricsEnvelope = z.infer<typeof AiMetricsEnvelopeSchema>;

export const AiEvalExpectedOutcomeSchema = z.enum(["ok", "refuse", "deny"]);
export type AiEvalExpectedOutcome = z.infer<typeof AiEvalExpectedOutcomeSchema>;

export const AiEvalCaseSchema = z.object({
  id: z.string().min(1),
  inputMessage: z.string().min(1),
  expectedOutcome: AiEvalExpectedOutcomeSchema,
  expectedRefuseCodes: z.array(AiChatRefuseCodeSchema).optional(),
  expectedIntent: AiPilotIntentSchema.optional(),
  mustNotContain: z.array(z.string().min(1)).optional(),
});
export type AiEvalCase = z.infer<typeof AiEvalCaseSchema>;

export const AI_EVAL_FIXTURES: readonly AiEvalCase[] = [
  {
    id: "eval-ambiguous",
    inputMessage: "hello what can you do?",
    expectedOutcome: "refuse",
    expectedRefuseCodes: ["AI_AMBIGUOUS"],
    expectedIntent: "refuse.ambiguous",
    mustNotContain: ["service_role", "eyJ"],
  },
  {
    id: "eval-support-list",
    inputMessage: "list my support tickets",
    expectedOutcome: "ok",
    expectedIntent: "support.list",
    mustNotContain: ["service_role", "OPENAI_API_KEY="],
  },
  {
    id: "eval-support-get",
    inputMessage: "get ticket status for 11111111-1111-4111-8111-111111111111",
    expectedOutcome: "ok",
    expectedIntent: "support.get",
  },
  {
    id: "eval-tenant-host",
    inputMessage: "resolve tenant host tenant.stg.impulsionando.com.br",
    expectedOutcome: "ok",
    expectedIntent: "tenant.host",
  },
  {
    id: "eval-journey-ambiguous",
    inputMessage: "show journey 22222222-2222-4222-8222-222222222222",
    expectedOutcome: "refuse",
    expectedRefuseCodes: ["AI_AMBIGUOUS"],
    expectedIntent: "refuse.ambiguous",
  },
] as const;

export const AiRedactionPolicySchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  /** Env *names* that must never appear as values in telemetry. */
  forbiddenValueEnvNames: z.array(z.string().min(1)),
  /** Key name substrings that trigger redaction. */
  redactKeyPatterns: z.array(z.string().min(1)),
  retentionNote: z.literal("in-memory-only-no-durable-pii-store"),
});
export type AiRedactionPolicy = z.infer<typeof AiRedactionPolicySchema>;

export const DEFAULT_AI_REDACTION_POLICY: AiRedactionPolicy = {
  schemaVersion: AI_SCHEMA_VERSION,
  forbiddenValueEnvNames: [AI_ENV_NAMES.OPENAI_API_KEY],
  redactKeyPatterns: [
    "secret",
    "password",
    "token",
    "apiKey",
    "api_key",
    "authorization",
    "serviceRole",
    "service_role",
  ],
  retentionNote: "in-memory-only-no-durable-pii-store",
};

const REDACT_KEY_RE =
  /(secret|password|token|api[_-]?key|authorization|credential|private[_-]?key|service[_-]?role)/i;

/** Deep-clone and redact secret-like keys before telemetry retention. */
export function redactAiPayload<T>(value: T, path = "$"): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item, i) => redactAiPayload(item, `${path}[${i}]`)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEY_RE.test(key) && !/EnvNames?$/i.test(key) && key !== "credentialEnvNames") {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactAiPayload(child, `${path}.${key}`);
      }
    }
    return out as T;
  }
  if (typeof value === "string" && value.startsWith("eyJ") && value.length > 40) {
    return "[REDACTED_JWT]" as T;
  }
  return value;
}

export function percentileSorted(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? null;
}

export function buildAiMetricsEnvelope(
  events: readonly AiTelemetryEvent[],
  scrapedAt = new Date().toISOString(),
): AiMetricsEnvelope {
  const outcomes = { ok: 0, refuse: 0, error: 0 };
  const promptVersions: Record<string, number> = {};
  const modelIds: Record<string, number> = {};
  const latencies: number[] = [];

  for (const e of events) {
    outcomes[e.outcome] += 1;
    latencies.push(e.latencyMs);
    if (e.promptVersion) {
      promptVersions[e.promptVersion] = (promptVersions[e.promptVersion] ?? 0) + 1;
    }
    if (e.modelId) {
      modelIds[e.modelId] = (modelIds[e.modelId] ?? 0) + 1;
    }
  }
  latencies.sort((a, b) => a - b);

  return {
    schemaVersion: AI_SCHEMA_VERSION,
    scrapedAt,
    eventCount: events.length,
    outcomes,
    latencyMsP50: percentileSorted(latencies, 50),
    latencyMsP95: percentileSorted(latencies, 95),
    promptVersions,
    modelIds,
    retention: "in-memory-ring",
    canaryStatus: "UNKNOWN",
  };
}

/** Tool registry metadata helpers (ids defined above near pilot schemas). */

export const AiToolMetaSchema = z.object({
  id: AiToolIdSchema,
  riskClass: AiRiskClass,
  description: z.string().min(1),
  /** true only for tools that may execute under policy. */
  executable: z.boolean(),
});
export type AiToolMeta = z.infer<typeof AiToolMetaSchema>;

export const AiToolsEnvelopeSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  scrapedAt: z.string().datetime(),
  tools: z.array(AiToolMetaSchema),
});
export type AiToolsEnvelope = z.infer<typeof AiToolsEnvelopeSchema>;

/** Helpers for per-tool I/O Zod shapes (registry validates at runtime). */
export const AiToolSupportListInputSchema = z
  .object({
    status: z.string().optional(),
    priority: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    cursor: z.string().optional(),
  })
  .strict();
export type AiToolSupportListInput = z.infer<typeof AiToolSupportListInputSchema>;

export const AiToolSupportGetInputSchema = z
  .object({
    ticketId: z.string().uuid(),
  })
  .strict();
export type AiToolSupportGetInput = z.infer<typeof AiToolSupportGetInputSchema>;

export const AiToolTenantResolveHostInputSchema = z
  .object({
    host: z.string().trim().min(1).max(253),
  })
  .strict();
export type AiToolTenantResolveHostInput = z.infer<
  typeof AiToolTenantResolveHostInputSchema
>;

export const AiToolTenantActiveContextInputSchema = z
  .object({
    host: z.string().trim().min(1).max(253),
  })
  .strict();
export type AiToolTenantActiveContextInput = z.infer<
  typeof AiToolTenantActiveContextInputSchema
>;

export const AiToolJourneyGetInputSchema = z
  .object({
    journeyId: z.string().uuid(),
    tenantId: z.string().uuid(),
  })
  .strict();
export type AiToolJourneyGetInput = z.infer<typeof AiToolJourneyGetInputSchema>;

/** Risk classes allowed to execute under a given policy snapshot. */
export type AiToolAllowPolicy = {
  killSwitchEnabled: boolean;
  /** When true, only READ may run (6A/6B default). */
  allowReadOnly: boolean;
  /** Explicit allow for RECOMMEND / AUTO_SAFE / APPROVAL_REQUIRED (default false). */
  allowRecommend?: boolean;
  allowAutoSafe?: boolean;
  allowApprovalRequired?: boolean;
};

/**
 * FORBIDDEN is always denied. Kill switch denies all executable tools.
 * 6A/6B: only READ when allowReadOnly.
 */
export function isToolAllowed(
  riskClass: AiRiskClassName,
  policy: AiToolAllowPolicy,
): boolean {
  if (riskClass === "FORBIDDEN") return false;
  if (policy.killSwitchEnabled) return false;
  switch (riskClass) {
    case "READ":
      return policy.allowReadOnly !== false;
    case "RECOMMEND":
      return Boolean(policy.allowRecommend);
    case "AUTO_SAFE":
      return Boolean(policy.allowAutoSafe);
    case "APPROVAL_REQUIRED":
      return Boolean(policy.allowApprovalRequired);
    default:
      return false;
  }
}

export function defaultAiToolAllowPolicy(
  killSwitchEnabled: boolean,
): AiToolAllowPolicy {
  return {
    killSwitchEnabled,
    allowReadOnly: true,
    allowRecommend: false,
    allowAutoSafe: false,
    allowApprovalRequired: false,
  };
}

/**
 * Parse AI_CAPABILITY_ALLOWLIST CSV.
 * Empty/unset → null (no extra filter; defaults from buildDefaultCapabilities apply).
 * Set → non-empty list of capability/tool ids (case-sensitive trim).
 */
export function parseCapabilityAllowlist(raw: string | undefined): string[] | null {
  if (raw === undefined || raw.trim() === "") return null;
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : null;
}

/** True when allowlist is unset (null) or explicitly includes the id. */
export function isCapabilityAllowed(
  capabilityId: string,
  allowlist: string[] | null,
): boolean {
  if (allowlist === null) return true;
  return allowlist.includes(capabilityId);
}

/**
 * Apply optional env allowlist: capabilities not listed become enabled=false.
 * Unknown ids in the allowlist are ignored (no invent).
 */
export function applyCapabilityAllowlist(
  envelope: AiCapabilitiesEnvelope,
  allowlist: string[] | null,
): AiCapabilitiesEnvelope {
  if (allowlist === null) return envelope;
  return {
    ...envelope,
    capabilities: envelope.capabilities.map((row) => ({
      ...row,
      enabled: row.enabled && allowlist.includes(row.id),
    })),
  };
}

/** Rough token estimate for budget gates (deterministic pilot — no provider usage). */
export function estimatePromptTokens(message: string): number {
  const trimmed = message.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

/**
 * Pure budget gate for one chat request.
 * rateCountInWindow = requests already counted for this actor in the last minute (excluding this one).
 */
export function evaluateChatBudget(opts: {
  budgets: AiBudgetEnvelope;
  message: string;
  rateCountInWindow: number;
}): { ok: true } | { ok: false; code: "AI_BUDGET_EXCEEDED"; message: string } {
  const tokens = estimatePromptTokens(opts.message);
  if (
    opts.budgets.maxTokensPerRequest !== null &&
    tokens > opts.budgets.maxTokensPerRequest
  ) {
    return {
      ok: false,
      code: "AI_BUDGET_EXCEEDED",
      message: `Token estimate ${tokens} exceeds maxTokensPerRequest ${opts.budgets.maxTokensPerRequest}`,
    };
  }
  if (
    opts.budgets.ratePerMinute !== null &&
    opts.rateCountInWindow >= opts.budgets.ratePerMinute
  ) {
    return {
      ok: false,
      code: "AI_BUDGET_EXCEEDED",
      message: `Rate limit ${opts.budgets.ratePerMinute}/min exceeded`,
    };
  }
  // Deterministic pilot cost is 0 — maxCostCents only blocks when estimate would be positive.
  return { ok: true };
}

/** Whether a tool id is permitted by a tenant-agent allowlist (explicit ids). */
export function isToolIdOnAllowlist(toolId: string, allowlist: readonly string[]): boolean {
  if (allowlist.includes(toolId)) return true;
  // Blanket READ tools capability covers registered READ tool ids when listed.
  if (allowlist.includes("ai.tools.read") && !toolId.startsWith("forbidden.")) {
    return (
      toolId.startsWith("support.") ||
      toolId.startsWith("tenants.") ||
      toolId.startsWith("journeys.")
    );
  }
  return false;
}

export function buildDefaultCapabilities(
  opts: {
    killSwitchEnabled: boolean;
    chatEnabled: boolean;
    scrapedAt?: string;
    /** When set, capabilities not listed are enabled=false. */
    capabilityAllowlist?: string[] | null;
  },
): AiCapabilitiesEnvelope {
  const scrapedAt = opts.scrapedAt ?? new Date().toISOString();
  const base: AiCapabilitiesEnvelope = {
    schemaVersion: AI_SCHEMA_VERSION,
    scrapedAt,
    killSwitchEnabled: opts.killSwitchEnabled,
    providerAdapter: "openai-compatible",
    credentialEnvNames: [
      AI_ENV_NAMES.OPENAI_API_KEY,
      AI_ENV_NAMES.OPENAI_BASE_URL,
      AI_ENV_NAMES.AI_MODEL,
    ],
    capabilities: [
      {
        id: "ai.capabilities",
        enabled: true,
        riskClass: "READ",
        description: "List AI gateway capabilities",
      },
      {
        id: "ai.policy",
        enabled: true,
        riskClass: "READ",
        description: "Read kill switch and budget policy",
      },
      {
        id: "ai.tools.list",
        enabled: true,
        riskClass: "READ",
        description: "List registered tools metadata",
      },
      {
        id: "ai.tools.read",
        enabled: !opts.killSwitchEnabled,
        riskClass: "READ",
        description: "Execute READ-class tools with auth recheck",
      },
      {
        id: "ai.chat",
        enabled: opts.chatEnabled && !opts.killSwitchEnabled,
        riskClass: "RECOMMEND",
        description: "Chat — deterministic READ pilot (6C) when AI_CHAT_ENABLED",
      },
    ],
  };
  return applyCapabilityAllowlist(base, opts.capabilityAllowlist ?? null);
}

export function parsePositiveIntEnv(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parseNonNegativeIntEnv(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function isTruthyEnv(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** Re-export ops helper for AI payloads (same secret-key deny list). */
export { assertNoSecretFields };
