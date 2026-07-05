/**
 * Impulsionito — Transport HTTP/SSE-like.
 *
 * Faz POST para /api/impulsionito/chat e lê a resposta em streaming
 * (text/plain chunks). Fallback automático para modo mock quando:
 *  - `VITE_IMPULSIONITO_MODE=mock` (dev/demo forçado)
 *  - o endpoint retorna erro / falha de rede (modo degradado)
 *  - `navigator.onLine === false`
 *
 * Contrato mantido — a UI não precisou mudar:
 *
 *   sendMessage({ text, context, history?, signal? }) -> AsyncIterable<TokenChunk>
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
  pathname: string;
  screen?: string;
  companyId?: string | null;
  audience?: string | null;
}

export interface SendMessageInput {
  text: string;
  context: ImpulsionitoContext;
  /** Histórico já persistido (sem a mensagem nova). */
  history?: ImpulsionitoMessage[];
  signal?: AbortSignal;
}

export interface TokenChunk {
  delta: string;
  done?: boolean;
}

export interface ImpulsionitoTransport {
  sendMessage: (input: SendMessageInput) => AsyncIterable<TokenChunk>;
  mode: "mock" | "live";
}

const ENDPOINT = "/api/impulsionito/chat";

// ---------------------------------------------------------------------------
// Mock (fallback local — permanece para dev e degradação graciosa).
// ---------------------------------------------------------------------------

function pickMockReply(input: SendMessageInput): string {
  const t = input.text.toLowerCase().trim();
  const path = input.context.pathname;
  if (!t) return "Diga o que você precisa que eu já te ajudo aqui no Core.";
  if (t.includes("ola") || t.includes("olá") || t === "oi")
    return "Olá! Sou o Impulsionito. Como posso te ajudar nesta tela?";
  if (t.includes("agenda"))
    return "Você pode abrir a Agenda pelo menu lateral. Quer que eu detalhe algum recurso específico?";
  if (t.includes("financeiro") || t.includes("pagamento") || t.includes("pix"))
    return "Para pagamentos e faturas, vá em Financeiro → Minha Assinatura.";
  if (t.includes("whatsapp"))
    return "O canal WhatsApp está no roadmap (Z-API na fase 1). Por enquanto, converse comigo por aqui mesmo.";
  if (path.startsWith("/admin"))
    return "Você está na área administrativa. Posso te orientar sobre métricas, ajustes ou próximas ações.";
  return `Entendi. Registrei "${input.text.slice(0, 80)}". Como posso avançar?`;
}

async function* streamMock(input: SendMessageInput): AsyncIterable<TokenChunk> {
  const full = pickMockReply(input);
  const parts = full.match(/\S+\s*/g) ?? [full];
  for (const p of parts) {
    if (input.signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 25 + Math.random() * 40));
    yield { delta: p };
  }
  yield { delta: "", done: true };
}

// ---------------------------------------------------------------------------
// Live — HTTP streaming contra /api/impulsionito/chat.
// ---------------------------------------------------------------------------

async function* streamLive(input: SendMessageInput): AsyncIterable<TokenChunk> {
  const history = (input.history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20)
    .map((m) => ({ role: m.role, text: m.text }));

  const payload = {
    messages: [...history, { role: "user" as const, text: input.text }],
    context: {
      pathname: input.context.pathname,
      screen: input.context.screen,
      audience: input.context.audience,
    },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/plain" },
    body: JSON.stringify(payload),
    signal: input.signal,
  });

  if (!res.ok || !res.body) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) detail = j.error;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      if (input.signal?.aborted) {
        try { await reader.cancel(); } catch { /* ignore */ }
        return;
      }
      const { value, done } = await reader.read();
      if (done) break;
      if (value) yield { delta: value };
    }
    yield { delta: "", done: true };
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Seleção de modo.
// ---------------------------------------------------------------------------

function forcedMockMode(): boolean {
  try {
    const m = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_IMPULSIONITO_MODE;
    if (m === "mock") return true;
  } catch { /* ignore */ }
  return false;
}

const liveTransport: ImpulsionitoTransport = {
  mode: "live",
  sendMessage: (input) => {
    // Wrapper que faz fallback gracioso: se streamLive falhar antes do
    // primeiro chunk (rede, 502), cai para mock automaticamente.
    return {
      [Symbol.asyncIterator]: async function* () {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          yield* streamMock(input);
          return;
        }
        try {
          const it = streamLive(input)[Symbol.asyncIterator]();
          const first = await it.next();
          if (first.done) return;
          yield first.value;
          while (true) {
            const n = await it.next();
            if (n.done) return;
            yield n.value;
          }
        } catch (err) {
          if (input.signal?.aborted) return;
          console.warn("[impulsionito] live falhou, usando mock:", err);
          yield {
            delta: "",
          };
          yield* streamMock(input);
        }
      },
    };
  },
};

