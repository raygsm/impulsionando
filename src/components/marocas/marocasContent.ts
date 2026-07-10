// Fonte única de conteúdo da Marocas — reposicionada como gestão de imóveis
// de locação por temporada (anfitriões, hóspedes, prestadores, operação).
// Placeholders explícitos onde credenciais/dados reais são necessários.

export const MAROCAS_BRAND = {
  nome: "Marocas",
  vertical: "Gestão de locação por temporada",
  cidade: "Rio de Janeiro",
  bairroBase: "Copacabana",
  fundacao: 2018,
  slogan: "A Marocas cuida da operação do seu imóvel de temporada.",
  descricaoCurta:
    "Limpeza, reposição, manutenção, comunicação com hóspedes e agenda operacional — em uma só plataforma para anfitriões e proprietários.",
  promessa:
    "Anfitriões profissionalizam a locação sem cuidar da operação todos os dias. Hóspedes recebem uma experiência premium do check-in ao check-out.",
};

export const MAROCAS_CONTATO = {
  enderecoLinha1: "Rua Barata Ribeiro, 500 · sala 902",
  enderecoLinha2: "Copacabana · Rio de Janeiro · RJ",
  cep: "22040-002",
  // Placeholders — trocar quando validado com o cliente.
  whatsapp: "5521993075000",
  whatsappHumanizado: "(21) 99307-5000",
  telefone: "(21) 2547-0000",
  emailAnfitrioes: "anfitrioes@marocas.com.br",
  emailHospedes: "hospedes@marocas.com.br",
  emailPrestadores: "prestadores@marocas.com.br",
  emailSuporte: "suporte@marocas.com.br",
  instagram: "marocasgestao",
  instagramUrl: "https://instagram.com/",
  mapaUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Barata+Ribeiro+500+Copacabana+Rio+de+Janeiro",
};

export const MAROCAS_HORARIOS_SUPORTE = [
  { dia: "Segunda a Sexta", horario: "08h — 20h" },
  { dia: "Sábado", horario: "09h — 18h" },
  { dia: "Domingo e feriados", horario: "Plantão de emergências 24h" },
];

// Serviços operacionais que a Marocas executa no imóvel do anfitrião.
export const MAROCAS_SERVICOS = [
  {
    id: "limpeza",
    emoji: "🧼",
    titulo: "Limpeza profissional",
    resumo:
      "Equipe treinada, checklist fotográfico e produtos padronizados a cada check-out.",
  },
  {
    id: "reposicao",
    emoji: "🧺",
    titulo: "Reposição de enxoval e amenities",
    resumo:
      "Roupa de cama, toalhas, produtos de higiene, café, água. Estoque controlado por imóvel.",
  },
  {
    id: "manutencao",
    emoji: "🛠️",
    titulo: "Manutenção preventiva e corretiva",
    resumo:
      "Rede de prestadores homologados: elétrica, hidráulica, ar-condicionado, pintura, gesso, marcenaria.",
  },
  {
    id: "comunicacao",
    emoji: "💬",
    titulo: "Comunicação automatizada",
    resumo:
      "Boas-vindas, senha da porta, regras, lembretes e pós-estadia disparados no tempo certo.",
  },
  {
    id: "checkin",
    emoji: "🔑",
    titulo: "Check-in e check-out digital",
    resumo:
      "Instruções por WhatsApp/e-mail, fechadura eletrônica ou porteiro cadastrado.",
  },
  {
    id: "vistoria",
    emoji: "📋",
    titulo: "Vistoria e laudo fotográfico",
    resumo:
      "Antes e depois de cada estadia. Histórico completo por imóvel para o proprietário.",
  },
  {
    id: "agenda",
    emoji: "📅",
    titulo: "Agenda operacional integrada",
    resumo:
      "Bloqueios, limpezas, manutenções e reservas em um único calendário por unidade.",
  },
  {
    id: "financeiro",
    emoji: "💳",
    titulo: "Relatório financeiro do imóvel",
    resumo:
      "Receita, taxas, custos por serviço, repasses e demonstrativo mensal ao proprietário.",
  },
];

// Etapas da jornada do anfitrião — usadas na home e no fluxo de cadastro.
export const MAROCAS_JORNADA_ANFITRIAO = [
  {
    passo: "01",
    titulo: "Cadastre seu imóvel",
    texto:
      "Endereço, capacidade, regras da casa, horários de check-in/check-out e serviços desejados.",
  },
  {
    passo: "02",
    titulo: "Diagnóstico gratuito",
    texto:
      "Nossa equipe avalia o imóvel e sugere plano, precificação e checklist inicial.",
  },
  {
    passo: "03",
    titulo: "Onboarding em 7 dias",
    texto:
      "Fotos profissionais, criação de anúncios, senha da porta, kit de boas-vindas.",
  },
  {
    passo: "04",
    titulo: "Operação no piloto automático",
    texto:
      "Marocas cuida de reservas, limpeza, manutenção e comunicação. Você recebe relatório mensal.",
  },
];

