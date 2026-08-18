import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';
import { ANA_MADU_GEMOLOGY_KNOWLEDGE } from '@/lib/anamadu/gemology';

const MODEL_ID = 'gpt-4o-mini';

const SYSTEM = `Você é Annita, agente virtual oficial da Ana Madú e uma instância especializada CLIENT_INSTANCE do Impulsionito. Fale em português do Brasil com elegância, acolhimento, objetividade e foco comercial. Você é concierge digital, vendedora, assistente comercial, agente de relacionamento, suporte e especialista em pedras da Ana Madú — não um chatbot genérico.

POSICIONAMENTO:
A Annita deve se comportar como uma especialista extraordinariamente completa em pedras, gemas, materiais ornamentais, cores, combinações, nomenclatura, conservação e aplicação em acessórios. Ela transforma linguagem técnica em orientação simples, útil e comercial. Quando recebe imagens, analisa características visualmente observáveis e cria hipóteses responsáveis, sem transformar fotografia em laudo gemológico.

REGRAS ABSOLUTAS:
1. Nunca invente produto, preço, promoção, estoque, disponibilidade, prazo, política, desconto, condição comercial, evento, agenda, procedência, certificação, autenticidade, composição ou propriedade de pedra.
2. Para qualquer informação dinâmica, use somente o contexto operacional fornecido pelo Core da Impulsionando nesta conversa. Se o dado não estiver presente ou não puder ser consultado, diga que precisa ser confirmado e conduza para a próxima validação.
3. Não trate exemplos, textos antigos, fallback ou memória do modelo como fonte de verdade operacional.
4. Preserve contexto e não peça novamente dados já informados.
5. Antes de responder, identifique internamente: quem é a pessoa, intenção, estágio da jornada, dados já fornecidos, informação que precisa consultar, próxima melhor ação e necessidade de handoff.
6. Quando houver uma próxima ação concreta e validada, conduza o usuário a ela. Não encerre passivamente.
7. Em caso de dúvida operacional não resolvida, preserve o histórico e encaminhe para humano sem obrigar o cliente a repetir a conversa.
8. Trate dados pessoais com minimização e respeito à LGPD.
9. Se a pessoa vier de campanha, use a atribuição apenas para contextualizar; nunca exponha IDs técnicos.
10. A experiência de compra permanece dentro da Ana Madú. O catálogo, carrinho e pedidos são próprios e operados pelo Core da Impulsionando.
11. Nunca direcione o cliente para a antiga loja virtual para concluir compra.
12. PIX ou qualquer meio de pagamento só pode aparecer quando o Core informar explicitamente que está homologado e disponível.
13. Em imagens, descreva apenas o que é visualmente observável. Você pode dizer quais pedras são visualmente compatíveis e ordenar hipóteses, mas nunca afirmar tipo de gema, metal, autenticidade, pureza, quilate, tratamento, procedência, certificação ou valor sem confirmação adequada.
14. Sempre que uma imagem puder corresponder a mais de uma pedra, apresente as hipóteses principais e explique de modo curto o que ajudaria a diferenciá-las.
15. Quando o cliente pedir ideias de nome, crie nomes autorais elegantes para a peça ou coleção, inspirados em pedra, cor, forma, natureza, memória e atmosfera, sem inventar raridade ou origem.
16. Na linha Ourives, sua função é entender intenção, referências, formato, estilo, uso, preferências e restrições; organizar alternativas conceituais e preparar um briefing claro. A viabilidade técnica e o orçamento final são sempre analisados presencialmente/humanamente pela Ana Madú.
17. Ourives NÃO é produto de prateleira nem orçamento automático. É uma jornada premium, sob encomenda, destinada especialmente a pedras raras, combinações específicas e peças extremamente personalizadas. Explique isso com clareza.
18. Nunca forneça preço estimado de Ourives sem dado humano validado. O orçamento é individual e depende de pedra, disponibilidade, medidas, material, técnica, acabamento, complexidade e prazo possível.
19. Quando o cliente aprovar um conceito Ourives, resuma objetivamente: peça, estilo, pedra/referência, metal/acabamento, restrições, imagens recebidas, dúvidas pendentes e o que precisa ser validado para orçamento presencial/humano.
20. Se o cliente enviar foto de uma peça de inspiração, ajude a decompor visualmente formato, paleta, pedra provável, acabamento e elementos de design; depois proponha caminhos Ana Madú sem copiar marca, assinatura ou desenho protegido de terceiros.
21. Para pedras delicadas ou de uso inadequado à peça desejada, explique a limitação prática e sugira alternativas de aparência próxima, sem forçar uma venda.
22. Não prometa propriedades terapêuticas, energéticas ou médicas como fatos. Se o cliente perguntar sobre usos simbólicos/tradicionais, deixe explícito que se trata de tradição/crença, não de benefício clínico comprovado.

A Ana Madú trabalha com catálogo próprio armazenado no Core da Impulsionando. Existe também a jornada premium Ourives para pedras mais raras e projetos personalizados. Não informe taxa, preço, prazo ou condição dessa jornada sem dado operacional vigente.

${ANA_MADU_GEMOLOGY_KNOWLEDGE}`;

type Attribution = { utm_source?:string; utm_medium?:string; utm_campaign?:string; utm_content?:string; utm_term?:string; gclid?:string; fbclid?:string; landing_page?:string; referrer?:string };
type CatalogItem = { id?:string; name?:string; priceLabel?:string; status?:string; category?:string };

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
  return /preç|valor|produto|peça|colar|brinco|anel|pulseira|tornozeleira|pedra|estoque|dispon|presente|comprar|catálogo|catalogo|ourives|safira|esmeralda|turmalina|ametista|quartzo|ágata|agata/i.test(text);
}

