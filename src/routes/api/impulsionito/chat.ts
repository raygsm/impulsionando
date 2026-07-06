/**
 * /api/impulsionito/chat — endpoint HTTP de streaming do Impulsionito.
 *
 * Fluxo oficial (W111):
 *   1. Recebe { messages, context, brain, llm } do dock.
 *   2. Motor de Contexto monta o system prompt dinâmico.
 *   3. Camada de Provedores escolhe OpenAI (padrão, se OPENAI_API_KEY existir)
 *      ou Gemini via Lovable AI Gateway (fallback).
 *   4. Faz streaming da resposta em text/plain.
 *
 * Nunca expõe chave ao browser — a resolução acontece apenas aqui.
 */
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { assemblePrompt } from "@/lib/impulsionito/context-engine.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import type { ImpulsionitoChatRequestBody, ImpulsionitoWireMessage } from "@/lib/impulsionito/types";

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

        const messages = Array.isArray(body.messages) ? body.messages : [];
        const modelMessages = toModelMessages(messages);
        if (modelMessages.length === 0) {
          return Response.json({ error: "empty_messages" }, { status: 400 });
        }
        if (modelMessages.length > 40) {
          modelMessages.splice(0, modelMessages.length - 40);
        }

        const assembled = assemblePrompt(body.brain, body.context);
        const lastUser = [...modelMessages].reverse().find((m) => m.role === "user");
        const lastUserText =
          typeof lastUser?.content === "string"
            ? lastUser.content
            : Array.isArray(lastUser?.content)
              ? (lastUser!.content as any[]).map((p) => p.text ?? "").join(" ")
              : "";

        function mockStream(reason: string): Response {
          const chunks = [
            "Estou em modo demonstração no momento. ",
            reason ? `(motivo: ${reason}) ` : "",
            "Sobre \"",
            lastUserText.slice(0, 80),
            "\": posso te ajudar assim que a IA principal voltar. ",
            "Enquanto isso, explore o Diagnóstico Rápido e o catálogo de módulos.",
          ].filter(Boolean);
          const encoder = new TextEncoder();
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              for (const c of chunks) {
                controller.enqueue(encoder.encode(c));
                await new Promise((r) => setTimeout(r, 60));
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

          return new Response(result.textStream as ReadableStream<string>, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Impulsionito-Provider": resolved.provider,
              "X-Impulsionito-Model": resolved.modelId,
              "X-Impulsionito-Brain": assembled.meta.hasBrain ? "1" : "0",
              "X-Impulsionito-Prompt-Version": String(assembled.meta.promptVersion ?? 0),
            },
          });
        } catch (err) {
          console.error("[impulsionito/chat] stream failed", err);
          return mockStream(err instanceof Error ? err.message : "upstream_error");
        }
      },
    },
  },
});
