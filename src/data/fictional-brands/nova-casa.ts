import type { FictionalBrand } from "./types";

export const novaCasa: FictionalBrand = {
  slug: "nova-casa",
  companyName: "Nova Casa Imóveis",
  tagline: "A curadoria imobiliária que respeita seu tempo.",
  domainFake: "novacasa.com.br",
  sector: "imobiliario",
  sectorLabel: "Imobiliário · Aluguel e Venda",
  palette: {
    primary: "#1E3A5F",
    primaryFg: "#F1F5FB",
    accent: "#C79A2F",
    surface: "#F5F2EC",
    ink: "#0E1B2B",
    muted: "#5A6472",
    heroGradient: "linear-gradient(135deg,#0E1B2B 0%,#1E3A5F 55%,#C79A2F 100%)",
  },
  typography: {
    heading: '"Cormorant Garamond", "Playfair Display", ui-serif, Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  logo: {
    mark: `<svg viewBox="0 0 32 32" fill="none"><path d="M4 15L16 4l12 11v13a2 2 0 0 1-2 2h-7v-9h-6v9H6a2 2 0 0 1-2-2V15z" fill="currentColor"/><circle cx="16" cy="12" r="1.6" fill="#C79A2F"/></svg>`,
    wordmark: "Nova Casa",
  },
  hero: {
    eyebrow: "Curadoria imobiliária boutique",
    title: "Imóveis pré-selecionados para pessoas que não têm tempo a perder.",
    subtitle:
      "Cada imóvel do nosso portfólio é visitado, fotografado e verificado por um consultor. Você recebe apenas o que faz sentido — nunca o que sobra.",
    primaryCta: { label: "Ver portfólio", to: "catalogo" },
    secondaryCta: { label: "Falar com consultor", to: "contato" },
    stats: [
      { label: "Imóveis ativos", value: "186" },
      { label: "Consultores", value: "14" },
      { label: "Tempo médio de venda", value: "38 dias" },
      { label: "Clientes recorrentes", value: "62%" },
    ],
    imageGradient: "linear-gradient(160deg,#1E3A5F 0%,#3d5f88 50%,#C79A2F 100%)",
    imageEmoji: "🏛️",
  },
  highlights: [
    { icon: "shield", title: "Documentação auditada", text: "Cada imóvel entra no portfólio só após diligência jurídica." },
    { icon: "sparkle", title: "Fotografia própria", text: "Fotógrafo e drone in-house, sem foto de celular." },
    { icon: "clock", title: "Visita agendada em 24h", text: "Consultor te encontra no imóvel no dia que você escolher." },
    { icon: "heart", title: "Acompanhamento pós-chave", text: "Ajudamos com mudança, decoração e contratos de serviço." },
  ],
  catalog: {
    label: "Portfólio",
    categories: [
      { id: "todos", label: "Todos" },
      { id: "venda", label: "Venda" },
      { id: "aluguel", label: "Aluguel" },
      { id: "lancamento", label: "Lançamentos" },
    ],
    items: [
      { id: "n1", name: "Cobertura duplex · Jardins", category: "venda", priceLabel: "R$ 4.8 mi", description: "320 m², 4 suítes, terraço com piscina e vista aberta.", highlight: "Exclusivo", imageGradient: "linear-gradient(135deg,#1E3A5F,#C79A2F)", emoji: "🏙️" },
      { id: "n2", name: "Casa térrea · Alto de Pinheiros", category: "venda", priceLabel: "R$ 2.6 mi", description: "3 suítes, jardim projetado, garagem para 4 carros.", imageGradient: "linear-gradient(135deg,#0E1B2B,#a68030)", emoji: "🏡" },
      { id: "n3", name: "Apto 2 dorm · Vila Madalena", category: "aluguel", priceLabel: "R$ 5.900/mês", description: "78 m², reformado, mobiliado, condomínio baixo.", imageGradient: "linear-gradient(135deg,#3d5f88,#f0d693)", emoji: "🛋️" },
      { id: "n4", name: "Loft studio · Pinheiros", category: "aluguel", priceLabel: "R$ 3.400/mês", description: "42 m², pé direito duplo, ideal para home office.", highlight: "Novo", imageGradient: "linear-gradient(135deg,#1E3A5F,#e0c37a)", emoji: "🪟" },
      { id: "n5", name: "Residencial Aurora · lançamento", category: "lancamento", priceLabel: "a partir de R$ 890 mil", description: "1 e 2 dorms, entrega em 2027, unidades a partir de 45 m².", imageGradient: "linear-gradient(135deg,#0E1B2B,#C79A2F)", emoji: "🏗️" },
      { id: "n6", name: "Casa de campo · Itu", category: "venda", priceLabel: "R$ 3.1 mi", description: "1.200 m² de terreno, piscina, área gourmet, condomínio fechado.", imageGradient: "linear-gradient(135deg,#2a4b6c,#d4b164)", emoji: "🌳" },
    ],
  },
  about: {
    story:
      "A Nova Casa nasceu em 2012 com uma provocação: por que ainda mostramos ao cliente 40 imóveis quando ele só precisa dos 3 certos? Fundada por um advogado e uma arquiteta, viramos referência em curadoria imobiliária no eixo Jardins/Pinheiros/Vila Madalena.",
    mission:
      "Reduzir o tempo entre o desejo de mudar de casa e a assinatura da escritura, sem abrir mão de segurança jurídica.",
    values: [
      { title: "Curadoria", text: "Menos imóveis, mais aderência." },
      { title: "Transparência", text: "Documentação aberta desde a primeira conversa." },
      { title: "Continuidade", text: "Consultor único do primeiro café à entrega das chaves." },
    ],
    team: [
      { name: "Renata Aoki", role: "Sócia-fundadora · Arquiteta", bio: "Curadora do portfólio e responsável pela relação com proprietários.", initials: "RA", accent: "#1E3A5F" },
      { name: "Gustavo Prado", role: "Sócio · Diretor jurídico", bio: "Comanda a auditoria documental de cada imóvel.", initials: "GP", accent: "#C79A2F" },
      { name: "Marina Duarte", role: "Head de consultores", bio: "Treina o time e acompanha as negociações complexas.", initials: "MD", accent: "#3d5f88" },
    ],
  },
  testimonials: [
    { author: "Família Ribeiro", role: "Compraram no Alto de Pinheiros", quote: "Vimos 4 casas. A terceira era a nossa. Nunca imaginei ser tão fácil.", rating: 5 },
    { author: "Camila L.", role: "Locação", quote: "Consultora entendeu meu orçamento e nunca ofereceu nada fora da conta.", rating: 5 },
    { author: "Diego M.", role: "Investidor", quote: "Segunda operação com eles. Documentação impecável.", rating: 5 },
  ],
  faq: [
    { question: "Vocês trabalham com financiamento?", answer: "Sim, temos parceria com 4 bancos e um assessor de crédito interno." },
    { question: "Como funciona a exclusividade?", answer: "Cerca de 70% do portfólio é exclusivo Nova Casa por 90 dias." },
    { question: "Atendem fora de São Paulo?", answer: "Casas de campo e temporada em Itu, Ibiúna e litoral norte." },
  ],
  contact: {
    whatsapp: "(11) 3062-4400",
    email: "consultores@novacasa.com.br",
    phone: "+55 11 3062-4400",
    address: "Rua Oscar Freire, 1240 · Jardins · São Paulo/SP",
    hours: "Seg a Sáb, 9h às 19h",
  },
  admin: {
    kpis: [
      { label: "Imóveis ativos", value: "186" },
      { label: "Leads no mês", value: "312" },
      { label: "Visitas agendadas", value: "94" },
      { label: "Fechamentos", value: "18", hint: "meta 20" },
    ],
    funnel: [
      { stage: "Leads", value: 312 },
      { stage: "Qualificados", value: 168 },
      { stage: "Visita agendada", value: 94 },
      { stage: "Proposta", value: 41 },
      { stage: "Fechados", value: 18 },
    ],
    revenue: [
      { month: "Mar", value: 480000 },
      { month: "Abr", value: 512000 },
      { month: "Mai", value: 604000 },
      { month: "Jun", value: 688000 },
    ],
  },
};
