// Central Interna de Clonagem de Módulos — Impulsionando
// Estrutura técnica reaproveitável (BLOCO 1/4).
// Frontend-only / localStorage. Não toca em dados reais.

export type CloneLayer = "base" | "demo" | "real";

export interface CloneModulePermissionFlags {
  canAccessCloneCenter: boolean; // Pode acessar Central Interna de Clonagem?
  canCloneToProject: boolean;    // Pode clonar módulo para novo projeto/cliente?
  canViewCloneLogs: boolean;     // Pode ver logs internos de clonagem?
}

export interface ModuleBase {
  id: string;
  slug: string;            // ex: "agenda-online"
  name: string;            // ex: "Agenda Online — Base v1.0"
  version: string;         // "1.0.0"
  description: string;
  status: "rascunho" | "estavel" | "descontinuado";
  // Estrutura técnica reaproveitável (preenchida nos próximos blocos)
  structure: {
    screens: string[];
    fields: string[];
    components: string[];
    flows: string[];
    rules: string[];
    parameters: string[];
    defaultPermissions: string[];
    defaultDashboards: string[];
    messageTemplates: string[];
    automations: string[];
    integrations: string[];
    demoMocks: string[];
    nichePresets: string[];
    logsStructure: string[];
    initialConfig: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export type InstanceStatus =
  | "Criado"
  | "Aguardando configuração"
  | "DEMO pronta"
  | "TESTE pronto"
  | "REAL aguardando configuração"
  | "Erro na clonagem"
  | "Arquivado";

export interface AgendaInitialConfig {
  publicName: string;
  internalName: string;
  niche: string;
  responsibleName: string;
  responsibleEmail?: string;
  responsibleWhatsapp?: string;
  environment: "DEMO" | "TESTE" | "REAL";
  notes?: string;
  structure: {
    profissionais: boolean;
    servicos: boolean;
    unidades: boolean;
    salas: boolean;
    pagamento: boolean;
    fila: boolean;
    lembretes: boolean;
    reagendamento: boolean;
    cancelamentoCliente: boolean;
    dashboard: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  operation: {
    horarioFuncionamento: string;
    duracaoPadrao: number;
    intervalo: number;
    antecedenciaMin: number;
    prazoCancelar: number;
    prazoReagendar: number;
    encaixe: boolean;
    noShow: boolean;
    listaEspera: boolean;
  };
  communication: {
    whatsapp: boolean;
    email: boolean;
    modelosPadrao: boolean;
    exigirConfirmacao: boolean;
    confirmacaoAgendamento: boolean;
    lembrete24h: boolean;
    lembrete2h: boolean;
    avisoReagendamento: boolean;
    avisoCancelamento: boolean;
    pesquisaPos: boolean;
  };
  integrations: {
    crm: boolean;
    whatsapp: boolean;
    pagamentos: boolean;
    voip: boolean;
    bi: boolean;
    whiteLabel: boolean;
  };
}

export interface CloneInstance {
  id: string;
  baseId: string;
  layer: Exclude<CloneLayer, "base">;
  targetName: string;
  fantasy?: string;
  niche?: string;
  preset?: string;
  purpose?: string;
  environment?: "DEMO" | "TESTE" | "REAL";
  status: InstanceStatus;
  responsibleName?: string;
  responsibleEmail?: string;
  createdBy?: string;
  integrations?: string[];
  internalUrl?: string;
  notes?: string;
  config?: AgendaInitialConfig;
  archived?: boolean;
  archiveReason?: string;
  archivedBy?: string;
  archivedAt?: string;
  // Versionamento — preparado para próxima fase técnica
  versionBase?: string;
  versionClone?: string;
  updateAvailable?: boolean;
  lastUpdateAt?: string;
  lastSyncAt?: string;
  versionStatus?: "atual" | "desatualizado" | "customizado";
  compatibility?: "compativel" | "atencao" | "incompativel";
  canReceiveBaseUpdate?: boolean;
  hasLocalCustomization?: boolean;
  allowAutoUpdate?: boolean;
  requiresManualReview?: boolean;
  changelog?: string[];
  createdAt: string;
}

export interface CloneLog {
  id: string;
  at: string;
  actor: string;
  action:
    | "criou-base"
    | "atualizou-base"
    | "acesso-central"
    | "abriu-wizard"
    | "selecionou-base"
    | "escolheu-ambiente"
    | "escolheu-preset"
    | "selecionou-integracoes"
    | "confirmou-clonagem"
    | "clonou-demo"
    | "clonou-real"
    | "falha-clonagem"
    | "abriu-config"
    | "configurou"
    | "acessou-clone"
    | "arquivou"
    | "duplicou"
    | "removeu"
    | "verificou-atualizacao"
    | "reverteu-versao"
    | "promoveu-melhoria"
    | "tentativa-acesso-negado"
    | "tentativa-acao-sem-permissao";
  detail: string;
  instanceId?: string;
  status?: "iniciado" | "em-andamento" | "concluido" | "falhou" | "bloqueado" | "cancelado";
}


const K_BASES = "imp.clone.bases.v1";
const K_INSTANCES = "imp.clone.instances.v1";
const K_LOGS = "imp.clone.logs.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const cloneStore = {
  listBases(): ModuleBase[] {
    return read<ModuleBase[]>(K_BASES, []);
  },
  saveBase(base: ModuleBase) {
    const all = cloneStore.listBases();
    const i = all.findIndex((b) => b.id === base.id);
    if (i >= 0) all[i] = base;
    else all.push(base);
    write(K_BASES, all);
  },
  removeBase(id: string) {
    write(K_BASES, cloneStore.listBases().filter((b) => b.id !== id));
  },

  listInstances(): CloneInstance[] {
    return read<CloneInstance[]>(K_INSTANCES, []);
  },
  saveInstance(inst: CloneInstance) {
    const all = cloneStore.listInstances();
    all.push(inst);
    write(K_INSTANCES, all);
  },
  removeInstance(id: string) {
    write(K_INSTANCES, cloneStore.listInstances().filter((i) => i.id !== id));
  },

  listLogs(): CloneLog[] {
    return read<CloneLog[]>(K_LOGS, []);
  },
  pushLog(log: Omit<CloneLog, "id" | "at">) {
    const all = cloneStore.listLogs();
    all.unshift({
      ...log,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    });
    write(K_LOGS, all.slice(0, 500));
  },
};

export function uid() {
  return crypto.randomUUID();
}

// Módulos preparados para receber base nos próximos blocos
export const PLANNED_MODULES: { slug: string; name: string }[] = [
  { slug: "agenda-online", name: "Agenda Online" },
  { slug: "crm", name: "CRM" },
  { slug: "whatsapp-inteligente", name: "WhatsApp Inteligente" },
  { slug: "pdv-comandas", name: "PDV e Comandas" },
  { slug: "eventos-ingressos", name: "Eventos e Ingressos" },
  { slug: "afiliados-produtos", name: "Afiliados e Produtos" },
  { slug: "wmp", name: "Prestação de Serviços com Parceiros / WMP" },
  { slug: "advogados", name: "Advogados e Escritórios Jurídicos" },
  { slug: "clinicas", name: "Clínicas e Consultórios" },
  { slug: "prontuario", name: "Prontuário Eletrônico" },
  { slug: "delivery", name: "Delivery" },
  { slug: "estoque", name: "Estoque" },
  { slug: "fitness", name: "Fitness" },
  { slug: "estetica", name: "Estética" },
  { slug: "white-label", name: "White Label" },
  { slug: "bi", name: "BI / Dashboards" },
  { slug: "tags-origem-roi", name: "Tags, Origem e ROI" },
];

export const NICHE_PRESETS = [
  "Clínica",
  "Consultório",
  "Estética",
  "Academia/Fitness",
  "Jurídico",
  "Bar/Restaurante",
  "Eventos/WMP",
  "Serviços profissionais",
  "Genérico",
] as const;
export type NichePreset = (typeof NICHE_PRESETS)[number];

export const PURPOSES = [
  { value: "cliente-real", label: "Novo cliente real", desc: "Cria estrutura vazia para implantação real de um novo cliente." },
  { value: "demo", label: "Nova demonstração", desc: "Cria ambiente demonstrativo com dados fictícios, mensagens TESTE e PAGO — DEMO." },
  { value: "interno", label: "Novo projeto interno", desc: "Cria estrutura para testes, validações ou desenvolvimento interno da Impulsionando." },
  { value: "teste", label: "Ambiente de teste", desc: "Cria ambiente técnico para homologação e validações." },
  { value: "white-label", label: "Cliente White Label autorizado", desc: "Cria estrutura para cliente vinculado a operação White Label autorizada pela Impulsionando." },
] as const;
export type PurposeValue = (typeof PURPOSES)[number]["value"];

export const ENVIRONMENTS = [
  { value: "DEMO", desc: "Cria ambiente demonstrativo com dados fictícios, PAGO — DEMO, mensagens TESTE, mocks e simulações." },
  { value: "TESTE", desc: "Cria ambiente técnico para validações internas, integrações e homologações." },
  { value: "REAL", desc: "Cria estrutura limpa para cliente real, sem dados fictícios obrigatórios e sem dados de outros clientes." },
] as const;
export type Environment = (typeof ENVIRONMENTS)[number]["value"];

export const INTEGRATIONS = [
  "CRM",
  "WhatsApp Inteligente",
  "Pagamentos",
  "VoIP",
  "BI / Dashboards",
  "White Label",
  "E-mail",
  "Logs avançados",
] as const;
export type Integration = (typeof INTEGRATIONS)[number];

export const PRESET_LABELS: Record<string, Record<string, string>> = {
  "Clínica": { cliente: "Paciente", profissional: "Médico", servico: "Consulta", retorno: "Retorno", sala: "Sala", especialidade: "Especialidade" },
  "Consultório": { cliente: "Paciente", profissional: "Profissional", servico: "Consulta", sala: "Sala" },
  "Estética": { cliente: "Cliente", profissional: "Esteticista", servico: "Procedimento", sala: "Cabine" },
  "Academia/Fitness": { cliente: "Aluno", profissional: "Personal", servico: "Aula/Treino", sala: "Sala" },
  "Jurídico": { cliente: "Cliente", profissional: "Advogado", servico: "Atendimento", sala: "Sala" },
  "Bar/Restaurante": { cliente: "Cliente", reserva: "Reserva", mesa: "Mesa", evento: "Evento", fila: "Lista de espera" },
  "Eventos/WMP": { cliente: "Participante", profissional: "Parceiro", servico: "Atendimento", evento: "Evento" },
  "Serviços profissionais": { cliente: "Cliente", profissional: "Profissional", servico: "Serviço" },
  "Genérico": { cliente: "Cliente", profissional: "Profissional", servico: "Serviço" },
};

export interface PresetDetail {
  labels: string[];
  features: string[];
  mockServices: string[];
}

export const PRESET_DETAILS: Record<string, PresetDetail> = {
  "Clínica": {
    labels: ["Paciente", "Médico", "Consulta", "Retorno", "Sala", "Especialidade"],
    features: ["pagamento para confirmar", "lembrete 24h", "lembrete 2h", "retorno", "no-show", "fila de espera", "integração com prontuário preparada", "comunicação com paciente", "comunicação com médico", "dashboard de consultas"],
    mockServices: ["Consulta inicial", "Retorno", "Avaliação clínica", "Teleconsulta"],
  },
  "Consultório": {
    labels: ["Paciente", "Profissional", "Atendimento", "Retorno", "Sala"],
    features: ["agendamento online", "confirmação", "lembrete", "pagamento", "no-show", "fila de espera"],
    mockServices: ["Atendimento inicial", "Retorno", "Consulta online"],
  },
  "Estética": {
    labels: ["Cliente", "Profissional", "Procedimento", "Pacote", "Retorno"],
    features: ["agenda por profissional", "comissão", "pacote", "retorno", "lembrete", "pagamento", "pesquisa pós-atendimento"],
    mockServices: ["Avaliação estética", "Limpeza de pele", "Procedimento facial", "Retorno do pacote"],
  },
  "Academia/Fitness": {
    labels: ["Aluno", "Professor", "Aula", "Treino", "Check-in"],
    features: ["check-in", "plano", "mensalidade", "limite de vagas", "turma", "lembrete de aula", "reagendamento"],
    mockServices: ["Aula experimental", "Personal trainer", "Avaliação física", "Treino funcional"],
  },
  "Jurídico": {
    labels: ["Cliente", "Advogado", "Reunião", "Audiência", "Prazo"],
    features: ["reunião", "audiência", "lembrete", "documentos", "tarefa", "comunicação com cliente", "integração futura com módulo jurídico"],
    mockServices: ["Reunião inicial", "Alinhamento de processo", "Audiência", "Revisão contratual"],
  },
  "Bar/Restaurante": {
    labels: ["Cliente", "Reserva", "Mesa", "Evento", "Lista de espera"],
    features: ["reserva", "sinal", "mesa", "fila de espera", "no-show", "lembrete", "confirmação por WhatsApp", "dashboard de ocupação"],
    mockServices: ["Reserva de mesa", "Reserva para evento", "Jantar harmonizado", "Lista de espera"],
  },
  "Eventos/WMP": {
    labels: ["Parceiro", "DJ", "Evento", "Horário de chegada", "Apresentação"],
    features: ["contrato", "agenda de evento", "aceite", "check-in", "reputação", "comunicação com parceiro", "integração futura com módulo WMP"],
    mockServices: ["Evento rooftop", "Apresentação DJ", "Evento recorrente", "Chegada técnica"],
  },
  "Serviços profissionais": {
    labels: ["Cliente", "Profissional", "Serviço", "Atendimento", "Horário"],
    features: ["agendamento", "lembrete", "pagamento", "confirmação", "reagendamento", "histórico do cliente"],
    mockServices: ["Atendimento inicial", "Consultoria", "Visita técnica", "Reunião online"],
  },
  "Genérico": {
    labels: ["Cliente", "Profissional", "Serviço", "Horário", "Agendamento"],
    features: ["agenda básica", "confirmação", "lembrete", "cancelamento", "reagendamento", "dashboard simples"],
    mockServices: ["Atendimento", "Reunião", "Serviço padrão"],
  },
};

export interface CloneWizardInput {
  baseId: string;
  purpose: PurposeValue;
  projectName: string;
  fantasy?: string;
  niche: NichePreset | "Outro";
  responsibleName: string;
  responsibleEmail?: string;
  responsibleWhatsapp?: string;
  notes?: string;
  environment: Environment;
  preset: NichePreset;
  integrations: Integration[];
  securityAck: boolean;
}

// Seed do primeiro módulo-base: Agenda Online v1.0.0
export const AGENDA_ONLINE_BASE: ModuleBase = {
  id: "base-agenda-online-v1",
  slug: "agenda_online",
  name: "Agenda Online",
  version: "1.0.0",
  description:
    "Módulo-base de Agenda Online com estrutura para profissionais, serviços, unidades, salas, horários, agendamentos, reagendamentos, pagamentos simulados, fila de espera, lembretes, comunicação, logs, permissões e dashboards.",
  status: "estavel",
  structure: {
    screens: ["Agenda Hoje", "Agendamentos", "Profissionais", "Serviços", "Horários", "Fila de espera", "Dashboard"],
    fields: ["cliente", "profissional", "serviço", "data", "hora", "duração", "sala", "unidade", "status", "valor", "origem"],
    components: ["Calendário", "Modal de agendamento", "Drawer profissional", "Tabela serviços", "Card fila"],
    flows: ["agendar", "reagendar", "cancelar", "confirmar", "encaixar fila"],
    rules: ["sem sobreposição", "buffer entre atendimentos", "limite por profissional", "bloqueios e folgas"],
    parameters: ["fuso horário", "duração padrão", "antecedência mínima", "janela de cancelamento"],
    defaultPermissions: ["agenda.appointment.read", "agenda.appointment.write", "agenda.professional.read", "agenda.service.read"],
    defaultDashboards: ["Ocupação", "No-show", "Receita simulada", "Top serviços", "Top profissionais"],
    messageTemplates: ["Confirmação", "Lembrete 24h", "Lembrete 1h", "Reagendamento", "Cancelamento", "Pesquisa pós-atendimento"],
    automations: ["Lembrete automático", "Confirmação automática", "Reativação de cliente inativo"],
    integrations: ["CRM", "WhatsApp Inteligente", "Pagamentos", "BI / Dashboards", "E-mail"],
    demoMocks: ["clientes fictícios", "profissionais fictícios", "agenda do dia", "fila exemplo"],
    nichePresets: [...NICHE_PRESETS],
    logsStructure: ["criação", "edição", "cancelamento", "envio de comunicação", "alteração de permissão"],
    initialConfig: ["unidade padrão", "profissional admin", "serviço exemplo", "horário comercial padrão"],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function ensureSeedBases() {
  if (typeof window === "undefined") return;
  const all = cloneStore.listBases();
  if (!all.some((b) => b.id === AGENDA_ONLINE_BASE.id)) {
    cloneStore.saveBase(AGENDA_ONLINE_BASE);
  }
}

