import type { FictionalBrand } from "./types";

export const urbanBurger: FictionalBrand = {
  slug: "urban-burger",
  companyName: "Urban Burger Co.",
  tagline: "Hambúrgueres artesanais, brasa e pressa zero.",
  domainFake: "urbanburger.com.br",
  sector: "alimentacao",
  sectorLabel: "Food Service · Delivery e Salão",
  palette: {
    primary: "#B4361C",
    primaryFg: "#FFF6EE",
    accent: "#F2B84B",
    surface: "#12100F",
    ink: "#FBF5EC",
    muted: "#A79E90",
    heroGradient: "radial-gradient(120% 90% at 20% 20%, #B4361C 0%, #7A1C0E 55%, #1a1210 100%)",
  },
  typography: {
    heading: '"Bebas Neue", "Oswald", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  logo: {
    mark: `<svg viewBox="0 0 32 32" fill="none"><path d="M4 20c0-4.4 5.4-8 12-8s12 3.6 12 8H4z" fill="currentColor"/><rect x="4" y="22" width="24" height="3" rx="1.5" fill="#F2B84B"/><rect x="5" y="26" width="22" height="2" rx="1" fill="currentColor"/></svg>`,
    wordmark: "Urban Burger",
  },
  hero: {
    eyebrow: "Delivery próprio · 30 min",
    title: "O smash certo, na brasa certa, no seu horário.",
    subtitle:
      "Blend exclusivo 180g, pães brioche assados na casa, batata rústica cortada na hora. Entregamos quente ou você retira em 15 minutos.",
    primaryCta: { label: "Ver cardápio", to: "catalogo" },
    secondaryCta: { label: "Reservar mesa", to: "contato" },
    stats: [
      { label: "Pedidos/mês", value: "9,2 mil" },
      { label: "Nota iFood", value: "4.9" },
      { label: "Tempo médio", value: "27 min" },
      { label: "Clientes fiéis", value: "3,4 mil" },
    ],
    imageGradient: "radial-gradient(120% 90% at 30% 30%, #F2B84B 0%, #B4361C 45%, #2b1613 100%)",
    imageEmoji: "🍔",
  },
  highlights: [
    { icon: "bolt", title: "Entrega em 30 min", text: "Frota própria dentro do raio de 6 km." },
    { icon: "sparkle", title: "Blend 180g exclusivo", text: "Corte assinado por açougueiro parceiro." },
    { icon: "heart", title: "Clube Urban", text: "A cada 8 pedidos, o próximo é por nossa conta." },
    { icon: "trend", title: "Combos inteligentes", text: "O app monta o combo com melhor custo/benefício." },
  ],
  catalog: {
    label: "Cardápio",
    categories: [
      { id: "todos", label: "Todos" },
      { id: "burgers", label: "Burgers" },
      { id: "combos", label: "Combos" },
      { id: "sides", label: "Acompanhamentos" },
      { id: "bebidas", label: "Bebidas" },
      { id: "sobremesas", label: "Sobremesas" },
    ],
    items: [
      { id: "u1", name: "Classic Smash", category: "burgers", priceLabel: "R$ 32", description: "Blend 180g, queijo cheddar, cebola caramelizada, molho urban.", highlight: "Mais pedido", imageGradient: "linear-gradient(135deg,#B4361C,#F2B84B)", emoji: "🍔" },
      { id: "u2", name: "Truffle Bacon", category: "burgers", priceLabel: "R$ 42", description: "Duplo smash, cheddar inglês, bacon crocante, maionese trufada.", imageGradient: "linear-gradient(135deg,#7A1C0E,#D18C3B)", emoji: "🥓" },
      { id: "u3", name: "Combo Urban", category: "combos", priceLabel: "R$ 49", description: "Classic Smash + batata rústica + refri 350ml.", highlight: "Melhor custo", imageGradient: "linear-gradient(135deg,#B4361C,#f0c467)", emoji: "🍟" },
      { id: "u4", name: "Combo Truffle", category: "combos", priceLabel: "R$ 62", description: "Truffle Bacon + onion rings + limonada suíça.", imageGradient: "linear-gradient(135deg,#4a1a10,#F2B84B)", emoji: "🧅" },
      { id: "u5", name: "Batata rústica", category: "sides", priceLabel: "R$ 18", description: "Cortada na hora, sal grosso e alecrim.", imageGradient: "linear-gradient(135deg,#8b3b19,#F2B84B)", emoji: "🥔" },
      { id: "u6", name: "Onion rings", category: "sides", priceLabel: "R$ 22", description: "Anéis empanados com molho barbecue defumado.", imageGradient: "linear-gradient(135deg,#A94C1E,#f0c467)", emoji: "🧅" },
      { id: "u7", name: "Limonada suíça", category: "bebidas", priceLabel: "R$ 14", description: "Feita na hora com limão siciliano.", imageGradient: "linear-gradient(135deg,#6a2612,#f9e6a5)", emoji: "🍋" },
      { id: "u8", name: "Milkshake Ovomaltine", category: "bebidas", priceLabel: "R$ 19", description: "Sorvete artesanal, leite gelado e ovomaltine crocante.", imageGradient: "linear-gradient(135deg,#4a1f14,#c78644)", emoji: "🥤" },
      { id: "u9", name: "Brownie na brasa", category: "sobremesas", priceLabel: "R$ 21", description: "Brownie quente com sorvete de baunilha bourbon.", imageGradient: "linear-gradient(135deg,#3a1a10,#F2B84B)", emoji: "🍫" },
    ],
  },
  about: {
    story:
      "O Urban começou em 2019 num food truck alugado no centro da cidade. Três amigos, uma chapa e a ideia fixa de fazer o smash perfeito. Em 5 anos viramos duas casas cheias, uma cozinha própria de produção e um app que hoje responde por 60% do faturamento.",
    mission:
      "Fazer o melhor burger da sua semana, entregue quente, com preço que cabe no dia de segunda.",
    values: [
      { title: "Brasa de verdade", text: "Zero micro-ondas, zero encurtar caminho." },
      { title: "Tempo respeitado", text: "Se atrasar, o combo é por nossa conta." },
      { title: "Time cuidado", text: "Cozinha com turnos justos e bônus por meta." },
    ],
    team: [
      { name: "Léo Marques", role: "Chef executivo", bio: "Chapeiro há 15 anos. Assina o blend Urban.", initials: "LM", accent: "#B4361C" },
      { name: "Isa Freitas", role: "Head de operação", bio: "Cuida da logística de delivery e do salão.", initials: "IF", accent: "#F2B84B" },
      { name: "Diego Barros", role: "Sócio-fundador", bio: "Toca marketing, clube e parcerias.", initials: "DB", accent: "#7A1C0E" },
    ],
  },
  testimonials: [
    { author: "Camila L.", role: "Cliente do clube", quote: "Peço toda sexta há um ano. Nunca chegou frio.", rating: 5 },
    { author: "Rodrigo T.", role: "Cliente novo", quote: "Truffle Bacon é obrigação. O melhor da cidade, sem discussão.", rating: 5 },
    { author: "Empresa Nexos", role: "Pedido corporativo", quote: "Fechamos jantar do time todo mês. Sempre no horário.", rating: 5 },
  ],
  faq: [
    { question: "Qual o raio de entrega?", answer: "Entregamos em 6 km com frota própria. Fora do raio, trabalhamos com parceiros." },
    { question: "Tem opção vegetariana?", answer: "Sim, o blend vegetal de grão-de-bico substitui qualquer burger do cardápio." },
    { question: "Como funciona o clube?", answer: "A cada 8 pedidos acima de R$ 40, o próximo Classic Smash é grátis." },
  ],
  contact: {
    whatsapp: "(11) 3542-1177",
    email: "oi@urbanburger.com.br",
    phone: "+55 11 3542-1177",
    address: "Rua Aspicuelta, 210 · Vila Madalena · São Paulo/SP",
    hours: "Ter a Dom, 18h às 23h30 · Delivery até 00h",
  },
  admin: {
    kpis: [
      { label: "Pedidos hoje", value: "142", hint: "meta 150" },
      { label: "Ticket médio", value: "R$ 68" },
      { label: "Tempo médio", value: "27 min" },
      { label: "Faturamento dia", value: "R$ 9.6k" },
    ],
    orders: [
      { id: "#4821", customer: "Rafaela Nunes", when: "há 4 min", total: "R$ 74", status: "producao" },
      { id: "#4820", customer: "Carlos Braga", when: "há 7 min", total: "R$ 52", status: "producao" },
      { id: "#4819", customer: "Empresa Nexos", when: "há 12 min", total: "R$ 486", status: "novo" },
      { id: "#4818", customer: "Fernanda Alves", when: "há 18 min", total: "R$ 39", status: "entregue" },
      { id: "#4817", customer: "Tiago Souza", when: "há 24 min", total: "R$ 91", status: "entregue" },
    ],
    funnel: [
      { stage: "Visitas app", value: 1240 },
      { stage: "Adicionaram carrinho", value: 412 },
      { stage: "Concluíram pedido", value: 142 },
      { stage: "Retornaram no mês", value: 96 },
    ],
    revenue: [
      { month: "Mar", value: 218000 },
      { month: "Abr", value: 234500 },
      { month: "Mai", value: 251200 },
      { month: "Jun", value: 268900 },
    ],
  },
};
