/**
 * Parametrizações SIM/NÃO da Agenda Online — DEMO.
 *
 * Lista completa do BLOCO 1/5 da especificação. Cada parâmetro tem label
 * curto + tooltip (hint) explicando o efeito na operação.
 *
 * Estado persistido em localStorage. Reset volta aos defaults.
 */

export type AgendaParamKey =
  | "agendamentoOnlineCliente"
  | "agendamentoInternoGestao"
  | "exigirPagamentoConfirmar"
  | "qrCodePagamentoDemo"
  | "reagendamentoCliente"
  | "cancelamentoCliente"
  | "exigirMotivoCancelamento"
  | "filaEspera"
  | "filaEsperaAuto"
  | "filaEsperaPrimeiroAceitar"
  | "encaixe"
  | "bloqueioHorario"
  | "arrastarDesktop"
  | "confirmarAoArrastar"
  | "confirmacaoWhats"
  | "confirmacaoEmail"
  | "lembrete24h"
  | "lembrete2h"
  | "avisoReagendamento"
  | "avisoCancelamento"
  | "pesquisaPos"
  | "marcarNoShow"
  | "tarefaPosNoShow"
  | "cobrarNoShow"
  | "tarefaRecepcao"
  | "logsCompletos"
  | "atualizarDashboard"
  | "integrarCrm"
  | "integrarWhatsapp"
  | "integrarPagamentos"
  | "integrarVoip"
  | "integrarBi"
  // 18.1 — Substituição automática de profissional
  | "substAtiva"
  | "substAvisoAuto"
  | "substPrimeiroAceitar"
  | "substAprovacaoGestao"
  | "substAvisarCliente"
  | "substClienteRecusa"
  | "substCancelarSemSub"
  | "substFilaSemSub"
  | "substTarefaSemSub"
  | "substHistAgendamento"
  | "substHistOriginal"
  | "substHistNovo";

export interface AgendaParamDef {
  key: AgendaParamKey;
  label: string;
  hint: string;
  group:
    | "Agendamento"
    | "Pagamento"
    | "Reagendamento e cancelamento"
    | "Fila e encaixe"
    | "Operação do calendário"
    | "Comunicação"
    | "No-show"
    | "Tarefas"
    | "Logs e dashboard"
    | "Integrações";
  default: boolean;
}

