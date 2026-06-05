import {
  Calendar,
  Bot,
  Users,
  Share2,
  Globe,
  CreditCard,
  FileText,
  ShieldCheck,
  BarChart3,
  Cog,
  Plug,
  Stethoscope,
} from "lucide-react";
import type { ModuleDetail } from "./ModuleDetailDialog";

const BADGES = {
  ativo: {
    label: "Ativo",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  },
  em_ativacao: {
    label: "Em ativação",
    className: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  },
  sob_consulta: {
    label: "Sob consulta",
    className: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  },
} as const;

export const MODULE_DETAILS: ModuleDetail[] = [
  {
    id: "agenda",
    title: "Agenda Online",
    icon: Calendar,
    desc: "Horários, profissionais, unidades, confirmação e pagamento.",
    badge: BADGES.ativo,
    hook: "Sua agenda lotando sozinha 24/7 — sem WhatsApp manual, sem furo de horário, sem secretária presa ao telefone.",
    forWho:
      "Clínicas, salões, estúdios, academias, consultórios e serviços que vendem tempo. Funciona para 1 profissional ou para múltiplas unidades e equipes.",
    benefits: [
      "Cliente agenda sozinho em segundos",
      "Lembretes automáticos (reduz falta em até 70%)",
      "Pagamento ou sinal no ato do agendamento",
      "Bloqueios, férias e regras por profissional",
      "Confirmação via WhatsApp",
      "Sem conflito de horários nem retrabalho",
    ],
    howItWorks: [
      {
        step: "Você configura serviços, profissionais e horários",
        detail: "Duração, preço, intervalo, sala/unidade, regras de cada um.",
      },
      {
        step: "O cliente acessa seu link e escolhe",
        detail:
          "Serviço → profissional → horário disponível em tempo real, sem ligar.",
      },
      {
        step: "Pagamento ou sinal opcional na hora",
        detail: "Pix, cartão ou link. Liberação automática do horário.",
      },
      {
        step: "Lembretes e confirmação automáticos",
        detail: "WhatsApp + e-mail 24h e 1h antes. Cliente confirma ou remarca.",
      },
      {
        step: "Pós-atendimento e reativação",
        detail:
          "Mensagens automáticas para recomprar, avaliar e voltar no tempo certo.",
      },
    ],
    examples: [
      "Estética: agenda 30 horários por dia em 4 cabines sem conflito.",
      "Personal trainer: vende pacote, paga no ato e cliente reserva sozinho.",
      "Clínica: pacientes confirmam pelo WhatsApp, taxa de falta cai pela metade.",
      "Salão: cada profissional tem regra própria, comissão e bloqueio.",
    ],
    features: [
      "Multi-unidade",
      "Multi-profissional",
      "Pix + cartão",
      "Bloqueios e folgas",
      "Avaliações",
      "Pacotes e créditos",
      "Notificações por WhatsApp",
      "Confirmação automática",
    ],
    integrations: [
      "Google Calendar",
      "WhatsApp Business",
      "Stripe/Pagar.me",
      "Mercado Pago",
      "Pix instantâneo",
    ],
    impact: [
      "Redução de até 70% em faltas (no-show)",
      "30% mais agendamentos por liberar o canal 24/7",
      "Equipe deixa de operar agenda no papel/planilha",
      "Aumento de ticket médio com upsell automático",
    ],
    ctaLabel: "Quero a agenda online",
    demoRoute: "/demo/cliente-final",
  },
  {
    id: "whatsapp",
    title: "Agente Virtual no WhatsApp",
    icon: Bot,
    desc: "Atendimento automatizado, triagem e qualificação.",
    badge: BADGES.em_ativacao,
    hook: "Um atendente que nunca dorme, nunca esquece e qualifica o lead antes da sua equipe gastar 1 minuto.",
    forWho:
      "Empresas que recebem muitas conversas e perdem leads por demora, ausência fora do horário ou triagem manual.",
    benefits: [
      "Responde em segundos, 24 horas por dia",
      "Qualifica e classifica o lead automaticamente",
      "Encaminha para o humano certo no momento certo",
      "Agenda, vende, cobra e faz follow-up sozinho",
      "Integração total com CRM e agenda",
      "Histórico unificado por cliente",
    ],
    howItWorks: [
      {
        step: "Mapeamos o fluxo de atendimento atual",
        detail:
          "Quais perguntas se repetem, onde leads esfriam, o que o humano realmente precisa fazer.",
      },
      {
        step: "Configuramos o agente com sua identidade",
        detail:
          "Tom de voz, regras, catálogo, horários, preços, FAQ e gatilhos.",
      },
      {
        step: "Agente atende, qualifica e direciona",
        detail:
          "Resolve sozinho o que pode, passa para humano só o que precisa.",
      },
      {
        step: "Toda conversa vira dado no CRM",
        detail:
          "Lead, etapa do funil, motivo, intenção e próximo passo automáticos.",
      },
      {
        step: "Recuperação automática de leads parados",
        detail:
          "Reativa quem sumiu, lembra carrinho, agenda retorno, fecha venda.",
      },
    ],
    examples: [
      "Restaurante: tira dúvidas do cardápio, faz pedido e envia para a cozinha.",
      "Clínica: agenda consulta sem humano nenhum no meio.",
      "E-commerce: recupera carrinho abandonado por WhatsApp.",
      "Serviço: qualifica orçamento, pede dados e marca visita técnica.",
    ],
    features: [
      "WhatsApp oficial (API Business)",
      "Multi-atendente",
      "IA com base no seu conteúdo",
      "Transferência inteligente",
      "Gatilhos e automações",
      "Tags e segmentação",
      "Templates aprovados",
    ],
    integrations: [
      "Meta/WhatsApp Business API",
      "CRM Impulsionando",
      "Agenda Online",
      "Pagamentos",
      "Planilhas/ERPs",
    ],
    impact: [
      "Tempo de primeira resposta para menos de 5 segundos",
      "3x a 5x mais leads qualificados sem aumentar equipe",
      "Redução drástica de leads perdidos por demora",
      "Equipe humana atende só conversa que vale dinheiro",
    ],
    ctaLabel: "Quero o agente no WhatsApp",
  },
  {
    id: "crm",
    title: "CRM e Automação",
    icon: Users,
    desc: "Jornada do lead, funil, follow-up e reativação.",
    badge: BADGES.ativo,
    hook: "Nenhum lead esquecido. Nenhum follow-up perdido. Pipeline previsível, com a equipe focada só no que fecha.",
    forWho:
      "Times comerciais, prestadores de serviço, agências e qualquer operação que dependa de relacionamento contínuo com o cliente.",
    benefits: [
      "Funil de vendas visual e claro",
      "Tarefas e follow-up automáticos",
      "Histórico completo por cliente",
      "Segmentação por tag, etapa e comportamento",
      "Automação de e-mail e WhatsApp",
      "Relatórios de conversão por etapa",
    ],
    howItWorks: [
      {
        step: "Desenhamos o seu funil real",
        detail:
          "Etapas, critérios de avanço, responsáveis e regras de qualificação.",
      },
      {
        step: "Lead entra automaticamente",
        detail:
          "De WhatsApp, site, anúncio, indicação, telefone ou cadastro manual.",
      },
      {
        step: "Sistema cria tarefas e lembretes",
        detail: "Equipe nunca esquece quem ligar, mandar proposta ou fechar.",
      },
      {
        step: "Automações cuidam do morno",
        detail:
          "Mensagens, cadências e nutrição enquanto o vendedor cuida do quente.",
      },
      {
        step: "Você vê o pipeline em tempo real",
        detail:
          "Quantos leads, qual etapa, taxa de conversão, tempo médio, gargalos.",
      },
    ],
    examples: [
      "Imobiliária: cada lead com etapa, visita, proposta e contrato.",
      "Clínica: pacientes recorrentes reativados a cada X meses.",
      "Serviço B2B: proposta enviada gera follow-up automático em D+3 e D+7.",
      "Indicação: parceiro indica e lead já entra com origem e comissão.",
    ],
    features: [
      "Funil Kanban",
      "Tarefas e lembretes",
      "E-mail e WhatsApp integrados",
      "Tags e segmentação",
      "Automação de cadência",
      "Permissões por usuário",
      "Relatórios de conversão",
    ],
    integrations: [
      "WhatsApp Business",
      "Agenda Online",
      "Sites e Landing Pages",
      "Pagamentos",
      "E-mail",
    ],
    impact: [
      "Taxa de conversão sobe sem aumentar volume de leads",
      "Equipe foca onde tem real chance de fechar",
      "Previsibilidade de receita com pipeline real",
      "Reativação gera 10–30% de venda adicional sem custo novo",
    ],
    ctaLabel: "Quero o CRM",
    demoRoute: "/demo/cliente-final",
  },
  {
    id: "afiliados",
    title: "Afiliados e Parceiros",
    icon: Share2,
    desc: "Links, rastreamento, comissões e painéis.",
    badge: BADGES.em_ativacao,
    hook: "Transforme clientes, influenciadores e parceiros em uma força de venda escalável — com tudo rastreado e comissionado automaticamente.",
    forWho:
      "Negócios que querem crescer por indicação, parceria, afiliação ou clube de embaixadores, com regras claras e auditáveis.",
    benefits: [
      "Cada parceiro tem link e painel próprios",
      "Comissão calculada automaticamente",
      "Rastreio confiável de origem do lead/venda",
      "Materiais e treinamentos centralizados",
      "Saques e relatórios transparentes",
      "Multinível opcional (1, 2 ou 3 níveis)",
    ],
    howItWorks: [
      {
        step: "Você define as regras de comissão",
        detail:
          "Por produto, por categoria, recorrente, fixa ou percentual, com prazos.",
      },
      {
        step: "Parceiro se cadastra e recebe link único",
        detail:
          "UTM, cookie e ID embutidos para rastreamento mesmo sem login.",
      },
      {
        step: "Venda acontece e é atribuída",
        detail:
          "Sistema reconhece a origem e calcula comissão com regra do plano.",
      },
      {
        step: "Painel mostra cliques, leads, vendas e ganhos",
        detail:
          "Parceiro acompanha em tempo real. Você audita tudo do admin.",
      },
      {
        step: "Pagamento automático ou em lote",
        detail:
          "Pix, transferência ou crédito interno. Comprovantes e histórico salvos.",
      },
    ],
    examples: [
      "Curso online: alunos viram afiliados e divulgam por link próprio.",
      "Clínica: médicos parceiros indicam e recebem por consulta gerada.",
      "Software: revendas com comissão recorrente mensal.",
      "Embaixador: cliente fiel ganha desconto a cada indicação fechada.",
    ],
    features: [
      "Links rastreáveis",
      "Cupom + link",
      "Comissão fixa ou %",
      "Comissão recorrente",
      "Multinível",
      "Painel do parceiro",
      "Saques Pix",
    ],
    integrations: ["Pagamentos", "CRM", "Sites/LPs", "WhatsApp", "Pix"],
    impact: [
      "Custo de aquisição cai (paga só pela venda gerada)",
      "Base de parceiros multiplica alcance sem mídia paga",
      "Recorrência fideliza embaixadores",
      "Crescimento previsível e escalável",
    ],
    ctaLabel: "Quero o programa de afiliados",
  },
  {
    id: "sites",
    title: "Sites e Landing Pages",
    icon: Globe,
    desc: "Páginas de conversão integradas a CRM e tráfego pago.",
    badge: BADGES.sob_consulta,
    hook: "Páginas feitas para converter — não só para serem bonitas. Integradas a CRM, WhatsApp, pagamento e tráfego pago desde o primeiro clique.",
    forWho:
      "Marcas, profissionais e empresas que dependem de site/LP para vender, captar lead, agendar ou rodar campanha de tráfego.",
    benefits: [
      "Performance e SEO de verdade",
      "Lead entra direto no CRM com origem",
      "Pixel, Tag Manager e analytics prontos",
      "Versões A/B e formulários inteligentes",
      "Pronto para Meta Ads e Google Ads",
      "Velocidade mobile no nível certo",
    ],
    howItWorks: [
      {
        step: "Briefing de objetivo e oferta",
        detail:
          "Quem é o público, o que vende, qual ação esperada (lead, agendamento, venda).",
      },
      {
        step: "Estrutura de conversão",
        detail:
          "Headline, prova social, oferta, objeção, garantia, CTA — tudo pensado.",
      },
      {
        step: "Design, copy e desenvolvimento",
        detail:
          "Identidade visual + texto persuasivo + código rápido e responsivo.",
      },
      {
        step: "Integração com CRM, WhatsApp e Pixel",
        detail:
          "Cada lead vira oportunidade rastreada. Conversão volta para a campanha.",
      },
      {
        step: "Publicação, A/B e otimização",
        detail:
          "Mede, ajusta, melhora taxa. Páginas evoluem com dado real.",
      },
    ],
    examples: [
      "LP de captura para Meta Ads com formulário no WhatsApp.",
      "Site institucional com agenda integrada.",
      "Página de vendas com checkout próprio e Pix.",
      "Hub de links para influenciador/profissional.",
    ],
    features: [
      "SEO técnico",
      "Mobile-first",
      "Formulário smart",
      "A/B test",
      "Pixel Meta + GTM",
      "Cookie/LGPD",
      "Painel próprio",
    ],
    integrations: [
      "Meta Ads",
      "Google Ads",
      "GA4",
      "WhatsApp",
      "CRM",
      "Pagamentos",
    ],
    impact: [
      "Custo por lead cai com página feita para converter",
      "Pixel rico melhora otimização da campanha",
      "Tempo de carregamento abaixo de 2s",
      "Conversão mensurável e auditável",
    ],
    ctaLabel: "Quero meu site/LP de alta conversão",
  },
  {
    id: "pagamentos",
    title: "Pagamentos e Baixa Automática",
    icon: CreditCard,
    desc: "Pix, cartão, link, confirmação e liberação automática.",
    badge: BADGES.em_ativacao,
    hook: "Receba antes, sem cobrar manualmente, sem conferir extrato — com baixa automática e liberação na hora.",
    forWho:
      "Qualquer negócio que cobra: serviço, agenda, infoproduto, mensalidade, parcela, pacote ou ticket.",
    benefits: [
      "Pix, cartão, boleto e link em um só painel",
      "Baixa automática (sem conferir extrato)",
      "Liberação automática do produto/serviço",
      "Cobrança recorrente para assinaturas",
      "Régua de inadimplência automática",
      "Conciliação com o financeiro",
    ],
    howItWorks: [
      {
        step: "Você cadastra produtos/preços",
        detail:
          "Avulso, recorrente, parcelado, com ou sem entrada, com taxas configuráveis.",
      },
      {
        step: "Cliente paga onde for mais fácil",
        detail:
          "Link, agenda, checkout próprio, WhatsApp, e-mail ou QR Code Pix.",
      },
      {
        step: "Sistema confirma o pagamento em segundos",
        detail:
          "Webhook do gateway → baixa automática → libera produto/serviço.",
      },
      {
        step: "Cliente inadimplente entra na régua",
        detail:
          "Lembrete D-3, D+1, D+3, D+7 com tom progressivo, sem ligar manualmente.",
      },
      {
        step: "Financeiro recebe tudo conciliado",
        detail:
          "Relatório por dia, por método, por vendedor, por unidade e por taxa.",
      },
    ],
    examples: [
      "Mensalidade de academia com Pix recorrente.",
      "Sinal de 30% no agendamento, restante na hora do serviço.",
      "Infoproduto com liberação imediata após pagamento.",
      "Cobrança automática de turma/curso parcelado.",
    ],
    features: [
      "Pix copia-e-cola",
      "Cartão 1x a 12x",
      "Recorrência",
      "Split de pagamento",
      "Régua de inadimplência",
      "Webhook próprio",
      "Multi-conta",
    ],
    integrations: [
      "Stripe",
      "Pagar.me",
      "Mercado Pago",
      "Asaas",
      "Pix direto (banco)",
    ],
    impact: [
      "Inadimplência cai com régua e Pix",
      "Recebimento antecipado vira fluxo de caixa",
      "Equipe deixa de cobrar manualmente",
      "Conciliação financeira leva minutos, não dias",
    ],
    ctaLabel: "Quero receber automatizado",
  },
  {
    id: "fiscal",
    title: "Emissão Fiscal",
    icon: FileText,
    desc: "Nota fiscal automática ou semi-automática conforme regras.",
    badge: BADGES.em_ativacao,
    hook: "Cada venda já sai com nota — sem você abrir o emissor da prefeitura, sem retrabalho, sem erro de CNAE.",
    forWho:
      "MEI, ME, EPP e empresas de serviço/produto que emitem NFS-e ou NF-e e querem deixar de fazer isso na mão.",
    benefits: [
      "Emissão automática após cada venda",
      "Conformidade com a regra fiscal correta",
      "Reenvio e correção facilitados",
      "Histórico organizado por cliente e período",
      "Integração com financeiro e pagamentos",
      "Suporte para múltiplos municípios",
    ],
    howItWorks: [
      {
        step: "Configuramos sua emissão",
        detail:
          "Certificado digital, dados da empresa, alíquotas, CNAE, CFOP, série.",
      },
      {
        step: "Mapeamos os gatilhos de emissão",
        detail:
          "Venda paga, agendamento concluído, fechamento de pacote, manual.",
      },
      {
        step: "Sistema emite e arquiva",
        detail:
          "NFS-e/NF-e gerada, PDF + XML salvos, link enviado ao cliente.",
      },
      {
        step: "Erros tratados sem dor",
        detail: "Retry automático, alerta e correção em poucos cliques.",
      },
      {
        step: "Relatório fiscal pronto para o contador",
        detail: "Exportação consolidada do mês, sem planilha avulsa.",
      },
    ],
    examples: [
      "Clínica que emite NFS-e a cada consulta paga.",
      "E-commerce que emite NF-e por pedido aprovado.",
      "Curso/Infoproduto com NFS-e por matrícula.",
      "Serviço B2B com nota mensal recorrente.",
    ],
    features: [
      "NFS-e (municipal)",
      "NF-e (estadual)",
      "Recibos",
      "Certificado A1",
      "Reenvio automático",
      "PDF + XML",
      "Histórico por cliente",
    ],
    integrations: [
      "Plugnotas",
      "Focus NFE",
      "eNotas",
      "Prefeituras suportadas",
      "Financeiro Impulsionando",
    ],
    impact: [
      "Equipe deixa de emitir nota manual",
      "Conformidade fiscal sem esquecimento",
      "Cliente recebe nota na hora (mais profissional)",
      "Contador recebe tudo pronto, fim de mês simples",
    ],
    ctaLabel: "Quero emissão automática",
  },
  {
    id: "permissoes",
    title: "Usuários e Permissões",
    icon: ShieldCheck,
    desc: "Perfis, setores, unidades e auditoria.",
    badge: BADGES.ativo,
    hook: "Cada pessoa enxergando exatamente o que precisa — nem mais, nem menos. Com auditoria completa.",
    forWho:
      "Empresas com mais de uma pessoa operando, com múltiplas unidades, setores ou níveis hierárquicos.",
    benefits: [
      "Perfis e papéis configuráveis",
      "Acesso por unidade, setor ou time",
      "Visibilidade granular por módulo e ação",
      "Auditoria completa (quem fez o quê e quando)",
      "Convite, bloqueio e troca de senha rápidos",
      "Login social opcional (Google)",
    ],
    howItWorks: [
      {
        step: "Definimos a estrutura organizacional",
        detail: "Empresa → unidades → setores → equipes → usuários.",
      },
      {
        step: "Criamos os perfis de acesso",
        detail:
          "Admin, gerente, atendente, financeiro, vendedor, parceiro, leitor.",
      },
      {
        step: "Cada perfil ganha permissões reais",
        detail:
          "O que vê, edita, exclui e exporta em cada módulo do sistema.",
      },
      {
        step: "Usuários convidados por e-mail",
        detail:
          "Onboarding guiado, senha forte, MFA opcional, login Google.",
      },
      {
        step: "Auditoria registra cada ação",
        detail:
          "Log com usuário, IP, dispositivo, módulo, registro e horário.",
      },
    ],
    examples: [
      "Atendente só vê agenda e cliente, não vê financeiro.",
      "Gerente de unidade só enxerga sua unidade.",
      "Contador acessa só relatórios fiscais.",
      "Vendedor só vê seus leads e suas comissões.",
    ],
    features: [
      "RBAC (papéis e permissões)",
      "Multi-unidade",
      "Multi-empresa",
      "Auditoria",
      "Login Google",
      "MFA opcional",
      "Sessões",
    ],
    integrations: ["Google OAuth", "SSO/SAML sob consulta"],
    impact: [
      "Segurança real (cada um vê só o que pode)",
      "Conformidade com LGPD facilitada",
      "Onboarding de novo colaborador em minutos",
      "Rastreabilidade de qualquer alteração",
    ],
    ctaLabel: "Quero controle de acessos",
  },
  {
    id: "bi",
    title: "Relatórios e BI",
    icon: BarChart3,
    desc: "Indicadores comerciais, financeiros e operacionais.",
    badge: BADGES.ativo,
    hook: "Pare de adivinhar. Veja receita, conversão, ticket, recompra, operação e produtividade em tempo real, num só lugar.",
    forWho:
      "Gestores que precisam decidir com dado e não com achismo. Operações que perdem dinheiro por não enxergar o gargalo.",
    benefits: [
      "Painel executivo único",
      "KPIs comerciais, financeiros e operacionais",
      "Filtros por unidade, período, equipe, produto",
      "Comparativos e tendências automáticas",
      "Exportação para Excel/PDF",
      "Alertas de queda ou anomalia",
    ],
    howItWorks: [
      {
        step: "Mapeamos quais decisões você precisa tomar",
        detail:
          "BI não é gráfico bonito — é responder pergunta certa, no tempo certo.",
      },
      {
        step: "Definimos os KPIs reais do negócio",
        detail:
          "Receita, ticket, conversão, CAC, LTV, recompra, ocupação, no-show.",
      },
      {
        step: "Conectamos as fontes",
        detail:
          "Vendas, CRM, agenda, pagamentos, fiscal, custos, equipe e canais.",
      },
      {
        step: "Você acessa o painel ao vivo",
        detail:
          "Web e mobile, com permissão por usuário e exportação fácil.",
      },
      {
        step: "Alertas e relatórios automáticos",
        detail:
          "Recebe por e-mail/WhatsApp quando algo sai do padrão esperado.",
      },
    ],
    examples: [
      "Diretor vê faturamento por unidade comparado a mês passado.",
      "Gerente vê profissional com pior taxa de no-show.",
      "Comercial vê funil real, etapa por etapa, em tempo real.",
      "Financeiro vê inadimplência e previsão de caixa.",
    ],
    features: [
      "Dashboards prontos",
      "Filtros dinâmicos",
      "Multi-unidade",
      "Mobile",
      "Exportação Excel/PDF",
      "Alertas",
      "Permissão por usuário",
    ],
    integrations: [
      "Todos os módulos Impulsionando",
      "Planilhas Google",
      "BigQuery (sob consulta)",
    ],
    impact: [
      "Decisão em horas, não em semanas",
      "Detecta gargalo antes de virar prejuízo",
      "Equipe deixa de montar relatório manual",
      "Reuniões mais curtas, mais objetivas",
    ],
    ctaLabel: "Quero ver tudo num painel",
    demoRoute: "/demo/cliente-final",
  },
  {
    id: "custom",
    title: "Sistemas Personalizados",
    icon: Cog,
    desc: "Soluções sob medida com regras próprias do negócio.",
    badge: BADGES.sob_consulta,
    hook: "Quando o sistema pronto não cabe, a gente desenha o seu — exatamente como seu negócio funciona, sem gambiarra e sem 'adapta aí'.",
    forWho:
      "Operações com regra própria, processo único, integração específica ou necessidade que nenhum SaaS pronto atende bem.",
    benefits: [
      "Sistema 100% colado no seu processo",
      "Regras de negócio reais, não compromissos",
      "Pode usar módulos prontos como base",
      "Você é dono da solução",
      "Evolução contínua junto da operação",
      "Documentação e treinamento incluídos",
    ],
    howItWorks: [
      {
        step: "Diagnóstico do processo atual",
        detail:
          "Mapeamos pessoas, sistemas, planilhas, gargalos e oportunidades.",
      },
      {
        step: "Desenho da solução",
        detail:
          "Telas, fluxos, regras, perfis, integrações e indicadores combinados.",
      },
      {
        step: "Entrega em sprints curtos",
        detail:
          "Você vê valor a cada 1–2 semanas, ajusta enquanto está sendo feito.",
      },
      {
        step: "Treinamento e adoção",
        detail:
          "Time aprende a usar com material próprio, com suporte ativo.",
      },
      {
        step: "Evolução e novas funções",
        detail:
          "Roadmap contínuo conforme o negócio cresce e muda.",
      },
    ],
    examples: [
      "ERP simplificado para operação específica.",
      "Painel logístico com regras próprias de roteirização.",
      "Sistema interno para gestão de contratos e SLA.",
      "Plataforma de marketplace ou comunidade.",
    ],
    features: [
      "Web responsivo",
      "Mobile opcional",
      "Banco próprio",
      "API/Webhook",
      "Integrações sob medida",
      "Painel admin",
      "Multi-tenant opcional",
    ],
    integrations: ["Qualquer sistema com API ou banco acessível"],
    impact: [
      "Operação roda no sistema, sistema não impede a operação",
      "Fim das planilhas paralelas",
      "Vantagem competitiva real e defensável",
      "Escalável sem refazer tudo do zero",
    ],
    ctaLabel: "Quero conversar sobre meu projeto",
  },
  {
    id: "integracoes",
    title: "Integrações",
    icon: Plug,
    desc: "APIs, webhooks, gateways, WhatsApp, ERPs e mais.",
    badge: BADGES.em_ativacao,
    hook: "Tudo conversa com tudo. Não existe mais limite real para o que pode ser conectado, automatizado e orquestrado.",
    forWho:
      "Empresas que já têm sistemas, ERPs, planilhas, gateways ou ferramentas e precisam que tudo funcione como um único organismo.",
    benefits: [
      "Conecta ferramentas que hoje vivem isoladas",
      "Automatiza tarefa repetitiva entre sistemas",
      "Reduz erro humano de copiar/colar",
      "Cria fluxos novos que antes não existiam",
      "Mantém o dado único e atualizado",
      "Permite migrar sem trauma",
    ],
    howItWorks: [
      {
        step: "Mapeamos os sistemas e os pontos de dor",
        detail:
          "Onde está o dado, quem precisa dele, qual atraso ou retrabalho gera.",
      },
      {
        step: "Definimos os fluxos",
        detail:
          "Quando algo acontece em A, o que precisa acontecer em B e C.",
      },
      {
        step: "Construímos a integração",
        detail:
          "Via API oficial, webhook, automação ou conector próprio.",
      },
      {
        step: "Monitoramos com logs e alertas",
        detail:
          "Se uma integração falha, você é avisado antes de virar problema.",
      },
      {
        step: "Evolução conforme novos sistemas entram",
        detail: "Cada novo sistema só precisa se conectar ao hub central.",
      },
    ],
    examples: [
      "Venda no e-commerce → estoque no ERP → nota fiscal → CRM.",
      "Lead no WhatsApp → CRM → SMS → pagamento → produto liberado.",
      "Atendimento finalizado → pesquisa NPS → tag no CRM.",
      "ERP financeiro recebe automaticamente as vendas do app.",
    ],
    features: [
      "REST API",
      "Webhooks",
      "OAuth",
      "Filas e retry",
      "Logs auditáveis",
      "Mapeamento de campos",
      "Multi-ambiente",
    ],
    integrations: [
      "WhatsApp Business",
      "Stripe / Pagar.me / Mercado Pago / Asaas",
      "Google (Calendar, Sheets, OAuth, Ads)",
      "Meta (Pixel, Ads)",
      "ERPs (Bling, Tiny, Omie e outros sob consulta)",
      "Zapier / Make / n8n",
    ],
    impact: [
      "Operação deixa de depender de copiar/colar",
      "Dado consistente em todos os lugares",
      "Tempo de processo cai drasticamente",
      "Novas oportunidades de automação ficam óbvias",
    ],
    ctaLabel: "Quero integrar tudo",
  },
];
