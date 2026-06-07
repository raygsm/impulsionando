// Log unificado da Agenda Online (DEMO).
// Persistência em localStorage; nenhum dado real é tocado.

export type AgendaLogStatus =
  | "concluido"
  | "simulado_demo"
  | "pendente"
  | "falhou"
  | "aguardando_credenciais"
  | "cancelado";

export type AgendaLogAmbiente = "DEMO" | "TESTE" | "REAL";

export type AgendaLogEntry = {
  id: string;
  modulo: "Agenda Online";
  area: string;
  acao: string;
  sessao?: string;
  lead?: string;
  cliente?: string;
  profissional?: string;
  dataHora: string; // ISO
  status: AgendaLogStatus;
  ambiente: AgendaLogAmbiente;
  canal?: string;
  destinatario?: string;
  origem?: string;
  erro?: string;
};

const KEY = "agenda.demo.logs.v1";
const MAX_ENTRIES = 500;

function uid() {
  return `lg_${Math.random().toString(36).slice(2, 10)}`;
}

export function listAgendaLogs(): AgendaLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AgendaLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendAgendaLog(
  entry: Omit<AgendaLogEntry, "id" | "modulo" | "dataHora"> &
    Partial<Pick<AgendaLogEntry, "dataHora">>,
): AgendaLogEntry {
  const full: AgendaLogEntry = {
    id: uid(),
    modulo: "Agenda Online",
    dataHora: entry.dataHora ?? new Date().toISOString(),
    ...entry,
  };
  if (typeof window === "undefined") return full;
  try {
    const arr = listAgendaLogs();
    arr.unshift(full);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX_ENTRIES)));
  } catch {
    /* noop */
  }
  return full;
}

export function clearAgendaLogs() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

