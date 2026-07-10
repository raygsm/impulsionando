// Dados mock para a Fase B — Área do Cliente Marocas.
// Todos os valores aqui são exclusivamente visuais e devem ser substituídos
// pelo Codex por queries reais ao Supabase quando o backend for conectado.
// Nada aqui persiste, autentica ou chama serviços externos.

export type OperationStatus =
  | "carregando"
  | "vazio"
  | "pendente"
  | "confirmado"
  | "em_andamento"
  | "concluido"
  | "cancelado"
  | "urgente"
  | "erro";

export const STATUS_LABEL: Record<OperationStatus, string> = {
  carregando: "Carregando…",
  vazio: "Sem registros",
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  urgente: "Urgente",
  erro: "Erro",
};

export const STATUS_TONE: Record<OperationStatus, string> = {
  carregando: "bg-muted text-muted-foreground",
  vazio: "bg-muted text-muted-foreground",
  pendente: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  confirmado: "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  em_andamento: "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  concluido: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  cancelado: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  urgente: "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200",
  erro: "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200",
};

export interface MockImovel {
  id: string;
  apelido: string;
  endereco: string;
  bairro: string;
  quartos: number;
  capacidade: number;
  status: "ativo" | "pausado" | "manutencao";
  ocupacao30d: number; // %
  proximaEntrada?: string;
  proximaSaida?: string;
  cover: string;
}

export const MOCK_IMOVEIS: MockImovel[] = [
  {
    id: "imv-001",
    apelido: "Copa Ocean 902",
    endereco: "Av. Atlântica, 1702 · ap 902",
    bairro: "Copacabana",
    quartos: 2,
    capacidade: 4,
    status: "ativo",
    ocupacao30d: 87,
    proximaEntrada: "2026-07-12",
    proximaSaida: "2026-07-11",
    cover: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "imv-002",
    apelido: "Leme Studio 305",
    endereco: "Rua Gustavo Sampaio, 244 · ap 305",
    bairro: "Leme",
    quartos: 1,
    capacidade: 2,
    status: "ativo",
    ocupacao30d: 74,
    proximaEntrada: "2026-07-14",
    proximaSaida: "2026-07-13",
    cover: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "imv-003",
    apelido: "Ipanema Garden 1101",
    endereco: "Rua Prudente de Morais, 800 · ap 1101",
    bairro: "Ipanema",
    quartos: 3,
    capacidade: 6,
    status: "manutencao",
    ocupacao30d: 42,
    cover: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "imv-004",
    apelido: "Botafogo Bay 704",
    endereco: "Rua Voluntários da Pátria, 190 · ap 704",
    bairro: "Botafogo",
    quartos: 2,
    capacidade: 4,
    status: "pausado",
    ocupacao30d: 0,
    cover: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
  },
];

export interface MockReserva {
  id: string;
  codigo: string;
  imovelId: string;
  hospede: string;
  canal: "Airbnb" | "Booking" | "Direto" | "Vrbo";
  checkin: string;
  checkout: string;
  noites: number;
  valorTotal: number;
  status: OperationStatus;
  adultos: number;
  criancas: number;
}

export const MOCK_RESERVAS: MockReserva[] = [
  {
    id: "res-101",
    codigo: "HMKX-8231",
    imovelId: "imv-001",
    hospede: "Marina Ferreira",
    canal: "Airbnb",
    checkin: "2026-07-12",
    checkout: "2026-07-18",
    noites: 6,
    valorTotal: 4860,
    status: "confirmado",
    adultos: 2,
    criancas: 1,
  },
  {
    id: "res-102",
    codigo: "BKG-55420",
    imovelId: "imv-002",
    hospede: "Peter Novak",
    canal: "Booking",
    checkin: "2026-07-14",
    checkout: "2026-07-21",
    noites: 7,
    valorTotal: 3990,
    status: "confirmado",
    adultos: 2,
    criancas: 0,
  },
  {
    id: "res-103",
    codigo: "DIR-00918",
    imovelId: "imv-001",
    hospede: "Camila Ribeiro",
    canal: "Direto",
    checkin: "2026-07-22",
    checkout: "2026-07-27",
    noites: 5,
    valorTotal: 4200,
    status: "pendente",
    adultos: 2,
    criancas: 0,
  },
  {
    id: "res-104",
    codigo: "AIR-77192",
    imovelId: "imv-004",
    hospede: "Familia Souza",
    canal: "Airbnb",
    checkin: "2026-08-02",
    checkout: "2026-08-09",
    noites: 7,
    valorTotal: 5320,
    status: "cancelado",
    adultos: 3,
    criancas: 2,
  },
];

