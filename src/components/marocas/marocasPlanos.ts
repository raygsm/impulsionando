// Planos Marocas — food service (bares, restaurantes, cafeterias, hamburguerias,
// pizzarias, delivery, dark kitchens, franquias). Reutilizável por futuros
// clientes do nicho de alimentação dentro do ecossistema Impulsionando.

export type MarocasPlanoId = "balcao" | "salao" | "rede";

export interface MarocasPlano {
  id: MarocasPlanoId;
  nome: string;
  tagline: string;
  resumo: string;
  preco: string;
  precoNota?: string;
  destaque?: boolean;
  publico: string;
  inclui: string[];
  naoInclui?: string[];
  diferenciais: { titulo: string; descricao: string }[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
}

export const marocasPlanos: MarocasPlano[] = [
  {
    id: "balcao",
    nome: "Balcão Marocas",
    tagline: "Cardápio digital + pedido rápido",
    resumo:
      "Ideal para cafeterias, lanchonetes e dark kitchens que querem digitalizar o cardápio e receber pedidos por QR Code, sem investir em POS complexo.",
    preco: "A partir de R$ 149/mês",
    precoNota: "Setup incluso. Sem taxas sobre vendas.",
    publico: "Operações enxutas com foco em balcão, retirada e delivery próprio.",
    inclui: [
      "Cardápio digital ilimitado com fotos, categorias e adicionais",
      "QR Code por mesa e por bandeja de retirada",
      "Pedidos por link e por WhatsApp com carrinho integrado",
      "Impressão em cozinha (via ESC/POS)",
      "Painel operacional com status do pedido",
      "Área do cliente com histórico e repetir pedido",
    ],
    naoInclui: ["Módulo de reservas", "Roteirização de entregadores"],
    diferenciais: [
      { titulo: "Ativação em 24h", descricao: "Time da Marocas cadastra o cardápio a partir de um PDF ou planilha." },
      { titulo: "Sem taxa por pedido", descricao: "Você fica com 100% do ticket. Sem comissão sobre venda." },
      { titulo: "Preparado para pulseiras", descricao: "Compatível com comandas numeradas quando o módulo for ativado." },
    ],
    faq: [
      { q: "Preciso de POS ou impressora especial?", a: "Não. Funciona em qualquer tablet ou celular. Impressora ESC/POS é opcional." },
      { q: "Aceita pagamento no app?", a: "Sim, via PIX Copia e Cola e link de cartão. Também aceita 'pagar na retirada'." },
    ],
    ctaLabel: "Começar com Balcão",
  },
  {
    id: "salao",
    nome: "Salão Marocas",
    tagline: "Operação completa: salão, delivery e reservas",
    resumo:
      "Para bares, restaurantes, hamburguerias e pizzarias que operam salão + delivery + retirada, com reservas e integração com comandas numeradas.",
    preco: "A partir de R$ 349/mês",
    precoNota: "Suporte prioritário. Ativação assistida.",
    destaque: true,
    publico: "Casas com atendimento presencial, delivery próprio e agenda de reservas.",
    inclui: [
      "Tudo do Balcão Marocas",
      "Mapa de mesas e comandas por mesa",
      "Reservas com confirmação, remarcação e cancelamento",
      "Delivery com taxa por bairro e tempo estimado",
      "Rastreio do pedido para o cliente (recebido → preparando → saiu → entregue)",
      "Módulo de garçom (KDS + comandas)",
      "Integração pronta para pulseiras numeradas (comandas pré-pagas)",
    ],
    naoInclui: ["Franqueadora multiunidade", "White label completo"],
    diferenciais: [
      { titulo: "Comandas por pulseira", descricao: "Fluxo pronto para pulseiras numeradas quando o hardware chegar." },
      { titulo: "Reservas sem no-show", descricao: "Confirmação em 2 cliques com lembrete automático." },
      { titulo: "Cardápio inteligente", descricao: "Itens somem quando esgotam. Voltam sozinhos ao repor estoque." },
    ],
    faq: [
      { q: "Como funciona a pulseira numerada?", a: "Cliente recebe uma pulseira ao entrar. Pedidos ficam vinculados ao número. Fechamento por pulseira ou por CPF." },
      { q: "Consigo integrar meu delivery próprio?", a: "Sim. O painel calcula taxa por bairro, tempo estimado e mostra rastreio para o cliente." },
    ],
    ctaLabel: "Falar com consultor",
  },
  {
    id: "rede",
    nome: "Rede Marocas",
    tagline: "Franquias, dark kitchens e multiunidades",
    resumo:
      "Para redes que precisam padronizar cardápio, precificação e operação entre unidades, com dashboard consolidado e governança central.",
    preco: "Sob consulta",
    precoNota: "Contrato por unidade ativa + fee de plataforma.",
    publico: "Franqueadoras, redes próprias e operadores de dark kitchens multi-marca.",
    inclui: [
      "Tudo do Salão Marocas em cada unidade",
      "Cardápio-mãe replicável para unidades",
      "Precificação regional e promoções centralizadas",
      "Dashboard consolidado (vendas, ticket médio, ocupação)",
      "Governança de marca (logo, cores, política de descontos)",
      "Papel de franqueado e franqueadora com permissões",
      "Suporte dedicado e SLA de plataforma",
    ],
    diferenciais: [
      { titulo: "Multi-marca em uma cozinha", descricao: "Dark kitchen roda várias marcas na mesma operação, com KDS separado por marca." },
      { titulo: "Governança central", descricao: "Franqueadora aprova mudanças de cardápio e preço antes de irem ao ar." },
      { titulo: "BI da rede", descricao: "Compare unidades por hora, dia, categoria e canal (salão, delivery, retirada)." },
    ],
    faq: [
      { q: "Tenho quantas unidades no mínimo?", a: "A partir de 2 unidades já faz sentido. Redes com 10+ ganham dashboard consolidado avançado." },
      { q: "Consigo cobrar royalties automaticamente?", a: "Sim. Fica configurado como percentual sobre venda ou fee fixo mensal por unidade." },
    ],
    ctaLabel: "Solicitar diagnóstico da rede",
  },
];

export function getMarocasPlano(id: string): MarocasPlano | undefined {
  return marocasPlanos.find((p) => p.id === id);
}
