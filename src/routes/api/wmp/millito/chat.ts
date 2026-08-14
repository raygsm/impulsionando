import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { closeConversationForExternalIdentity, listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const SYSTEM = `Você é Millito — WMP Wagner Miller Produções, agente comercial e operacional inteligente da WMP. Responda em português do Brasil, de forma objetiva, cordial e comercial. Qualifique o evento antes de recomendar estrutura. Pergunte apenas o necessário sobre tipo de evento, data, local, público, ambiente, estrutura existente e necessidades. Pode orientar sobre som, iluminação, DJ, palco, audiovisual e produção, mas não invente preços, estoque, certificações, cases ou disponibilidade. Quando faltarem dados técnicos, assuma explicitamente que é uma estimativa. Para DJ/eletrônico considere 1 microfone base para comunicação do DJ/MC; música ambiente 0; microfones extras somente conforme necessidade. Estimule o briefing em /orcamento. Se houver risco, exigência legal, aprovação comercial extraordinária ou baixa confiança, encaminhe para humano. Antes de encerrar pergunte exatamente: "Algo mais em que eu ainda possa ajudar?". Se o cliente responder que não, encerre com: "Pois não. Caso queira, você pode ter acesso à conversa na íntegra." Não prometa exportação sem cadastro/verificação.`;

function sessionId(request: Request) {
  const supplied = request.headers.get('x-wmp-session')?.trim() ?? '';
  return /^wmp:[A-Za-z0-9:_-]{8,200}$/.test(supplied) ? supplied : `wmp:ephemeral:${randomUUID()}`;
}

function toMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const content = (m.body_text ?? '').trim();
    if (!content) return [];
    if (m.direction === 'INBOUND' || m.author_type === 'CONTACT') return [{ role: 'user', content }];
    if (m.direction === 'OUTBOUND' && m.author_type === 'AGENT') return [{ role: 'assistant', content }];
    return [];
  });
}

function isNegativeClosure(text: string) {
  const normalized = text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return /^(nao|nao obrigado|nao obrigada|nao valeu|nada|so isso|somente isso|era isso|por enquanto nao|por ora nao|obrigado|obrigada)$/.test(normalized);
}

export const Route = createFileRoute('/api/wmp/millito/chat')({
  server: { handlers: { POST: async ({ request }) => {
    const body = await request.json().catch(() => null) as { text?: string } | null;
    const text = body?.text?.trim() ?? '';
    if (!text) return Response.json({ error: 'empty_message' }, { status: 400 });
    if (text.length > 12000) return Response.json({ error: 'message_too_large' }, { status: 413 });

    const externalUserId = sessionId(request);
    const ledger = await recordInboundMessage({
      agentKey: 'wmp-millito',
      channel: 'web_chat', provider: 'wmp_front', externalUserId,
      bodyText: text, endpointAddress: 'https://wmp.impulsionando.com.br',
      metadata: { source: 'wmp_millito_web_chat' },
    });

    const rawHistory = await listConversationHistory(ledger.conversation_id, 30);
    const previousAssistant = [...rawHistory].reverse().find((m) => m.direction === 'OUTBOUND' && m.author_type === 'AGENT')?.body_text ?? '';
    const shouldClose = previousAssistant.includes('Algo mais em que eu ainda possa ajudar?') && isNegativeClosure(text);
    const history = toMessages(rawHistory);
    const resolved = resolveProvider({});
    const result = streamText({ model: resolved.model, system: SYSTEM, messages: history, temperature: 0.35, maxOutputTokens: 900 });
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({ async start(controller) {
      let full = '';
      try {
        for await (const chunk of result.textStream) { full += chunk; controller.enqueue(encoder.encode(chunk)); }
        if (full.trim()) await recordOutboundMessage({ conversationId: ledger.conversation_id, bodyText: full, channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id, metadata: { agent: 'Millito' } });
        if (shouldClose) {
          const closed = await closeConversationForExternalIdentity({ agentKey: 'wmp-millito', channel: 'web_chat', provider: 'wmp_front', externalUserId });
          const accessUrl = `/wmp/conversa/${encodeURIComponent(closed.protocol)}?token=${encodeURIComponent(closed.accessToken)}`;
          const closing = `\n\nProtocolo: ${closed.protocol}\nAcesse sua conversa na íntegra: ${accessUrl}`;
          controller.enqueue(encoder.encode(closing));
          await recordOutboundMessage({ conversationId: closed.conversationId, bodyText: closing.trim(), channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id, metadata: { agent: 'Millito', system_event: 'conversation_closed', protocol: closed.protocol } });
        }
        controller.close();
      } catch (error) { controller.error(error); }
    }});
    return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': ledger.conversation_id } });
  } } },
});