const mockTransport: ImpulsionitoTransport = {
  mode: "mock",
  sendMessage: (input) => streamMock(input),
};

export function useImpulsionitoTransport(): ImpulsionitoTransport {
  return forcedMockMode() ? mockTransport : liveTransport;
}

// ---------------------------------------------------------------------------
// Sugestões contextuais por rota.
// ---------------------------------------------------------------------------

const NICHO_SUGGESTIONS: Record<string, string[]> = {
  clinicas: ["Como funciona a agenda de consultas?", "Como enviar lembretes por WhatsApp?", "Como emitir recibo/NFS-e?"],
  saude: ["Como funciona a agenda de consultas?", "Como enviar lembretes por WhatsApp?", "Como emitir recibo/NFS-e?"],
  "bares-restaurantes": ["Como funciona o cardápio digital?", "Como controlar comanda e mesa?", "Como fechar o caixa do dia?"],
  bar: ["Como funciona o cardápio digital?", "Como controlar comanda e mesa?", "Como fechar o caixa do dia?"],
  microcervejarias: ["Como controlar a produção?", "Como gerir vendas por canal?", "Como fidelizar cliente do clube?"],
  imobiliaria: ["Como cadastrar um imóvel?", "Como qualificar leads no CRM?", "Como agendar uma visita?"],
  eventos: ["Como montar um orçamento?", "Como gerir fornecedores?", "Como acompanhar o funil do evento?"],
  juridico: ["Como controlar prazos e processos?", "Como cadastrar honorários?", "Como enviar contratos?"],
  advocacia: ["Como controlar prazos e processos?", "Como cadastrar honorários?", "Como enviar contratos?"],
  contabilidade: ["Como organizar documentos do cliente?", "Como enviar relatórios mensais?", "Como cobrar honorários?"],
  psicologia: ["Como agendar sessão?", "Como controlar prontuário?", "Como cobrar via PIX/cartão?"],
  fitness: ["Como controlar matrículas?", "Como agendar aula/personal?", "Como reter aluno em risco?"],
  educacao: ["Como matricular aluno?", "Como emitir boletim?", "Como comunicar com responsáveis?"],
  ecommerce: ["Como integrar minha loja?", "Como gerir estoque?", "Como acompanhar pedidos?"],
  veiculos: ["Como cadastrar veículo?", "Como gerir test-drive?", "Como acompanhar propostas?"],
  fornecedores: ["Como listar produtos?", "Como receber cotações?", "Como gerir pedidos B2B?"],
  comercio: ["Como cadastrar produto?", "Como controlar estoque?", "Como fechar venda no PDV?"],
  servicos: ["Como agendar prestação de serviço?", "Como orçar e cobrar?", "Como gerir equipe em campo?"],
  comunidade: ["Como gerir associados?", "Como controlar mensalidade?", "Como enviar comunicados?"],
  "white-label": ["Como replico a plataforma para meu cliente?", "Como aplico minha marca?", "Como cobro dos meus clientes?"],
};

export function nichoSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/(?:nichos|demo\/nicho)\/([^/?#]+)/);
  return m?.[1] ?? null;
}

export function moduleSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/(?:modulos|demo\/modulos|admin\/modules)\/([^/?#]+)/);
  return m?.[1] ?? null;
}


export function suggestionsForRoute(pathname: string): string[] {
  const nichoSlug = nichoSlugFromPath(pathname);
  if (nichoSlug && NICHO_SUGGESTIONS[nichoSlug]) return NICHO_SUGGESTIONS[nichoSlug];
  if (pathname === "/nichos" || pathname.startsWith("/nichos/") || pathname.startsWith("/demo/nicho/"))
    return ["Qual nicho combina com meu negócio?", "Ver uma demonstração agora", "Quanto custa cada plano?"];
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

// ---------------------------------------------------------------------------
// Exportação de conversa (utilizado pelo dock).
// ---------------------------------------------------------------------------

export function exportConversation(
  messages: ImpulsionitoMessage[],
  format: "json" | "txt",
): { filename: string; mime: string; content: string } {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  if (format === "json") {
    return {
      filename: `impulsionito-${stamp}.json`,
      mime: "application/json",
      content: JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          messages: messages.map((m) => ({
            role: m.role,
            text: m.text,
            ts: m.ts,
            iso: new Date(m.ts).toISOString(),
          })),
        },
        null,
        2,
      ),
    };
  }
  const lines = messages.map((m) => {
    const who = m.role === "user" ? "Você" : m.role === "assistant" ? "Impulsionito" : "Sistema";
    const time = new Date(m.ts).toLocaleString("pt-BR");
    return `[${time}] ${who}:\n${m.text}\n`;
  });
  return {
    filename: `impulsionito-${stamp}.txt`,
    mime: "text/plain;charset=utf-8",
    content: `Conversa com Impulsionito — exportada em ${new Date().toLocaleString("pt-BR")}\n\n${lines.join("\n")}`,
  };
}
