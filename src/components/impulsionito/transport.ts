/** Impulsionito — transport HTTP com streaming e contexto autenticado opcional. */
import type { BrainSnapshot, LlmConfig } from "@/lib/impulsionito/types";
import { supabase } from "@/integrations/supabase/client";

export type ImpulsionitoRole = "user" | "assistant" | "system";
export interface ImpulsionitoMessage { id: string; role: ImpulsionitoRole; text: string; ts: number; status?: "sending" | "streaming" | "done" | "error"; }
export interface ImpulsionitoContext { pathname: string; screen?: string; companyId?: string | null; audience?: string | null; channel?: string; tenant?: string; userProfile?: string; }
export interface SendMessageInput { text: string; context: ImpulsionitoContext; history?: ImpulsionitoMessage[]; brain?: BrainSnapshot; llm?: Partial<LlmConfig>; signal?: AbortSignal; }
export interface TokenChunk { delta: string; done?: boolean; }
export interface ImpulsionitoTransport { sendMessage: (input: SendMessageInput) => AsyncIterable<TokenChunk>; mode: "mock" | "live"; }

const ENDPOINT = "/api/impulsionito/chat";
const SESSION_STORAGE_KEY = "impulsionito:web-session:v1";

function getAnonymousWebSessionId(): string {
  if (typeof window === "undefined") return "web:ssr";
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)?.trim();
    if (existing) return existing.slice(0, 200);
    const generated = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `web:${crypto.randomUUID()}` : `web:${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch { return `web:ephemeral:${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

function isDemoPath(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

function pickMockReply(input: SendMessageInput): string {
  const t = input.text.toLowerCase().trim(); const path = input.context.pathname;
  if (!t) return "Diga o que você quer explorar nesta demonstração e eu mostro como o recurso funciona.";
  if (t.includes("ola") || t.includes("olá") || t === "oi") return "Olá! Sou o Impulsionito desta demonstração. Posso guiar você pelos recursos deste cenário.";
  if (t.includes("agenda")) return "Nesta demonstração, a Agenda representa a jornada contratada: disponibilidade, encaixes, pega-agenda, antecipação e automações.";
  if (t.includes("financeiro") || t.includes("pagamento") || t.includes("pix")) return "Nesta demonstração, o Financeiro mostra cobrança, conciliação, recorrência, PIX/cartão e indicadores sem usar dados reais de clientes.";
  if (t.includes("whatsapp")) return "Nesta demonstração, o WhatsApp mostra templates, jornadas e automações que o cliente poderá editar ou solicitar ao time Impulsionando.";
  if (path.startsWith("/demo")) return `Entendi. Vou usar o cenário demonstrativo para mostrar como "${input.text.slice(0,80)}" funciona no produto contratado.`;
  return "Demonstração indisponível fora de /demo.";
}

async function* streamMock(input: SendMessageInput): AsyncIterable<TokenChunk> {
  const full = pickMockReply(input); const parts = full.match(/\S+\s*/g) ?? [full];
  for (const p of parts) { if (input.signal?.aborted) return; await new Promise(r => setTimeout(r,25 + Math.random()*40)); yield { delta:p }; }
  yield { delta:"", done:true };
}

async function authenticatedHeaders(): Promise<Record<string,string>> {
  const headers: Record<string,string> = { "Content-Type":"application/json", Accept:"text/plain", "X-Impulsionando-Session":getAnonymousWebSessionId() };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch { /* chat público continua anônimo */ }
  return headers;
}

async function* streamLive(input: SendMessageInput): AsyncIterable<TokenChunk> {
  const history = (input.history ?? []).filter(m => m.role === "user" || m.role === "assistant").slice(-20).map(m => ({ role:m.role, text:m.text }));
  const payload = {
    messages:[...history,{ role:"user" as const,text:input.text }],
    context:{ pathname:input.context.pathname,screen:input.context.screen,audience:input.context.audience,channel:input.context.channel ?? "web",tenant:input.context.tenant,userProfile:input.context.userProfile },
    brain:input.brain,llm:input.llm,
  };
  const res = await fetch(ENDPOINT,{ method:"POST",headers:await authenticatedHeaders(),body:JSON.stringify(payload),signal:input.signal });
  if (!res.ok || !res.body) {
    let detail=`HTTP ${res.status}`; try { const j=await res.json() as {error?:string}; if(j?.error) detail=j.error; } catch { /* ignore */ }
    throw new Error(detail);
  }
  const reader=res.body.pipeThrough(new TextDecoderStream()).getReader();
  try { while(true){ if(input.signal?.aborted){ try{await reader.cancel();}catch{} return; } const {value,done}=await reader.read(); if(done)break; if(value)yield{delta:value}; } yield{delta:"",done:true}; }
  finally { try{reader.releaseLock();}catch{} }
}

function forcedMockMode(pathname?: string): boolean {
  if (!pathname || !isDemoPath(pathname)) return false;
  try { return (import.meta as unknown as {env?:Record<string,string>}).env?.VITE_IMPULSIONITO_MODE === "mock"; } catch { return false; }
}

const liveTransport: ImpulsionitoTransport = { mode:"live", sendMessage:(input)=>({ [Symbol.asyncIterator]:async function*(){
  const demo = isDemoPath(input.context.pathname);
  if(typeof navigator!=="undefined" && navigator.onLine===false){
    if (demo) { yield* streamMock(input); return; }
    throw new Error("Sem conexão. Fora da área de demonstração o Impulsionito não gera respostas fictícias.");
  }
  try {
    const it=streamLive(input)[Symbol.asyncIterator](); const first=await it.next(); if(first.done)return; yield first.value;
    while(true){const n=await it.next();if(n.done)return;yield n.value;}
  } catch(err){
    if(input.signal?.aborted)return;
    if (demo) { console.warn("[impulsionito/demo] live falhou; usando cenário demonstrativo isolado",err); yield* streamMock(input); return; }
    console.error("[impulsionito] falha live sem fallback fictício", err);
    throw err;
  }
}})};
const mockTransport: ImpulsionitoTransport = { mode:"mock",sendMessage:(input)=>streamMock(input) };
export function useImpulsionitoTransport(): ImpulsionitoTransport {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  return forcedMockMode(pathname)?mockTransport:liveTransport;
}

const NICHO_SUGGESTIONS: Record<string,string[]> = {
  clinicas:["Como funciona a agenda de consultas?","Como enviar lembretes por WhatsApp?","Como emitir recibo/NFS-e?"],
  saude:["Como funciona a agenda de consultas?","Como enviar lembretes por WhatsApp?","Como emitir recibo/NFS-e?"],
  "bares-restaurantes":["Como funciona o cardápio digital?","Como controlar comanda e mesa?","Como fechar o caixa do dia?"],
  bar:["Como funciona o cardápio digital?","Como controlar comanda e mesa?","Como fechar o caixa do dia?"],
  microcervejarias:["Como controlar a produção?","Como gerir vendas por canal?","Como fidelizar cliente do clube?"],
  imobiliaria:["Como cadastrar um imóvel?","Como qualificar leads no CRM?","Como agendar uma visita?"],
  eventos:["Como montar um orçamento?","Como gerir fornecedores?","Como acompanhar o funil do evento?"],
  juridico:["Como controlar prazos e processos?","Como cadastrar honorários?","Como enviar contratos?"],
  advocacia:["Como controlar prazos e processos?","Como cadastrar honorários?","Como enviar contratos?"],
  contabilidade:["Como organizar documentos do cliente?","Como enviar relatórios mensais?","Como cobrar honorários?"],
  psicologia:["Como agendar sessão?","Como controlar prontuário?","Como cobrar via PIX/cartão?"],
  fitness:["Como controlar matrículas?","Como agendar aula/personal?","Como reter aluno em risco?"],
  educacao:["Como matricular aluno?","Como emitir boletim?","Como comunicar com responsáveis?"],
  ecommerce:["Como integrar minha loja?","Como gerir estoque?","Como acompanhar pedidos?"],
  veiculos:["Como cadastrar veículo?","Como gerir test-drive?","Como acompanhar propostas?"],
  fornecedores:["Como listar produtos?","Como receber cotações?","Como gerir pedidos B2B?"],
  comercio:["Como cadastrar produto?","Como controlar estoque?","Como fechar venda no PDV?"],
  servicos:["Como agendar prestação de serviço?","Como orçar e cobrar?","Como gerir equipe em campo?"],
  comunidade:["Como gerir associados?","Como controlar mensalidade?","Como enviar comunicados?"],
  "white-label":["Como replico a plataforma para meu cliente?","Como aplico minha marca?","Como cobro dos meus clientes?"],
};
export function nichoSlugFromPath(pathname:string):string|null { return pathname.match(/^\/(?:nichos|demo\/nicho)\/([^/?#]+)/)?.[1] ?? null; }
export function moduleSlugFromPath(pathname:string):string|null { return pathname.match(/^\/(?:modulos|demo\/modulos|admin\/modules)\/([^/?#]+)/)?.[1] ?? null; }
export function suggestionsForRoute(pathname:string):string[]{
  const n=nichoSlugFromPath(pathname); if(n&&NICHO_SUGGESTIONS[n])return NICHO_SUGGESTIONS[n];
  if(pathname==="/nichos"||pathname.startsWith("/nichos/")||pathname.startsWith("/demo/nicho/"))return["Qual nicho combina com meu negócio?","Ver uma demonstração agora","Quanto custa cada plano?"];
  if(pathname.startsWith("/admin/billing"))return["Resumo de inadimplência","Clientes em atraso hoje","Gerar relatório de cobrança"];
  if(pathname.startsWith("/admin"))return["Resumo do dia","Alertas críticos","O que mudou nas últimas 24h?"];
  if(pathname.startsWith("/crm"))return["Meus leads quentes","Follow-ups de hoje","Sugerir roteiro de contato"];
  if(pathname.startsWith("/agenda"))return["Agenda de hoje","Próximos compromissos","Bloquear horário"];
  if(pathname.startsWith("/finance")||pathname.startsWith("/financeiro"))return["Fluxo de caixa da semana","Contas a receber","Como emitir NF?"];
  if(pathname.startsWith("/marketing"))return["Ideia de campanha","Sugerir copy de anúncio","Melhor canal para meu público"];
  if(pathname.startsWith("/clube")||pathname.startsWith("/area-clube"))return["Meus benefícios","Como usar o clube","Falar com suporte"];
  return["O que posso fazer aqui?","Me mostre um resumo do meu negócio","Como você funciona?"];
}

export function exportConversation(messages:ImpulsionitoMessage[],format:"json"|"txt"):{filename:string;mime:string;content:string}{
  const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
  if(format==="json")return{filename:`impulsionito-${stamp}.json`,mime:"application/json",content:JSON.stringify({exportedAt:new Date().toISOString(),messages:messages.map(m=>({role:m.role,text:m.text,ts:m.ts,iso:new Date(m.ts).toISOString()}))},null,2)};
  const lines=messages.map(m=>{const who=m.role==="user"?"Você":m.role==="assistant"?"Impulsionito":"Sistema";return`[${new Date(m.ts).toLocaleString("pt-BR")}] ${who}:\n${m.text}\n`;});
  return{filename:`impulsionito-${stamp}.txt`,mime:"text/plain;charset=utf-8",content:`Conversa com Impulsionito — exportada em ${new Date().toLocaleString("pt-BR")}\n\n${lines.join("\n")}`};
}
