// Presets por nicho da Agenda Online (DEMO).
// Adapta labels, exemplos de serviços, recursos prioritários e CTAs.

// recursosPrioritarios é apenas informacional (chips no preset).

export type NichoSlug = "clinicas" | "estetica" | "fitness" | "juridico" | "bar" | "eventos" | "servicos";

export type NichoLabels = {
  cliente: string;
  clientePlural: string;
  profissional: string;
  profissionalPlural: string;
  servico: string;
  servicoPlural: string;
  agendamento: string;
  sala: string;
  unidade: string;
};

export type NichoPreset = {
  slug: NichoSlug;
  nome: string;
  descricao: string;
  labels: NichoLabels;
  recursosPrioritarios: string[];
  servicosExemplo: { nome: string; duracao: number; preco: number }[];
  ctasDestaque: string[];
};

export const NICHO_PRESETS: Record<NichoSlug, NichoPreset> = {
  clinicas: {
    slug: "clinicas",
    nome: "Clínicas e Consultórios",
    descricao: "Agenda médica com paciente, médico, consulta, retorno e prontuário.",
    labels: {
      cliente: "Paciente", clientePlural: "Pacientes",
      profissional: "Médico", profissionalPlural: "Médicos",
      servico: "Consulta", servicoPlural: "Consultas",
      agendamento: "Consulta", sala: "Sala", unidade: "Unidade",
    },
    recursosPrioritarios: [
      "exigePagamentoConfirmar", "lembrete24h", "lembrete2h",
      "retornoAutomatico", "noShowAuto", "filaEsperaAuto",
      "confirmaWhats", "confirmaEmail", "integraProntuario", "integraVoip",
    ],
    servicosExemplo: [
      { nome: "Consulta inicial", duracao: 60, preco: 350 },
      { nome: "Retorno", duracao: 30, preco: 150 },
      { nome: "Teleconsulta", duracao: 30, preco: 220 },
      { nome: "Avaliação clínica", duracao: 45, preco: 280 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Ver planos", "Falar com consultor"],
  },
  estetica: {
    slug: "estetica",
    nome: "Estética & Beleza",
    descricao: "Agenda de procedimentos, pacotes, retornos e comissão por profissional.",
    labels: {
      cliente: "Cliente", clientePlural: "Clientes",
      profissional: "Profissional", profissionalPlural: "Profissionais",
      servico: "Procedimento", servicoPlural: "Procedimentos",
      agendamento: "Atendimento", sala: "Cabine", unidade: "Unidade",
    },
    recursosPrioritarios: [
      "agendaPorProfissional", "pacotes", "retornoAutomatico", "comissao",
      "lembrete24h", "exigePagamentoConfirmar", "pesquisaPos", "reativacao",
    ],
    servicosExemplo: [
      { nome: "Avaliação estética", duracao: 45, preco: 120 },
      { nome: "Limpeza de pele", duracao: 60, preco: 180 },
      { nome: "Procedimento facial", duracao: 90, preco: 350 },
      { nome: "Retorno do pacote", duracao: 30, preco: 0 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Adicionar Agenda ao orçamento"],
  },
  fitness: {
    slug: "fitness",
    nome: "Fitness & Academias",
    descricao: "Aulas, turmas, check-in, recorrência e aula experimental.",
    labels: {
      cliente: "Aluno", clientePlural: "Alunos",
      profissional: "Professor", profissionalPlural: "Professores",
      servico: "Aula", servicoPlural: "Aulas",
      agendamento: "Aula", sala: "Sala", unidade: "Unidade",
    },
    recursosPrioritarios: [
      "limiteVagas", "checkIn", "planoMensalidade", "aulaExperimental",
      "recorrencia", "lembrete2h", "reagendamentoAuto", "noShowAuto",
    ],
    servicosExemplo: [
      { nome: "Aula experimental", duracao: 60, preco: 0 },
      { nome: "Personal trainer", duracao: 60, preco: 120 },
      { nome: "Avaliação física", duracao: 45, preco: 80 },
      { nome: "Treino funcional", duracao: 60, preco: 60 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Testar outros módulos"],
  },
  juridico: {
    slug: "juridico",
    nome: "Advogados & Jurídico",
    descricao: "Reuniões, audiências, prazos e diligências.",
    labels: {
      cliente: "Cliente", clientePlural: "Clientes",
      profissional: "Advogado", profissionalPlural: "Advogados",
      servico: "Reunião", servicoPlural: "Reuniões",
      agendamento: "Compromisso", sala: "Sala", unidade: "Escritório",
    },
    recursosPrioritarios: [
      "reuniaoAudiencia", "lembrete24h", "anexosDocumentos", "tarefaInterna",
      "comunicaCliente", "integraJuridico", "prazoVinculado",
    ],
    servicosExemplo: [
      { nome: "Reunião inicial", duracao: 60, preco: 0 },
      { nome: "Alinhamento de processo", duracao: 45, preco: 250 },
      { nome: "Audiência", duracao: 90, preco: 500 },
      { nome: "Revisão contratual", duracao: 60, preco: 300 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Falar com consultor"],
  },
  bar: {
    slug: "bar",
    nome: "Bar & Restaurante",
    descricao: "Reservas, mesas, sinal, lista de espera.",
    labels: {
      cliente: "Cliente", clientePlural: "Clientes",
      profissional: "Anfitrião", profissionalPlural: "Anfitriões",
      servico: "Reserva", servicoPlural: "Reservas",
      agendamento: "Reserva", sala: "Mesa", unidade: "Casa",
    },
    recursosPrioritarios: [
      "exigePagamentoConfirmar", "filaEsperaAuto", "noShowAuto",
      "lembrete2h", "confirmaWhats", "ocupacaoDashboard",
    ],
    servicosExemplo: [
      { nome: "Reserva de mesa", duracao: 120, preco: 0 },
      { nome: "Reserva para evento", duracao: 180, preco: 100 },
      { nome: "Jantar harmonizado", duracao: 150, preco: 250 },
      { nome: "Lista de espera", duracao: 30, preco: 0 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Ver planos"],
  },
  eventos: {
    slug: "eventos",
    nome: "Eventos / WMP",
    descricao: "Parceiros, DJs, chegada técnica, contrato.",
    labels: {
      cliente: "Parceiro", clientePlural: "Parceiros",
      profissional: "DJ/Artista", profissionalPlural: "Artistas",
      servico: "Evento", servicoPlural: "Eventos",
      agendamento: "Apresentação", sala: "Palco", unidade: "Local",
    },
    recursosPrioritarios: [
      "agendaEvento", "aceiteContrato", "chegadaTecnica",
      "checkIn", "comunicaParceiro", "integraWmp",
    ],
    servicosExemplo: [
      { nome: "Evento rooftop", duracao: 240, preco: 1800 },
      { nome: "Apresentação DJ", duracao: 180, preco: 1200 },
      { nome: "Evento recorrente", duracao: 240, preco: 1500 },
      { nome: "Chegada técnica", duracao: 60, preco: 0 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Testar outros módulos"],
  },
  servicos: {
    slug: "servicos",
    nome: "Serviços profissionais",
    descricao: "Atendimentos, consultoria, reuniões on-line.",
    labels: {
      cliente: "Cliente", clientePlural: "Clientes",
      profissional: "Profissional", profissionalPlural: "Profissionais",
      servico: "Serviço", servicoPlural: "Serviços",
      agendamento: "Atendimento", sala: "Sala", unidade: "Unidade",
    },
    recursosPrioritarios: [
      "lembrete24h", "confirmaWhats", "exigePagamentoConfirmar",
      "reagendamentoAuto", "historicoCliente", "pesquisaPos",
    ],
    servicosExemplo: [
      { nome: "Atendimento inicial", duracao: 45, preco: 0 },
      { nome: "Consultoria", duracao: 60, preco: 350 },
      { nome: "Visita técnica", duracao: 90, preco: 280 },
      { nome: "Reunião online", duracao: 45, preco: 0 },
    ],
    ctasDestaque: ["Contratar Agenda real", "Adicionar Agenda ao orçamento"],
  },
};

export const NICHO_OPTIONS = Object.values(NICHO_PRESETS).map((p) => ({ value: p.slug, label: p.nome }));

export function getNichoPreset(slug: string | null | undefined): NichoPreset {
  if (slug && slug in NICHO_PRESETS) return NICHO_PRESETS[slug as NichoSlug];
  return NICHO_PRESETS.servicos;
}

export function labelsFor(slug: string | null | undefined): NichoLabels {
  return getNichoPreset(slug).labels;
}
