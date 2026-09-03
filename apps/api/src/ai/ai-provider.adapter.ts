/**
 * Phase 6A — OpenAI-compatible provider adapter interface.
 * Kill-switch short-circuits before any network call. Stub OK for 6A (no real invoke required).
 * Never put service-role keys or secrets in prompts.
 */
export type AiProviderChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiProviderChatRequest = {
  model: string;
  messages: AiProviderChatMessage[];
  maxTokens?: number;
  correlationId: string;
};

export type AiProviderChatResult =
  | { ok: true; content: string; model: string; usage?: { promptTokens?: number; completionTokens?: number } }
  | { ok: false; code: "AI_KILL_SWITCH" | "AI_PROVIDER_STUB" | "AI_PROVIDER_ERROR"; message: string };

export interface AiProviderAdapter {
  readonly id: "openai-compatible";
  chat(request: AiProviderChatRequest): Promise<AiProviderChatResult>;
}

/**
 * Stub adapter — never calls a remote provider.
 * Real OpenAI-compatible wiring is deferred until 6C + credentials.
 */
export class StubOpenAiCompatibleAdapter implements AiProviderAdapter {
  readonly id = "openai-compatible" as const;

  constructor(private readonly killSwitchEnabled: () => boolean) {}

  async chat(request: AiProviderChatRequest): Promise<AiProviderChatResult> {
    if (this.killSwitchEnabled()) {
      return {
        ok: false,
        code: "AI_KILL_SWITCH",
        message: "AI kill switch is enabled — provider short-circuited",
      };
    }
    // No network: refuse to invent completions from a stub.
    void request;
    return {
      ok: false,
      code: "AI_PROVIDER_STUB",
      message: "Provider adapter is stubbed until Phase 6C",
    };
  }
}