export type OpEventType =
  | "checkin"
  | "checkout"
  | "limpeza"
  | "vistoria"
  | "manutencao"
  | "reposicao"
  | "bloqueio"
  | "urgencia";

export const OP_EVENT_LABEL: Record<OpEventType, string> = {
  checkin: "Check-in",
  checkout: "Check-out",
  limpeza: "Limpeza",
  vistoria: "Vistoria",
  manutencao: "Manutenção",
  reposicao: "Reposição",
  bloqueio: "Bloqueio",
  urgencia: "Urgência",
};

export const OP_EVENT_TONE: Record<OpEventType, string> = {
  checkin: "bg-emerald-500",
  checkout: "bg-sky-500",
  limpeza: "bg-teal-500",
  vistoria: "bg-purple-500",
  manutencao: "bg-orange-500",
  reposicao: "bg-yellow-500",
  bloqueio: "bg-zinc-500",
  urgencia: "bg-red-500",
};

export interface MockOpEvento {
  id: string;
  tipo: OpEventType;
  imovelId: string;
  data: string; // ISO
  hora: string; // HH:mm
  responsavel?: string;
  status: OperationStatus;
  observacao?: string;
}

export const MOCK_AGENDA: MockOpEvento[] = [
  { id: "op-1", tipo: "checkout", imovelId: "imv-002", data: "2026-07-13", hora: "11:00", status: "pendente" },
  { id: "op-2", tipo: "limpeza", imovelId: "imv-002", data: "2026-07-13", hora: "12:00", responsavel: "Sandra M.", status: "confirmado" },
  { id: "op-3", tipo: "vistoria", imovelId: "imv-002", data: "2026-07-13", hora: "15:00", responsavel: "Rogério P.", status: "confirmado" },
  { id: "op-4", tipo: "checkin", imovelId: "imv-002", data: "2026-07-14", hora: "15:00", status: "confirmado" },
  { id: "op-5", tipo: "manutencao", imovelId: "imv-003", data: "2026-07-13", hora: "09:00", responsavel: "Élcio B.", status: "em_andamento", observacao: "Vazamento pia cozinha" },
  { id: "op-6", tipo: "urgencia", imovelId: "imv-001", data: "2026-07-12", hora: "22:10", status: "urgente", observacao: "Ar-condicionado sem gelar" },
  { id: "op-7", tipo: "reposicao", imovelId: "imv-001", data: "2026-07-11", hora: "10:00", responsavel: "Central Marocas", status: "concluido" },
  { id: "op-8", tipo: "bloqueio", imovelId: "imv-004", data: "2026-07-15", hora: "00:00", status: "confirmado", observacao: "Reforma pintura" },
];

export interface MockPrestador {
  id: string;
  nome: string;
  categoria: "Limpeza" | "Manutenção" | "Lavanderia" | "Vistoria" | "Chaveiro" | "Piscina";
  avaliacao: number;
  servicosMes: number;
  regioes: string[];
  status: "ativo" | "ferias" | "inativo";
}