export const AGENDA_PARAM_DEFS: AgendaParamDef[] = [
  // Agendamento
  { key: "agendamentoOnlineCliente", group: "Agendamento", default: true, label: "Permitir agendamento online pelo cliente?", hint: "Cliente final consegue agendar sozinho via link público." },
  { key: "agendamentoInternoGestao", group: "Agendamento", default: true, label: "Permitir agendamento interno pela gestão?", hint: "Recepção/gestão cria agendamentos diretamente no sistema." },
  // Pagamento
  { key: "exigirPagamentoConfirmar", group: "Pagamento", default: false, label: "Exigir pagamento para confirmar?", hint: "Agendamento só fica confirmado após pagamento (simulado em DEMO)." },
  { key: "qrCodePagamentoDemo", group: "Pagamento", default: true, label: "Gerar QR Code de pagamento DEMO?", hint: "Mostra QR Code fictício de Pix simulado. Nenhuma cobrança real é feita." },
  // Reagendamento e cancelamento
  { key: "reagendamentoCliente", group: "Reagendamento e cancelamento", default: true, label: "Permitir reagendamento pelo cliente?", hint: "Cliente pode trocar a data pelo link recebido." },
  { key: "cancelamentoCliente", group: "Reagendamento e cancelamento", default: true, label: "Permitir cancelamento pelo cliente?", hint: "Cliente pode cancelar pelo link." },
  { key: "exigirMotivoCancelamento", group: "Reagendamento e cancelamento", default: true, label: "Exigir motivo de cancelamento?", hint: "Pede justificativa antes de cancelar — útil para indicadores." },
  // Fila e encaixe
  { key: "filaEspera", group: "Fila e encaixe", default: true, label: "Ativar fila de espera?", hint: "Cliente entra em fila quando o horário desejado está cheio." },
  { key: "filaEsperaAuto", group: "Fila e encaixe", default: true, label: "Avisar fila de espera automaticamente?", hint: "Ao liberar horário, sistema notifica quem está na fila." },
  { key: "filaEsperaPrimeiroAceitar", group: "Fila e encaixe", default: true, label: "Confirmar para quem aceitar primeiro?", hint: "Vaga vai para o primeiro da fila que aceitar." },
  { key: "encaixe", group: "Fila e encaixe", default: true, label: "Permitir encaixe?", hint: "Recepção cria horário fora da grade padrão." },
  // Operação do calendário
  { key: "bloqueioHorario", group: "Operação do calendário", default: true, label: "Permitir bloqueio de horário?", hint: "Profissional/gestão bloqueia faixas (folga, intervalo, indisponível)." },
  { key: "arrastarDesktop", group: "Operação do calendário", default: true, label: "Permitir arrastar horário no desktop?", hint: "Drag and drop no calendário para reagendar rapidamente." },
  { key: "confirmarAoArrastar", group: "Operação do calendário", default: true, label: "Exigir confirmação ao arrastar?", hint: "Pede confirmação antes de aplicar o novo horário." },
  // Comunicação
  { key: "confirmacaoWhats", group: "Comunicação", default: true, label: "Enviar confirmação por WhatsApp?", hint: "Mensagem TESTE no momento da criação do agendamento." },
  { key: "confirmacaoEmail", group: "Comunicação", default: false, label: "Enviar confirmação por e-mail?", hint: "E-mail TESTE no momento da criação." },
  { key: "lembrete24h", group: "Comunicação", default: true, label: "Enviar lembrete 24h antes?", hint: "Reduz no-show. Em DEMO, mensagem marcada como TESTE." },
  { key: "lembrete2h", group: "Comunicação", default: true, label: "Enviar lembrete 2h antes?", hint: "Lembrete final, reduz faltas de última hora." },
  { key: "avisoReagendamento", group: "Comunicação", default: true, label: "Enviar aviso de reagendamento?", hint: "Notifica cliente e profissional sobre mudança." },
  { key: "avisoCancelamento", group: "Comunicação", default: true, label: "Enviar aviso de cancelamento?", hint: "Confirma cancelamento para os envolvidos." },
  { key: "pesquisaPos", group: "Comunicação", default: false, label: "Enviar pesquisa pós-atendimento?", hint: "NPS / nota após o atendimento." },
  // No-show
  { key: "marcarNoShow", group: "No-show", default: true, label: "Marcar no-show?", hint: "Permite registrar quando o cliente não compareceu." },
  { key: "tarefaPosNoShow", group: "No-show", default: true, label: "Criar tarefa após no-show?", hint: "Gera follow-up automático para retomar contato." },
  { key: "cobrarNoShow", group: "No-show", default: false, label: "Cobrar no-show?", hint: "Aciona política de cobrança quando há falta sem aviso (simulado em DEMO)." },
  // Tarefas
  { key: "tarefaRecepcao", group: "Tarefas", default: true, label: "Criar tarefa para recepção/gestão?", hint: "Tarefas automáticas para confirmar, cobrar, ligar etc." },
  // Logs e dashboard
  { key: "logsCompletos", group: "Logs e dashboard", default: true, label: "Registrar logs completos?", hint: "Registra todas as ações: criação, edição, cancelamento, comunicação." },
  { key: "atualizarDashboard", group: "Logs e dashboard", default: true, label: "Atualizar dashboard automaticamente?", hint: "Indicadores recalculam ao salvar agendamentos." },
  // Integrações
  { key: "integrarCrm", group: "Integrações", default: true, label: "Integrar com CRM?", hint: "Lead/cliente aparece automaticamente no CRM." },
  { key: "integrarWhatsapp", group: "Integrações", default: true, label: "Integrar com WhatsApp?", hint: "Envia mensagens via módulo WhatsApp Inteligente." },
  { key: "integrarPagamentos", group: "Integrações", default: true, label: "Integrar com Pagamentos?", hint: "Cobranças, Pix, cartão (simulado em DEMO)." },
  { key: "integrarVoip", group: "Integrações", default: false, label: "Integrar com VoIP?", hint: "Permite acionar ligação a partir do agendamento." },
  { key: "integrarBi", group: "Integrações", default: true, label: "Integrar com BI?", hint: "Exporta dados para dashboards avançados." },
];

export type AgendaParams = Record<AgendaParamKey, boolean>;

export function defaultAgendaParams(): AgendaParams {
  const out = {} as AgendaParams;
  for (const def of AGENDA_PARAM_DEFS) out[def.key] = def.default;
  return out;
}

