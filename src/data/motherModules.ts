/**
 * Fonte única de verdade dos 14 módulos principais da Impulsionando Tecnologia.
 *
 * Cada módulo principal representa uma grande área comercial e técnica que reúne
 * submódulos, recursos e funcionalidades. As páginas /modulos, /planos,
 * /solucoes, /trial e /orcamento devem consumir este arquivo.
 *
 * Slugs ficam em sincronia com a tabela public.modules e com PLAN_MODULES
 * no webhook do Paddle (src/routes/api/public/payments/webhook.ts).
 */
import {
  Briefcase, Users, Bot, Calendar, CreditCard, Store, Boxes,
  Stethoscope, Ticket, Truck, BarChart3, Layers, Award, UserCircle,
  type LucideIcon,
} from "lucide-react";

export type PlanTier = "essencial" | "integrado" | "avancado" | "sob_medida";

export interface MotherModule {
  /** Slug — mesmo da tabela public.modules e do webhook. */
  slug: string;
  /** Nome curto (cards, navegação). */
  shortName: string;
  /** Nome longo (heroes, títulos). */
  fullName: string;
  /** Subtítulo (uma linha de venda). */
  tagline: string;
  /** Texto comercial completo (1 parágrafo). */
  pitch: string;
  /** Ícone Lucide. */
  icon: LucideIcon;
  /** Lista de submódulos / recursos. */
  submodules: string[];
  /** Categoria visual no catálogo. */
  category: "Gestão" | "Atendimento & Vendas" | "Operação" | "Crescimento" | "Plataforma";
  /** Exemplos de nichos onde o módulo brilha. */
  exampleNiches: string[];
  /** Planos onde costuma estar disponível. */
  planTier: PlanTier[];
}

