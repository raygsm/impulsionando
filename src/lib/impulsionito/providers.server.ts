/**
 * Camada de Provedores LLM — server-only.
 *
 * O ecossistema Impulsionando usa OpenAI como provedor canônico de produção.
 * Configurações históricas de outros provedores permanecem tipadas apenas para
 * compatibilidade de dados legados, mas não são resolvidas em runtime.
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

function tryProvider(
  id: LlmProviderId,
  requestedModel: string | undefined,
  credentials: ProviderCredentialOverrides = {},
): ResolvedProvider | null {
  if (id !== "openai") return null;

  const modelId = requestedModel && requestedModel.trim()
    ? requestedModel.trim()
    : DEFAULT_MODEL_BY_PROVIDER.openai;
  const key = credentials.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const provider = createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${key}` },
  });

  return { provider: "openai", model: provider(modelId), modelId };
}

export interface ResolveOptions {
  llm?: Partial<LlmConfig>;
  /** false = fail closed no provedor solicitado. */
  allowFallback?: boolean;
  /** Credencial OpenAI específica do cliente/instância. Nunca expor no client. */
  openaiApiKey?: string;
}

export function resolveProvider(opts: ResolveOptions = {}): ResolvedProvider {
  const requested: LlmProviderId = opts.llm?.provider ?? "openai";
  const model = opts.llm?.model;
  const credentials = { openaiApiKey: opts.openaiApiKey };

  if (opts.allowFallback === false) {
    const resolved = tryProvider(requested, model, credentials);
    if (resolved) return resolved;
    throw new Error(`llm_provider_unavailable:${requested}`);
  }

  const requestedResolved = tryProvider(requested, model, credentials);
  if (requestedResolved) return requestedResolved;

  const openaiResolved = tryProvider("openai", requested === "openai" ? model : undefined, credentials);
  if (openaiResolved) return openaiResolved;

  throw new Error("no_llm_provider_available");
}

export function detectAvailableProviders(): Record<LlmProviderId, boolean> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: false,
    claude: false,
    ollama: false,
  };
}
