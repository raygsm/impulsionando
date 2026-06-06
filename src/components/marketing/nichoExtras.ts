/**
 * Extras por nicho — exemplos logísticos, formulários típicos e dashboards.
 * Carregados sob demanda em /nichos/$slug. Apenas conteúdo apresentável;
 * não cria rotas nem componentes novos.
 */

export interface NichoExtra {
  /** Exemplos logísticos: blocos com título e bullets, agrupados por operação. */
  logisticsExamples?: { title: string; items: string[] }[];
  /** Formulário típico de cadastro neste nicho (campos esperados). */
  formExample?: { title: string; fields: string[] };
  /** Dashboard típico: cards/indicadores principais. */
  dashboardExample?: { title: string; cards: string[] };
  /** Texto comercial de fechamento por nicho. */
  closingPitch?: string;
}

export const NICHO_EXTRAS: Record<string, NichoExtra> = {
  // ─────────────────────────────────────────────────────────────────────────
  clinicas: {
    logisticsExamples: [
      {
        title: "Clínicas e consultórios",
        items: [
          "Agenda médica por profissional, sala e unidade",
          "Prontuário eletrônico com evoluções e exames",
          "Área do paciente com upload de exames",
          "Retornos e séries de consulta",
          "Pagamento antecipado e baixa automática",
          "Confirmação de consulta e lembretes por WhatsApp",
          "Recepção, médico e financeiro com visões separadas",
          "Histórico clínico completo e comunicação paciente-clínica",
        ],
      },
      {
        title: "Farmácias",
        items: [
          "Cadastro de clientes e histórico de compras",
          "Produtos recorrentes e retirada agendada",
          "Delivery e campanhas segmentadas",
          "Clube de vantagens, estoque, pedidos e recompra",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — paciente",
      fields: [
        "Nome do paciente",
        "CPF",
        "WhatsApp",
        "E-mail",
        "Especialidade",
        "Médico",
        "Serviço",
        "Convênio",
        "Retorno (sim/não)",
        "Exames anexados",
        "Prontuário vinculado",
      ],
    },
    dashboardExample: {
      title: "Dashboard típico — Saúde",
      cards: [
        "Consultas do dia",
        "Taxa de no-show",
        "Retornos pendentes",
        "Pacientes ativos",
        "Exames enviados",
        "Pendências médicas",
        "Pagamentos confirmados",
        "Origem dos pacientes",
      ],
    },
    closingPitch:
      "Da agenda ao relacionamento, da consulta ao retorno, do plano mensal à reativação — a plataforma organiza a operação de saúde com módulos ajustáveis à rotina de cada negócio.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  fitness: {
    logisticsExamples: [
      {
        title: "Academias, CrossFit e Personal Trainer",
        items: [
          "Aulas, turmas e vagas por horário",
          "Aula experimental e avaliação física",
          "Planos mensais, pacotes e pagamentos recorrentes",
          "Controle de presença e reativação de aluno inativo",
          "Professores, agenda de treinos e clube de vantagens",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — aluno",
      fields: [
        "Nome",
        "WhatsApp",
        "E-mail",
        "Plano contratado",
        "Modalidade",
        "Professor",
        "Avaliação física (sim/não)",
        "Histórico de presença",
      ],
    },
    dashboardExample: {
      title: "Dashboard típico — Fitness",
      cards: [
        "Alunos ativos",
        "Inadimplência",
        "Presença por turma",
        "Aulas experimentais convertidas",
        "Reativação no mês",
        "Receita recorrente",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  "bares-restaurantes": {
    logisticsExamples: [
      {
        title: "Bares",
        items: [
          "Cadastro do cliente e consumo identificado",
          "Eventos, reservas e comandas",
          "PDV e estoque de bebidas",
          "Produtos mais vendidos e clientes recorrentes",
          "Clube de vantagens e convites segmentados",
        ],
      },
      {
        title: "Restaurantes",
        items: [
          "Reservas pagas com regras de cancelamento",
          "Mesas, consumo mínimo e confirmação por pagamento",
          "Cardápio, pedidos, estoque, cozinha, garçons e caixa",
          "Pesquisa pós-visita e reativação",
        ],
      },
      {
        title: "Delivery",
        items: [
          "Cardápio online e pedido online",
          "Pagamento e baixa automática",
          "Cozinha/preparo e entregadores próprios (push futuro)",
          "Aceite de entrega e status do pedido",
          "Integração preparada com iFood, 99Food e outros modais",
          "Recompra e avaliação pós-entrega",
        ],
      },
      {
        title: "Pizzarias e hamburguerias",
        items: [
          "Combos, adicionais e personalização do pedido",
          "Entrega, retirada agendada e histórico do cliente",
          "Recompra, ticket médio e promoções segmentadas",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — reserva",
      fields: [
        "Nome do cliente",
        "WhatsApp",
        "Data da reserva",
        "Horário",
        "Quantidade de pessoas",
        "Regras aceitas (sim/não)",
        "Pagamento (Pix / cartão)",
        "Consumo mínimo",
      ],
    },
    dashboardExample: {
      title: "Dashboard típico — Alimentação",
      cards: [
        "Reservas confirmadas",
        "Ticket médio",
        "Consumo por cliente",
        "Produtos mais vendidos",
        "Estoque crítico",
        "Pedidos de delivery",
        "Receita por evento",
        "Recorrência mensal",
      ],
    },
    closingPitch:
      "A plataforma transforma consumo, reserva, estoque, pedido, entrega e relacionamento em dados úteis para vender mais, perder menos e conhecer melhor cada cliente.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  microcervejarias: {
    logisticsExamples: [
      {
        title: "Operação cervejeira",
        items: [
          "Cadastro de rótulos com estilo, ABV e IBU",
          "Lote, validade e estoque",
          "Pedido B2B e bares compradores",
          "Recompra e campanhas de reposição",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — rótulo",
      fields: ["Nome", "Estilo", "ABV", "IBU", "Lote", "Validade", "Estoque por embalagem"],
    },
    dashboardExample: {
      title: "Dashboard típico — B2B cervejeiro",
      cards: [
        "Pedidos do mês",
        "Bares ativos",
        "Recompra média",
        "Rótulos mais vendidos",
        "Estoque crítico",
        "Lotes próximos do vencimento",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  fornecedores: {
    logisticsExamples: [
      {
        title: "Fornecedores e distribuidores",
        items: [
          "Catálogo B2B com produtos e compradores",
          "Pedidos, estoque e preços por cliente",
          "Recompra e relatórios de giro",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — comprador B2B",
      fields: ["Razão social", "CNPJ", "Contato", "WhatsApp", "Tabela de preço", "Condição de pagamento"],
    },
    dashboardExample: {
      title: "Dashboard típico — Distribuição",
      cards: [
        "Pedidos abertos",
        "Compradores ativos",
        "Giro por produto",
        "Inadimplência",
        "Recompra mensal",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  servicos: {
    logisticsExamples: [
      {
        title: "Serviços, consultorias e atendimento",
        items: [
          "Briefing inteligente e orçamentos",
          "Propostas, agenda e atendimento",
          "Equipes, serviços, pacotes e mensalidades",
          "Pagamentos, follow-ups e pós-venda",
          "Reativação e pesquisa de satisfação",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — lead de serviço",
      fields: ["Nome", "WhatsApp", "E-mail", "Tipo de serviço", "Urgência", "Origem do contato", "Observações"],
    },
    dashboardExample: {
      title: "Dashboard típico — Serviços",
      cards: [
        "Leads no funil",
        "Propostas enviadas",
        "Taxa de conversão",
        "Tempo médio de fechamento",
        "Mensalidades ativas",
        "Satisfação (NPS)",
      ],
    },
    closingPitch:
      "Para empresas que dependem de atendimento, proposta, agenda e follow-up, o sistema organiza a jornada do lead até a venda, reduzindo perda de oportunidades.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  ecommerce: {
    logisticsExamples: [
      {
        title: "Varejo, e-commerce e supermercados",
        items: [
          "Produtos, estoque, pedidos, compras e vendas",
          "Clientes, histórico de consumo e segmentação",
          "Recompra, clube de vantagens e promoções por perfil",
          "Atendimento consultivo, retirada e entrega",
          "Dashboard de venda por categoria",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — pedido",
      fields: [
        "Cliente",
        "Produtos",
        "Forma de pagamento",
        "Endereço de entrega",
        "Cupom",
        "Origem (loja física / e-commerce)",
        "Status",
      ],
    },
    dashboardExample: {
      title: "Dashboard típico — Varejo",
      cards: [
        "Vendas do dia",
        "Recompra",
        "Estoque por categoria",
        "Produtos mais vendidos",
        "Clientes recorrentes",
        "Clube de vantagens (uso)",
      ],
    },
    closingPitch:
      "Venda isolada é pouco. A plataforma ajuda o varejo a transformar cada compra em histórico, relacionamento, recompra e fidelização.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  "white-label": {
    logisticsExamples: [
      {
        title: "Operação White Label",
        items: [
          "Cadastro de cliente final e escolha de nicho",
          "Briefing completo, diagnóstico e proposta",
          "Ativação de módulos, usuários, setores e permissões",
          "Painéis por cliente e gestão de recorrência",
          "Gestão de suporte e relatórios consolidados",
        ],
      },
    ],
    formExample: {
      title: "Cadastro típico — cliente White Label",
      fields: ["Marca do parceiro", "Razão social do cliente final", "Nicho", "Módulos contratados", "Plano", "Responsável"],
    },
    dashboardExample: {
      title: "Dashboard típico — Parceiros",
      cards: [
        "Clientes ativos",
        "Receita recorrente (MRR)",
        "Churn",
        "Módulos mais contratados",
        "Tickets de suporte",
        "Saques de comissões",
      ],
    },
    closingPitch:
      "O White Label permite que parceiros vendam tecnologia com sua própria marca, usando a estrutura da Impulsionando nos bastidores, com gestão, módulos, clientes, dashboards e recorrência.",
  },
};
