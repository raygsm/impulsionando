import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provedor OpenAI canônico do Core — uso exclusivo server-side.
 * A credencial nunca é exposta ao cliente.
 */
export function createOpenAiGatewayProvider(openAiApiKey: string) {
  return createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
    },
  });
}