export const AREAS_AGENDA: { title: string; what: string; impact: string; logs?: boolean; dash?: boolean; comm?: boolean }[] = [
  { title: "Visão Geral", what: "Painel inicial do módulo com KPIs e atalhos.", impact: "Acelera tomada de decisão da gestão.", dash: true },
  { title: "Calendário", what: "Visualiza horários por profissional e por dia.", impact: "Ocupação visível em tempo real." },
  { title: "Profissionais", what: "Cadastro de quem realiza o atendimento.", impact: "Define a agenda real." },
  { title: "Clientes / Pacientes / Alunos", what: "Cadastro de quem é atendido.", impact: "Histórico, comunicação e CRM." },
  { title: "Serviços", what: "O que é oferecido (consulta, procedimento, aula).", impact: "Determina duração, preço e regras." },
  { title: "Especialidades", what: "Agrupa profissionais por área.", impact: "Filtros e direcionamento do cliente." },
  { title: "Unidades", what: "Filiais ou pontos de atendimento.", impact: "Multi-unidade no mesmo CNPJ." },
  { title: "Salas", what: "Espaços físicos para o atendimento.", impact: "Evita sobreposição de recursos." },
  { title: "Horários", what: "Janelas em que cada profissional atende.", impact: "Define disponibilidade pública." },
  { title: "Disponibilidade", what: "Vagas calculadas pelos horários e bloqueios.", impact: "O que aparece para o cliente final." },
  { title: "Bloqueios", what: "Folgas, intervalos, feriados.", impact: "Bloqueia agendamento naquele período." },
  { title: "Agendamentos", what: "Reservas confirmadas ou pendentes.", impact: "Base de toda a operação.", comm: true, logs: true, dash: true },
  { title: "Reagendamentos", what: "Troca de data/horário.", impact: "Reduz cancelamentos.", comm: true, logs: true },
  { title: "Cancelamentos", what: "Liberação do horário com motivo.", impact: "Alimenta análise de motivos.", comm: true, logs: true },
  { title: "Fila de Espera", what: "Clientes aguardando vaga.", impact: "Aumenta ocupação." },
  { title: "Encaixes", what: "Horários fora da grade padrão.", impact: "Aproveita janelas livres." },
  { title: "Pagamentos Simulados", what: "Fluxo PAGO — DEMO sem cobrança real.", impact: "Mostra como seria a cobrança." },
  { title: "QR Code Demo", what: "QR fictício de Pix demonstrativo.", impact: "Visualiza UX de pagamento." },
  { title: "Lembretes", what: "WhatsApp/e-mail antes do atendimento.", impact: "Reduz no-show.", comm: true },
  { title: "Comunicação", what: "Central de envio TESTE.", impact: "Mostra trilha de mensagens.", comm: true, logs: true },
  { title: "Modelos de Mensagem", what: "Templates editáveis.", impact: "Padroniza comunicação." },
  { title: "Gatilhos", what: "Eventos que disparam mensagens/tarefas.", impact: "Automatiza follow-up." },
  { title: "Automações", what: "Sequências baseadas em gatilhos.", impact: "Reduz trabalho manual." },
  { title: "Usuários", what: "Quem acessa o sistema.", impact: "Controle de acesso." },
  { title: "Permissões", what: "O que cada perfil pode fazer.", impact: "Segurança e governança." },
  { title: "Parametrizações", what: "SIM/NÃO de cada recurso.", impact: "Adapta o módulo a cada nicho." },
  { title: "Logs", what: "Histórico de todas as ações.", impact: "Auditoria interna.", logs: true },
  { title: "Dashboard", what: "Indicadores da agenda.", impact: "Visão executiva.", dash: true },
  { title: "Jornada Guiada", what: "Passo a passo da demonstração.", impact: "Orienta o lead na experiência." },
  { title: "Outros Módulos", what: "Atalhos para CRM, WhatsApp, PDV etc.", impact: "Mostra integração entre módulos." },
  { title: "Zerar Dados da DEMO", what: "Limpa estado local.", impact: "Recomeçar a demonstração." },
  { title: "Contratação Real", what: "CTA para iniciar contratação real do módulo.", impact: "Saída do ambiente DEMO." },
];

const STORAGE_KEY = "imp.demo.agenda.params.v2";

export function loadAgendaParams(): AgendaParams {
  if (typeof window === "undefined") return defaultAgendaParams();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAgendaParams();
    const parsed = JSON.parse(raw) as Partial<AgendaParams>;
    return { ...defaultAgendaParams(), ...parsed };
  } catch {
    return defaultAgendaParams();
  }
}

export function saveAgendaParams(p: AgendaParams) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
