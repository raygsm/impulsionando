/**
 * Bloco comercial "Agenda online por nicho".
 * Renderizado pelo NichoPage logo após a seção de Solução.
 * Cada bloco reforça que o próprio cliente/paciente/aluno pode agir sozinho
 * (escolher serviço, profissional, dia, horário, pagar e confirmar).
 */

export interface NichoAgendaBlock {
  title: string;
  description: string;
  highlights: string[];
  cta: string;
}

export const AGENDA_BASE =
  "Com a agenda online, o próprio cliente escolhe o serviço, o profissional, o dia e o horário disponível. Quando aplicável, ele também pode pagar online, confirmar a marcação automaticamente, remarcar dentro das regras definidas e receber lembretes por WhatsApp. Isso reduz retrabalho, evita perda de oportunidades e deixa a operação mais organizada.";

export const NICHO_AGENDA: Record<string, NichoAgendaBlock> = {
  clinicas: {
    title: "Agenda médica com pagamento e confirmação automática",
    description:
      "O paciente escolhe especialidade, médico, modalidade e horário. Pode pagar online a consulta avulsa, com confirmação automática após a aprovação. Lembretes por WhatsApp, reagendamento com regras e controle de retorno reduzem no-show e desafogam a recepção.",
    highlights: [
      "Consulta avulsa",
      "Retorno",
      "Pagamento online",
      "Baixa automática",
      "Menos no-show",
      "Menos trabalho da recepção",
    ],
    cta: "Simule uma agenda médica com pagamento e confirmação automática.",
  },
  saloes: {
    title: "Agenda do salão sem depender só do WhatsApp manual",
    description:
      "Cliente escolhe serviço, profissional, dia e horário. Pode pagar sinal, pacote ou serviço avulso online. Lembretes automáticos reduzem faltas e o reagendamento dentro das regras evita perda de slots.",
    highlights: ["Serviço avulso", "Pacotes", "Sinal online", "Reagendamento", "Lembretes", "Fidelização"],
    cta: "Veja como sua agenda pode funcionar sem depender só do WhatsApp manual.",
  },
  "bares-restaurantes": {
    title: "Reserva paga com confirmação automática",
    description:
      "O cliente reserva mesa, evento ou experiência e paga reserva, consumação mínima, ingresso ou sinal online. Regras de horário, tolerância, cancelamento e reembolso ficam claras antes da confirmação.",
    highlights: [
      "Reserva paga",
      "Evento pago",
      "Consumação mínima",
      "Regras claras",
      "Menos no-show",
      "Mais previsibilidade",
    ],
    cta: "Teste uma reserva paga com confirmação automática.",
  },
  educacao: {
    title: "Matrícula, agenda e pagamento online em uma jornada só",
    description:
      "Aluno agenda aula experimental, reunião, entrevista, matrícula, mentoria ou atendimento. Pode pagar matrícula, mensalidade, aula avulsa ou plano recorrente, conforme a configuração da escola.",
    highlights: [
      "Aula experimental",
      "Matrícula",
      "Mensalidade",
      "Planos",
      "Turmas",
      "Reagendamento",
      "Lembretes",
    ],
    cta: "Simule uma jornada de matrícula, agenda e pagamento online.",
  },
  academias: {
    title: "Aulas, avaliações e planos vendidos online",
    description:
      "Aluno agenda aula experimental, avaliação física, treino personalizado, aula avulsa ou plano mensal. Pagamento online por diária, aula avulsa, pacote ou mensalidade, com lembretes e reativação automática de inativos.",
    highlights: [
      "Aula experimental",
      "Avaliação física",
      "Aula avulsa",
      "Diária",
      "Mensalidade",
      "Planos",
      "Lembretes",
      "Reativação de aluno inativo",
    ],
    cta: "Veja como uma academia pode vender planos, aulas e avaliações online.",
  },
  crossfit: {
    title: "Reserva de turma com limite de vagas e pagamento online",
    description:
      "Aluno reserva aula, aula experimental, drop-in, plano mensal ou pacote. O box limita vagas por turma, controla presença, pagamento e cancelamento dentro das regras configuradas.",
    highlights: [
      "Reserva de turma",
      "Drop-in",
      "Aula experimental",
      "Plano mensal",
      "Limite de vagas",
      "Pagamento online",
      "Reagendamento com regra",
    ],
    cta: "Simule uma reserva de aula em um box com pagamento e limite de vagas.",
  },
  personal: {
    title: "Agenda de personal com planos, pacotes e pagamento online",
    description:
      "Cliente agenda treino avulso, avaliação, consultoria, pacote de aulas ou plano mensal. Pagamento online com confirmação automática e lembretes por WhatsApp.",
    highlights: [
      "Treino avulso",
      "Pacote de aulas",
      "Plano mensal",
      "Avaliação",
      "Reagendamento",
      "Pagamento online",
    ],
    cta: "Teste uma agenda de personal com planos, pacotes e pagamento online.",
  },
  servicos: {
    title: "Agenda de serviços com briefing, proposta e pagamento",
    description:
      "Cliente agenda visita, orçamento, reunião, atendimento ou execução de serviço. Pagamento de sinal, serviço avulso, pacote ou mensalidade conforme a operação.",
    highlights: [
      "Visita técnica",
      "Orçamento",
      "Serviço avulso",
      "Sinal online",
      "Pacote",
      "Mensalidade",
      "Follow-up",
    ],
    cta: "Simule uma agenda de serviços com briefing, proposta e pagamento.",
  },
  ecommerce: {
    title: "Atendimento, retirada e demonstração agendados",
    description:
      "Mesmo sem agenda tradicional, o sistema permite agendar atendimento, retirada, consultoria, demonstração, prova, instalação ou entrega. Trabalha com pagamento online, recompra e clube de vantagens.",
    highlights: [
      "Retirada agendada",
      "Atendimento consultivo",
      "Demonstração",
      "Entrega",
      "Pagamento online",
      "Recompra",
      "Clube de vantagens",
    ],
    cta: "Veja como sua loja pode transformar atendimento em relacionamento e recompra.",
  },
  fitness: {
    title: "Aulas, avaliações e planos vendidos online",
    description:
      "Aluno agenda aula experimental, avaliação física, treino personalizado, aula avulsa ou plano mensal. Pagamento online por diária, aula avulsa, pacote ou mensalidade, com lembretes e reativação automática de inativos.",
    highlights: [
      "Aula experimental",
      "Avaliação física",
      "Aula avulsa",
      "Diária",
      "Mensalidade",
      "Planos",
      "Lembretes",
    ],
    cta: "Veja como uma academia pode vender planos, aulas e avaliações online.",
  },
};
