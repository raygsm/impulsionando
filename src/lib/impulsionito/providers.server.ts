/**
 * Camada de Provedores LLM — server-only.
 *
 * Ordem de resolução:
 *   1. Provedor pedido pelo cliente (llm.provider) — se a chave existir.
 *   2. Cadeia de fallback declarada pelo cliente (llm.fallback[]) — em ordem.
 *   3. OpenAI se OPENAI_API_KEY existir.
 *   4. Gemini via provedor direto de IA (OPENAI_API_KEY) — sempre disponível
 *      neste projeto (chave provisionada pelo Lovable).
 *
 * "Claude" e "Ollama" ficam declarados como IDs mas ainda não instanciam
 * modelo — retornam null e a cadeia segue para o próximo provedor. Isso
 * permite trocar o provedor ativo apenas pela UI (Centro de Inteligência
 * → Configurações → Motor LLM) sem tocar em código.
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
    const key = (process.env.OPENAI_COMPATIBLE_API_KEY ?? process.env.OPENAI_API_KEY);
    if (!key) return null;
    const provider = createLovableAiGatewayProvider(key);
    // Se o cliente pediu "gpt-*", cai no default do Gemini.
    const finalId = modelId.startsWith("google/") ? modelId : DEFAULT_MODEL_BY_PROVIDER.gemini;
    return { provider: "gemini", model: provider(finalId), modelId: finalId };
  }

  // Claude e Ollama: reservados. Retornam null para que o chain siga.
  return null;
}

export interface ResolveOptions {
  llm?: Partial<LlmConfig>;
}

/**
 * Resolve o provedor real que atenderá a requisição, aplicando fallback.
 * Lança se nenhum provedor estiver disponível (nem OpenAI nem Gemini).
 */
export function resolveProvider(opts: ResolveOptions = {}): ResolvedProvider {
  const requested: LlmProviderId = opts.llm?.provider ?? "openai";
  const fallback: LlmProviderId[] = opts.llm?.fallback ?? ["gemini"];
  const model = opts.llm?.model;

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

/** Introspecção usada pelo endpoint /api/public/health (leitura em backend). */
export function detectAvailableProviders(): Record<LlmProviderId, boolean> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!(process.env.OPENAI_COMPATIBLE_API_KEY ?? process.env.OPENAI_API_KEY),
    claude: false,
    ollama: false,
  };
}