// Helpers especializados (cobrem Bloco 47)
export const AgendaLog = {
  leadCapturado: (lead: string) =>
    appendAgendaLog({ area: "Lead", acao: "lead_capturado", lead, status: "concluido", ambiente: "DEMO" }),
  demoLiberada: (lead?: string) =>
    appendAgendaLog({ area: "Demo", acao: "demo_liberada", lead, status: "concluido", ambiente: "DEMO" }),
  simulacaoContratacao: () =>
    appendAgendaLog({ area: "Contratação", acao: "simulacao_iniciada", status: "simulado_demo", ambiente: "DEMO" }),
  pagoDemo: (origem?: string) =>
    appendAgendaLog({ area: "Pagamento", acao: "pago_demo_confirmado", status: "simulado_demo", ambiente: "DEMO", origem }),

  profissionalCriado: (nome: string) =>
    appendAgendaLog({ area: "Profissionais", acao: "profissional_criado", profissional: nome, status: "concluido", ambiente: "DEMO" }),
  profissionalEditado: (nome: string) =>
    appendAgendaLog({ area: "Profissionais", acao: "profissional_editado", profissional: nome, status: "concluido", ambiente: "DEMO" }),
  clienteCriado: (nome: string) =>
    appendAgendaLog({ area: "Clientes", acao: "cliente_criado", cliente: nome, status: "concluido", ambiente: "DEMO" }),
  clienteEditado: (nome: string) =>
    appendAgendaLog({ area: "Clientes", acao: "cliente_editado", cliente: nome, status: "concluido", ambiente: "DEMO" }),
  servicoCriado: (nome: string) =>
    appendAgendaLog({ area: "Serviços", acao: "servico_criado", origem: nome, status: "concluido", ambiente: "DEMO" }),
  unidadeCriada: (nome: string) =>
    appendAgendaLog({ area: "Unidades", acao: "unidade_criada", origem: nome, status: "concluido", ambiente: "DEMO" }),
  salaCriada: (nome: string) =>
    appendAgendaLog({ area: "Salas", acao: "sala_criada", origem: nome, status: "concluido", ambiente: "DEMO" }),
  disponibilidadeCriada: () =>
    appendAgendaLog({ area: "Disponibilidade", acao: "disponibilidade_criada", status: "concluido", ambiente: "DEMO" }),
  bloqueioCriado: (motivo?: string) =>
    appendAgendaLog({ area: "Bloqueios", acao: "bloqueio_criado", origem: motivo, status: "concluido", ambiente: "DEMO" }),
  agendamentoCriado: (cliente: string, profissional?: string) =>
    appendAgendaLog({ area: "Agendamentos", acao: "agendamento_criado", cliente, profissional, status: "concluido", ambiente: "DEMO" }),
  agendamentoConfirmado: (cliente: string) =>
    appendAgendaLog({ area: "Agendamentos", acao: "agendamento_confirmado", cliente, status: "concluido", ambiente: "DEMO" }),
  horarioArrastado: (cliente: string) =>
    appendAgendaLog({ area: "Calendário", acao: "horario_arrastado", cliente, status: "concluido", ambiente: "DEMO" }),
  reagendamento: (cliente: string) =>
    appendAgendaLog({ area: "Agendamentos", acao: "reagendamento", cliente, status: "concluido", ambiente: "DEMO" }),
  cancelamento: (cliente: string, motivo?: string) =>
    appendAgendaLog({ area: "Agendamentos", acao: "cancelamento", cliente, origem: motivo, status: "concluido", ambiente: "DEMO" }),
  noShow: (cliente: string) =>
    appendAgendaLog({ area: "Agendamentos", acao: "no_show", cliente, status: "concluido", ambiente: "DEMO" }),
  filaAdicionada: (cliente: string) =>
    appendAgendaLog({ area: "Fila", acao: "fila_adicionada", cliente, status: "concluido", ambiente: "DEMO" }),
  filaAcionada: (cliente: string) =>
    appendAgendaLog({ area: "Fila", acao: "fila_acionada", cliente, status: "simulado_demo", ambiente: "DEMO" }),
  encaixeCriado: (cliente: string) =>
    appendAgendaLog({ area: "Encaixes", acao: "encaixe_criado", cliente, status: "concluido", ambiente: "DEMO" }),
  pagamentoSimulado: (cliente: string) =>
    appendAgendaLog({ area: "Pagamento", acao: "pagamento_simulado", cliente, status: "simulado_demo", ambiente: "DEMO" }),
  qrCodeGerado: (cliente: string) =>
    appendAgendaLog({ area: "Pagamento", acao: "qr_code_gerado", cliente, status: "simulado_demo", ambiente: "DEMO" }),
  comunicacao: (canal: string, destinatario: string, modelo: string) =>
    appendAgendaLog({ area: "Comunicação", acao: "mensagem_enviada", canal, destinatario, origem: modelo, status: "simulado_demo", ambiente: "DEMO" }),
  lembreteEnviado: (canal: string) =>
    appendAgendaLog({ area: "Comunicação", acao: "lembrete_enviado", canal, status: "simulado_demo", ambiente: "DEMO" }),
  gatilhoExecutado: (evento: string) =>
    appendAgendaLog({ area: "Automação", acao: "gatilho_executado", origem: evento, status: "simulado_demo", ambiente: "DEMO" }),
  automacaoExecutada: (nome: string) =>
    appendAgendaLog({ area: "Automação", acao: "automacao_executada", origem: nome, status: "simulado_demo", ambiente: "DEMO" }),
  permissaoAlterada: (perfil: string, area: string) =>
    appendAgendaLog({ area: "Permissões", acao: "permissao_alterada", origem: `${perfil} / ${area}`, status: "concluido", ambiente: "DEMO" }),
  dashboardAtualizado: () =>
    appendAgendaLog({ area: "Dashboard", acao: "dashboard_atualizado", status: "concluido", ambiente: "DEMO" }),
  jornadaIniciada: () =>
    appendAgendaLog({ area: "Jornada", acao: "jornada_iniciada", status: "concluido", ambiente: "DEMO" }),
  jornadaEtapa: (etapa: number, status: "concluido" | "cancelado") =>
    appendAgendaLog({ area: "Jornada", acao: status === "cancelado" ? "jornada_etapa_pulada" : "jornada_etapa_concluida", origem: `etapa ${etapa}`, status, ambiente: "DEMO" }),
  jornadaConcluida: () =>
    appendAgendaLog({ area: "Jornada", acao: "jornada_concluida", status: "concluido", ambiente: "DEMO" }),
  resetLocal: () =>
    appendAgendaLog({ area: "Sistema", acao: "reset_local", status: "concluido", ambiente: "DEMO" }),
  ctaClicado: (destino: string, lead?: string) =>
    appendAgendaLog({ area: "CTA", acao: "cta_clicado", origem: destino, lead, status: "concluido", ambiente: "DEMO" }),
  nichoAplicado: (nicho: string) =>
    appendAgendaLog({ area: "Nicho", acao: "preset_aplicado", origem: nicho, status: "concluido", ambiente: "DEMO" }),
  aguardandoCredencial: (recurso: string) =>
    appendAgendaLog({ area: "Integração", acao: "aguardando_credenciais_externas", origem: recurso, status: "aguardando_credenciais", ambiente: "DEMO" }),
};
