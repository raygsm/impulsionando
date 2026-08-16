/**
 * Camada de Provedores LLM — server-only.
 *
 * Cada cliente pode exigir provedor estrito sem alterar o comportamento
 * dos demais clientes. Quando allowFallback=false, somente o provedor
 * explicitamente solicitado é considerado.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { LlmConfig, LlmProviderId } from "./types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

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

function tryProvider(id: LlmProviderId, requestedModel: string | undefined): ResolvedProvider | null {
  const modelId = requestedModel && requestedModel.trim() ? requestedModel.trim() : DEFAULT_MODEL_BY_PROVIDER[id];

  if (id === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    const provider = createOpenAICompatible({
      name: "openai",
      baseURL: "https://api.openai.com/v1",
      headers: { Authorization: `Bearer ${key}` },
    });
    return { provider: "openai", model: provider(modelId), modelId };
  }

  if (id === "gemini") {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return null;
    const provider = createLovableAiGatewayProvider(key);
    const finalId = modelId.startsWith("google/") ? modelId : DEFAULT_MODEL_BY_PROVIDER.gemini;
    return { provider: "gemini", model: provider(finalId), modelId: finalId };
  }

  return null;
}

export interface ResolveOptions {
  llm?: Partial<LlmConfig>;
  /**
   * false = fail closed no provedor solicitado. Útil para clientes que
   * proíbem fallback por política, como a RioMed.
   */
  allowFallback?: boolean;
}

export function resolveProvider(opts: ResolveOptions = {}): ResolvedProvider {
  const requested: LlmProviderId = opts.llm?.provider ?? "openai";
  const model = opts.llm?.model;

  if (opts.allowFallback === false) {
    const resolved = tryProvider(requested, model);
    if (resolved) return resolved;
    throw new Error(`llm_provider_unavailable:${requested}`);
  }

  const fallback: LlmProviderId[] = opts.llm?.fallback ?? ["gemini"];
  const chain: LlmProviderId[] = [];
  const seen = new Set<LlmProviderId>();
  for (const id of [requested, ...fallback, "openai", "gemini"] as LlmProviderId[]) {
    if (seen.has(id)) continue;
    seen.add(id);
    chain.push(id);
  }

  for (const id of chain) {
    const resolved = tryProvider(id, id === requested ? model : undefined);
    if (resolved) return resolved;
  }

  throw new Error("no_llm_provider_available");
}

export function detectAvailableProviders(): Record<LlmProviderId, boolean> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.LOVABLE_API_KEY,
    claude: false,
    ollama: false,
  };
}
