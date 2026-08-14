import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { closeConversationForExternalIdentity, listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const SYSTEM = `Você é Millito — WMP Wagner Miller Produções, agente comercial e operacional inteligente da WMP. Responda em português do Brasil, de forma objetiva, cordial e comercial. Qualifique o evento antes de recomendar estrutura. Pergunte apenas o necessário sobre tipo de evento, data, local, público, ambiente, estrutura existente e necessidades. Pode orientar sobre som, iluminação, DJ, palco, audiovisual e produção, mas não invente preços, estoque, certificações, cases ou disponibilidade. Quando faltarem dados técnicos, assuma explicitamente que é uma estimativa. Para DJ/eletrônico considere 1 microfone base para comunicação do DJ/MC; música ambiente 0; microfones extras somente conforme necessidade. Estimule o briefing em /wmp/orcamento. Se houver risco, exigência legal, aprovação comercial extraordinária ou baixa confiança, encaminhe para humano. Quando perceber que a demanda foi resolvida e a conversa está chegando ao fim, pergunte exatamente: "Algo mais em que eu ainda possa ajudar?". Nunca entregue link, protocolo ou conteúdo de exportação diretamente. A oferta de exportação e o cadastro obrigatório são controlados pelo sistema.`;

const EXPORT_QUESTION = 'Perfeito. Deseja receber por e-mail uma cópia completa desta conversa, com o número de protocolo do atendimento? Se desejar, responda “sim”. Para sua segurança, antes do envio pediremos apenas um cadastro básico: nome completo, celular e e-mail. Os demais dados são opcionais e poderão ser preenchidos agora ou depois.';

function sessionId(request: Request) {
  const supplied = request.headers.get('x-wmp-session')?.trim() ?? '';
  return /^wmp:[A-Za-z0-9:_-]{8,200}$/.test(supplied) ? supplied : `wmp:ephemeral:${randomUUID()}`;
}

function normalize(text: string) {
  return text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
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
  return /^(nao|nao obrigado|nao obrigada|nao valeu|nada|so isso|somente isso|era isso|por enquanto nao|por ora nao|obrigado|obrigada)$/.test(normalize(text));
}

function isAffirmative(text: string) {
  return /^(sim|sim quero|quero|quero sim|pode|pode sim|claro|ok|okay|exportar|quero exportar|envie|pode enviar)$/.test(normalize(text));
}

function isNegativeExport(text: string) {
  return /^(nao|nao quero|agora nao|nao obrigado|nao obrigada|dispenso|deixa pra la|deixe para la)$/.test(normalize(text));
}

async function fixedResponse(input: {
  conversationId: string;
  endpointId: string | null;
  text: string;
  metadata?: Record<string, unknown>;
}) {
  await recordOutboundMessage({
    conversationId: input.conversationId,
    bodyText: input.text,
    channel: 'web_chat',
    provider: 'wmp_front',
    endpointId: input.endpointId,
    metadata: { agent: 'Millito', ...(input.metadata ?? {}) },
  });
  return new Response(input.text, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': input.conversationId },
  });
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

    const rawHistory = await listConversationHistory(ledger.conversation_id, 40);
    const outbound = rawHistory.filter((m) => m.direction === 'OUTBOUND' && m.author_type === 'AGENT');
    const previousAssistant = outbound.length ? outbound[outbound.length - 1]?.body_text ?? '' : '';

    // 1) O cliente confirmou que não há mais dúvidas: oferecemos a exportação, mas ainda não fechamos a conversa.
    if (previousAssistant.includes('Algo mais em que eu ainda possa ajudar?') && isNegativeClosure(text)) {
      return fixedResponse({
        conversationId: ledger.conversation_id,
        endpointId: ledger.endpoint_id,
        text: EXPORT_QUESTION,
        metadata: { system_event: 'export_offered' },
      });
    }

    const awaitingExportDecision = previousAssistant.includes('Deseja receber por e-mail uma cópia completa desta conversa');

    // 2) Se aceitar, fecha a conversa, gera protocolo/token e leva ao cadastro básico obrigatório.
    if (awaitingExportDecision && isAffirmative(text)) {
      const closed = await closeConversationForExternalIdentity({ agentKey: 'wmp-millito', channel: 'web_chat', provider: 'wmp_front', externalUserId });
      const registrationUrl = `/wmp/conversa/${encodeURIComponent(closed.protocol)}?token=${encodeURIComponent(closed.accessToken)}`;
      const message = `Ótimo. Para receber a conversa por e-mail, conclua primeiro o cadastro básico. Nome completo, celular e e-mail são obrigatórios. CPF, CEP, endereço e dados de empresa são opcionais e você pode preenchê-los agora ou depois.\n\nProtocolo: ${closed.protocol}\nCadastro para envio: ${registrationUrl}`;
      await recordOutboundMessage({
        conversationId: closed.conversationId,
        bodyText: message,
        channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id,
        metadata: { agent: 'Millito', system_event: 'registration_required_for_export', protocol: closed.protocol },
      });
      return new Response(message, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': closed.conversationId } });
    }

    // 3) Se não quiser exportar, encerra normalmente e informa apenas o protocolo.
    if (awaitingExportDecision && isNegativeExport(text)) {
      const closed = await closeConversationForExternalIdentity({ agentKey: 'wmp-millito', channel: 'web_chat', provider: 'wmp_front', externalUserId });
      const message = `Sem problema. Atendimento encerrado com sucesso. Protocolo: ${closed.protocol}. Quando precisar, o Millito estará por aqui.`;
      await recordOutboundMessage({
        conversationId: closed.conversationId,
        bodyText: message,
        channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id,
        metadata: { agent: 'Millito', system_event: 'conversation_closed_without_export', protocol: closed.protocol },
      });
      return new Response(message, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': closed.conversationId } });
    }

    const history = toMessages(rawHistory);
    const resolved = resolveProvider({});
    const result = streamText({ model: resolved.model, system: SYSTEM, messages: history, temperature: 0.35, maxOutputTokens: 900 });
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({ async start(controller) {
      let full = '';
      try {
        for await (const chunk of result.textStream) { full += chunk; controller.enqueue(encoder.encode(chunk)); }
        if (full.trim()) {
          await recordOutboundMessage({ conversationId: ledger.conversation_id, bodyText: full, channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id, metadata: { agent: 'Millito' } });
        }
        controller.close();
      } catch (error) { controller.error(error); }
    }});
    return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': ledger.conversation_id } });
  } } },
});
