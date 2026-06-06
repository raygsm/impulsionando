/**
 * Helpers de navegação cruzada entre as demos CRM / WhatsApp / Agenda.
 *
 * Lê e escreve diretamente no mesmo localStorage namespace usado pelo
 * `useDemoState` (prefixo `imp.demo.`) e dispara o evento
 * `imp:demo-sandbox-changed` para que os componentes em outras abas/rotas
 * sincronizem o estado automaticamente. Nenhuma chamada de banco.
 */

const EVT = "imp:demo-sandbox-changed";

function read<T>(fullKey: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(fullKey);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(fullKey: string, value: T) {
  try {
    localStorage.setItem(fullKey, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVT, { detail: { key: fullKey } }));
  } catch {
    /* ignore */
  }
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const K = {
  crmLeads: "imp.demo.crm.leads",
  waContatos: "imp.demo.wa.contatos",
  waConv: "imp.demo.wa.conv",
};

type CrmLead = {
  id: string; nome: string; email: string; telefone: string;
  origem: string; estagio: string; valor: number; score: number; tags: string[]; criadoEm: string;
};
type WaContato = { id: string; nome: string; telefone: string; tags: string[]; optIn: boolean };
type WaConversa = { id: string; contatoId: string; mensagens: { de: "cliente" | "atendente" | "bot"; texto: string; quando: string }[]; status: "aberto" | "fechado" };

export type DemoActor = { nome: string; telefone?: string; email?: string };

/** Garante um lead no CRM com base em nome+telefone; retorna o id. */
export function ensureCrmLead(a: DemoActor, origem = "Cross-link"): string {
  const leads = read<CrmLead[]>(K.crmLeads, []);
  const existing = leads.find((l) => (a.telefone && l.telefone === a.telefone) || (a.email && l.email === a.email) || l.nome === a.nome);
  if (existing) return existing.id;
  const lead: CrmLead = {
    id: uid("ld"),
    nome: a.nome,
    email: a.email ?? "",
    telefone: a.telefone ?? "",
    origem,
    estagio: "Novo",
    valor: 0,
    score: 50,
    tags: ["cross-link"],
    criadoEm: new Date().toISOString(),
  };
  write(K.crmLeads, [lead, ...leads]);
  return lead.id;
}

/** Garante um contato no WhatsApp; retorna o id. */
export function ensureWaContato(a: DemoActor): string {
  const contatos = read<WaContato[]>(K.waContatos, []);
  const existing = contatos.find((c) => (a.telefone && c.telefone === a.telefone) || c.nome === a.nome);
  if (existing) return existing.id;
  const c: WaContato = {
    id: uid("ct"),
    nome: a.nome,
    telefone: a.telefone ?? "",
    tags: ["cross-link"],
    optIn: true,
  };
  write(K.waContatos, [c, ...contatos]);
  return c.id;
}

/** Garante uma conversa aberta para o contato; retorna o id da conversa. */
export function ensureWaConversa(contatoId: string, primeiraMsg?: string): string {
  const convs = read<WaConversa[]>(K.waConv, []);
  const existing = convs.find((c) => c.contatoId === contatoId);
  if (existing) return existing.id;
  const conv: WaConversa = {
    id: uid("cv"),
    contatoId,
    status: "aberto",
    mensagens: primeiraMsg
      ? [{ de: "atendente", texto: primeiraMsg, quando: new Date().toISOString() }]
      : [],
  };
  write(K.waConv, [conv, ...convs]);
  return conv.id;
}

/** Abre o WhatsApp já com a conversa selecionada. */
export function gotoWhatsapp(a: DemoActor, mensagemInicial?: string): string {
  const contatoId = ensureWaContato(a);
  const convId = ensureWaConversa(contatoId, mensagemInicial);
  const url = `/demo/whatsapp?conv=${encodeURIComponent(convId)}`;
  if (typeof window !== "undefined") window.location.href = url;
  return url;
}

/** Abre a Agenda já com o cliente pré-preenchido no formulário. */
export function gotoAgenda(a: DemoActor): string {
  const qs = new URLSearchParams();
  qs.set("cliente", a.nome);
  if (a.telefone) qs.set("telefone", a.telefone);
  const url = `/demo/agenda?${qs.toString()}#agendar`;
  if (typeof window !== "undefined") window.location.href = url;
  return url;
}

/** Abre o CRM destacando o lead. */
export function gotoCrm(a: DemoActor): string {
  const id = ensureCrmLead(a);
  const url = `/demo/crm?lead=${encodeURIComponent(id)}`;
  if (typeof window !== "undefined") window.location.href = url;
  return url;
}
