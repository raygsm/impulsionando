/**
 * Camada de Provedores LLM — server-only.
 *
 * Regra canônica do Ecossistema Impulsionando:
 * - cada agente usa sua própria chave OpenAI;
 * - chaves de agentes ficam no Supabase Vault;
 * - agentes acessam OpenAI somente através do openai-agent-gateway;
 * - nenhuma rota de agente pode cair silenciosamente em uma chave global.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { LlmConfig, LlmProviderId } from "./types";

const DEFAULT_MODEL_BY_PROVIDER: Record<LlmProviderId, string> = {
  openai: "gpt-4o-mini",
  gemini: "google/gemini-2.5-flash",
  claude: "claude-3-5-sonnet-latest",
  ollama: "llama3.1",
};

export interface ResolvedProvider {
  provider: LlmProviderId;
  model: LanguageModel;
  modelId: string;
}

interface ProviderCredentialOverrides {
  openaiApiKey?: string;
}

function directOpenAiProvider(
  requestedModel: string | undefined,
  credentials: ProviderCredentialOverrides,
): ResolvedProvider | null {
  const key = credentials.openaiApiKey?.trim();
  if (!key) return null;
  const modelId = requestedModel?.trim() || DEFAULT_MODEL_BY_PROVIDER.openai;
  const provider = createOpenAICompatible({
    name: "openai-direct-server-only",
    baseURL: "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${key}` },
  });
  return { provider: "openai", model: provider(modelId), modelId };
}

function agentGatewayProvider(agentKey: string, requestedModel?: string): ResolvedProvider {
  const normalizedAgentKey = agentKey.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,100}$/.test(normalizedAgentKey)) {
    throw new Error("invalid_agent_key");
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("agent_gateway_supabase_credentials_unavailable");
  }

  const modelId = requestedModel?.trim() || DEFAULT_MODEL_BY_PROVIDER.openai;
  const baseURL = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/openai-agent-gateway`;
  const provider = createOpenAICompatible({
    name: `openai-${normalizedAgentKey}`,
    baseURL,
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "x-impulsionando-agent-key": normalizedAgentKey,
    },
  });

  return { provider: "openai", model: provider(modelId), modelId };
}

export interface ResolveOptions {
  llm?: Partial<LlmConfig>;
  /** false = fail closed no provedor solicitado. */
  allowFallback?: boolean;
  /** Credencial OpenAI explícita para tarefa técnica server-only, nunca para agentes. */
  openaiApiKey?: string;
  /** Identidade canônica do agente. Quando presente, obriga chave própria via Supabase Vault. */
  agentKey?: string;
}

export function resolveProvider(opts: ResolveOptions = {}): ResolvedProvider {
  const requested: LlmProviderId = opts.llm?.provider ?? "openai";
  const model = opts.llm?.model;

  if (requested !== "openai") {
    throw new Error(`llm_provider_unavailable:${requested}`);
  }

  if (opts.agentKey) {
    return agentGatewayProvider(opts.agentKey, model);
  }

  // Apenas rotinas técnicas server-only podem fornecer uma chave explícita.
  // OPENAI_API_KEY global não é mais fallback implícito para agentes.
  const direct = directOpenAiProvider(model, { openaiApiKey: opts.openaiApiKey });
  if (direct) return direct;

  throw new Error("openai_agent_key_required_or_explicit_server_key_missing");
}

export function detectAvailableProviders(): Record<LlmProviderId, boolean> {
  return {
    openai: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    gemini: false,
    claude: false,
    ollama: false,
  };
}
