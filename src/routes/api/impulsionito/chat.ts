/**
 * /api/impulsionito/chat — endpoint HTTP de streaming do Impulsionito.
 *
 * O ledger omnichannel é a fonte persistente da conversa. O navegador envia
 * somente uma identidade anônima de sessão; qualquer união futura com outra
 * identidade/canal exige verificação explícita no backend.
 */
import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import { streamText, type ModelMessage } from "ai";
import { assemblePrompt } from "@/lib/impulsionito/context-engine.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import type { ImpulsionitoChatRequestBody, ImpulsionitoWireMessage } from "@/lib/impulsionito/types";
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
  type InboundLedger,
} from "@/lib/agents/omnichannel.server";

function toModelMessages(msgs: ImpulsionitoWireMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const m of msgs) {
    const content = (m.text ?? "").toString().trim();
    if (!content) continue;
    if (m.role === "system") out.push({ role: "system", content });
    else if (m.role === "assistant") out.push({ role: "assistant", content });
    else out.push({ role: "user", content });
  }
  return out;
}

function ledgerToModelMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const content = (m.body_text ?? "").trim();
    if (!content) return [];
    if (m.direction === "INBOUND" || m.author_type === "CONTACT") return [{ role: "user", content }];
    if (m.direction === "OUTBOUND" && m.author_type === "AGENT") return [{ role: "assistant", content }];
    return [];
  });
}

function safeSessionId(request: Request): string {
  const supplied = request.headers.get("x-impulsionando-session")?.trim() ?? "";
  if (/^web:[A-Za-z0-9:_-]{8,200}$/.test(supplied)) return supplied;
  return `web:ephemeral:${randomUUID()}`;
}

function trackedTextStream(
  source: ReadableStream<string>,
  onComplete: (text: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      let full = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          full += value;
          controller.enqueue(encoder.encode(value));
        }
        if (full.trim()) {
          try {
            await onComplete(full);
          } catch (error) {
            console.error("[impulsionito/chat] outbound ledger failed", error);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        try { reader.releaseLock(); } catch { /* ignore */ }
      }
    },
  });
}

export const Route = createFileRoute("/api/impulsionito/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ImpulsionitoChatRequestBody;
        try {
          body = (await request.json()) as ImpulsionitoChatRequestBody;
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const clientMessages = Array.isArray(body.messages) ? body.messages : [];
        const clientModelMessages = toModelMessages(clientMessages);
        const lastUser = [...clientModelMessages].reverse().find((m) => m.role === "user");
        const lastUserText =
          typeof lastUser?.content === "string"
            ? lastUser.content.trim()
            : Array.isArray(lastUser?.content)
              ? (lastUser.content as any[]).map((p) => p.text ?? "").join(" ").trim()
              : "";

        if (!lastUserText) return Response.json({ error: "empty_messages" }, { status: 400 });

        let ledger: InboundLedger;
        try {
          ledger = await recordInboundMessage({
            agentKey: "impulsionito-core",
            channel: "web_chat",
            provider: "impulsionando_front",
            externalUserId: safeSessionId(request),
            bodyText: lastUserText,
            endpointAddress: "https://impulsionando.com.br",
            metadata: {
              pathname: body.context?.pathname ?? null,
              screen: body.context?.screen ?? null,
              audience: body.context?.audience ?? null,
              source: "impulsionito_web_chat",
            },
          });
        } catch (error) {
          console.error("[impulsionito/chat] inbound ledger failed", error);
          return Response.json({ error: "conversation_ledger_unavailable" }, { status: 503 });
        }

        let modelMessages = clientModelMessages;
        try {
          const persisted = ledgerToModelMessages(await listConversationHistory(ledger.conversation_id, 30));
          if (persisted.length) modelMessages = persisted;
        } catch (error) {
          console.error("[impulsionito/chat] history read failed", error);
        }
        if (modelMessages.length > 30) modelMessages = modelMessages.slice(-30);

        const assembled = assemblePrompt(body.brain, body.context);

        const persistOutbound = async (text: string, status = "SENT", metadata: Record<string, unknown> = {}) => {
          await recordOutboundMessage({
            conversationId: ledger.conversation_id,
            bodyText: text,
            channel: "web_chat",
            provider: "impulsionando_front",
            endpointId: ledger.endpoint_id,
            status,
            metadata,
          });
        };

        function mockStream(reason: string): Response {
          const chunks = [
            "Estou em modo de contingência no momento. ",
            "Sobre \"",
            lastUserText.slice(0, 80),
            "\": posso continuar te orientando com os recursos disponíveis enquanto o provedor principal se recupera.",
          ];
          const encoder = new TextEncoder();
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              let full = "";
              for (const chunk of chunks) {
                full += chunk;
                controller.enqueue(encoder.encode(chunk));
                await new Promise((r) => setTimeout(r, 40));
              }
              try {
                await persistOutbound(full, "SENT", { fallback: true, fallback_reason: reason || "unknown" });
              } catch (error) {
                console.error("[impulsionito/chat] fallback ledger failed", error);
              }
              controller.close();
            },
          });
          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Impulsionito-Provider": "mock",
              "X-Impulsionito-Model": "mock-1",
              "X-Impulsionito-Brain": assembled.meta.hasBrain ? "1" : "0",
              "X-Impulsionito-Prompt-Version": String(assembled.meta.promptVersion ?? 0),
              "X-Impulsionito-Fallback-Reason": reason || "unknown",
              "X-Conversation-Id": ledger.conversation_id,
            },
          });
        }

        let resolved;
        try {
          resolved = resolveProvider({ llm: body.llm });
        } catch {
          return mockStream("no_provider_available");
        }

        try {
          const result = streamText({
            model: resolved.model,
            system: assembled.system,
            messages: modelMessages,
            temperature: body.llm?.temperature ?? 0.4,
            maxOutputTokens: body.llm?.maxTokens ?? 1024,
          });

          const stream = trackedTextStream(
            result.textStream as ReadableStream<string>,
            (text) => persistOutbound(text, "SENT", {
              provider: resolved.provider,
              model: resolved.modelId,
              prompt_version: assembled.meta.promptVersion ?? 0,
            }),
          );

          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Impulsionito-Provider": resolved.provider,
              "X-Impulsionito-Model": resolved.modelId,
              "X-Impulsionito-Brain": assembled.meta.hasBrain ? "1" : "0",
              "X-Impulsionito-Prompt-Version": String(assembled.meta.promptVersion ?? 0),
              "X-Conversation-Id": ledger.conversation_id,
            },
          });
        } catch (err) {
          console.error("[impulsionito/chat] stream failed", err);
          return mockStream(err instanceof Error ? err.message.slice(0, 120) : "upstream_error");
        }
      },
    },
  },
});
