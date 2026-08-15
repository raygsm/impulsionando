import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { closeConversationForExternalIdentity, listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const BASE_SYSTEM = `Você é Milito — WMP Wagner Miller Produções, o cérebro comercial e operacional da WMP. Responda em português do Brasil, de forma objetiva, cordial, inteligente e orientada à conversão. Identifique rapidamente se a pessoa quer produzir um evento, contratar DJ, contratar de forma recorrente como hotel/empresa, cadastrar-se como DJ/parceiro, consultar a agenda pública do Wagner ou receber suporte. Faça poucas perguntas de alto valor e conduza para o próximo passo correto.

REGRAS COMERCIAIS E OPERACIONAIS:
- Para eventos, qualifique tipo, data, local, público, ambiente, estrutura existente e necessidades; conduza para /wmp/orcamento.
- Para contratação de DJ, entenda data, local, duração, perfil musical e contexto; conduza para /wmp/djs. Nunca prometa DJ específico ou disponibilidade sem confirmação operacional.
- Para hotéis e empresas, reconheça demandas recorrentes, múltiplas datas, unidades e calendário corporativo; conduza para /wmp/empresas e ofereça organização de briefing comercial.
- Para DJ ou profissional que queira integrar a rede, conduza para /wmp/parceiro. Não prometa aprovação automática.
- Para agenda pública do Wagner Miller, use somente o contexto operacional validado fornecido pelo sistema e conduza para /wmp/onde-estou. Nunca use agenda histórica como se fosse atual.
- Pode orientar sobre som, iluminação, DJ, palco, audiovisual, produção e setup, mas não invente preços, estoque, certificações, cases, disponibilidade, agenda, medidas, potência elétrica, dB ou conformidade legal.
- Para DJ/eletrônico considere 1 microfone base para comunicação do DJ/MC; música ambiente 0; microfones extras somente conforme necessidade.
- A proposta comercial preliminar vem antes do contrato formal. Equipamento e mão de obra são itens distintos.
- Se houver risco, exigência legal, aprovação comercial extraordinária, conflito operacional ou baixa confiança, encaminhe para humano.
- Não revele custos internos, margens internas, dados pessoais de parceiros, tokens, segredos ou informações administrativas.
- Quando a demanda estiver resolvida e a conversa chegando ao fim, pergunte exatamente: "Algo mais em que eu ainda possa ajudar?".
- Nunca entregue protocolo ou conteúdo de exportação por conta própria. A oferta de exportação e o cadastro obrigatório são controlados pelo sistema.`;

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

async function getOperationalContext() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: schedule } = await supabaseAdmin
    .from('wmp_whereabouts_entries' as never)
    .select('event_date,venue_name,venue_address,start_time,end_time,status,published_at' as never)
    .gte('event_date' as never, today)
    .eq('status' as never, 'PUBLISHED')
    .not('published_at' as never, 'is', null)
    .order('event_date' as never, { ascending: true })
    .order('start_time' as never, { ascending: true })
    .limit(12);

  const entries = ((schedule as unknown as Array<Record<string, unknown>>) ?? []).map((item) => ({
    date: item.event_date,
    venue: item.venue_name,
    address: item.venue_address,
    start: item.start_time,
    end: item.end_time,
  }));

  return [
    'CONTEXTO OPERACIONAL VALIDADO NESTA REQUISIÇÃO:',
    'Rotas canônicas: evento=/wmp/orcamento; contratar DJ=/wmp/djs; hotéis e empresas=/wmp/empresas; parceiro=/wmp/parceiro; agenda Wagner=/wmp/onde-estou.',
    entries.length
      ? `Agenda pública futura validada: ${JSON.stringify(entries)}.`
      : 'Agenda pública futura validada: nenhuma entrada publicada no momento. Se perguntarem onde Wagner estará, diga que não há agenda pública confirmada agora e direcione para /wmp/onde-estou; não invente local ou data.',
  ].join('\n');
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
    metadata: { agent: 'Milito', ...(input.metadata ?? {}) },
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

    if (previousAssistant.includes('Algo mais em que eu ainda possa ajudar?') && isNegativeClosure(text)) {
      return fixedResponse({
        conversationId: ledger.conversation_id,
        endpointId: ledger.endpoint_id,
        text: EXPORT_QUESTION,
        metadata: { system_event: 'export_offered' },
      });
    }

    const awaitingExportDecision = previousAssistant.includes('Deseja receber por e-mail uma cópia completa desta conversa');

    if (awaitingExportDecision && isAffirmative(text)) {
      const closed = await closeConversationForExternalIdentity({ agentKey: 'wmp-millito', channel: 'web_chat', provider: 'wmp_front', externalUserId });
      const registrationUrl = `/wmp/conversa/${encodeURIComponent(closed.protocol)}?token=${encodeURIComponent(closed.accessToken)}`;
      const message = `Ótimo. Para receber a conversa por e-mail, conclua primeiro o cadastro básico. Nome completo, celular e e-mail são obrigatórios. CPF, CEP, endereço e dados de empresa são opcionais e você pode preenchê-los agora ou depois.\n\nProtocolo: ${closed.protocol}\nCadastro para envio: ${registrationUrl}`;
      await recordOutboundMessage({
        conversationId: closed.conversationId,
        bodyText: message,
        channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id,
        metadata: { agent: 'Milito', system_event: 'registration_required_for_export', protocol: closed.protocol },
      });
      return new Response(message, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': closed.conversationId } });
    }

    if (awaitingExportDecision && isNegativeExport(text)) {
      const closed = await closeConversationForExternalIdentity({ agentKey: 'wmp-millito', channel: 'web_chat', provider: 'wmp_front', externalUserId });
      const message = `Sem problema. Atendimento encerrado com sucesso. Protocolo: ${closed.protocol}. Quando precisar, o Milito estará por aqui.`;
      await recordOutboundMessage({
        conversationId: closed.conversationId,
        bodyText: message,
        channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id,
        metadata: { agent: 'Milito', system_event: 'conversation_closed_without_export', protocol: closed.protocol },
      });
      return new Response(message, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': closed.conversationId } });
    }

    const history = toMessages(rawHistory);
    const operationalContext = await getOperationalContext().catch(() => 'CONTEXTO OPERACIONAL: indisponível nesta requisição. Não invente agenda ou disponibilidade; use as rotas canônicas e encaminhe para confirmação.');
    const resolved = resolveProvider({});
    const result = streamText({ model: resolved.model, system: `${BASE_SYSTEM}\n\n${operationalContext}`, messages: history, temperature: 0.25, maxOutputTokens: 900 });
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({ async start(controller) {
      let full = '';
      try {
        for await (const chunk of result.textStream) { full += chunk; controller.enqueue(encoder.encode(chunk)); }
        if (full.trim()) {
          await recordOutboundMessage({ conversationId: ledger.conversation_id, bodyText: full, channel: 'web_chat', provider: 'wmp_front', endpointId: ledger.endpoint_id, metadata: { agent: 'Milito', provider: resolved.provider, model: resolved.modelId } });
        }
        controller.close();
      } catch (error) { controller.error(error); }
    }});
    return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': ledger.conversation_id } });
  } } },
});
