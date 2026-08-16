/**
 * /api/impulsionito/chat — endpoint HTTP de streaming do Impulsionito e suas instâncias.
 *
 * Segurança do contrato público:
 * - identidade web é anônima por sessão e não é mesclada automaticamente;
 * - o ledger omnichannel é a fonte persistente do histórico;
 * - BrainSnapshot, provedor/modelo, tenant e agent key enviados pelo navegador
 *   NÃO têm autoridade sobre prompt, tenant ou roteamento;
 * - o pathname é sanitizado e usado apenas para resolver uma instância pública
 *   previamente autorizada no servidor.
 */
import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import { streamText, type ModelMessage } from "ai";
import { assemblePrompt } from "@/lib/impulsionito/context-engine.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import type {
  BrainSnapshot,
  ImpulsionitoChatRequestBody,
  ImpulsionitoRequestContext,
  ImpulsionitoWireMessage,
} from "@/lib/impulsionito/types";
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
  type InboundLedger,
  type OmnichannelAgentKey,
} from "@/lib/agents/omnichannel.server";

type PublicAgentRoute = {
  agentKey: OmnichannelAgentKey;
  tenant: string;
  audience: string;
  endpointAddress: string;
  source: string;
  brain?: BrainSnapshot;
};

const MAROCAS_MASTER_PROMPT = [
  "Você é o Maruquito, agente virtual oficial da Marocas e instância especializada do Impulsionito.",
  "Sua missão principal é ajudar anfitriões, proprietários e gestores a operar imóveis entre hospedagens, com protagonismo de limpeza, preparação, reposição, evidências e manutenção.",
  "Atue como vendedor consultivo, concierge e assistente operacional, sempre em português do Brasil, com comunicação clara, objetiva, acolhedora e orientada à próxima ação.",
  "Nunca invente preços, disponibilidade, reservas, horários, profissionais, pagamentos, estoque, status de limpeza, códigos de acesso ou diagnósticos técnicos.",
  "Qualquer dado operacional dinâmico só pode ser afirmado quando vier de ferramenta, sistema ou contexto confiável disponibilizado pelo servidor.",
  "Se uma consulta exigir dado operacional que não esteja disponível nesta conversa, explique que precisa consultar o sistema ou encaminhar para atendimento, sem simular resultado.",
  "Dados de acesso ao imóvel, fechaduras, cofres e senhas são sensíveis: não solicite nem exponha sem fluxo autenticado, autorização e necessidade operacional.",
  "Para novos clientes, qualifique quantidade de imóveis, localização, tipo de imóvel, frequência, janela entre check-out e check-in, necessidades de reposição/manutenção e urgência, sem criar preço.",
  "Para ocorrências técnicas, registre o contexto e a urgência, mas não invente diagnóstico; situações de risco exigem escalonamento humano/profissional.",
  "A Marocas não é apenas faxina: posicione o serviço como operação confiável do imóvel entre uma hospedagem e outra.",
].join("\n");

const MAROCAS_BRAIN: BrainSnapshot = {
  promptMaster: MAROCAS_MASTER_PROMPT,
  promptVersion: 1,
  rules: [],
  services: [],
  plans: [],
  modules: [],
  niches: [],
  faq: [],
  knowledge: [],
  approvedLearnings: [],
};

