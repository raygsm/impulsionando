import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const SYSTEM = `Você é Annita, agente virtual oficial da Ana Madú e uma instância especializada CLIENT_INSTANCE do Impulsionito. Fale em português do Brasil com elegância, acolhimento, objetividade e foco comercial. Você é concierge digital, vendedora, assistente comercial, agente de relacionamento e suporte da Ana Madú — não um chatbot genérico.

REGRAS ABSOLUTAS:
1. Nunca invente produto, preço, promoção, estoque, disponibilidade, prazo, política, desconto, condição comercial, evento, agenda, procedência, certificação ou propriedade de pedra.
2. Para qualquer informação dinâmica, use somente o contexto operacional fornecido pelo sistema nesta conversa. Se o dado não estiver presente ou não puder ser consultado, diga que precisa ser confirmado e ofereça encaminhamento humano.
3. Não trate exemplos, textos antigos, fallback ou memória do modelo como fonte de verdade operacional.
4. Preserve contexto e não peça novamente dados já informados.
5. Antes de responder, identifique internamente: quem é a pessoa, intenção, estágio da jornada, dados já fornecidos, informação que precisa consultar, próxima melhor ação e necessidade de handoff.
6. Quando houver uma próxima ação concreta e validada, conduza o usuário a ela. Não encerre passivamente.
7. Em caso de dúvida operacional não resolvida, preserve o histórico e encaminhe para humano sem obrigar o cliente a repetir a conversa.
8. Trate dados pessoais com minimização e respeito à LGPD.
9. Se a pessoa vier de campanha, use a atribuição apenas para contextualizar; nunca exponha IDs técnicos.
10. O checkout oficial é o da Nuvemshop. PIX direto só pode aparecer como contingência temporária quando o sistema explicitamente informar que o fallback está habilitado.

A Ana Madú trabalha com um catálogo real sincronizado da loja oficial. Existe também uma jornada denominada Ourives para projetos personalizados; não informe taxa, preço, prazo ou condição dessa jornada sem dado operacional vigente. Quando fizer sentido, ajude a estruturar o briefing e encaminhar a próxima ação validada.`;

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

type CatalogItem = {
  name?: string;
  priceLabel?: string;
  url?: string;
  status?: string;
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

function needsCatalogLookup(text: string) {
  return /preç|valor|produto|peça|colar|brinco|anel|pulseira|tornozeleira|pedra|estoque|dispon|presente|comprar|catálogo|catalogo/i.test(text);
}

async function liveCatalogContext(request: Request, text: string) {
  if (!needsCatalogLookup(text)) return '';
  try {
    const url = new URL('/api/anamadu/catalog', request.url);
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return '\nCATÁLOGO OPERACIONAL: consulta indisponível neste momento. Não informe preço, estoque ou disponibilidade por memória.';
    const data = await response.json() as { syncedAt?: string; items?: CatalogItem[] };
    const tokens = text.toLocaleLowerCase('pt-BR').split(/\s+/).filter((token) => token.length >= 3);
    const items = (data.items ?? []).filter((item) => {
      const name = String(item.name ?? '').toLocaleLowerCase('pt-BR');
      return tokens.some((token) => name.includes(token));
    }).slice(0, 20);
    const fallback = items.length ? items : (data.items ?? []).slice(0, 12);
    if (!fallback.length) return '\nCATÁLOGO OPERACIONAL: nenhuma peça foi retornada pela sincronização. Não invente itens.';
    const lines = fallback.map((item) => `- ${item.name ?? 'Sem nome'} | ${item.priceLabel ?? 'preço não informado'} | status=${item.status ?? 'unknown'} | ${item.url ?? ''}`);
    return `\nCATÁLOGO OPERACIONAL CONSULTADO EM ${data.syncedAt ?? 'horário não informado'}:\n${lines.join('\n')}\nUse somente estes dados para preço/disponibilidade nesta resposta. Status unknown não significa disponível.`;
  } catch {
    return '\nCATÁLOGO OPERACIONAL: consulta falhou. Não informe preço, estoque ou disponibilidade por memória.';
  }
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
          metadata: { source: 'anamadu_annita_web_chat', attribution: body?.attribution ?? {} },
        });

        const history = toMessages(await listConversationHistory(ledger.conversation_id, 50));
        const campaignContext = body?.attribution?.utm_campaign
          ? `\nContexto interno da origem da sessão: campanha ${body.attribution.utm_campaign}; fonte ${body.attribution.utm_source ?? 'não informada'}; meio ${body.attribution.utm_medium ?? 'não informado'}. Não exponha identificadores técnicos ao cliente.`
          : '';
        const catalogContext = await liveCatalogContext(request, text);
        const resolved = resolveProvider({});
        const result = streamText({
          model: resolved.model,
          system: SYSTEM + campaignContext + catalogContext,
          messages: history,
          temperature: 0.2,
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
                  metadata: { agent: 'Annita', architecture: 'CLIENT_INSTANCE', orchestrator: 'Impulsionito' },
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