export const MOTHER_MODULES: MotherModule[] = [
  {
    slug: "erp",
    shortName: "ERP",
    fullName: "ERP — Gestão Operacional e Financeira",
    tagline: "Gestão financeira, administrativa e operacional em um único ambiente.",
    pitch:
      "O módulo ERP centraliza a gestão financeira, administrativa e operacional da empresa, permitindo controlar cobranças, pagamentos, notas fiscais, repasses, assinaturas, inadimplência, usuários, permissões e documentos em um único ambiente.",
    icon: Briefcase,
    submodules: [
      "Financeiro", "Caixa", "Contas a receber", "Contas a pagar",
      "Conciliação bancária", "Fluxo de caixa", "Cobranças",
      "Assinaturas recorrentes", "Faturas", "Notas fiscais",
      "Repasses", "Comissões", "Centros de custo", "Planos contratados",
      "Inadimplência", "Suspensão de acesso", "Regularização financeira",
      "Contratos", "Documentos administrativos", "Usuários",
      "Permissões", "Setores", "Unidades", "Auditoria", "Logs",
    ],
    category: "Gestão",
    exampleNiches: ["Clínicas", "Restaurantes", "Varejo", "Franquias"],
    planTier: ["avancado", "sob_medida"],
  },
  {
    slug: "crm",
    shortName: "CRM",
    fullName: "CRM — Relacionamento, Vendas e Atendimento",
    tagline: "Toda a jornada do cliente, do primeiro contato à fidelização.",
    pitch:
      "O CRM organiza toda a jornada do cliente, desde o primeiro contato até a venda, pagamento, atendimento, recompra, reativação e fidelização. Nada fica perdido no WhatsApp, em planilhas ou na memória da equipe.",
    icon: Users,
    submodules: [
      "Leads", "Clientes", "Pacientes", "Participantes", "Alunos",
      "Consumidores", "Funil comercial", "Funil de atendimento",
      "Funil de recuperação", "Funil financeiro", "Oportunidades",
      "Tarefas", "Follow-ups", "Tags", "Histórico de relacionamento",
      "Origem do lead", "Segmentação", "Reativação",
      "Recuperação de carrinho", "Recuperação de pagamento",
      "Pós-venda", "Pesquisas de satisfação", "NPS",
      "Reclamações", "Elogios", "Retenção",
    ],
    category: "Atendimento & Vendas",
    exampleNiches: ["Serviços", "Educação", "B2B", "Saúde"],
    planTier: ["essencial", "integrado", "avancado", "sob_medida"],
  },
  {
    slug: "automacao",
    shortName: "Automação & Comunicação",
    fullName: "Automação & Comunicação",
    tagline: "WhatsApp, e-mail, IA e follow-ups com regras de segurança.",
    pitch:
      "O módulo de Automação & Comunicação permite atender, cobrar, lembrar, recuperar, confirmar, pesquisar e reativar clientes por WhatsApp e e-mail, com IA, templates, regras de segurança e encaminhamento humano quando necessário.",
    icon: Bot,
    submodules: [
      "WhatsApp via Z-API", "E-mail transacional", "Assistente virtual IA",
      "OpenAI", "Templates de mensagens", "Templates de e-mail",
      "Central de comunicação", "Fila de envio", "Logs de comunicação",
      "Webhooks", "Mensagens automáticas", "Mensagens manuais",
      "Boas-vindas", "Lembretes", "Cobranças", "Pesquisas",
      "Reativação", "Encaminhamento humano", "Painel de atendimento",
      "Atendimento passivo", "Atendimento ativo",
      "Fallback humano", "Auditoria de conversas",
    ],
    category: "Atendimento & Vendas",
    exampleNiches: ["Qualquer nicho"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
  {
    slug: "agenda",
    shortName: "Agenda & Reservas",
    fullName: "Agenda & Reservas",
    tagline: "Agendamento, reservas e disponibilidade com confirmação automática.",
    pitch:
      "O módulo Agenda & Reservas permite que clientes, pacientes, alunos ou participantes escolham horários, façam reservas, paguem quando necessário e tenham a confirmação automática somente após as regras definidas pela empresa.",
    icon: Calendar,
    submodules: [
      "Agenda online", "Agendamento por profissional",
      "Agendamento por serviço", "Agendamento por sala",
      "Agendamento por unidade", "Reagendamento", "Cancelamento",
      "Lista de espera", "Confirmação automática", "Lembretes",
      "Bloqueios de agenda", "Disponibilidade", "Reservas",
      "Reservas pagas", "Consumação mínima", "Política de no-show",
      "Tolerância de atraso", "Vagas por horário", "Turmas",
      "Aulas", "Consultas", "Retornos", "Confirmação mediante pagamento",
    ],
    category: "Atendimento & Vendas",
    exampleNiches: ["Clínicas", "Salões", "Academias", "Restaurantes"],
    planTier: ["essencial", "integrado", "avancado", "sob_medida"],
  },
  {
    slug: "commerce",
    shortName: "Commerce & Pagamentos",
    fullName: "Commerce & Pagamentos",
    tagline: "Checkout, assinaturas e baixa automática — venda confirmada.",
    pitch:
      "O módulo Commerce & Pagamentos transforma interesse em venda confirmada, com checkout, Pix, cartão, boleto, cobrança recorrente, baixa automática e liberação do serviço somente após pagamento aprovado.",
    icon: CreditCard,
    submodules: [
      "Checkout transparente", "Mercado Pago", "Pix",
      "Cartão de crédito", "Cartão de débito", "Boleto",
      "Link de pagamento", "QR Code Pix", "Assinaturas recorrentes",
      "Planos mensais", "Plano anual", "Trial de 7 dias",
      "Setup inicial", "Pagamentos pontuais", "Carrinho",
      "Carrinho abandonado", "Cobrança automática", "Baixa automática",
      "Liberação automática do serviço", "Faturas",
      "Nota fiscal fictícia em demo", "Inadimplência",
      "Suspensão de acesso", "Regularização", "Histórico financeiro",
    ],
    category: "Operação",
    exampleNiches: ["E-commerce", "Cursos", "SaaS", "Serviços"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
  {
    slug: "pdv",
    shortName: "PDV",
    fullName: "PDV & Operação Presencial",
    tagline: "Caixa, comandas, mesas e atendimento local conectados.",
    pitch:
      "O módulo PDV & Operação Presencial organiza vendas, comandas, mesas, caixa, consumo e atendimento local, conectando o que acontece no balcão, no salão ou no evento aos dados do cliente e aos relatórios da gestão.",
    icon: Store,
    submodules: [
      "PDV", "Caixa", "Abertura de caixa", "Fechamento de caixa",
      "Comandas", "Mesas", "Consumo", "Produtos", "Serviços",
      "Descontos", "Taxas", "Pagamento presencial", "QR Code de mesa",
      "Controle de atendimento", "Garçons", "Cozinha", "Bar",
      "Retirada", "Check-in presencial", "Relatórios de operação",
    ],
    category: "Operação",
    exampleNiches: ["Bares", "Restaurantes", "Lojas", "Eventos"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
  {
    slug: "estoque",
    shortName: "Estoque & Fornecedores",
    fullName: "Estoque & Fornecedores",
    tagline: "Produtos, insumos, compras e B2B sob controle.",
    pitch:
      "O módulo Estoque & Fornecedores conecta produtos, compras, insumos, vendas e reposição, permitindo que a empresa saiba o que tem, o que vende, o que falta, o que gira e o que precisa ser recomprado.",
    icon: Boxes,
    submodules: [
      "Produtos", "Serviços", "Categorias", "Insumos", "Estoque",
      "Estoque mínimo", "Entrada de produtos", "Saída de produtos",
      "Baixa automática", "Lotes", "Validade", "Fornecedores",
      "Catálogo B2B", "Pedidos para fornecedores", "Recompra",
      "Preço de custo", "Preço de venda", "Margem",
      "Relatórios de giro", "Histórico de compras",
    ],
    category: "Operação",
    exampleNiches: ["Varejo", "Microcervejarias", "Distribuidores"],
    planTier: ["avancado", "sob_medida"],
  },
  {
    slug: "saude",
    shortName: "Saúde & Prontuário",
    fullName: "Saúde & Prontuário",
    tagline: "Clínicas, consultórios e área do paciente com segurança LGPD.",
    pitch:
      "O módulo Saúde & Prontuário centraliza a jornada clínica do paciente, reunindo agenda, consultas, exames, laudos, documentos, evolução médica, pareceres, comunicação e área exclusiva do paciente com segurança e rastreabilidade.",
    icon: Stethoscope,
    submodules: [
      "Pacientes", "Médicos", "Consultas", "Retornos",
      "Agenda médica", "Prontuário eletrônico", "Linha do tempo clínica",
      "Evolução médica", "Upload de exames", "Upload de laudos",
      "Exames laboratoriais", "Exames de imagem", "Área do paciente",
      "Área do médico", "Parecer médico", "Confirmação eletrônica",
      "IA de apoio para resumo", "Revisão médica da IA",
      "Liberação ao paciente", "Notificações", "Logs clínicos",
      "Auditoria", "LGPD / dados sensíveis",
    ],
    category: "Operação",
    exampleNiches: ["Clínicas", "Consultórios", "Dentistas", "Fisioterapeutas"],
    planTier: ["avancado", "sob_medida"],
  },
  {
    slug: "eventos",
    shortName: "Eventos & Ingressos",
    fullName: "Eventos & Ingressos",
    tagline: "Venda de ingressos, check-in e pós-evento em um só fluxo.",
    pitch:
      "O módulo Eventos & Ingressos permite vender vagas, confirmar pagamentos, emitir ingressos nominais, controlar check-in presencial, transferir titularidade conforme regras e medir a satisfação dos participantes após o evento.",
    icon: Ticket,
    submodules: [
      "Cadastro de eventos", "Página pública do evento",
      "Imagem convite", "Lotes de ingressos", "Venda de ingressos",
      "Pagamento de ingresso", "Reserva temporária", "Lista de espera",
      "Ingresso nominal", "QR Code", "Transferência de ingresso",
      "Alteração de titular", "Regras de prazo",
      "Aprovação da organização", "Check-in presencial",
      "Confirmação de presença", "Boas-vindas",
      "Pesquisa pós-evento", "Histórico do participante",
      "Histórico do ingresso", "Dashboard do evento",
    ],
    category: "Crescimento",
    exampleNiches: ["Casas noturnas", "Cursos", "Workshops", "Experiências"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
  {
    slug: "delivery",
    shortName: "Delivery & Logística",
    fullName: "Delivery & Logística",
    tagline: "Pedidos, entregadores e entrega — sem pedido perdido.",
    pitch:
      "O módulo Delivery & Logística organiza pedidos, pagamentos, preparo, entrega, entregadores próprios, status para o cliente e recompra, reduzindo pedidos perdidos e melhorando a experiência de compra.",
    icon: Truck,
    submodules: [
      "Cardápio digital", "Pedido online", "Carrinho",
      "Pagamento online", "Status do pedido",
      "Notificação para cozinha", "Separação/preparo", "Retirada",
      "Entrega", "Cadastro de entregadores", "Motoqueiros próprios",
      "Aceite de entrega", "Push futuro para entregadores",
      "Taxa de entrega", "Área atendida", "Tempo estimado",
      "Histórico de entregas", "Recompra",
      "Integração futura com modais externos",
    ],
    category: "Operação",
    exampleNiches: ["Restaurantes", "Hamburguerias", "Dark kitchens"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
  {
    slug: "bi",
    shortName: "BI & Dashboards",
    fullName: "BI & Dashboards",
    tagline: "Relatórios, indicadores e inteligência de gestão.",
    pitch:
      "O módulo BI & Dashboards transforma dados operacionais em gestão real, permitindo acompanhar vendas, atendimentos, pagamentos, agenda, eventos, estoque, satisfação, repasses, inadimplência e performance por nicho.",
    icon: BarChart3,
    submodules: [
      "Dashboard master", "Dashboard financeiro", "Dashboard comercial",
      "Dashboard operacional", "Dashboard de atendimento",
      "Dashboard de CRM", "Dashboard de eventos", "Dashboard de saúde",
      "Dashboard de delivery", "Dashboard de estoque",
      "Dashboard de afiliados", "Dashboard de satisfação",
      "Relatórios por período", "Relatórios por unidade",
      "Relatórios por usuário", "Relatórios por canal",
      "Indicadores de conversão", "Indicadores de retenção",
      "Indicadores de inadimplência", "Exportações", "BI por nicho",
    ],
    category: "Gestão",
    exampleNiches: ["Multiempresa", "Franquias", "Gestão consolidada"],
    planTier: ["avancado", "sob_medida"],
  },
  {
    slug: "white_label",
    shortName: "White Label",
    fullName: "White Label & Franquias Digitais",
    tagline: "Marca própria, clientes próprios e gestão multiempresa.",
    pitch:
      "O módulo White Label permite que parceiros vendam tecnologia com sua própria marca, seus próprios clientes e seus próprios planos, contando com a estrutura técnica e a evolução da Impulsionando Tecnologia por trás.",
    icon: Layers,
    submodules: [
      "Marca própria", "Logo própria", "Clientes próprios",
      "Multiempresa", "Multinicho", "Gestão centralizada",
      "Briefing inteligente", "Diagnóstico do cliente",
      "Proposta personalizada", "Ativação de módulos",
      "Usuários por cliente", "Permissões", "Dashboards por cliente",
      "Relatórios consolidados", "Planos próprios", "Repasses",
      "Suporte de bastidor", "Gestão comercial do parceiro",
    ],
    category: "Plataforma",
    exampleNiches: ["Agências", "Consultorias", "Parceiros comerciais"],
    planTier: ["sob_medida"],
  },
  {
    slug: "fidelizacao",
    shortName: "Fidelização & Afiliados",
    fullName: "Fidelização & Afiliados",
    tagline: "Indicação, clube de vantagens e comissões automáticas.",
    pitch:
      "O módulo Fidelização & Afiliados transforma clientes, parceiros e indicadores em canais de crescimento, criando clubes de vantagens, comissões, recompensas, recorrência e novas vendas.",
    icon: Award,
    submodules: [
      "Afiliados", "Parceiros", "Clube de indicação", "Clube de vantagens",
      "Links de indicação", "Cupons", "QR Codes", "Comissões",
      "Ranking", "Repasses", "Pontuação", "Benefícios", "Recompensas",
      "Campanhas de retorno", "Recompra", "Clientes recorrentes",
      "Indicações realizadas", "Taxa de retorno", "Histórico de participação",
    ],
    category: "Crescimento",
    exampleNiches: ["Cursos", "Clínicas", "SaaS", "Varejo"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
  {
    slug: "area_cliente",
    shortName: "Área do Cliente",
    fullName: "Área do Cliente",
    tagline: "Portal do cliente, paciente, aluno, participante ou consumidor.",
    pitch:
      "A Área do Cliente permite que cada pessoa acompanhe suas informações, pagamentos, documentos, agendamentos, ingressos, exames, pedidos, mensagens e histórico em um ambiente próprio, seguro e organizado.",
    icon: UserCircle,
    submodules: [
      "Portal do cliente", "Área do paciente", "Área do aluno",
      "Área do participante", "Área do fornecedor", "Área do afiliado",
      "Área do parceiro", "Histórico", "Documentos", "Faturas",
      "Pagamentos", "Agendamentos", "Reservas", "Ingressos",
      "Exames", "Pedidos", "Mensagens", "Pesquisas", "Benefícios",
      "Suporte",
    ],
    category: "Plataforma",
    exampleNiches: ["Saúde", "Educação", "Eventos", "Serviços"],
    planTier: ["integrado", "avancado", "sob_medida"],
  },
];

export const MOTHER_MODULE_CATEGORIES = [
  "Gestão",
  "Atendimento & Vendas",
  "Operação",
  "Crescimento",
  "Plataforma",
] as const;

/** Lookup helper. */
export function getMotherModule(slug: string): MotherModule | undefined {
  return MOTHER_MODULES.find((m) => m.slug === slug);
}

/**
 * Mapa de slugs equivalentes: alguns módulos antigos foram unificados
 * (ex.: "financeiro" → "erp"). Use isto para retrocompatibilidade.
 */
export const SLUG_ALIASES: Record<string, string> = {
  financeiro: "erp",
  fiscal: "erp",
  usuarios: "erp",
  whatsapp: "automacao",
  pagamentos: "commerce",
  afiliados: "fidelizacao",
  prontuario: "saude",
};

export function resolveSlug(slug: string): string {
  return SLUG_ALIASES[slug] ?? slug;
}
