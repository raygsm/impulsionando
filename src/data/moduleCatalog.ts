/**
 * Catálogo comercial de módulos vendidos no wizard "Monte seu Orçamento".
 *
 * Cada módulo aqui corresponde a um produto comercial vendável a R$ 497/mês.
 * O `motherSlug` referencia um dos 14 módulos principais em motherModules.ts
 * (e em public.modules + webhook PLAN_MODULES), garantindo que ao contratar
 * a permissão certa seja ativada para a empresa.
 */

export type ModuleCategory =
  | "Atendimento & Comunicação"
  | "Agenda, Reservas e Eventos"
  | "Vendas e Pagamentos"
  | "Operação, Delivery e PDV"
  | "Saúde"
  | "Gestão, Dados e Segurança";

export interface CatalogModule {
  /** Identificador único usado no wizard e no orçamento. */
  slug: string;
  /** Nome comercial exibido em cards e contrato. */
  name: string;
  /** Categoria visual no catálogo. */
  category: ModuleCategory;
  /** Descrição curta para o card. */
  description: string;
  /** Texto do tooltip "para que serve / como funciona". */
  tooltip: string;
  /** Preço mensal por módulo em centavos. R$ 497 = 49700. */
  priceCents: number;
  /** Nichos onde o módulo brilha (apoia recomendações). */
  recommendedFor: string[];
  /** Outros slugs que combinam (exibidos como "combina com"). */
  combinesWith: string[];
  /** True quando depende de credenciais externas (gateway, WhatsApp API, etc.). */
  requiresExternalCredentials: boolean;
  /** Slug do módulo principal correspondente em motherModules.ts. */
  motherSlug: string;
}

/** Preço único por módulo (R$ 497,00). */
export const MODULE_PRICE_CENTS = 49700;

