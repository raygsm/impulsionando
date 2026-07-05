/**
 * Impulsionito — Transport (mock, sem backend).
 *
 * Ponto único de integração para o Codex ligar depois no backend real
 * (ex.: /api/impulsionito/chat + OpenAI Responses API / Lovable AI Gateway).
 *
 * Regras da trava atual (frontend-only-lock):
 * - Nenhuma requisição de rede real.
 * - Nenhum secret, nenhum Supabase, nenhum server function.
 * - Toda resposta é simulada localmente com atraso e streaming fake.
 *
 * Contrato público (NÃO mudar sem alinhar com o roadmap
 * docs/IMPULSIONITO_BACKEND_ROADMAP_W110.md):
 *
 *   sendMessage({ text, context }) -> AsyncIterable<TokenChunk>
 *
 * Quando o backend estiver pronto, basta trocar a implementação de
 * `useImpulsionitoTransport` sem tocar em UI.
 */

export type ImpulsionitoRole = "user" | "assistant" | "system";

export interface ImpulsionitoMessage {
  id: string;
  role: ImpulsionitoRole;
  text: string;
  ts: number;
  status?: "sending" | "streaming" | "done" | "error";
}

export interface ImpulsionitoContext {
  /** Rota atual do usuário no Core. */
  pathname: string;
  /** Título curto da tela (breadcrumb / doc.title). */
  screen?: string;
  /** Tenant/empresa ativa, se conhecida. */
  companyId?: string | null;
  /** Audiência do usuário (b2b, consumidor, whitelabel, admin). */
  audience?: string | null;
}

export interface SendMessageInput {
  text: string;
  context: ImpulsionitoContext;
  signal?: AbortSignal;
}

export interface TokenChunk {
  delta: string;
  done?: boolean;
}

export interface ImpulsionitoTransport {
  sendMessage: (input: SendMessageInput) => AsyncIterable<TokenChunk>;
  /** Indicador visual — enquanto backend não existe, sempre `mock`. */
  mode: "mock" | "live";
}

// ---------------------------------------------------------------------------
// Mock — respostas curtas e contextuais por rota. Sem chamadas de rede.
// ---------------------------------------------------------------------------

function pickReply(input: SendMessageInput): string {
  const t = input.text.toLowerCase().trim();
  const path = input.context.pathname;

  if (!t) return "Diga o que você precisa que eu já te ajudo aqui no Core.";

  if (t.includes("ola") || t.includes("olá") || t === "oi") {
    return "Olá! Eu sou o Impulsionito. Estou em modo visual de demonstração — o backend real será plugado em seguida. Como posso te orientar nesta tela?";
  }

  if (t.includes("agenda")) {
    return "Você pode abrir a Agenda pelo menu lateral. Nesta versão visual, ainda não executo ações — só te oriento no fluxo.";
  }

  if (t.includes("financeiro") || t.includes("pagamento") || t.includes("boleto") || t.includes("pix")) {
    return "Para pagamentos e faturas, vá em Financeiro → Minha Assinatura. Quando meu backend estiver ativo, eu mesmo gero o link de pagamento aqui.";
  }

  if (t.includes("whatsapp")) {
    return "O canal WhatsApp está no roadmap (Z-API na fase 1 → Meta Cloud API na fase 2). Por enquanto, converse comigo por aqui mesmo.";
  }

  if (path.startsWith("/admin")) {
    return "Estou vendo que você está na área administrativa. Quando o backend estiver ativo, respondo com métricas reais desta tela e sugiro próximas ações.";
  }

  if (path.startsWith("/crm")) {
    return "No CRM eu consigo te ajudar a triagem de leads, próximos follow-ups e roteiros de contato. Agora é só demo visual.";
  }

  return `Entendi. Nesta versão visual eu não executo ações, mas registrei sua mensagem "${input.text.slice(0, 80)}". O backend real será ligado em seguida.`;
}

async function* streamMock(input: SendMessageInput): AsyncIterable<TokenChunk> {
  const full = pickReply(input);
  // divide em tokens curtos para simular streaming
  const parts = full.match(/\S+\s*/g) ?? [full];
  for (const p of parts) {
    if (input.signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 25 + Math.random() * 45));
    yield { delta: p };
  }
  yield { delta: "", done: true };
}

const mockTransport: ImpulsionitoTransport = {
  mode: "mock",
  sendMessage: (input) => streamMock(input),
};

export function useImpulsionitoTransport(): ImpulsionitoTransport {
  // Quando houver backend, retornar aqui o transport HTTP/SSE real.
  return mockTransport;
}

// ---------------------------------------------------------------------------
// Sugestões contextuais por rota — visuais, sem lógica de negócio.
// ---------------------------------------------------------------------------

export function suggestionsForRoute(pathname: string): string[] {
  if (pathname.startsWith("/admin/billing"))
    return ["Resumo de inadimplência", "Clientes em atraso hoje", "Gerar relatório de cobrança"];
  if (pathname.startsWith("/admin"))
    return ["Resumo do dia", "Alertas críticos", "O que mudou nas últimas 24h?"];
  if (pathname.startsWith("/crm"))
    return ["Meus leads quentes", "Follow-ups de hoje", "Sugerir roteiro de contato"];
  if (pathname.startsWith("/agenda"))
    return ["Agenda de hoje", "Próximos compromissos", "Bloquear horário"];
  if (pathname.startsWith("/finance") || pathname.startsWith("/financeiro"))
    return ["Fluxo de caixa da semana", "Contas a receber", "Como emitir NF?"];
  if (pathname.startsWith("/marketing"))
    return ["Ideia de campanha", "Sugerir copy de anúncio", "Melhor canal para meu público"];
  if (pathname.startsWith("/clube") || pathname.startsWith("/area-clube"))
    return ["Meus benefícios", "Como usar o clube", "Falar com suporte"];
  return ["O que posso fazer aqui?", "Me mostre um resumo do meu negócio", "Como você funciona?"];
}
