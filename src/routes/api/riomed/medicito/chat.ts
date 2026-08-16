import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import { streamText, type ModelMessage } from "ai";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
  type InboundLedger,
} from "@/lib/agents/omnichannel.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function sessionId(request: Request): string {
  const supplied = request.headers.get("x-riomed-session")?.trim() ?? "";
  if (/^riomed:[A-Za-z0-9:_-]{8,200}$/.test(supplied)) return supplied;
  return `riomed:web:${randomUUID()}`;
}

function historyToMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const text = (m.body_text ?? "").trim();
    if (!text) return [];
    if (m.direction === "INBOUND" || m.author_type === "CONTACT") return [{ role: "user", content: text }];
    if (m.direction === "OUTBOUND" && m.author_type === "AGENT") return [{ role: "assistant", content: text }];
    return [];
  });
}

async function getRuntimeAndContext() {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("communication_tenants")
    .select("id,company_id,locale,timezone,settings")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (tenantError) throw tenantError;
  if (!tenant?.id || !tenant.company_id) throw new Error("riomed_not_configured");

  const { data: runtime, error: runtimeError } = await supabaseAdmin
    .from("communication_agent_runtime")
    .select("agent_id,agent_key,system_prompt_ref,model_policy,privacy_policy,handoff_policy,capabilities,config,active")
    .eq("agent_key", "riomed-medicito")
    .eq("active", true)
    .maybeSingle();
  if (runtimeError) throw runtimeError;
  if (!runtime?.agent_id) throw new Error("medicito_runtime_not_configured");

  const { data: products } = await supabaseAdmin
    .from("riomed_products")
    .select("id,sku,name,description,category,modality,price_sale,price_rental_daily,price_rental_monthly,currency,stock,is_active,metadata")
    .eq("company_id", tenant.company_id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(80);

  const { data: sellers } = await supabaseAdmin
    .from("riomed_sellers")
    .select("id,full_name,territory,status,metadata")
    .eq("company_id", tenant.company_id)
    .eq("status", "active")
    .limit(40);

  return { tenant, runtime, products: products ?? [], sellers: sellers ?? [] };
}

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof getRuntimeAndContext>>) {
  const inventory = ctx.products.length
    ? JSON.stringify(ctx.products.map((p: any) => ({
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        modality: p.modality,
        price_sale: p.price_sale,
        price_rental_daily: p.price_rental_daily,
        price_rental_monthly: p.price_rental_monthly,
        currency: p.currency,
        stock: p.stock,
        metadata: p.metadata,
      })))
    : "[]";
  const sellers = ctx.sellers.length
    ? JSON.stringify(ctx.sellers.map((s: any) => ({ full_name: s.full_name, territory: s.territory, metadata: s.metadata })))
    : "[]";
  return `Você é MEDICITO — SEU CONCIERGE MÉDICO, agente oficial da RioMed e CLIENT_INSTANCE do Impulsionito.\n\nMISSÃO\nAtender, qualificar, vender de forma consultiva, orientar sobre catálogo, locação, manutenção e suporte, registrar contexto no Core e encaminhar para especialista quando necessário.\n\nREGRAS ABSOLUTAS\n- Nunca invente estoque, preço, prazo, fabricante, modelo, SKU, garantia, compatibilidade, condição, localização, certificação ou informação clínica.\n- Nunca faça diagnóstico, prescrição ou orientação médica individual.\n- Se o dado objetivo não estiver no contexto validado desta requisição, diga que precisa ser confirmado no sistema RioMed ou por um especialista.\n- Use apenas OpenAI nesta instância. Se o provedor estiver indisponível, falhe de forma segura; não use fallback Lovable/Gemini.\n- Para produto, use estoque e preços somente quando presentes no INVENTÁRIO VALIDADO.\n- Se o inventário estiver vazio, explique que o catálogo real ainda não está publicado no Core; não fabrique exemplos como se fossem produtos existentes.\n- Quando houver vendedor disponível, ofereça agendamento ou encaminhamento, mas não prometa agenda/horário sem consulta específica.\n- Responda no idioma do usuário quando claramente identificável. Na dúvida, use português do Brasil.\n- Em imagem/placa/peça, trate identificação como hipótese com confiança alta/média/baixa e peça foto adicional/código quando necessário.\n\nTENANT\nlocale padrão=${ctx.tenant.locale}; timezone=${ctx.tenant.timezone}; estratégia=${ctx.runtime.config?.locale_strategy ?? "contextual"}.\n\nINVENTÁRIO VALIDADO\n${inventory}\n\nVENDEDORES ATIVOS VALIDADOS\n${sellers}`;
}

