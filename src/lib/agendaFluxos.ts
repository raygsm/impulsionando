// BLOCO 3/5 — Fluxos de agendamento, pagamento DEMO, no-show, fila, encaixe, retorno, pesquisa.
export type FluxoLog = {
  id: string;
  at: string;
  area: "agendamento" | "pagamento" | "cancelamento" | "noshow" | "fila" | "encaixe" | "retorno" | "pesquisa";
  msg: string;
};

export type DemoPagamento = {
  id: string;
  agendamentoId: string;
  cliente: string;
  servico: string;
  valor: number;
  status: "aguardando_pagamento" | "link_enviado" | "qr_gerado" | "pago_demo" | "confirmado" | "expirado" | "cancelado";
  qrPayload?: string;
  geradoEm: string;
};

export type Cancelamento = {
  id: string;
  agendamentoId: string;
  cliente: string;
  motivo: string;
  quemCancelou: string;
  liberarHorario: boolean;
  avisarFila: boolean;
  registrarNoShow: boolean;
  criarTarefa: boolean;
  at: string;
};

export type NoShow = {
  id: string;
  cliente: string;
  servico: string;
  data: string;
  hora: string;
  justificativa?: string;
  at: string;
};

export type FilaItem = {
  id: string;
  cliente: string;
  whatsapp: string;
  servico: string;
  profissionalDesejado?: string;
  unidadeDesejada?: string;
  preferenciaData?: string;
  preferenciaHora?: string;
  prioridade: "baixa" | "normal" | "alta";
  observacoes?: string;
  status: "aguardando_horario" | "avisado" | "aceitou" | "nao_respondeu" | "horario_expirado" | "removido" | "convertido";
  at: string;
};

export type Encaixe = {
  id: string;
  cliente: string;
  profissional: string;
  servico: string;
  unidade?: string;
  sala?: string;
  data: string;
  hora: string;
  motivo: string;
  autorizadoPor: string;
  observacao?: string;
  avisarEnvolvidos: boolean;
  status: "solicitado" | "autorizado" | "confirmado" | "cancelado";
  at: string;
};

export type RetornoProgramado = {
  id: string;
  cliente: string;
  servicoOrigem: string;
  profissional: string;
  prazoDias: number;
  dataSugerida: string;
  canal: "whatsapp" | "email" | "ambos";
  status: "sugerido" | "enviado" | "confirmado" | "ignorado" | "reagendado";
  at: string;
};

export type Pesquisa = {
  id: string;
  cliente: string;
  servico: string;
  profissional: string;
  nota: number;
  comentario?: string;
  canal: "whatsapp" | "email";
  status: "enviada" | "respondida" | "nao_respondida" | "avaliacao_baixa" | "avaliacao_positiva";
  at: string;
};

export type AgendaFluxos = {
  logs: FluxoLog[];
  pagamentos: DemoPagamento[];
  cancelamentos: Cancelamento[];
  noShows: NoShow[];
  fila: FilaItem[];
  encaixes: Encaixe[];
  retornos: RetornoProgramado[];
  pesquisas: Pesquisa[];
};

const KEY = "imp.demo.agenda.fluxos";
const EMPTY: AgendaFluxos = {
  logs: [], pagamentos: [], cancelamentos: [], noShows: [], fila: [], encaixes: [], retornos: [], pesquisas: [],
};

export function loadFluxos(): AgendaFluxos {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export function saveFluxos(f: AgendaFluxos) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(f));
}

export function appendLog(f: AgendaFluxos, area: FluxoLog["area"], msg: string): AgendaFluxos {
  const log: FluxoLog = { id: `log_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), area, msg };
  return { ...f, logs: [log, ...f.logs].slice(0, 200) };
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const CANCEL_MOTIVOS = [
  "Cliente solicitou",
  "Profissional indisponível",
  "Pagamento não confirmado",
  "Remarcação necessária",
  "No-show",
  "Erro de agendamento",
  "Outro",
];

export const ENCAIXE_MOTIVOS = [
  "Urgência",
  "Cliente VIP",
  "Retorno necessário",
  "Ajuste operacional",
  "Autorização da gestão",
  "Outro",
];