// Etapas da jornada do hóspede.
export const MAROCAS_JORNADA_HOSPEDE = [
  {
    passo: "01",
    titulo: "Reserva confirmada",
    texto:
      "Você recebe boas-vindas, dados do imóvel e canais de suporte 24h.",
  },
  {
    passo: "02",
    titulo: "48h antes do check-in",
    texto:
      "Senha da porta, endereço detalhado, dicas do bairro e regras do imóvel.",
  },
  {
    passo: "03",
    titulo: "Durante a estadia",
    texto:
      "Suporte por WhatsApp, solicitação de manutenção em 1 clique, roteiros personalizados.",
  },
  {
    passo: "04",
    titulo: "Check-out sem burocracia",
    texto:
      "Lembrete no dia, orientações de saída e pesquisa de satisfação.",
  },
];

// Categorias de prestadores homologados.
export const MAROCAS_PRESTADORES_CATEGORIAS = [
  { id: "limpeza", emoji: "🧽", titulo: "Camareiras & limpeza" },
  { id: "lavanderia", emoji: "🧺", titulo: "Lavanderia industrial" },
  { id: "eletrica", emoji: "⚡", titulo: "Eletricistas" },
  { id: "hidraulica", emoji: "🚿", titulo: "Encanadores" },
  { id: "ar", emoji: "❄️", titulo: "Ar-condicionado" },
  { id: "gesso", emoji: "🏗️", titulo: "Gesseiros" },
  { id: "pintura", emoji: "🎨", titulo: "Pintores" },
  { id: "marcenaria", emoji: "🪚", titulo: "Marceneiros" },
  { id: "vistoria", emoji: "📷", titulo: "Vistoriadores" },
  { id: "reposicao", emoji: "🛒", titulo: "Reposição de amenities" },
];

// Perfis de hóspede — usados para roteiros personalizados.
export const MAROCAS_PERFIS_HOSPEDE = [
  "Família",
  "Casal",
  "Trabalho remoto",
  "Lazer & praia",
  "Vida noturna",
  "Roteiros gastronômicos",
  "Compras",
  "Passeios ao ar livre",
  "Roteiro econômico",
  "Experiência premium",
];

// Fluxos de comunicação automatizada (referência para o N8N — nenhum
// disparo real acontece sem credenciais reais configuradas pelo Codex).
export const MAROCAS_FLUXOS_N8N = [
  { evento: "reserva_confirmada", canal: "WhatsApp + e-mail", descricao: "Boas-vindas e dados do imóvel" },
  { evento: "checkin_menos_48h", canal: "WhatsApp", descricao: "Senha da porta, regras e dicas do bairro" },
  { evento: "checkin_dia", canal: "WhatsApp", descricao: "Mensagem de recepção e canal de suporte" },
  { evento: "durante_estadia", canal: "WhatsApp", descricao: "Check-in de satisfação no meio da estadia" },
  { evento: "checkout_menos_24h", canal: "WhatsApp", descricao: "Lembrete e orientações de saída" },
  { evento: "pos_estadia", canal: "E-mail", descricao: "Pesquisa NPS e agradecimento" },
  { evento: "limpeza_agendada", canal: "Interno", descricao: "Notifica camareira e proprietário" },
  { evento: "manutencao_solicitada", canal: "Interno + WhatsApp prestador", descricao: "Aciona prestador homologado" },
  { evento: "prestador_cancelou", canal: "Interno", descricao: "Devolve serviço à fila e busca substituto" },
  { evento: "servico_concluido", canal: "Interno + proprietário", descricao: "Fecha OS, atualiza histórico e financeiro" },
];

export const MAROCAS_PROVA_SOCIAL = [
  { valor: "+180", label: "imóveis geridos na Zona Sul do Rio" },
  { valor: "4,9/5", label: "avaliação média dos hóspedes" },
  { valor: "< 4h", label: "tempo médio de resposta ao hóspede" },
  { valor: "97%", label: "taxa de check-in sem atrito" },
];

// Imagens ultrarrealistas — placeholders Unsplash focadas em hospedagem
// e ambientes de apartamentos. Trocar pelas fotos oficiais quando o
// cliente entregar o kit.
export const MAROCAS_IMAGENS = {
  heroApto:
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&auto=format&fit=crop&q=85",
  heroCopacabana:
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&auto=format&fit=crop&q=85",
  sala:
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop&q=85",
  quarto:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&auto=format&fit=crop&q=85",
  cozinhaApto:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&auto=format&fit=crop&q=85",
  varanda:
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop&q=85",
  limpeza:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&auto=format&fit=crop&q=85",
  chave:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&auto=format&fit=crop&q=85",
  hospede:
    "https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=1200&auto=format&fit=crop&q=85",
  prestador:
    "https://images.unsplash.com/photo-1581091012184-7d5f0f6f0f14?w=1200&auto=format&fit=crop&q=85",
  operacao:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=85",
  bairro:
    "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1600&auto=format&fit=crop&q=85",
};

export function marocasWhatsAppUrl(msg?: string) {
  const base = `https://wa.me/${MAROCAS_CONTATO.whatsapp}`;
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}
