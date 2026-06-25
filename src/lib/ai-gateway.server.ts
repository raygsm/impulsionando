import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getLovableLegacyApiKey } from "@/lib/lovable-legacy.server";

export interface CoreAiRestConfig {
  baseURL: string;
  headers: Record<string, string>;
  source: "core" | "lovable-legacy";
}

export function createCoreAiGatewayProvider(apiKey: string, baseURL = "https://api.openai.com/v1") {
  return createOpenAICompatible({
    name: "impulsionando-core-ai",
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export function resolveCoreAiGateway() {
  const coreApiKey = process.env.CORE_AI_API_KEY;
  if (coreApiKey) {
    return {
      provider: createCoreAiGatewayProvider(coreApiKey, process.env.CORE_AI_BASE_URL || undefined),
      source: "core" as const,
    };
  }

  const lovableApiKey = getLovableLegacyApiKey();
  if (lovableApiKey) {
    return {
      provider: createLovableAiGatewayProvider(lovableApiKey),
      source: "lovable-legacy" as const,
    };
  }

  return { provider: null, source: null };
}

export function resolveCoreAiRestConfig(): CoreAiRestConfig | null {
  const coreApiKey = process.env.CORE_AI_API_KEY;
  if (coreApiKey) {
    return {
      baseURL: process.env.CORE_AI_BASE_URL || "https://api.openai.com/v1",
      headers: {
        Authorization: `Bearer ${coreApiKey}`,
      },
      source: "core",
    };
  }

  const lovableApiKey = getLovableLegacyApiKey();
  if (lovableApiKey) {
    return {
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Lovable-API-Key": lovableApiKey,
      },
      source: "lovable-legacy",
    };
  }

  return null;
}
