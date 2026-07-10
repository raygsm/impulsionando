// Fonte única de conteúdo público da Marocas — Fase A (vitrine premium).
// Usado por home, sobre, contato, eventos, delivery, reservas e FAQ.
// Placeholders explícitos onde credenciais/dados reais são necessários.
// NÃO inventar depoimentos com nomes reais. Prova social apenas por métricas
// e badges genéricos até validação com o cliente.

export const MAROCAS_BRAND = {
  nome: "Marocas",
  bairro: "Copacabana",
  cidade: "Rio de Janeiro",
  assinatura: "Cozinha da casa em Copacabana",
  fundacao: 2012,
  slogan: "Copacabana à mesa, o Rio no prato.",
  descricaoCurta:
    "Cozinha da casa no coração de Copacabana. Delivery próprio na Zona Sul, reservas em 2 cliques e comandas por pulseira numerada no salão.",
};

export const MAROCAS_CONTATO = {
  enderecoLinha1: "Rua Barata Ribeiro, 500",
  enderecoLinha2: "Copacabana · Rio de Janeiro · RJ",
  cep: "22040-002",
  // Placeholders — trocar pelo canal oficial da Marocas quando validado.
  whatsapp: "5521993075000",
  whatsappHumanizado: "(21) 99307-5000",
  telefone: "(21) 2547-0000",
  email: "ola@marocas.com.br",
  reservasEmail: "reservas@marocas.com.br",
  eventosEmail: "eventos@marocas.com.br",
  instagram: "marocascopacabana",
  instagramUrl: "https://instagram.com/",
  mapaUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Barata+Ribeiro+500+Copacabana+Rio+de+Janeiro",
};

export const MAROCAS_HORARIOS = [
  { dia: "Segunda", horario: "Fechado", fechado: true },
  { dia: "Terça a Quinta", horario: "18h — 23h" },
  { dia: "Sexta e Sábado", horario: "12h — 00h" },
  { dia: "Domingo", horario: "12h — 22h" },
];

export const MAROCAS_BAIRROS_DELIVERY = [
  { nome: "Copacabana", taxa: 0, prazo: "20–30 min", destaque: true },
  { nome: "Leme", taxa: 6, prazo: "25–35 min" },
  { nome: "Ipanema", taxa: 8, prazo: "30–40 min" },
  { nome: "Arpoador", taxa: 8, prazo: "30–40 min" },
  { nome: "Leblon", taxa: 10, prazo: "35–45 min" },
  { nome: "Botafogo", taxa: 10, prazo: "35–45 min" },
  { nome: "Humaitá", taxa: 12, prazo: "35–45 min" },
  { nome: "Flamengo", taxa: 12, prazo: "40–50 min" },
  { nome: "Urca", taxa: 14, prazo: "40–50 min" },
  { nome: "Lagoa", taxa: 14, prazo: "40–50 min" },
  { nome: "Jardim Botânico", taxa: 16, prazo: "45–55 min" },
  { nome: "Gávea", taxa: 16, prazo: "45–55 min" },
];

export const MAROCAS_HISTORIA = [
  {
    ano: "2012",
    titulo: "Um balcão em Copacabana",
    texto:
      "A Marocas começa como um balcão de bolinhos de bacalhau na Barata Ribeiro. Fila na calçada no primeiro fim de semana.",
  },
  {
    ano: "2016",
    titulo: "Cozinha própria, entrega própria",
    texto:
      "Assumimos a entrega em toda Copacabana com moto própria, sem intermediário. Cardápio ganha hambúrgueres, pizzas de fermentação natural e pratos da casa.",
  },
  {
    ano: "2020",
    titulo: "Mesa que vira sala de estar",
    texto:
      "Reformamos o salão para receber famílias, casais e eventos privados. Comandas por pulseira numerada agilizam o atendimento no salão.",
  },
  {
    ano: "2024",
    titulo: "Referência Impulsionando Food Service",
    texto:
      "A Marocas passa a rodar sobre o core Impulsionando — cardápio digital, delivery próprio, reservas, KDS e cockpit em um só lugar.",
  },
];

export const MAROCAS_EVENTOS = [
  {
    id: "aniversarios",
    emoji: "🎉",
    titulo: "Aniversários",
    resumo: "Do bolo à decoração, sem taxa de rolha. Menu fechado ou à la carte.",
    capacidade: "10–60 pessoas",
    duracao: "3h no salão",
  },
  {
    id: "corporativos",
    emoji: "🤝",
    titulo: "Almoços & jantares corporativos",
    resumo: "Reserva de área privativa com Wi-Fi, projeção e menu personalizado.",
    capacidade: "8–40 pessoas",
    duracao: "2–4h",
  },
  {
    id: "confraternizacoes",
    emoji: "🥂",
    titulo: "Confraternizações",
    resumo: "Fim de expediente, festa de equipe, réveillon de amigos. Open bar opcional.",
    capacidade: "20–80 pessoas",
    duracao: "4h",
  },
  {
    id: "casamentos",
    emoji: "💍",
    titulo: "Mini weddings & bodas",
    resumo: "Casamentos íntimos em Copacabana com cerimônia + jantar assinado pela casa.",
    capacidade: "20–50 pessoas",
    duracao: "5–6h",
  },
  {
    id: "chef-em-casa",
    emoji: "👨‍🍳",
    titulo: "Chef em casa",
    resumo: "Nossa equipe vai até você na Zona Sul. Menu degustação de 4 tempos.",
    capacidade: "6–20 pessoas",
    duracao: "3h",
  },
  {
    id: "workshops",
    emoji: "🍕",
    titulo: "Workshops de cozinha",
    resumo: "Aulas temáticas: pizza artesanal, drinks da casa, cozinha carioca.",
    capacidade: "8–16 pessoas",
    duracao: "3h",
  },
];

export const MAROCAS_PROVA_SOCIAL = [
  { valor: "12 anos", label: "servindo Copacabana desde 2012" },
  { valor: "200k+", label: "pedidos entregues na Zona Sul" },
  { valor: "4,8/5", label: "avaliação média (Google Meu Negócio)" },
  { valor: "0%", label: "taxa de reserva — sempre grátis" },
];

export const MAROCAS_IMPRENSA = [
  "Guia da Semana",
  "Veja Rio",
  "Time Out Rio",
  "O Globo · Rio Show",
  "Diário do Rio",
];

// Imagens ultrarrealistas — placeholders Unsplash. Trocar pelas fotos
// oficiais da Marocas quando o cliente entregar o kit.
export const MAROCAS_IMAGENS = {
  heroCopacabana:
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&auto=format&fit=crop&q=85",
  heroSalao:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop&q=85",
  calcadao:
    "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=1600&auto=format&fit=crop&q=85",
  praia:
    "https://images.unsplash.com/photo-1544989164-31dc3c645987?w=1600&auto=format&fit=crop&q=85",
  cozinha:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&auto=format&fit=crop&q=85",
  chef:
    "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=1200&auto=format&fit=crop&q=85",
  mesa:
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&auto=format&fit=crop&q=85",
  drink:
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=85",
  bairro:
    "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1600&auto=format&fit=crop&q=85",
  eventos:
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1600&auto=format&fit=crop&q=85",
};

export function marocasWhatsAppUrl(msg?: string) {
  const base = `https://wa.me/${MAROCAS_CONTATO.whatsapp}`;
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}