function trackedTextStream(source: ReadableStream<string>, onComplete: (text: string) => Promise<void>) {
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
        if (full.trim()) await onComplete(full);
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        try { reader.releaseLock(); } catch {}
      }
    },
  });
}

export const Route = createFileRoute("/api/riomed/medicito/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
        const text = typeof body?.text === "string"
          ? body.text.trim()
          : Array.isArray(body?.messages)
            ? ([...body.messages].reverse().find((m: any) => m?.role === "user" && typeof (m?.text ?? m?.content) === "string")?.text
              ?? [...body.messages].reverse().find((m: any) => m?.role === "user" && typeof (m?.text ?? m?.content) === "string")?.content
              ?? "").trim()
            : "";
        if (!text) return Response.json({ error: "empty_message" }, { status: 400 });
        if (text.length > 12000) return Response.json({ error: "message_too_large" }, { status: 413 });

        let ledger: InboundLedger;
        try {
          ledger = await recordInboundMessage({
            agentKey: "riomed-medicito",
            channel: "web_chat",
            provider: "riomed_front",
            externalUserId: sessionId(request),
            bodyText: text,
            endpointAddress: "https://riomed.impulsionando.com.br",
            metadata: { source: "riomed_medicito_web", pathname: typeof body?.pathname === "string" ? body.pathname.slice(0, 300) : "/" },
          });
        } catch (error) {
          console.error("[riomed/medicito] inbound ledger failed", error);
          return Response.json({ error: "conversation_ledger_unavailable" }, { status: 503 });
        }

        let context;
        try { context = await getRuntimeAndContext(); }
        catch (error) {
          console.error("[riomed/medicito] runtime/context unavailable", error);
          return Response.json({ error: "runtime_unavailable" }, { status: 503 });
        }

        let modelMessages: ModelMessage[] = [];
        try { modelMessages = historyToMessages(await listConversationHistory(ledger.conversation_id, 30)); }
        catch { modelMessages = [{ role: "user", content: text }]; }

        let resolved;
        try {
          resolved = resolveProvider({ llm: { provider: "openai", model: context.runtime.model_policy?.model }, allowFallback: false });
        } catch (error) {
          console.error("[riomed/medicito] OpenAI unavailable", error);
          return Response.json({ error: "openai_unavailable" }, { status: 503 });
        }

        const system = buildSystemPrompt(context);
        try {
          const result = streamText({
            model: resolved.model,
            system,
            messages: modelMessages.slice(-30),
            temperature: 0.2,
            maxOutputTokens: 1200,
          });
          const stream = trackedTextStream(result.textStream as ReadableStream<string>, async (output) => {
            await recordOutboundMessage({
              conversationId: ledger.conversation_id,
              bodyText: output,
              channel: "web_chat",
              provider: "riomed_front",
              endpointId: ledger.endpoint_id,
              status: "SENT",
              metadata: {
                provider: resolved.provider,
                model: resolved.modelId,
                agent_key: "riomed-medicito",
                root_agent_key: "impulsionito-core",
                prompt_source: context.runtime.system_prompt_ref,
                strict_provider: true,
              },
            });
          });
          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Agent-Key": "riomed-medicito",
              "X-Root-Agent-Key": "impulsionito-core",
              "X-Conversation-Id": ledger.conversation_id,
              "X-LLM-Provider": "openai",
            },
          });
        } catch (error) {
          console.error("[riomed/medicito] stream failed", error);
          return Response.json({ error: "upstream_error" }, { status: 502 });
        }
      },
    },
  },
});