function toModelMessages(msgs: ImpulsionitoWireMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const m of msgs) {
    const content = (m.text ?? "").toString().trim();
    if (!content) continue;
    if (m.role === "assistant") out.push({ role: "assistant", content });
    else if (m.role === "user") out.push({ role: "user", content });
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

function sanitizePath(body: ImpulsionitoChatRequestBody): string {
  const rawPath = body.context?.pathname?.trim() ?? "/";
  return /^\/[A-Za-z0-9_./?=&%+~-]{0,299}$/.test(rawPath) ? rawPath : "/";
}

function resolvePublicAgent(pathname: string): PublicAgentRoute {
  if (pathname === "/marocas" || pathname.startsWith("/marocas/")) {
    return {
      agentKey: "marocas-maruquito",
      tenant: "marocas",
      audience: pathname.startsWith("/marocas/app/") ? "marocas_app_web" : "marocas_public_web",
      endpointAddress: "https://marocas.impulsionando.com.br",
      source: "maruquito_web_chat",
      brain: MAROCAS_BRAIN,
    };
  }

  return {
    agentKey: "impulsionito-core",
    tenant: "impulsionando",
    audience: "public_web",
    endpointAddress: "https://impulsionando.com.br",
    source: "impulsionito_web_chat",
  };
}

function safePublicContext(pathname: string, route: PublicAgentRoute): ImpulsionitoRequestContext {
  return {
    pathname,
    channel: "web",
    tenant: route.tenant,
    audience: route.audience,
  };
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
        const lastUserText = typeof lastUser?.content === "string" ? lastUser.content.trim() : "";

        if (!lastUserText) return Response.json({ error: "empty_messages" }, { status: 400 });
        if (lastUserText.length > 12000) return Response.json({ error: "message_too_large" }, { status: 413 });

        const pathname = sanitizePath(body);
        const agentRoute = resolvePublicAgent(pathname);
        const publicContext = safePublicContext(pathname, agentRoute);

        let ledger: InboundLedger;
        try {
          ledger = await recordInboundMessage({
            agentKey: agentRoute.agentKey,
            channel: "web_chat",
            provider: "impulsionando_front",
            externalUserId: safeSessionId(request),
            bodyText: lastUserText,
            endpointAddress: agentRoute.endpointAddress,
            metadata: {
              pathname: publicContext.pathname,
              tenant: agentRoute.tenant,
              agent_key: agentRoute.agentKey,
              source: agentRoute.source,
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

        // O endpoint público nunca aceita system prompt, BrainSnapshot, tenant ou agent key do browser.
        // Instâncias públicas conhecidas são resolvidas server-side pelo pathname sanitizado.
        const assembled = assemblePrompt(agentRoute.brain, publicContext);

        const persistOutbound = async (text: string, status = "SENT", metadata: Record<string, unknown> = {}) => {
          await recordOutboundMessage({
            conversationId: ledger.conversation_id,
            bodyText: text,
            channel: "web_chat",
            provider: "impulsionando_front",
            endpointId: ledger.endpoint_id,
            status,
            metadata: {
              tenant: agentRoute.tenant,
              agent_key: agentRoute.agentKey,
              ...metadata,
            },
          });
        };

        function mockStream(reason: string): Response {
          const fallbackText = agentRoute.agentKey === "marocas-maruquito"
            ? "Estou temporariamente sem acesso ao motor principal. Não vou inventar informações sobre reservas, limpeza, equipe, preço, pagamento ou acesso ao imóvel. Você pode continuar descrevendo sua necessidade e, quando o serviço estiver disponível, o Maruquito retoma com o contexto preservado."
            : `Estou em modo de contingência no momento. Sobre \"${lastUserText.slice(0, 80)}\": posso continuar te orientando com os recursos disponíveis enquanto o provedor principal se recupera.`;
          const chunks = fallbackText.match(/.{1,90}(?:\s|$)/g) ?? [fallbackText];
          const encoder = new TextEncoder();
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              let full = "";
              for (const chunk of chunks) {
                full += chunk;
                controller.enqueue(encoder.encode(chunk));
                await new Promise((r) => setTimeout(r, 25));
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
              "X-Impulsionito-Agent": agentRoute.agentKey,
              "X-Impulsionito-Tenant": agentRoute.tenant,
              "X-Impulsionito-Provider": "mock",
              "X-Impulsionito-Model": "mock-1",
              "X-Impulsionito-Brain": agentRoute.brain ? "server-tenant" : "server-fallback",
              "X-Impulsionito-Fallback-Reason": reason || "unknown",
              "X-Conversation-Id": ledger.conversation_id,
            },
          });
        }

        let resolved;
        try {
          resolved = resolveProvider({});
        } catch {
          return mockStream("no_provider_available");
        }

        try {
          const result = streamText({
            model: resolved.model,
            system: assembled.system,
            messages: modelMessages,
            temperature: agentRoute.agentKey === "marocas-maruquito" ? 0.25 : 0.4,
            maxOutputTokens: 1024,
          });

          const stream = trackedTextStream(
            result.textStream as ReadableStream<string>,
            (text) => persistOutbound(text, "SENT", {
              provider: resolved.provider,
              model: resolved.modelId,
              prompt_source: agentRoute.brain ? "server_tenant" : "server",
            }),
          );

          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Impulsionito-Agent": agentRoute.agentKey,
              "X-Impulsionito-Tenant": agentRoute.tenant,
              "X-Impulsionito-Provider": resolved.provider,
              "X-Impulsionito-Model": resolved.modelId,
              "X-Impulsionito-Brain": agentRoute.brain ? "server-tenant" : "server-fallback",
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
