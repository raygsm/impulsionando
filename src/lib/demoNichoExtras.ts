/**
 * Datasets compactos para as demos ricas dos nichos saúde, bar, imobiliária,
 * comércio, serviços e comunidade. Renderizados por NichoDemoRich.
 */
export type RichNiche =
  | "saude" | "bar" | "imobiliaria" | "comercio" | "servicos" | "comunidade";

export const RICH_NICHES: RichNiche[] = ["saude", "bar", "imobiliaria", "comercio", "servicos", "comunidade"];

export interface RichKpi { label: string; value: string; sub?: string }
export interface RichTab {
  id: string;
  label: string;
  headline: string;
  description: string;
  kind: "table" | "cards" | "timeline" | "metrics";
  // table
  columns?: string[];
  rows?: (string | number)[][];
  // cards
  cards?: { title: string; meta?: string; body: string; tag?: string }[];
  // timeline
  steps?: { title: string; body: string; meta?: string }[];
  // metrics
  metrics?: RichKpi[];
}

export interface RichNicheConfig {
  niche: RichNiche;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  kpis: RichKpi[];
  tabs: RichTab[];
  ctaPrimary: { label: string; to: string };
  ctaSecondary: { label: string; to: string };
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ============================================================
// SAÚDE — clínicas e consultórios
// ============================================================
const saude: RichNicheConfig = {
  niche: "saude",
  heroEyebrow: "Demo — Clínicas & Saúde",
  heroTitle: "Agenda inteligente, prontuário e fluxo completo do paciente",
  heroSubtitle:
    "Da captação do lead à alta médica: agendamento online, prontuário eletrônico, retornos automáticos, comunicação WhatsApp+e-mail e BI por profissional.",
  kpis: [
    { label: "Pacientes ativos", value: "1.284" },
    { label: "Atendimentos/mês", value: "682" },
    { label: "Receita mensal", value: fmtBRL(218_400) },
    { label: "Taxa de retorno", value: "73%" },
  ],
  tabs: [
    {
      id: "agenda",
      label: "Agenda",
      headline: "Agenda multi-profissional",
      description: "Bloqueios automáticos, sala compartilhada, telemedicina e fila de espera.",
      kind: "cards",
      cards: [
        { title: "Dra. Helena Krause — Cardiologia", meta: "Hoje 14:00 → 18:00", body: "8 consultas (6 retornos, 2 primeira vez). 1 horário livre 16:30.", tag: "Presencial" },
        { title: "Dr. Bruno Sax — Endocrinologia", meta: "Hoje 09:00 → 12:00", body: "5 telemedicinas, 2 presenciais. Sala 3 ocupada até 11:30.", tag: "Teleconsulta" },
        { title: "Dra. Lia Nascimento — Pediatria", meta: "Amanhã 08:00 → 13:00", body: "Agenda lotada, 4 na lista de espera para encaixe.", tag: "Lotada" },
      ],
    },
    {
      id: "pacientes",
      label: "Pacientes",
      headline: "Prontuário eletrônico com histórico completo",
      description: "Anamnese, evolução, exames, prescrição e atestado em um único timeline.",
      kind: "table",
      columns: ["Paciente", "Última consulta", "Próximo retorno", "Convênio", "Status"],
      rows: [
        ["Mariana Costa", "12/06/2026 — Cardiologia", "12/09/2026", "Bradesco Saúde", "Em acompanhamento"],
        ["Carlos Eduardo", "08/06/2026 — Endocrino", "08/12/2026", "Particular", "Alta clínica"],
        ["Família Andrade (3)", "02/06/2026 — Pediatria", "02/07/2026", "Amil", "Vacinas pendentes"],
        ["Roberto Silva", "28/05/2026 — Clínica geral", "Sem retorno", "SulAmérica", "Encaminhado"],
      ],
    },
    {
      id: "fluxos",
      label: "Comunicação",
      headline: "WhatsApp + e-mail em todos os pontos",
      description: "Confirmação, lembrete 24h e 2h antes, pós-consulta e convite para retorno.",
      kind: "timeline",
      steps: [
        { title: "Agendamento criado", body: "Confirmação imediata via WhatsApp e e-mail com link do mapa e do prontuário online.", meta: "D-7" },
        { title: "Lembrete 24h", body: "Mensagem com botão 'Confirmar / Reagendar / Cancelar'. Não respondidos viram alerta na recepção.", meta: "D-1" },
        { title: "Pós-consulta", body: "Envio de prescrição em PDF + pesquisa NPS. Resposta entra no BI do profissional.", meta: "D+0" },
        { title: "Convite de retorno", body: "Quando o protocolo prevê retorno (ex: 90 dias cardio), o paciente recebe link direto para reagendar.", meta: "D+90" },
      ],
    },
    {
      id: "bi",
      label: "Resultado",
      headline: "BI por profissional, convênio e procedimento",
      description: "Receita, ocupação, taxa de no-show, ticket médio e ranking de procedimentos.",
      kind: "metrics",
      metrics: [
        { label: "Ocupação média", value: "82%", sub: "+6pp vs. mês anterior" },
        { label: "Ticket médio", value: fmtBRL(320), sub: "Particular: R$ 480 · Convênio: R$ 180" },
        { label: "No-show", value: "4,1%", sub: "−2,3pp após lembretes 24h" },
        { label: "NPS médio", value: "78", sub: "Top: Dra. Helena (NPS 91)" },
      ],
    },
  ],
  ctaPrimary: { label: "Quero implantar na minha clínica", to: "/orcamento" },
  ctaSecondary: { label: "Falar com um especialista", to: "/contato" },
};

// ============================================================
// BAR / RESTAURANTE
// ============================================================
const bar: RichNicheConfig = {
  niche: "bar",
  heroEyebrow: "Demo — Bares & Restaurantes",
  heroTitle: "Comanda, cardápio digital, fidelidade e operação de salão",
  heroSubtitle:
    "Comanda em tempo real, KDS na cozinha, cardápio QR Code, programa de fidelidade e BI de mesa, garçom e produto.",
  kpis: [
    { label: "Mesas ativas agora", value: "18 / 22" },
    { label: "Ticket médio", value: fmtBRL(94) },
    { label: "Faturamento do dia", value: fmtBRL(7_840) },
    { label: "Clientes recorrentes", value: "61%" },
  ],
  tabs: [
    {
      id: "salao",
      label: "Salão",
      headline: "Mapa do salão em tempo real",
      description: "Status de cada mesa, garçom responsável e tempo de permanência.",
      kind: "cards",
      cards: [
        { title: "Mesa 7 · 4 pessoas", meta: "Garçom: Diego · 42min", body: "Comanda aberta R$ 312,00. 2 chopes pendentes na cozinha.", tag: "Comendo" },
        { title: "Mesa 12 · 2 pessoas", meta: "Garçom: Bianca · 12min", body: "Aguardando entrada. Pedido aceito no KDS.", tag: "Aguardando" },
        { title: "Mesa 3 · 6 pessoas", meta: "Garçom: Diego · 1h18", body: "Pediu a conta. Dividida em 6, taxa de serviço 10%.", tag: "Fechando" },
      ],
    },
    {
      id: "cardapio",
      label: "Cardápio digital",
      headline: "QR Code, fotos, esgotados em tempo real",
      description: "Cliente pede direto pelo celular; cozinha bloqueia itens em falta sem precisar atualizar nada.",
      kind: "table",
      columns: ["Item", "Categoria", "Preço", "Vendidos hoje", "Status"],
      rows: [
        ["Hambúrguer da Casa", "Pratos", fmtBRL(48), 23, "Ativo"],
        ["Chope Pilsen 300ml", "Bebidas", fmtBRL(14), 71, "Ativo"],
        ["Costela ao bafo", "Pratos", fmtBRL(89), 8, "Esgotado às 21:40"],
        ["Petit gateau", "Sobremesas", fmtBRL(26), 12, "Ativo"],
      ],
    },
    {
      id: "fidelidade",
      label: "Fidelidade",
      headline: "Clube de pontos + cashback automático",
      description: "Pontuação por consumo, resgate na própria comanda e campanhas por aniversário.",
      kind: "timeline",
      steps: [
        { title: "Cliente abre comanda", body: "Identificação automática por CPF ou WhatsApp. Sistema reconhece histórico e preferências.", meta: "0min" },
        { title: "Sugere upsell personalizado", body: "Se cliente costuma pedir chope, app sugere combo 3 chopes + porção com 15% off.", meta: "5min" },
        { title: "Acumula pontos", body: "Cada R$ 1 = 1 ponto. R$ 200 acumulados = R$ 20 de cashback automático na próxima visita.", meta: "Fim da comanda" },
        { title: "Reativação", body: "Cliente sumiu há 45 dias? Régua dispara WhatsApp com voucher R$ 30 válido por 7 dias.", meta: "D+45" },
      ],
    },
    {
      id: "bi",
      label: "Resultado",
      headline: "BI de produto, garçom e horário",
      description: "Top produtos, mesa mais lucrativa, garçom com maior ticket médio.",
      kind: "metrics",
      metrics: [
        { label: "Top garçom", value: "Diego — R$ 1.840 / noite", sub: "+18% acima da média" },
        { label: "Margem média", value: "63%", sub: "Bebidas 78% · Pratos 52%" },
        { label: "Pico do dia", value: "21:00–23:00", sub: "62% do faturamento" },
        { label: "Taxa de retorno 30d", value: "47%", sub: "Meta da casa: 50%" },
      ],
    },
  ],
  ctaPrimary: { label: "Quero levar isto para meu bar", to: "/orcamento" },
  ctaSecondary: { label: "Ver demo de delivery", to: "/demo/checkout" },
};

// ============================================================
// IMOBILIÁRIA
// ============================================================
const imobiliaria: RichNicheConfig = {
  niche: "imobiliaria",
  heroEyebrow: "Demo — Imobiliárias",
  heroTitle: "Plataforma imobiliária inteligente: site + CRM + IA + app do corretor",
  heroSubtitle:
    "Lead chega do portal → distribuição automática → SLA de 15min → corretor responde por voz → pré-cadastro de imóveis por áudio → aprovação interna → publicação no site e portais.",
  kpis: [
    { label: "Imóveis ativos", value: "412" },
    { label: "Leads/mês", value: "830" },
    { label: "Visitas semanais", value: "94" },
    { label: "VGV em pipeline", value: fmtBRL(38_400_000) },
  ],
  tabs: [
    {
      id: "imoveis",
      label: "Imóveis",
      headline: "Carteira com aprovação interna e proteção de endereço",
      description: "Pré-cadastro por voz, fluxo de aprovação, autorização do proprietário e publicação seletiva por canal.",
      kind: "table",
      columns: ["Ref.", "Imóvel", "Operação", "Valor", "Bairro", "Status"],
      rows: [
        ["GAR-FLM-203", "Apartamento 3qts — vista Aterro", "Venda", fmtBRL(1_800_000), "Flamengo/RJ", "Ativo · 12 leads"],
        ["GAR-BOT-118", "Apartamento 2qts mobiliado", "Locação", fmtBRL(4_500) + "/mês", "Botafogo/RJ", "Ativo · 7 leads"],
        ["GAR-BRR-044", "Casa 4qts c/ piscina", "Venda", fmtBRL(3_200_000), "Barra/RJ", "Ativo · 4 leads"],
        ["GAR-CAT-302", "Cobertura duplex", "Venda", fmtBRL(2_650_000), "Catete/RJ", "Pendente aprovação"],
      ],
    },
    {
      id: "leads",
      label: "Leads & SLA",
      headline: "Distribuição automática com SLA de 15min",
      description: "Push imediato no app do corretor, escalonamento ao gerente se SLA estourar e mensagens prontas por contexto.",
      kind: "cards",
      cards: [
        { title: "Mariana Costa", meta: "Viva Real · há 4min", body: "Interesse em GAR-BOT-118. Corretor Diego notificado. SLA: 11min restantes.", tag: "Quente" },
        { title: "Carlos Eduardo", meta: "Zap · há 1h12", body: "Pediu visita ao GAR-FLM-203. Visita confirmada para sábado 14h.", tag: "Visita marcada" },
        { title: "Família Andrade", meta: "Site · há 2 dias", body: "Visitou GAR-BRR-044. Parecer: gostou, achou condomínio alto. Sistema sugeriu 3 alternativas.", tag: "Pós-visita" },
      ],
    },
    {
      id: "corretor",
      label: "App do corretor",
      headline: "Operação por voz — corretor não digita CRM",
      description: "Pré-cadastro de imóveis por áudio, parecer de visita por voz, IA interpreta e estrutura.",
      kind: "timeline",
      steps: [
        { title: "Lead chega", body: "Push: 'Novo lead Viva Real — apartamento 2qts no Flamengo até R$5k. SLA 15min.' Botão grande: Atender.", meta: "0min" },
        { title: "Mensagem pronta", body: "Sistema sugere texto personalizado com nome do cliente, imóvel e referência. Corretor aprova e envia pelo WhatsApp.", meta: "+2min" },
        { title: "Visita agendada", body: "Por voz: 'Marcar visita sábado às 10h, imóvel Flamengo 203.' Confirmação WhatsApp+e-mail para cliente e proprietário.", meta: "+1h" },
        { title: "Parecer pós-visita", body: "Áudio: 'Gostou, mas achou condomínio alto. Quer ver opções em Botafogo até R$1,4M.' Sistema cria perfil e sugere 3 imóveis aderentes.", meta: "Pós-visita" },
      ],
    },
    {
      id: "bi",
      label: "Resultado",
      headline: "Funil completo com gargalo identificado",
      description: "Onde a equipe está perdendo: lead → visita → proposta → fechamento.",
      kind: "metrics",
      metrics: [
        { label: "Taxa lead → visita", value: "22%", sub: "Meta 30% · gargalo SLA" },
        { label: "Visita → proposta", value: "41%", sub: "Top corretor: 68%" },
        { label: "VGV fechado/mês", value: fmtBRL(4_120_000), sub: "+12% vs. trimestre" },
        { label: "Tempo médio fechamento", value: "38 dias", sub: "Locação: 9 dias · Venda: 54 dias" },
      ],
    },
  ],
  ctaPrimary: { label: "Quero esta plataforma na minha imobiliária", to: "/orcamento" },
  ctaSecondary: { label: "Ver carteira da Garrido (cliente real)", to: "/" },
};

// ============================================================
// COMÉRCIO / VAREJO
// ============================================================
const comercio: RichNicheConfig = {
  niche: "comercio",
  heroEyebrow: "Demo — E-commerce & Varejo",
  heroTitle: "PDV, estoque, e-commerce e fidelidade num único painel",
  heroSubtitle:
    "Vendas balcão, loja online, integração com marketplaces, estoque sincronizado em tempo real, fidelidade e BI por categoria.",
  kpis: [
    { label: "Vendas hoje", value: fmtBRL(12_840) },
    { label: "Pedidos online", value: "47" },
    { label: "SKUs ativos", value: "1.842" },
    { label: "Margem média", value: "38%" },
  ],
  tabs: [
    {
      id: "pdv",
      label: "PDV & Loja online",
      headline: "Mesmo estoque, mesmo cliente, dois canais",
      description: "Vendeu no balcão? Baixou no online. Estoque, preço e promoção sincronizados.",
      kind: "table",
      columns: ["Produto", "SKU", "Estoque", "Preço", "Vendas 7d"],
      rows: [
        ["Camiseta Premium Preta P", "CAM-PRE-P", "23 un", fmtBRL(89), "41 un"],
        ["Tênis Runner 41", "TEN-RUN-41", "4 un", fmtBRL(349), "12 un (estoque baixo)"],
        ["Kit meia esportiva 3p", "MEI-ESP-3P", "112 un", fmtBRL(59), "89 un"],
        ["Mochila Trail 22L", "MOC-TRA-22", "0 un", fmtBRL(259), "Esgotado — reposição em 5 dias"],
      ],
    },
    {
      id: "fidelidade",
      label: "Fidelidade",
      headline: "Cashback automático + cupom por comportamento",
      description: "Cliente que parou de comprar há 60 dias recebe cupom; aniversariante recebe brinde.",
      kind: "cards",
      cards: [
        { title: "Top cliente", meta: "Mariana C. · 14 compras", body: "Ticket médio R$ 280. Recebeu cupom VIP 20% off na próxima compra acima de R$ 400.", tag: "VIP" },
        { title: "Reativação", meta: "Carlos E. · 72 dias sem comprar", body: "Régua disparou cupom R$ 30 + frete grátis. Validade 7 dias.", tag: "Win-back" },
        { title: "Aniversariante", meta: "Família Andrade · esta semana", body: "Voucher de R$ 50 enviado por WhatsApp+e-mail. Conversão histórica: 31%.", tag: "Aniversário" },
      ],
    },
    {
      id: "operacao",
      label: "Operação",
      headline: "Da compra ao pós-venda",
      description: "Pedido → separação → embalagem → envio → entrega → NPS → fidelização.",
      kind: "timeline",
      steps: [
        { title: "Pedido entra", body: "Loja online + marketplaces (Mercado Livre, Shopee). Sistema reserva estoque imediatamente.", meta: "0min" },
        { title: "Separação", body: "App da equipe gera lista por corredor. Bipa SKU para validar — zero divergência.", meta: "+45min" },
        { title: "Envio", body: "Etiqueta dos Correios/transportadora impressa. Cliente recebe rastreio por WhatsApp e e-mail.", meta: "+2h" },
        { title: "Pós-venda", body: "Entrega confirmada → NPS automático + convite para review. Cupom de fidelidade liberado.", meta: "D+entrega" },
      ],
    },
    {
      id: "bi",
      label: "Resultado",
      headline: "BI por canal, categoria e vendedor",
      description: "Quem mais vende, quanto fica de margem, qual canal compensa.",
      kind: "metrics",
      metrics: [
        { label: "Loja online vs. balcão", value: "62% / 38%", sub: "Online cresceu 23% no trimestre" },
        { label: "Top categoria", value: "Calçados — 31%", sub: "Margem média 42%" },
        { label: "Conversão site", value: "3,8%", sub: "Acima da média do setor (2,1%)" },
        { label: "Recompra 90d", value: "44%", sub: "+9pp após programa de fidelidade" },
      ],
    },
  ],
  ctaPrimary: { label: "Quero unificar loja física + online", to: "/orcamento" },
  ctaSecondary: { label: "Ver demo de checkout", to: "/demo/checkout" },
};

// ============================================================
// SERVIÇOS (advogados, contadores, consultores, oficinas)
// ============================================================
const servicos: RichNicheConfig = {
  niche: "servicos",
  heroEyebrow: "Demo — Empresas de Serviços",
  heroTitle: "Pipeline comercial, agenda, propostas e contratos digitais",
  heroSubtitle:
    "Para advogados, contadores, consultores, oficinas e prestadores: CRM, agenda, proposta assinada online, financeiro recorrente e portal do cliente.",
  kpis: [
    { label: "Propostas abertas", value: "23" },
    { label: "Contratos ativos", value: "147" },
    { label: "MRR", value: fmtBRL(184_300) },
    { label: "Inadimplência", value: "2,8%" },
  ],
  tabs: [
    {
      id: "pipeline",
      label: "Pipeline",
      headline: "Funil comercial com etapas customizáveis",
      description: "Lead → diagnóstico → proposta → assinatura → onboarding → contrato ativo.",
      kind: "table",
      columns: ["Cliente", "Serviço", "Valor", "Etapa", "Probabilidade"],
      rows: [
        ["Construtora Andrade", "Assessoria tributária", fmtBRL(8_500) + "/mês", "Proposta enviada", "70%"],
        ["Restaurante Lumière", "Contabilidade completa", fmtBRL(2_200) + "/mês", "Diagnóstico", "40%"],
        ["DJ Marcos Vinicius", "Planejamento PJ", fmtBRL(1_400) + "/mês", "Assinado", "100%"],
        ["Clínica Krause", "Departamento pessoal", fmtBRL(3_800) + "/mês", "Negociação", "85%"],
      ],
    },
    {
      id: "proposta",
      label: "Proposta digital",
      headline: "Proposta personalizada com assinatura eletrônica",
      description: "Template inteligente, valores dinâmicos por escopo, aceite com 2 cliques.",
      kind: "cards",
      cards: [
        { title: "Proposta #2401", meta: "Construtora Andrade · enviada há 2h", body: "Vista 3x · tempo médio na página 4min. Cliente abriu seção 'Valores' duas vezes.", tag: "Aberta 3x" },
        { title: "Proposta #2398", meta: "Família Andrade · enviada ontem", body: "Aceita às 09:42. Contrato gerado, primeira cobrança agendada para D+5.", tag: "Aceita" },
        { title: "Proposta #2392", meta: "Hotel Fasano · há 6 dias", body: "Sem retorno. Régua dispara WhatsApp de retomada em 24h.", tag: "Sem resposta" },
      ],
    },
    {
      id: "portal",
      label: "Portal do cliente",
      headline: "Cliente acompanha tudo sem ligar para você",
      description: "Documentos, status, financeiro, chamados e histórico em um link.",
      kind: "timeline",
      steps: [
        { title: "Acesso por link mágico", body: "Sem senha. Cliente clica no link recebido por e-mail/WhatsApp e cai no portal próprio.", meta: "Login" },
        { title: "Documentos & guias", body: "Folhas, balanços, peças jurídicas e relatórios disponíveis para download/visualização imediata.", meta: "Centro de arquivos" },
        { title: "Chamados", body: "Cliente abre dúvida → SLA de resposta começa. Equipe responde no portal e por e-mail simultaneamente.", meta: "Suporte" },
        { title: "Financeiro", body: "Boletos, PIX, histórico de pagamento e segunda via. Atrasos disparam régua antes de virar inadimplência.", meta: "Cobrança" },
      ],
    },
    {
      id: "bi",
      label: "Resultado",
      headline: "Saúde da carteira recorrente",
      description: "MRR, churn, LTV, NPS e ranking de consultores.",
      kind: "metrics",
      metrics: [
        { label: "Crescimento MRR", value: "+8,2% / mês", sub: "Net Revenue Retention 112%" },
        { label: "Churn mensal", value: "1,4%", sub: "−0,8pp após portal do cliente" },
        { label: "LTV médio", value: fmtBRL(38_400), sub: "Tempo médio 21 meses" },
        { label: "NPS", value: "72", sub: "Top consultor: Bruno (NPS 88)" },
      ],
    },
  ],
  ctaPrimary: { label: "Quero esta operação na minha empresa", to: "/orcamento" },
  ctaSecondary: { label: "Falar com especialista", to: "/contato" },
};

// ============================================================
// COMUNIDADE (associações, igrejas, ONGs)
// ============================================================
const comunidade: RichNicheConfig = {
  niche: "comunidade",
  heroEyebrow: "Demo — Comunidades & Associações",
  heroTitle: "Membros, doações, eventos e comunicação multicanal",
  heroSubtitle:
    "Para igrejas, ONGs, associações de bairro, clubes e comunidades: cadastro de membros, mensalidades, doações, presença em eventos e portal do associado.",
  kpis: [
    { label: "Membros ativos", value: "1.842" },
    { label: "Mensalidades em dia", value: "92%" },
    { label: "Doações do mês", value: fmtBRL(48_300) },
    { label: "Presença média", value: "78%" },
  ],
  tabs: [
    {
      id: "membros",
      label: "Membros",
      headline: "Cadastro com vínculo familiar e histórico",
      description: "Pessoa, família, grupo, ministério/comissão e linha do tempo de participação.",
      kind: "table",
      columns: ["Membro", "Grupo", "Status mensalidade", "Última presença", "Engajamento"],
      rows: [
        ["Mariana Costa", "Grupo de jovens", "Em dia", "Domingo 14/06", "Alto"],
        ["Família Andrade (4)", "Famílias com filhos", "Em dia (R$ 80)", "Domingo 14/06", "Alto"],
        ["Carlos Eduardo", "Voluntários", "Atrasada 12 dias", "07/06", "Médio"],
        ["Roberto Silva", "Conselho", "Doador recorrente", "31/05", "Médio (em queda)"],
      ],
    },
    {
      id: "doacoes",
      label: "Doações",
      headline: "PIX, cartão, débito recorrente e campanhas",
      description: "Cada doação registra origem (campanha, evento, link). Recibo automático por e-mail.",
      kind: "cards",
      cards: [
        { title: "Campanha 'Construção do Salão'", meta: "Meta R$ 80.000 · arrecadado R$ 52.400", body: "127 doadores. Topo: anônimo R$ 5.000. Média R$ 412.", tag: "Em andamento" },
        { title: "Dízimo / mensalidade", meta: "Junho/2026", body: "1.694 contribuintes em dia. R$ 38.200 via PIX automático, R$ 9.100 em débito.", tag: "Recorrente" },
        { title: "Evento beneficente", meta: "Bazar de inverno · 22/06", body: "215 inscritos. Doações de mercadoria: 84 itens registrados pelo app.", tag: "Próximo" },
      ],
    },
    {
      id: "eventos",
      label: "Eventos & presença",
      headline: "Check-in com QR Code e relatório por grupo",
      description: "Inscrição online, lista de espera, check-in rápido e métricas de retenção.",
      kind: "timeline",
      steps: [
        { title: "Inscrição", body: "Link público com formulário. Confirmação automática WhatsApp+e-mail com QR Code do ingresso.", meta: "Antes" },
        { title: "Lembrete", body: "24h antes: WhatsApp com horário, endereço e link do mapa. 2h antes: alerta para confirmar presença.", meta: "D-1" },
        { title: "Check-in", body: "Voluntário lê o QR Code no celular do membro. Sistema atualiza presença em tempo real no painel.", meta: "Dia do evento" },
        { title: "Pós-evento", body: "Mensagem de agradecimento + pesquisa rápida (1 pergunta). Métricas vão para BI por grupo e idade.", meta: "D+1" },
      ],
    },
    {
      id: "bi",
      label: "Resultado",
      headline: "Saúde da comunidade",
      description: "Engajamento, retenção, doação por origem e gargalos.",
      kind: "metrics",
      metrics: [
        { label: "Novos membros / mês", value: "47", sub: "+12 vs. trimestre anterior" },
        { label: "Retenção 6m", value: "84%", sub: "Famílias com filhos: 96%" },
        { label: "Ticket médio doação", value: fmtBRL(412), sub: "Recorrente: R$ 95/mês" },
        { label: "Inadimplência mensalidade", value: "8%", sub: "−4pp após cobrança automática" },
      ],
    },
  ],
  ctaPrimary: { label: "Quero esta plataforma na minha comunidade", to: "/orcamento" },
  ctaSecondary: { label: "Ver demo completa", to: "/demo" },
};

export const RICH_NICHE_CONFIGS: Record<RichNiche, RichNicheConfig> = {
  saude, bar, imobiliaria, comercio, servicos, comunidade,
};

export function getRichNiche(slug: string): RichNicheConfig | null {
  return (RICH_NICHE_CONFIGS as Record<string, RichNicheConfig>)[slug] ?? null;
}