export const MOCK_PRESTADORES: MockPrestador[] = [
  { id: "pr-1", nome: "Sandra M.", categoria: "Limpeza", avaliacao: 4.9, servicosMes: 42, regioes: ["Copacabana", "Leme"], status: "ativo" },
  { id: "pr-2", nome: "Élcio B.", categoria: "Manutenção", avaliacao: 4.8, servicosMes: 18, regioes: ["Copacabana", "Ipanema", "Leblon"], status: "ativo" },
  { id: "pr-3", nome: "Rogério P.", categoria: "Vistoria", avaliacao: 5.0, servicosMes: 27, regioes: ["Zona Sul"], status: "ativo" },
  { id: "pr-4", nome: "LavaJá", categoria: "Lavanderia", avaliacao: 4.7, servicosMes: 61, regioes: ["Copacabana", "Botafogo"], status: "ativo" },
  { id: "pr-5", nome: "Chaves 24h", categoria: "Chaveiro", avaliacao: 4.6, servicosMes: 9, regioes: ["Zona Sul"], status: "ferias" },
];

export interface MockServicoFila {
  id: string;
  tipo: OpEventType;
  imovelApelido: string;
  bairro: string;
  data: string;
  hora: string;
  valorSugerido: number;
  urgencia: "normal" | "alta" | "critica";
  descricao: string;
}

export const MOCK_FILA_SERVICOS: MockServicoFila[] = [
  { id: "sv-1", tipo: "limpeza", imovelApelido: "Copa Ocean 902", bairro: "Copacabana", data: "2026-07-18", hora: "12:00", valorSugerido: 180, urgencia: "normal", descricao: "Turnover pós check-out — 2 quartos, 1 banheiro" },
  { id: "sv-2", tipo: "manutencao", imovelApelido: "Ipanema Garden 1101", bairro: "Ipanema", data: "2026-07-14", hora: "09:00", valorSugerido: 260, urgencia: "alta", descricao: "Troca de resistência do chuveiro" },
  { id: "sv-3", tipo: "vistoria", imovelApelido: "Leme Studio 305", bairro: "Leme", data: "2026-07-13", hora: "15:30", valorSugerido: 120, urgencia: "normal", descricao: "Vistoria pré check-in" },
  { id: "sv-4", tipo: "urgencia", imovelApelido: "Copa Ocean 902", bairro: "Copacabana", data: "2026-07-12", hora: "22:30", valorSugerido: 320, urgencia: "critica", descricao: "Ar-condicionado sem gelar — hóspede aguardando" },
];

export interface MockAutomacao {
  id: string;
  nome: string;
  gatilho: string;
  canal: "WhatsApp" | "Email" | "SMS" | "Interno";
  status: "ativa" | "pausada" | "rascunho";
  execucoes30d: number;
}

export const MOCK_AUTOMACOES: MockAutomacao[] = [
  { id: "au-1", nome: "Boas-vindas ao hóspede", gatilho: "Reserva confirmada", canal: "WhatsApp", status: "ativa", execucoes30d: 84 },
  { id: "au-2", nome: "Instruções de check-in", gatilho: "24h antes do check-in", canal: "WhatsApp", status: "ativa", execucoes30d: 78 },
  { id: "au-3", nome: "Solicitação de avaliação", gatilho: "1h após check-out", canal: "WhatsApp", status: "ativa", execucoes30d: 71 },
  { id: "au-4", nome: "Alerta de manutenção crítica", gatilho: "Chamado urgência aberto", canal: "Interno", status: "ativa", execucoes30d: 6 },
  { id: "au-5", nome: "Recuperação de reserva", gatilho: "Cotação sem resposta 24h", canal: "Email", status: "pausada", execucoes30d: 0 },
  { id: "au-6", nome: "Onboarding do prestador", gatilho: "Cadastro aprovado", canal: "Email", status: "rascunho", execucoes30d: 0 },
];

