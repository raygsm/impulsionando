/**
 * /api/impulsionito/chat — endpoint HTTP de streaming do Impulsionito.
 *
 * Contrato mínimo (compatível com src/components/impulsionito/transport.ts):
 *
 *   POST /api/impulsionito/chat
 *   Body: {
 *     messages: [{ role: "user"|"assistant"|"system", text: string }],
 *     context?: { pathname?: string, screen?: string, audience?: string }
 *   }
 *
 * Resposta: `text/plain; charset=utf-8` em streaming (chunks são deltas
 * de texto). Se o modelo falhar, retorna 502 com JSON `{ error }`.
 *
 * Não requer auth para permitir uso público (o dock está em rotas
 * autenticadas, mas o endpoint aceita chamadas anônimas). Não retorna
 * PII e não escreve em banco — persistência ficará em fase posterior
 * (ver docs/IMPULSIONITO_BACKEND_CHECKLIST_W110F.md).
 */
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type IncomingMessage = { role: "user" | "assistant" | "system"; text?: string; content?: string };
type IncomingContext = { pathname?: string; screen?: string; audience?: string };
type Body = { messages?: IncomingMessage[]; context?: IncomingContext };

const MODEL_ID = "google/gemini-2.5-flash";

function systemPrompt(ctx: IncomingContext | undefined): string {
  const bits: string[] = [
    "Você é o Impulsionito, agente central do Core Impulsionando.",
    "Fale português do Brasil, tom direto, objetivo, gentil. Sem emojis.",
    "Responda em até 4 parágrafos curtos ou uma lista curta.",
    "Se o usuário pedir ação que exige integração (agenda, financeiro, WhatsApp), oriente o caminho no menu — não invente que executou.",
    "Nunca peça dados sensíveis (senha, cartão, CPF completo). Se necessário, oriente o usuário a acessar o painel oficial.",
  ];
  if (ctx?.pathname) bits.push(`Rota atual do usuário: ${ctx.pathname}.`);
  if (ctx?.screen) bits.push(`Título da tela: ${ctx.screen}.`);
  if (ctx?.audience) bits.push(`Audiência: ${ctx.audience}.`);
  return bits.join(" ");
}

function toModelMessages(msgs: IncomingMessage[]): ModelMessage[] {
  return msgs
    .map((m) => {
      const content = (m.text ?? m.content ?? "").toString().trim();
      if (!content) return null;
      if (m.role === "system") return { role: "system" as const, content };
      if (m.role === "assistant") return { role: "assistant" as const, content };
      return { role: "user" as const, content };
    })
    .filter((m): m is ModelMessage => m !== null);
}

export const Route = createFileRoute("/api/impulsionito/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
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

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "missing_api_key" }, { status: 500 });
        }

        try {
          const gateway = createLovableAiGatewayProvider(apiKey);
          const result = streamText({
            model: gateway(MODEL_ID),
            system: systemPrompt(body.context),
            messages: modelMessages,
            temperature: 0.4,
          });

          return new Response(result.textStream as ReadableStream<string>, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Impulsionito-Model": MODEL_ID,
            },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "upstream_error";
          console.error("[impulsionito/chat] stream failed", err);
          return Response.json({ error: msg }, { status: 502 });
        }
      },
    },
  },
});
