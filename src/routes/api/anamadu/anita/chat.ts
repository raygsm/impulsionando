import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const SYSTEM = `Você é Anita, agente virtual oficial da Ana Madu Acessórios e uma instância especializada do Impulsionito. Fale em português do Brasil com elegância, acolhimento e objetividade comercial. Sua função é entender intenção, estilo, ocasião, tipo de peça, pedra desejada, faixa de preço e urgência, ajudar a descobrir o catálogo, recomendar peças cadastradas, estimular compra, pós-venda, cross-sell e recompra. Há duas linhas: Tradicional, com peças prontas e pedras naturais; e Ourives, linha premium sob medida com curadoria e projeto personalizado. Na linha Ourives, explique o processo e ajude a estruturar briefing, mas nunca prometa execução, prazo, disponibilidade, certificação, procedência, autenticidade, propriedade gemológica ou preço que não esteja validado no sistema. O atendimento premium Ourives tem taxa inicial padrão de R$ 500,00, que é configurável no dashboard; se não houver confirmação de valor vigente em contexto, diga que o valor precisa ser confirmado. Nunca invente estoque, preço ou informação sobre pedra. Se o usuário pedir algo fora do que está validado, encaminhe para humano. Quando fizer sentido, use o catálogo público e oriente a pessoa a abrir a peça no site. Preserve continuidade entre canais e trate dados pessoais com minimização e respeito à LGPD. Se a pessoa vier de campanha, use a atribuição apenas para contextualizar a jornada; nunca exponha IDs técnicos de rastreamento ao cliente.`;

type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer?: string;
};

function sessionId(request: Request) {
  const supplied = request.headers.get('x-anamadu-session')?.trim() ?? '';
  return /^anamadu:[A-Za-z0-9:_-]{8,200}$/.test(supplied) ? supplied : `anamadu:ephemeral:${randomUUID()}`;
}

function toMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((message): ModelMessage[] => {
    const content = (message.body_text ?? '').trim();
    if (!content) return [];
    if (message.direction === 'INBOUND' || message.author_type === 'CONTACT') return [{ role: 'user', content }];
    if (message.direction === 'OUTBOUND' && message.author_type === 'AGENT') return [{ role: 'assistant', content }];
    return [];
  });
}

export const Route = createFileRoute('/api/anamadu/anita/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null) as { text?: string; attribution?: Attribution } | null;
        const text = body?.text?.trim() ?? '';
        if (!text) return Response.json({ error: 'empty_message' }, { status: 400 });
        if (text.length > 12000) return Response.json({ error: 'message_too_large' }, { status: 413 });

        const externalUserId = sessionId(request);
        const ledger = await recordInboundMessage({
          agentKey: 'anamadu-anita',
          channel: 'web_chat',
          provider: 'anamadu_front',
          externalUserId,
          bodyText: text,
          endpointAddress: 'https://anamadu.impulsionando.com.br',
          metadata: { source: 'anamadu_anita_web_chat', attribution: body?.attribution ?? {} },
        });

        const history = toMessages(await listConversationHistory(ledger.conversation_id, 50));
        const campaignContext = body?.attribution?.utm_campaign
          ? `\nContexto interno da origem da sessão: campanha ${body.attribution.utm_campaign}; fonte ${body.attribution.utm_source ?? 'não informada'}; meio ${body.attribution.utm_medium ?? 'não informado'}. Não exponha identificadores técnicos ao cliente.`
          : '';
        const resolved = resolveProvider({});
        const result = streamText({
          model: resolved.model,
          system: SYSTEM + campaignContext,
          messages: history,
          temperature: 0.35,
          maxOutputTokens: 900,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let full = '';
            try {
              for await (const chunk of result.textStream) {
                full += chunk;
                controller.enqueue(encoder.encode(chunk));
              }
              if (full.trim()) {
                await recordOutboundMessage({
                  conversationId: ledger.conversation_id,
                  bodyText: full,
                  channel: 'web_chat',
                  provider: 'anamadu_front',
                  endpointId: ledger.endpoint_id,
                  metadata: { agent: 'Anita' },
                });
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store',
            'x-conversation-id': ledger.conversation_id,
          },
        });
      },
    },
  },
});
