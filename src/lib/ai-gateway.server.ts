import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Compatibilidade legada: o gateway Lovable fica bloqueado por padrão para
 * produção não depender da plataforma. Configure OPENAI_COMPATIBLE_BASE_URL
 * e OPENAI_COMPATIBLE_API_KEY (ou migre chamadas para provedor direto).
 */
export function createLovableAiGatewayProvider(_lovableApiKey: string) {
  const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
  const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error("AI provider direto não configurado; Lovable AI Gateway desativado");
  }
  return createOpenAICompatible({
    name: "independent-ai",
    baseURL,
    apiKey,
  });
}
