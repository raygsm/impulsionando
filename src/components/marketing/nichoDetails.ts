import {
  Stethoscope,
  UtensilsCrossed,
  Beer,
  Truck,
  Briefcase,
  ShoppingBag,
  Building2,
  Dumbbell,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NichoDetail {
  slug: string;
  title: string;
  subtitle: string;
  shortLabel: string;
  cardDesc: string;
  icon: ComponentType<{ className?: string }>;
  pains: string[];
  silentLosses: string[];
  solution: string[];
  journey: { step: string; detail: string }[];
  /** Bloco extra opcional (ex.: "exemplo de reserva paga"). */
  extraBlock?: { title: string; lines: string[] };
  /** Ids dos módulos do catálogo (moduleDetails.ts) que fazem sentido aqui. */
  modules: string[];
  benefits: string[];
  ctaPrimary: { label: string; whatsappMsg: string };
  ctaSecondary: { label: string; href: string };
  /** Rota interna para uma demo do nicho, se houver. */
  demoRoute?: string;
}

const WA_BASE = "https://wa.me/5521993075000?text=";
export const ctaWaUrl = (msg: string) => WA_BASE + encodeURIComponent(msg);

export const NICHO_DETAILS: NichoDetail[] = [
  // ============================================================
  // 1. CLÍNICAS MÉDICAS E CONSULTÓRIOS
  // ============================================================
  {
    slug: "clinicas",
    title: "Clínicas médicas mais organizadas, com agenda, pagamento, WhatsApp e relacionamento em um só lugar.",
    subtitle:
      "Da primeira mensagem do paciente à confirmação da consulta, tudo pode ser conduzido com mais controle, menos retrabalho e mais conversão.",
    shortLabel: "Clínicas Médicas e Consultórios",
    cardDesc:
      "Agenda online, pagamento antecipado, WhatsApp 24h, CRM de pacientes e dashboard por médico, serviço e canal.",
    icon: Stethoscope,
    pains: [
      "Pacientes chamam fora do horário comercial.",
      "A recepção perde oportunidades por excesso de mensagens.",
      "Muitos pacientes perguntam, mas não agendam.",
      "Consultas são marcadas sem pagamento prévio.",
      "Há no-show.",
      "Há retrabalho com remarcações.",
      "Falta controle de retorno.",
      "Pacientes esquecem horários.",
      "A clínica não sabe qual canal traz mais consultas.",
      "A gestão não sabe qual médico, serviço ou campanha converte melhor.",
    ],
    silentLosses: [
      "Agenda com horários ociosos.",
      "Paciente interessado que não recebe resposta rápida.",
      "Consulta marcada sem compromisso financeiro.",
      "Recepção sobrecarregada com dúvidas repetitivas.",
      "Falta de follow-up após o primeiro contato.",
      "Falta de reativação de pacientes antigos.",
      "Falta de dados para decidir onde investir em marketing.",
    ],
    solution: [
      "Cadastro de pacientes",
      "Agenda online",
      "Escolha de médico, serviço e horário",
      "Pagamento online antes da confirmação",
      "Baixa automática",
      "Lembretes automáticos",
      "Reagendamento pelo próprio paciente",
      "Cancelamento com regras",
      "Controle de retorno",
      "CRM de pacientes",
      "WhatsApp 24h",
      "Follow-up automático",
      "Pesquisa pós-consulta",
      "Dashboard por médico, serviço, canal e origem",
    ],
    journey: [
      { step: "Paciente vê anúncio, site ou indicação", detail: "Chama no WhatsApp da clínica." },
      { step: "Sistema responde automaticamente", detail: "Tira dúvidas e apresenta os serviços disponíveis." },
      { step: "Paciente escolhe médico e horário", detail: "Sem depender da recepção, em segundos." },
      { step: "Sistema envia link de pagamento", detail: "Pix, cartão ou link. Pagamento valida a consulta." },
      { step: "Pagamento aprovado", detail: "Agenda confirmada automaticamente, sem retrabalho." },
      { step: "Paciente recebe lembrete", detail: "WhatsApp e/ou e-mail antes da consulta — menos no-show." },
      { step: "Consulta é realizada", detail: "Sistema registra atendimento, observações e próximos passos." },
      { step: "Sistema envia pesquisa", detail: "Avaliação rápida + abertura para reativação." },
      { step: "Paciente entra em fluxo de retorno", detail: "Reativação automática no tempo certo de cada serviço." },
    ],
    modules: ["agenda", "crm", "whatsapp", "pagamentos", "fiscal", "bi", "permissoes"],
    benefits: [
      "Menos no-show",
      "Mais consultas confirmadas",
      "Menos retrabalho da recepção",
      "Mais clareza para o paciente",
      "Pagamento mais organizado",
      "Retorno controlado",
      "Atendimento 24h",
      "Histórico completo",
      "Melhor gestão da agenda",
      "Mais conversão de leads em pacientes",
    ],
    ctaPrimary: {
      label: "Quero a clínica organizada no WhatsApp",
      whatsappMsg:
        "Olá, sou de uma clínica/consultório e quero conhecer a Impulsionando para agenda online, pagamento, WhatsApp 24h e CRM de pacientes.",
    },
    ctaSecondary: { label: "Teste agora a jornada completa de uma clínica digital", href: "/demo/cliente-final" },
    demoRoute: "/demo/cliente-final",
  },

  // ============================================================
  // 2. BARES E RESTAURANTES
  // ============================================================
  {
    slug: "bares-restaurantes",
    title: "Seu bar ou restaurante não pode continuar tratando cliente como anônimo.",
    subtitle:
      "Transforme reservas, consumo, atendimento, eventos e relacionamento em dados, recorrência e faturamento.",
    shortLabel: "Bares e Restaurantes",
    cardDesc:
      "Reservas pagas, CRM, clube de vantagens, campanhas segmentadas, controle de estoque e dashboard por evento e cliente.",
    icon: UtensilsCrossed,
    pains: [
      "Cliente frequenta o local, consome e vai embora sem deixar dados.",
      "O bar não sabe quem é o cliente.",
      "Não sabe o que ele consome.",
      "Não sabe quando ele volta.",
      "Não consegue convidar clientes certos para eventos certos.",
      "Reservas são feitas de forma informal.",
      "Pessoas reservam e não aparecem.",
      "Eventos são feitos sem medir resultado.",
      "Estoque é controlado sem conexão com consumo real.",
      "Promoções são feitas sem segmentação.",
    ],
    silentLosses: [
      "Cliente bom que nunca é reativado.",
      "Evento com público errado.",
      "Produto parado no estoque.",
      "Mesa reservada sem garantia de comparecimento.",
      "Equipe sem histórico do cliente.",
      "Campanha enviada para todo mundo sem critério.",
      "Falta de dados sobre consumo, frequência e ticket médio.",
    ],
    solution: [
      "Cadastro de cliente via QR Code, WhatsApp, reserva, Wi-Fi ou atendimento",
      "Histórico de consumo",
      "CRM de clientes",
      "Clube de vantagens",
      "Reservas online",
      "Reservas pagas",
      "Regras de reserva expostas antes da confirmação",
      "Pagamento antecipado",
      "Baixa automática",
      "Reembolso conforme regra",
      "Convites para eventos",
      "Controle de frequência",
      "Campanhas segmentadas",
      "Controle de estoque",
      "Relatórios por evento, produto, cliente e horário",
    ],
    extraBlock: {
      title: "Exemplo de reserva paga",
      lines: [
        "Cliente escolhe data, horário e quantidade de pessoas.",
        "Sistema mostra as regras da reserva.",
        "Cliente aceita as condições.",
        "Paga valor de reserva ou consumação mínima.",
        "Reserva é confirmada automaticamente.",
        "Restaurante sabe que vai receber.",
        "Cliente recebe lembrete.",
        "Comparecimento é registrado.",
        "Consumo entra no histórico.",
        "Cliente entra em campanha futura.",
      ],
    },
    journey: [
      { step: "Cliente acessa QR Code, WhatsApp ou página de reservas", detail: "Entrada simples por qualquer canal." },
      { step: "Faz cadastro", detail: "Dados mínimos, com consentimento LGPD." },
      { step: "Escolhe mesa, horário ou evento", detail: "Tudo com regras claras antes de pagar." },
      { step: "Aceita regras e paga reserva ou sinal", detail: "Pix ou cartão, com baixa automática." },
      { step: "Recebe confirmação", detail: "Lembrete antes da reserva por WhatsApp." },
      { step: "Consome no local", detail: "Sistema registra preferências e ticket." },
      { step: "Cliente recebe benefício ou convite futuro", detail: "Clube de vantagens e campanhas segmentadas." },
      { step: "Retorna com mais frequência", detail: "Recorrência cresce com dados, não com sorte." },
    ],
    modules: ["crm", "whatsapp", "pagamentos", "afiliados", "bi", "permissoes"],
    benefits: [
      "Menos reserva perdida",
      "Menos no-show",
      "Mais previsibilidade",
      "Mais recorrência",
      "Mais controle sobre clientes",
      "Mais eficiência em eventos",
      "Mais vendas por segmentação",
      "Melhor gestão de estoque",
      "Campanhas mais inteligentes",
      "Cliente deixa de ser anônimo",
    ],
    ctaPrimary: {
      label: "Quero transformar meu bar/restaurante",
      whatsappMsg:
        "Olá, tenho bar/restaurante e quero conhecer a Impulsionando para reservas pagas, CRM, clube de vantagens e campanhas segmentadas.",
    },
    ctaSecondary: { label: "Teste a demonstração para bares e restaurantes", href: "/demo/cliente-final" },
    demoRoute: "/demo/cliente-final",
  },

  // ============================================================
  // 3. MICROCERVEJARIAS
  // ============================================================
  {
    slug: "microcervejarias",
    title: "Venda melhor para bares, controle rótulos, estoque, pedidos e recompra.",
    subtitle:
      "Uma plataforma para transformar a operação comercial da microcervejaria em um ecossistema B2B organizado.",
    shortLabel: "Microcervejarias",
    cardDesc:
      "Pedidos B2B, controle por barril/lata/garrafa, ranking de rótulos e compradores, recompra automática e campanhas para bares.",
    icon: Beer,
    pains: [
      "Vendas feitas por WhatsApp sem padronização.",
      "Bares perguntam disponibilidade o tempo todo.",
      "Estoque de barris, latas e garrafas nem sempre está atualizado.",
      "Falta controle por lote, validade, estilo e região.",
      "Falta histórico de recompra por bar.",
      "Falta visão dos rótulos com maior giro.",
      "Falta gestão dos compradores recorrentes.",
      "Falta integração com eventos e campanhas.",
    ],
    silentLosses: [
      "Pedido perdido por demora na resposta.",
      "Produto parado sem campanha.",
      "Bar que comprou uma vez e nunca foi reativado.",
      "Falta de dados para prever produção.",
      "Falta de ranking dos melhores compradores.",
      "Falta de clareza sobre rótulos mais rentáveis.",
    ],
    solution: [
      "Cadastro de rótulos com estilo, ABV, IBU, volume e embalagem",
      "Controle por barril, lata ou garrafa",
      "Estoque disponível e reservado",
      "Preço B2B",
      "Pedido de bares com aprovação",
      "Pagamento online e baixa automática",
      "Recompra automática",
      "Relatórios por rótulo e por comprador",
      "Campanhas para bares",
      "Integração futura com marketplace",
    ],
    journey: [
      { step: "Microcervejaria cadastra rótulos", detail: "Estilo, ABV, IBU, embalagem, lote e validade." },
      { step: "Bares visualizam disponibilidade", detail: "Catálogo B2B com preço e estoque em tempo real." },
      { step: "Comprador faz pedido", detail: "Pelo WhatsApp ou pelo painel, com regras claras." },
      { step: "Sistema registra e organiza", detail: "Pedido entra no fluxo comercial e logístico." },
      { step: "Pagamento é feito", detail: "Pix ou link, com baixa automática." },
      { step: "Estoque é atualizado", detail: "Movimentação por barril, lata ou garrafa." },
      { step: "Entrega é acompanhada", detail: "Status visível para a microcervejaria e o bar." },
      { step: "Recompra é monitorada", detail: "Ciclo médio por bar e por rótulo." },
      { step: "Bares inativos entram em follow-up", detail: "Reativação automática com campanha segmentada." },
    ],
    modules: ["crm", "whatsapp", "pagamentos", "bi", "fiscal", "permissoes", "integracoes"],
    benefits: [
      "Venda B2B mais organizada",
      "Menos pedido perdido",
      "Melhor controle de estoque",
      "Melhor relacionamento com bares",
      "Mais recompra",
      "Mais previsibilidade",
      "Mais inteligência comercial",
      "Ranking de rótulos e compradores",
      "Campanhas mais eficientes",
    ],
    ctaPrimary: {
      label: "Quero organizar minha microcervejaria",
      whatsappMsg:
        "Olá, tenho microcervejaria e quero conhecer a Impulsionando para pedidos B2B, estoque por rótulo, recompra e campanhas para bares.",
    },
    ctaSecondary: { label: "Simule uma microcervejaria vendendo para bares", href: "/demo/cliente-final" },
    demoRoute: "/demo/cliente-final",
  },

  // ============================================================
  // 4. FORNECEDORES E DISTRIBUIDORES
  // ============================================================
  {
    slug: "fornecedores",
    title: "Organize pedidos, clientes, produtos, estoque e relacionamento B2B.",
    subtitle:
      "Uma operação de fornecedor precisa vender, acompanhar, cobrar, entregar e reativar com controle.",
    shortLabel: "Fornecedores e Distribuidores",
    cardDesc:
      "Catálogo B2B, pedidos, pagamentos, recompra, campanhas por segmento e dashboard comercial em um só painel.",
    icon: Truck,
    pains: [
      "Pedidos espalhados em WhatsApp.",
      "Falta de padrão comercial.",
      "Dificuldade de saber quem compra, quando compra e o que compra.",
      "Falta de controle sobre produtos de maior giro.",
      "Falta de reativação de clientes inativos.",
      "Pouca visibilidade de estoque.",
      "Falta de relacionamento automatizado com compradores.",
    ],
    silentLosses: [
      "Pedido que entrou no WhatsApp e foi esquecido.",
      "Cliente B2B sem visita comercial planejada.",
      "Produto encalhado sem campanha de saída.",
      "Cliente comprou 1 vez e nunca foi reativado.",
      "Falta de dados para negociar com indústria/fornecedor.",
    ],
    solution: [
      "Cadastro de compradores",
      "Catálogo de produtos",
      "Controle de estoque",
      "Pedidos com aprovação",
      "Pagamento online",
      "Follow-up automático",
      "Recompra programada",
      "Relatórios comerciais",
      "WhatsApp 24h",
      "Campanhas por segmento",
      "Dashboard comercial",
    ],
    journey: [
      { step: "Cliente B2B chama pelo WhatsApp", detail: "Entrada por canal que ele já usa." },
      { step: "Sistema identifica ou cadastra", detail: "Reconhece o comprador e abre o histórico." },
      { step: "Apresenta catálogo", detail: "Com preço, estoque e regras comerciais." },
      { step: "Cliente faz pedido", detail: "Direto pelo painel ou conduzido pelo WhatsApp." },
      { step: "Recebe link de pagamento", detail: "Pix, cartão ou faturado, conforme regra." },
      { step: "Pedido é confirmado", detail: "Estoque é atualizado, equipe é notificada." },
      { step: "Cliente entra em fluxo de recompra", detail: "Próximo pedido programado no tempo certo." },
    ],
    modules: ["crm", "whatsapp", "pagamentos", "afiliados", "bi", "fiscal", "integracoes"],
    benefits: [
      "Menos pedido perdido",
      "Mais controle comercial",
      "Melhor relacionamento B2B",
      "Mais recompra",
      "Melhor gestão de estoque",
      "Dados reais de vendas",
      "Campanhas segmentadas",
    ],
    ctaPrimary: {
      label: "Quero organizar minha operação B2B",
      whatsappMsg:
        "Olá, sou fornecedor/distribuidor e quero conhecer a Impulsionando para pedidos, estoque, recompra e CRM B2B.",
    },
    ctaSecondary: { label: "Teste como vender e reativar clientes B2B", href: "/demo/cliente-final" },
    demoRoute: "/demo/cliente-final",
  },

  // ============================================================
  // 5. EMPRESAS DE SERVIÇOS
  // ============================================================
  {
    slug: "servicos",
    title: "Organize atendimento, briefing, proposta, agenda, pagamento e follow-up.",
    subtitle: "Empresas de serviços perdem oportunidades todos os dias por falta de processo.",
    shortLabel: "Empresas de Serviços",
    cardDesc:
      "CRM com briefing inteligente, sugestão de plano, proposta, agenda, pagamento e follow-up — tudo conectado.",
    icon: Briefcase,
    pains: [
      "Leads chegam por vários canais e se perdem.",
      "Atendimento demora.",
      "Briefing é incompleto.",
      "Propostas são enviadas sem follow-up.",
      "Clientes não entendem os planos.",
      "Equipe esquece retorno.",
      "Pagamentos são controlados manualmente.",
      "Não há histórico claro de cada cliente.",
    ],
    silentLosses: [
      "Lead que entrou por anúncio e não recebeu resposta.",
      "Proposta enviada e nunca seguida.",
      "Cliente bom que ficou sem retorno.",
      "Equipe sem visão do funil real.",
      "Receita previsível virando achismo.",
    ],
    solution: [
      "CRM",
      "Briefing automático",
      "Formulários inteligentes",
      "Sugestão de plano",
      "Agenda integrada",
      "Pagamento online",
      "Follow-up automático",
      "WhatsApp passivo e ativo",
      "Relatórios",
      "Dashboard comercial",
    ],
    journey: [
      { step: "Lead chama no WhatsApp", detail: "Sistema responde em segundos, sem depender de humano." },
      { step: "Faz perguntas estratégicas", detail: "Briefing estruturado, sem texto solto." },
      { step: "Identifica necessidade", detail: "Classifica intenção e nível de urgência." },
      { step: "Sugere plano ou serviço", detail: "Com base no briefing e em regras do negócio." },
      { step: "Cria oportunidade no CRM", detail: "Com etapa, responsável e próximos passos." },
      { step: "Agenda reunião", detail: "Com link e lembrete automático." },
      { step: "Envia proposta", detail: "Modelo padronizado, sem retrabalho." },
      { step: "Acompanha follow-up", detail: "Cadência automática até a decisão." },
      { step: "Registra pagamento", detail: "Pix, link ou faturado, com baixa automática." },
      { step: "Ativa relacionamento pós-venda", detail: "Onboarding, pesquisa, upsell e renovação." },
    ],
    modules: ["crm", "whatsapp", "agenda", "pagamentos", "sites", "bi", "permissoes"],
    benefits: [
      "Menos lead perdido",
      "Atendimento 24h",
      "Briefing mais completo",
      "Propostas mais claras",
      "Follow-up automático",
      "Mais conversão",
      "Mais organização",
      "Mais previsibilidade comercial",
    ],
    ctaPrimary: {
      label: "Quero processo comercial de verdade",
      whatsappMsg:
        "Olá, tenho empresa de serviços e quero conhecer a Impulsionando para CRM, briefing automático, proposta, agenda e follow-up.",
    },
    ctaSecondary: { label: "Teste a demo comercial completa", href: "/demo/cliente-final" },
    demoRoute: "/demo/cliente-final",
  },

  // ============================================================
  // 6. E-COMMERCE E VAREJO
  // ============================================================
  {
    slug: "ecommerce",
    title: "Venda, entenda o cliente, estimule recompra e crie relacionamento.",
    subtitle:
      "Venda isolada é pouco. O valor está em transformar cada compra em histórico, preferência e recorrência.",
    shortLabel: "E-commerce e Varejo",
    cardDesc:
      "Histórico de compras, tags por interesse, follow-up de carrinho, clube de vantagens, indicação e campanhas segmentadas.",
    icon: ShoppingBag,
    pains: [
      "Cliente compra uma vez e desaparece.",
      "Loja não usa histórico de compra.",
      "Campanhas são genéricas.",
      "Carrinho abandonado não recebe follow-up.",
      "Cliente inativo não é reativado.",
      "Falta clube de vantagens.",
      "Falta segmentação por interesse.",
    ],
    silentLosses: [
      "Base inteira recebendo a mesma campanha.",
      "Cliente VIP tratado como novo.",
      "Carrinho abandonado sem 1 mensagem sequer.",
      "Cliente inativo deixado para trás.",
      "Indicação espontânea sem mecânica para virar venda.",
    ],
    solution: [
      "CRM",
      "Histórico de compras",
      "Tags por interesse",
      "Follow-up de carrinho",
      "WhatsApp",
      "Clube de vantagens",
      "Clube de indicação",
      "Campanhas segmentadas",
      "Pagamentos integrados",
      "Relatórios de recompra",
      "Notificações futuras (app/push)",
    ],
    journey: [
      { step: "Cliente compra ou demonstra interesse", detail: "Entrada pode ser site, loja física ou WhatsApp." },
      { step: "Sistema registra produto, categoria e valor", detail: "Histórico granular por SKU e categoria." },
      { step: "Cria perfil de consumo", detail: "Tags, frequência, ticket e preferência." },
      { step: "Envia ofertas segmentadas", detail: "Mensagem certa para o cliente certo, na hora certa." },
      { step: "Bonifica recompra", detail: "Clube de vantagens com regras claras." },
      { step: "Convida para clube de indicação", detail: "Transforma cliente em canal." },
      { step: "Cliente inativo entra em reativação", detail: "Campanha automática com gatilho de tempo." },
    ],
    modules: ["crm", "whatsapp", "afiliados", "pagamentos", "sites", "bi", "integracoes"],
    benefits: [
      "Mais recompra",
      "Mais retenção",
      "Menos abandono",
      "Campanhas mais certeiras",
      "Melhor aproveitamento da base",
      "Clube de vantagens",
      "Dados de comportamento",
      "Relacionamento contínuo",
    ],
    ctaPrimary: {
      label: "Quero recompra e relacionamento",
      whatsappMsg:
        "Olá, tenho e-commerce/varejo e quero conhecer a Impulsionando para CRM, follow-up, clube de vantagens e campanhas segmentadas.",
    },
    ctaSecondary: { label: "Veja a demo de recompra e relacionamento", href: "/demo/cliente-final" },
    demoRoute: "/demo/cliente-final",
  },

  // ============================================================
  // 7. WHITE LABEL
  // ============================================================
  {
    slug: "white-label",
    title: "Venda tecnologia com sua marca, sem desenvolver uma plataforma do zero.",
    subtitle:
      "Uma estrutura SaaS pronta para parceiros que desejam oferecer CRM, agenda, WhatsApp, automações, pagamentos, afiliados, fornecedores e dashboards aos seus próprios clientes.",
    shortLabel: "White Label para Parceiros",
    cardDesc:
      "Ambiente multiempresa com marca própria, módulos ativáveis, painel master e demo pronta para vender.",
    icon: Building2,
    pains: [
      "Desenvolver sistema do zero custa caro.",
      "Manter tecnologia exige equipe.",
      "Agências e consultores perdem receita por não terem produto recorrente.",
      "Clientes precisam de sistema, mas recebem apenas serviço.",
      "Falta painel centralizado para operar múltiplos clientes.",
      "Falta estrutura de demonstração para vender melhor.",
    ],
    silentLosses: [
      "Receita recorrente que nunca acontece.",
      "Cliente que sai por não ter ferramenta integrada.",
      "Tempo gasto refazendo apresentação manual.",
      "Concorrente que entrega tecnologia + serviço junto.",
    ],
    solution: [
      "Ambiente white label",
      "Marca própria",
      "Cadastro de empresas-cliente",
      "Ativação de módulos por SIM/NÃO",
      "Gestão de usuários e permissões",
      "Dashboard master",
      "Dashboard por cliente",
      "CRM, Agenda, WhatsApp, Pagamentos preparados",
      "Afiliados e fornecedores",
      "Relatórios e ambiente demo",
    ],
    journey: [
      { step: "Parceiro acessa o painel white label", detail: "Visão master de todas as empresas-cliente." },
      { step: "Cria uma empresa-cliente", detail: "Marca, nicho, módulos e regras." },
      { step: "Configura marca e módulos", detail: "Ativa só o que faz sentido para aquele cliente." },
      { step: "Cria usuários e permissões", detail: "Setores, papéis e níveis de acesso." },
      { step: "Libera demo", detail: "Cliente vê o sistema funcionando antes de assinar." },
      { step: "Acompanha resultados", detail: "Indicadores por cliente e consolidados." },
      { step: "Vende recorrência com a própria marca", detail: "Receita previsível, sem desenvolver do zero." },
    ],
    modules: ["crm", "agenda", "whatsapp", "pagamentos", "afiliados", "bi", "permissoes", "custom"],
    benefits: [
      "Nova receita recorrente",
      "Plataforma pronta",
      "Marca própria",
      "Menos custo de desenvolvimento",
      "Menos tempo de implantação",
      "Mais escala comercial",
      "Gestão centralizada",
      "Diferenciação no mercado",
      "Produto vendável para vários nichos",
    ],
    ctaPrimary: {
      label: "Quero vender com minha marca",
      whatsappMsg:
        "Olá, quero conhecer o modelo White Label da Impulsionando para oferecer a plataforma com a minha marca.",
    },
    ctaSecondary: { label: "Testar a experiência White Label", href: "/demo/white-label" },
    demoRoute: "/demo/white-label",
  },

  // ============================================================
  // 8. FITNESS (atalho, demo já existe em /showroom/fitness)
  // ============================================================
  {
    slug: "fitness",
    title: "Academias, boxes, estúdios e personais com agenda, planos, pagamento e relacionamento sob controle.",
    subtitle:
      "Da matrícula ao retorno do aluno, a operação fitness ganha automação, recorrência e dados reais.",
    shortLabel: "Fitness — Academias, CrossFit, Funcional, Personal",
    cardDesc:
      "Planos, agenda de aulas, pagamento recorrente, frequência, retenção e dashboard por unidade e professor.",
    icon: Dumbbell,
    pains: [
      "Aluno some sem ninguém perceber.",
      "Cobrança manual gera inadimplência.",
      "Reserva de aula sem regra clara.",
      "Falta de visão por unidade ou professor.",
      "Sem reativação dos alunos inativos.",
    ],
    silentLosses: [
      "Aluno que não treina há 3 semanas e ninguém ligou.",
      "Plano vencendo sem cobrança automática.",
      "Vagas de aula vazias por falta de reserva.",
      "Personal sem agenda integrada à academia.",
    ],
    solution: [
      "Planos e mensalidades",
      "Agenda de aulas com reserva e regra",
      "Pagamento recorrente",
      "Controle de frequência",
      "Alerta de inativos",
      "CRM com histórico",
      "WhatsApp 24h",
      "Dashboard por unidade, professor e turma",
    ],
    journey: [
      { step: "Aluno chega por anúncio ou indicação", detail: "Entra pelo WhatsApp ou site." },
      { step: "Sistema oferece plano + experimentação", detail: "Briefing rápido, sem dor." },
      { step: "Pagamento recorrente é configurado", detail: "Cartão ou Pix recorrente, com régua." },
      { step: "Aluno reserva aulas", detail: "Com regra de presença e cancelamento." },
      { step: "Frequência é monitorada", detail: "Alerta automático ao cair." },
      { step: "Inativo entra em reativação", detail: "Mensagem certa, no tempo certo." },
    ],
    modules: ["agenda", "crm", "whatsapp", "pagamentos", "afiliados", "bi", "permissoes"],
    benefits: [
      "Menos inadimplência",
      "Mais retenção",
      "Mais ocupação por aula",
      "Mais previsibilidade financeira",
      "Mais dados por unidade e professor",
    ],
    ctaPrimary: {
      label: "Quero a operação fitness automatizada",
      whatsappMsg:
        "Olá, sou de academia/box/estúdio/personal e quero conhecer a Impulsionando para planos, agenda, pagamento recorrente e retenção.",
    },
    ctaSecondary: { label: "Ver o Showroom Fitness", href: "/showroom/fitness" },
    demoRoute: "/showroom/fitness",
  },
];

export const findNicho = (slug: string) => NICHO_DETAILS.find((n) => n.slug === slug);