export const CATALOG_MODULES: CatalogModule[] = [
  // ---------- Atendimento, CRM e Comunicação ----------
  {
    slug: "crm",
    name: "CRM",
    category: "Atendimento & Comunicação",
    description:
      "Organiza leads, clientes, histórico, funis, tarefas, origem do contato, follow-ups e oportunidades.",
    tooltip:
      "Centraliza toda a jornada do cliente — do primeiro contato à recompra — sem perder histórico no WhatsApp ou em planilhas.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Clínicas", "Restaurantes", "Eventos", "Afiliados", "Varejo"],
    combinesWith: ["whatsapp", "agenda", "checkout", "bi"],
    requiresExternalCredentials: false,
    motherSlug: "crm",
  },
  {
    slug: "whatsapp",
    name: "WhatsApp Inteligente",
    category: "Atendimento & Comunicação",
    description:
      "Atendimento ativo e passivo, respostas automáticas, lembretes, confirmações e encaminhamento para humano.",
    tooltip:
      "Funciona com WhatsApp Web ou WhatsApp Business API oficial. Recursos avançados (templates, multi-atendente) dependem da API oficial.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Clínicas", "Restaurantes", "Eventos", "Delivery", "Afiliados"],
    combinesWith: ["crm", "agenda", "eventos", "delivery", "afiliados"],
    requiresExternalCredentials: true,
    motherSlug: "automacao",
  },
  {
    slug: "followups",
    name: "Follow-ups e Automações",
    category: "Atendimento & Comunicação",
    description:
      "Réguas automáticas de relacionamento, recuperação, reativação, lembretes e mensagens pós-venda.",
    tooltip:
      "Cria sequências de mensagens disparadas por evento (carrinho abandonado, aniversário, pós-evento, etc.).",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Afiliados", "Eventos", "Varejo", "Delivery"],
    combinesWith: ["crm", "whatsapp", "afiliados", "eventos"],
    requiresExternalCredentials: false,
    motherSlug: "automacao",
  },

  // ---------- Agenda, Reservas e Eventos ----------
  {
    slug: "agenda",
    name: "Agenda Online",
    category: "Agenda, Reservas e Eventos",
    description:
      "Marcação, reagendamento, confirmação, lembretes, fila de espera e pagamento para confirmar horário.",
    tooltip:
      "Substitui agendas em papel ou WhatsApp. Funciona com profissionais, serviços, salas e múltiplas unidades.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Clínicas", "Consultórios", "Salões", "Estética"],
    combinesWith: ["checkout", "whatsapp", "crm", "prontuario"],
    requiresExternalCredentials: false,
    motherSlug: "agenda",
  },
  {
    slug: "reservas",
    name: "Reservas Pagas",
    category: "Agenda, Reservas e Eventos",
    description:
      "Reservas com regras, pagamento antecipado, tolerância, cancelamento, reembolso e confirmação automática.",
    tooltip:
      "Ideal para restaurantes, bares, salas, quadras e espaços com no-show alto. Cobra antecipado para garantir presença.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Restaurantes", "Bares", "Salas", "Quadras"],
    combinesWith: ["checkout", "whatsapp", "crm", "eventos"],
    requiresExternalCredentials: true,
    motherSlug: "agenda",
  },
  {
    slug: "eventos",
    name: "Eventos e Ingressos",
    category: "Agenda, Reservas e Eventos",
    description:
      "Venda de ingressos, lotes, pagamentos, check-in presencial, transferência de titular e pesquisa pós-evento.",
    tooltip:
      "Plataforma completa para eventos pagos. Suporta múltiplos lotes, cortesias, afiliados de venda e relatórios.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Eventos", "Workshops", "Casas de show", "Cursos presenciais"],
    combinesWith: ["checkout", "crm", "whatsapp", "afiliados"],
    requiresExternalCredentials: true,
    motherSlug: "eventos",
  },

  // ---------- Vendas, Produtos e Pagamentos ----------
  {
    slug: "checkout",
    name: "Checkout e Pagamentos",
    category: "Vendas e Pagamentos",
    description:
      "Pix, cartão, boleto quando disponível, baixa automática, status de pagamento e confirmação da compra.",
    tooltip:
      "Depende de credenciais de gateway (Pagar.me, Asaas, Mercado Pago etc.). A configuração é feita após a contratação.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Todos"],
    combinesWith: ["crm", "afiliados", "eventos", "agenda", "produtos"],
    requiresExternalCredentials: true,
    motherSlug: "commerce",
  },
  {
    slug: "produtos",
    name: "Produtos e Ofertas",
    category: "Vendas e Pagamentos",
    description:
      "Cadastro de produtos, serviços, planos, ofertas, combos, order bump, upsell, cross-sell e cupons.",
    tooltip:
      "Catálogo completo. Suporta produtos físicos, digitais, serviços, assinaturas e combos.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Afiliados", "Varejo", "Delivery", "Eventos"],
    combinesWith: ["afiliados", "checkout", "crm", "estoque"],
    requiresExternalCredentials: false,
    motherSlug: "commerce",
  },
  {
    slug: "afiliados",
    name: "Afiliados e Produtos",
    category: "Vendas e Pagamentos",
    description:
      "Gestão de produtores, afiliados, coprodutores, gerentes, links, cupons, QR Codes, comissões, splits, saques e repasses.",
    tooltip:
      "Operação completa de afiliados. Suporta múltiplos níveis, splits automáticos e dashboards por afiliado.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Afiliados", "Infoprodutos", "Eventos pagos"],
    combinesWith: ["checkout", "crm", "produtos", "bi"],
    requiresExternalCredentials: true,
    motherSlug: "commerce",
  },
  {
    slug: "estoque",
    name: "Estoque, Compras e Fornecedores",
    category: "Vendas e Pagamentos",
    description:
      "Controle de produtos, estoque, compras, fornecedores, pedidos B2B, alertas e recompra.",
    tooltip:
      "Gestão de estoque com múltiplos depósitos, lotes, validade e alertas de mínimo.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Restaurantes", "Varejo", "Delivery", "Farmácias"],
    combinesWith: ["produtos", "delivery", "pdv", "bi"],
    requiresExternalCredentials: false,
    motherSlug: "estoque",
  },

  // ---------- Operação, Delivery e PDV ----------
  {
    slug: "pdv",
    name: "PDV e Comandas",
    category: "Operação, Delivery e PDV",
    description:
      "Vendas presenciais, comandas, mesas, caixa, produtos, consumo e fechamento.",
    tooltip:
      "PDV completo para restaurantes, bares, lojas e quiosques. Integra com estoque, pagamentos e cozinha.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Restaurantes", "Bares", "Cafeterias", "Lojas físicas"],
    combinesWith: ["estoque", "crm", "checkout", "reservas"],
    requiresExternalCredentials: false,
    motherSlug: "pdv",
  },
  {
    slug: "delivery",
    name: "Delivery",
    category: "Operação, Delivery e PDV",
    description:
      "Pedidos online, cardápio, status, entregadores próprios, notificações e aceite de entrega.",
    tooltip:
      "Cardápio digital com pedido pelo cliente. Integrações com iFood/Rappi são opcionais e dependem de credenciais.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Restaurantes", "Hamburguerias", "Pizzarias"],
    combinesWith: ["produtos", "checkout", "crm", "estoque"],
    requiresExternalCredentials: true,
    motherSlug: "delivery",
  },

  // ---------- Saúde ----------
  {
    slug: "prontuario",
    name: "Prontuário Eletrônico",
    category: "Saúde",
    description:
      "Histórico clínico, exames, documentos, upload pelo paciente, área médica, resumo IA e parecer eletrônico.",
    tooltip:
      "Em conformidade com CFM e LGPD. Suporta múltiplos profissionais e especialidades.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Clínicas", "Consultórios", "Médicos", "Dentistas"],
    combinesWith: ["agenda", "area_paciente", "whatsapp", "crm"],
    requiresExternalCredentials: false,
    motherSlug: "saude",
  },
  {
    slug: "area_paciente",
    name: "Área do Paciente",
    category: "Saúde",
    description:
      "Ambiente exclusivo para o paciente acessar documentos, enviar exames e acompanhar registros autorizados.",
    tooltip:
      "Portal do paciente com login próprio. Acesso a receitas, exames, atestados e histórico autorizado.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Clínicas", "Consultórios"],
    combinesWith: ["prontuario", "agenda", "whatsapp"],
    requiresExternalCredentials: false,
    motherSlug: "area_cliente",
  },

  // ---------- Gestão, Dados e Segurança ----------
  {
    slug: "bi",
    name: "Dashboards e BI",
    category: "Gestão, Dados e Segurança",
    description:
      "Painéis de gestão, relatórios, indicadores, origem de leads, ROI, vendas, atendimento, agenda e eventos.",
    tooltip:
      "Dashboards prontos por nicho + relatórios personalizados. Atualização em tempo quase real.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Todos"],
    combinesWith: ["crm", "checkout", "agenda", "eventos", "afiliados"],
    requiresExternalCredentials: false,
    motherSlug: "bi",
  },
  {
    slug: "permissoes",
    name: "Usuários, Setores e Permissões",
    category: "Gestão, Dados e Segurança",
    description:
      "Criação de usuários, setores, perfis, permissões, logs e auditoria para controlar quem acessa cada recurso.",
    tooltip:
      "Controle granular por módulo, ação e setor. Suporta múltiplas unidades e auditoria LGPD.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Equipes maiores", "Franquias", "Multiunidades"],
    combinesWith: ["erp", "bi"],
    requiresExternalCredentials: false,
    motherSlug: "erp",
  },
  {
    slug: "white_label",
    name: "White Label",
    category: "Gestão, Dados e Segurança",
    description:
      "Opere a plataforma com sua marca, logo, identidade visual, clientes próprios e gestão multiempresa.",
    tooltip:
      "Você revende a plataforma como sua. Domínio próprio, identidade visual, controle de clientes finais.",
    priceCents: MODULE_PRICE_CENTS,
    recommendedFor: ["Agências", "Consultores", "Parceiros"],
    combinesWith: ["crm", "bi", "permissoes"],
    requiresExternalCredentials: true,
    motherSlug: "white_label",
  },
];

export function getModule(slug: string): CatalogModule | undefined {
  return CATALOG_MODULES.find((m) => m.slug === slug);
}

export function modulesByCategory(): Record<ModuleCategory, CatalogModule[]> {
  const grouped = {} as Record<ModuleCategory, CatalogModule[]>;
  for (const m of CATALOG_MODULES) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }
  return grouped;
}