// Guest side ------------------------------------------------------
export interface MockHospedeReserva {
  codigo: string;
  imovelApelido: string;
  endereco: string;
  bairro: string;
  checkin: string;
  checkout: string;
  noites: number;
  adultos: number;
  criancas: number;
  wifiSsid: string;
  wifiSenhaMock: string; // exibida com blur
  senhaPortaMock: string; // exibida com blur/one-time reveal
  concierge: string;
  regras: string[];
}

export const MOCK_HOSPEDE_RESERVA: MockHospedeReserva = {
  codigo: "HMKX-8231",
  imovelApelido: "Copa Ocean 902",
  endereco: "Av. Atlântica, 1702 · ap 902 · Copacabana",
  bairro: "Copacabana",
  checkin: "2026-07-12",
  checkout: "2026-07-18",
  noites: 6,
  adultos: 2,
  criancas: 1,
  wifiSsid: "MAROCAS-902",
  wifiSenhaMock: "••••••••",
  senhaPortaMock: "••••",
  concierge: "(21) 99307-5000",
  regras: [
    "Check-in a partir das 15h · check-out até 11h",
    "Não é permitido fumar no interior do imóvel",
    "Animais de pequeno porte sob solicitação prévia",
    "Silêncio das 22h às 8h por regra do condomínio",
  ],
};

export const MOCK_ROTEIROS = [
  {
    id: "rt-1",
    titulo: "Copacabana em 24h",
    descricao: "Café no Boteco Belmonte, quiosques do posto 4 e pôr-do-sol no Arpoador.",
    tags: ["gastronomia", "praia", "clássico"],
  },
  {
    id: "rt-2",
    titulo: "Rio para famílias",
    descricao: "AquaRio, Museu do Amanhã, teleférico da Urca e picolé no Uruguai.",
    tags: ["família", "cultura"],
  },
  {
    id: "rt-3",
    titulo: "Trilhas & mirantes",
    descricao: "Morro da Urca ao amanhecer, Pedra do Telégrafo e Pedra Bonita ao entardecer.",
    tags: ["natureza", "trilha"],
  },
];

export const MOCK_HOSPEDE_HISTORICO = [
  { codigo: "HMKX-7801", imovel: "Leme Studio 305", checkin: "2025-11-04", checkout: "2025-11-09", nota: 5 },
  { codigo: "HMKX-6650", imovel: "Copa Ocean 902", checkin: "2025-02-18", checkout: "2025-02-24", nota: 5 },
];

// Provider side ---------------------------------------------------
export interface MockPrestadorServico {
  id: string;
  tipo: OpEventType;
  imovelApelido: string;
  bairro: string;
  data: string;
  hora: string;
  valor: number;
  status: OperationStatus;
}

export const MOCK_PRESTADOR_AGENDA: MockPrestadorServico[] = [
  { id: "ps-1", tipo: "limpeza", imovelApelido: "Leme Studio 305", bairro: "Leme", data: "2026-07-13", hora: "12:00", valor: 150, status: "confirmado" },
  { id: "ps-2", tipo: "limpeza", imovelApelido: "Copa Ocean 902", bairro: "Copacabana", data: "2026-07-18", hora: "12:00", valor: 180, status: "confirmado" },
  { id: "ps-3", tipo: "vistoria", imovelApelido: "Ipanema Garden 1101", bairro: "Ipanema", data: "2026-07-15", hora: "10:00", valor: 120, status: "em_andamento" },
  { id: "ps-4", tipo: "limpeza", imovelApelido: "Botafogo Bay 704", bairro: "Botafogo", data: "2026-07-08", hora: "12:00", valor: 170, status: "concluido" },
  { id: "ps-5", tipo: "limpeza", imovelApelido: "Copa Ocean 902", bairro: "Copacabana", data: "2026-07-01", hora: "12:00", valor: 180, status: "cancelado" },
];

// Helpers ---------------------------------------------------------
export function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function imovelById(id: string) {
  return MOCK_IMOVEIS.find((i) => i.id === id);
}
