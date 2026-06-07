// BLOCO 2/5 — Recursos da Agenda Online (DEMO)
// Persistência em localStorage. Toda nomenclatura adapta ao nicho.

export type ResStatus = "ativo" | "inativo" | "bloqueado";

export type Cliente = {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  cpf?: string;
  nascimento?: string;
  cidade?: string;
  estado?: string;
  origem?: string;
  observacoes?: string;
  tags?: string[];
  status: "novo" | "ativo" | "aguardando_confirmacao" | "aguardando_pagamento" | "recorrente" | "inativo" | "no_show_recorrente";
};

export type Especialidade = {
  id: string;
  nome: string;
  status: ResStatus;
  profissionais?: string[];
  servicos?: string[];
};

export type Unidade = {
  id: string;
  nome: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  horarioFuncionamento?: string;
  diasFuncionamento?: string[];
  observacoes?: string;
  status: ResStatus;
};

export type SalaTipo =
  | "consultorio"
  | "reuniao"
  | "procedimento"
  | "online"
  | "mesa"
  | "aula"
  | "externo"
  | "evento"
  | "outro";

export type Sala = {
  id: string;
  nome: string;
  unidadeId?: string;
  capacidade?: number;
  tipo: SalaTipo;
  servicos?: string[];
  observacoes?: string;
  status: ResStatus | "ocupada" | "manutencao" | "disponivel";
};

export type Disponibilidade = {
  id: string;
  profissionalId?: string;
  servicoId?: string;
  unidadeId?: string;
  salaId?: string;
  diaSemana: number; // 0=domingo
  horaInicial: string;
  horaFinal: string;
  intervaloMin: number;
  duracaoPadrao: number;
  recorrencia: "semanal" | "quinzenal" | "mensal" | "unica";
  dataInicio?: string;
  dataFim?: string;
  ativo: boolean;
};

export type Bloqueio = {
  id: string;
  tipo: "profissional" | "sala" | "unidade" | "servico" | "geral";
  refId?: string;
  dataInicio: string;
  dataFim: string;
  horaInicio?: string;
  horaFim?: string;
  motivo: string;
  afetaAgendamentos: boolean;
  avisarEnvolvidos: boolean;
};

export type AgendaResources = {
  clientes: Cliente[];
  especialidades: Especialidade[];
  unidades: Unidade[];
  salas: Sala[];
  disponibilidade: Disponibilidade[];
  bloqueios: Bloqueio[];
};

const KEY = "imp.demo.agenda.resources";

const EMPTY: AgendaResources = {
  clientes: [],
  especialidades: [],
  unidades: [],
  salas: [],
  disponibilidade: [],
  bloqueios: [],
};

export function loadResources(): AgendaResources {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export function saveResources(r: AgendaResources) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(r));
}

// Nomenclatura por nicho
export function clienteLabel(nicho: string): { singular: string; plural: string } {
  switch (nicho) {
    case "clinica":
    case "consultorio":
      return { singular: "Paciente", plural: "Pacientes" };
    case "estetica":
    case "salao":
      return { singular: "Cliente", plural: "Clientes" };
    case "fitness":
    case "academia":
      return { singular: "Aluno", plural: "Alunos" };
    case "juridico":
    case "advocacia":
      return { singular: "Cliente", plural: "Clientes" };
    case "bar":
    case "restaurante":
      return { singular: "Reserva", plural: "Reservas" };
    case "eventos":
    case "wmp":
      return { singular: "Participante", plural: "Participantes" };
    default:
      return { singular: "Cliente", plural: "Clientes" };
  }
}

export const DEMO_TAG = "DEMONSTRAÇÃO — VERSÃO TESTE";

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