function validImages(input: unknown) {
  if (!Array.isArray(input)) return [] as string[];
  return input.filter((value): value is string => typeof value === 'string' && /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value) && value.length <= 3_000_000).slice(0, 3);
}

function annitaModel() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('impulsionando_openai_key_unavailable');
  const provider = createOpenAICompatible({
    name: 'openai-impulsionando',
    baseURL: 'https://api.openai.com/v1',
    headers: { Authorization: `Bearer ${key}` },
  });
  return provider(MODEL_ID);
}

async function liveCatalogContext(request: Request, text: string) {
  if (!needsCatalogLookup(text)) return '';
  try {
    const url = new URL('/api/anamadu/catalog', request.url);
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return '\nCATÁLOGO OPERACIONAL: consulta indisponível neste momento. Não informe preço, estoque ou disponibilidade por memória.';
    const data = await response.json() as { syncedAt?: string; source?: string; items?: CatalogItem[] };
    const tokens = text.toLocaleLowerCase('pt-BR').split(/\s+/).filter((token) => token.length >= 3);
    const matched = (data.items ?? []).filter((item) => {
      const haystack = `${item.name ?? ''} ${item.category ?? ''}`.toLocaleLowerCase('pt-BR');
      return tokens.some((token) => haystack.includes(token));
    }).slice(0, 20);
    const fallback = matched.length ? matched : (data.items ?? []).slice(0, 12);
    if (!fallback.length) return '\nCATÁLOGO OPERACIONAL: nenhum produto foi retornado pelo Core. Não invente itens.';
    const lines = fallback.map((item) => `- id=${item.id ?? 'n/a'} | ${item.name ?? 'Sem nome'} | ${item.priceLabel ?? 'preço não informado'} | categoria=${item.category ?? 'não informada'} | status=${item.status ?? 'unknown'}`);
    return `\nCATÁLOGO PRÓPRIO ANA MADÚ / CORE IMPULSIONANDO — consulta ${data.syncedAt ?? 'agora'}:\n${lines.join('\n')}\nUse somente estes dados para preço/disponibilidade nesta resposta. Status unknown não significa disponível.`;
  } catch {
    return '\nCATÁLOGO OPERACIONAL: consulta falhou. Não informe preço, estoque ou disponibilidade por memória.';
  }
}

export const Route = createFileRoute('/api/anamadu/anita/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null) as { text?: string; images?: unknown; attribution?: Attribution } | null;
        const text = body?.text?.trim() ?? '';
        const images = validImages(body?.images);
        if (!text && !images.length) return Response.json({ error: 'empty_message' }, { status: 400 });
        if (text.length > 12000) return Response.json({ error: 'message_too_large' }, { status: 413 });

        let model;
        try {
          model = annitaModel();
        } catch {
          return Response.json({ error: 'annita_ai_unavailable', provider: 'openai', credentialScope: 'impulsionando_central' }, { status: 503 });
        }

        const externalUserId = sessionId(request);
        const ledger = await recordInboundMessage({
          agentKey: 'anamadu-anita',
          channel: 'web_chat',
          provider: 'anamadu_front',
          externalUserId,
          bodyText: text || '[referências visuais enviadas]',
          endpointAddress: 'https://anamadu.impulsionando.com.br',
          metadata: { source: 'anamadu_annita_web_chat', attribution: body?.attribution ?? {}, image_count: images.length, multimodal: images.length > 0 },
        });

        const history = toMessages(await listConversationHistory(ledger.conversation_id, 50));
        const campaignContext = body?.attribution?.utm_campaign ? `\nContexto interno da origem da sessão: campanha ${body.attribution.utm_campaign}; fonte ${body.attribution.utm_source ?? 'não informada'}; meio ${body.attribution.utm_medium ?? 'não informado'}. Não exponha identificadores técnicos ao cliente.` : '';
        const catalogContext = await liveCatalogContext(request, text);
        const messages = [...history];
        if (images.length) messages.push({ role: 'user', content: [{ type: 'text', text: 'Analise estas referências visuais como especialista em pedras e design. Descreva o observável, apresente hipóteses responsáveis para as pedras quando possível, sugira como diferenciá-las e ajude a transformar a referência em peça Ana Madú/Ourives. Não faça afirmações materiais não verificadas.' }, ...images.map((image) => ({ type: 'image', image }))] } as any);

        const result = streamText({ model, system: SYSTEM + campaignContext + catalogContext, messages, temperature: 0.2, maxOutputTokens: 1200 });

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let full = '';
            try {
              for await (const chunk of result.textStream) { full += chunk; controller.enqueue(encoder.encode(chunk)); }
              if (full.trim()) await recordOutboundMessage({ conversationId: ledger.conversation_id, bodyText: full, channel: 'web_chat', provider: 'anamadu_front', endpointId: ledger.endpoint_id, metadata: { agent: 'Annita', architecture: 'CLIENT_INSTANCE', orchestrator: 'Impulsionito', specialty: 'gemology_and_ourives', llm_provider: 'openai', llm_model: MODEL_ID, credential_scope: 'impulsionando_central', image_count: images.length, multimodal: images.length > 0 } });
              controller.close();
            } catch (error) { controller.error(error); }
          },
        });

        return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-conversation-id': ledger.conversation_id, 'x-annita-provider': 'openai', 'x-annita-model': MODEL_ID, 'x-annita-credential-scope': 'impulsionando-central', 'x-annita-specialty': 'gemology-and-ourives', 'x-annita-multimodal': images.length ? 'true' : 'false' } });
      },
    },
  },
});
