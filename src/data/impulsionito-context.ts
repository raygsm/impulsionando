/**
 * Contexto comercial público do Impulsionito.
 * Regra: nunca prometer canal, preço, trial ou capacidade que não esteja homologada.
 */
export type ImpulsionitoContext = {
  id: string;
  tip: string;
  cta: string;
  whatsapp: string;
};

const DEFAULT: ImpulsionitoContext = {
  id: "default",
  tip: "Sou o Impulsionito. Me conte o que seu negócio faz e o que mais atrapalha seu crescimento; eu te mostro a jornada Impulsionando mais adequada.",
  cta: "Diagnosticar meu negócio",
  whatsapp: "Olá! Vim pelo site da Impulsionando e quero entender como o ecossistema pode funcionar no meu negócio.",
};

const ROUTE_CONTEXTS: Array<{ match: RegExp; ctx: ImpulsionitoContext }> = [
  {
    match: /^\/mvp/,
    ctx: {
      id: "mvp-investidor",
      tip: "Você está na Investor Room. Posso explicar a tese da Impulsionando, arquitetura do Core, modelo de negócio, diferenciação, riscos, estágio real de execução, escalabilidade e como o ecossistema pode gerar receita recorrente sem vender funcionalidades ainda não homologadas.",
      cta: "Explorar a tese de investimento",
      whatsapp: "Olá! Estou na Investor Room da Impulsionando e quero conversar sobre tese, produto, tecnologia, modelo de negócio, escala e oportunidade de investimento.",
    },
  },
  {
    match: /^\/empresas/,
    ctx: {
      id: "empresas",
      tip: "Não vou te vender uma lista de módulos. Me diga seu segmento, como você capta clientes hoje e onde mais perde tempo ou vendas. Eu transformo isso numa jornada prática.",
      cta: "Quero ver no meu negócio",
      whatsapp: "Olá! Estou na área de Empresas da Impulsionando e quero um diagnóstico do meu negócio, com foco em captação, conversão, relacionamento e fidelização.",
    },
  },
  {
    match: /^\/white-label/,
    ctx: {
      id: "white-label",
      tip: "White Label é para quem quer operar e comercializar o ecossistema com marca própria. Posso te mostrar capacidade, implantação, autonomia comercial e jornada de upgrade.",
      cta: "Quero entender o White Label",
      whatsapp: "Olá! Quero entender o White Label da Impulsionando, suas faixas de capacidade, implantação e modelo comercial.",
    },
  },
  {
    match: /^\/clube/,
    ctx: {
      id: "clube",
      tip: "O Clube conecta consumidores às empresas e benefícios disponíveis no ecossistema. Posso te ajudar a encontrar vantagens e, quando publicado, produtos e disponibilidade das empresas participantes.",
      cta: "Explorar o Clube",
      whatsapp: "Olá! Quero entender o Clube Impulsionando e as vantagens disponíveis.",
    },
  },
  {
    match: /^\/planos/,
    ctx: {
      id: "planos",
      tip: "Eu comparo sua necessidade com o catálogo comercial realmente publicado no Core. Se um preço ou condição não estiver homologado, eu não invento: conduzo para proposta.",
      cta: "Encontrar a melhor configuração",
      whatsapp: "Olá! Estou na página de planos da Impulsionando e quero ajuda para definir a configuração adequada ao meu negócio.",
    },
  },
  {
    match: /^\/checkout/,
    ctx: {
      id: "checkout",
      tip: "Posso explicar exatamente o que está sendo contratado, valores publicados e próximos passos antes da confirmação.",
      cta: "Revisar minha contratação",
      whatsapp: "Olá! Estou no checkout da Impulsionando e quero ajuda para revisar minha contratação.",
    },
  },
  {
    match: /^\/demo\/escolher-nicho/,
    ctx: {
      id: "demo-niche",
      tip: "Escolha o segmento mais próximo. Se ele não estiver na lista, me diga o que sua empresa faz e eu conduzo a demonstração pela lógica operacional do seu negócio.",
      cta: "Encontrar meu segmento",
      whatsapp: "Olá! Quero encontrar a demonstração mais próxima do meu segmento na Impulsionando.",
    },
  },
  {
    match: /^\/demo/,
    ctx: {
      id: "demo",
      tip: "Use a demonstração para enxergar a jornada, não apenas telas. Eu posso explicar como captação, CRM, operação, relacionamento e indicadores se conectam.",
      cta: "Explicar esta demonstração",
      whatsapp: "Olá! Estou em uma demonstração da Impulsionando e quero entender como essa jornada se aplicaria à minha empresa.",
    },
  },
  {
    match: /^\/nichos/,
    ctx: {
      id: "nichos",
      tip: "Me diga seu nicho. Eu comparo o cenário atual com a jornada Impulsionando e mostro onde normalmente existem perdas invisíveis, recorrência desperdiçada e tarefas manuais.",
      cta: "Diagnosticar meu nicho",
      whatsapp: "Olá! Quero uma recomendação da Impulsionando para o meu segmento.",
    },
  },
  {
    match: /^\/recomendacao/,
    ctx: {
      id: "recomendacao",
      tip: "Posso refinar sua recomendação usando segmento, tamanho da operação, canais atuais e principal objetivo de negócio.",
      cta: "Refinar minha recomendação",
      whatsapp: "Olá! Recebi uma recomendação no site da Impulsionando e quero refiná-la.",
    },
  },
  {
    match: /^\/orcamento/,
    ctx: {
      id: "orcamento",
      tip: "Antes de fechar um orçamento, eu ajudo a separar o que é necessário agora, o que pode ser faseado e o que ainda depende de homologação.",
      cta: "Montar a configuração certa",
      whatsapp: "Olá! Estou montando um orçamento na Impulsionando e quero ajuda para definir o escopo correto.",
    },
  },
  {
    match: /^\/contato/,
    ctx: {
      id: "contato",
      tip: "Posso organizar sua necessidade antes do contato com o time, para que você já chegue com segmento, objetivo e prioridades claros.",
      cta: "Organizar meu contato",
      whatsapp: "Olá! Vim pela página de contato da Impulsionando e quero falar com o time.",
    },
  },
];

const NICHE_CONTEXTS: Record<string, Partial<ImpulsionitoContext>> = {
  "bares-restaurantes": {
    tip: "Hoje você sabe quem sentou nas suas mesas, quanto cada cliente consome, do que gosta e quando deveria ser convidado a voltar? Eu te mostro como transformar comanda em relacionamento.",
    cta: "Diagnosticar meu bar ou restaurante",
    whatsapp: "Olá! Tenho bar/restaurante e quero entender como transformar PDV, cadastro, consumo, reservas, eventos e fidelização em uma jornada integrada.",
  },
  "materiais-construcao": {
    tip: "Orçamento que não recebe follow-up e cliente em obra que compra uma vez são oportunidades invisíveis. Vamos mapear orçamento, recompra, profissionais e estoque.",
    cta: "Diagnosticar minha loja",
    whatsapp: "Olá! Tenho loja de materiais de construção e quero organizar orçamentos, CRM, estoque, recompra e relacionamento com profissionais.",
  },
  farmacias: {
    tip: "Uma farmácia tem frequência natural. A pergunta é: quantos clientes recorrentes ainda passam anônimos e quantas campanhas realmente geram recompra?",
    cta: "Diagnosticar minha farmácia",
    whatsapp: "Olá! Tenho farmácia/drogaria e quero entender CRM, fidelidade, estoque e relacionamento dentro da Impulsionando.",
  },
  supermercados: {
    tip: "Seu PDV conhece produtos vendidos; o desafio é transformar compras autorizadas em entendimento de frequência, ticket, categorias e retorno de campanhas.",
    cta: "Diagnosticar meu mercado",
    whatsapp: "Olá! Tenho supermercado/mercado e quero entender fidelização, CRM, estoque e campanhas segmentadas na Impulsionando.",
  },
  "lava-jato": {
    tip: "Lavagem é recorrente por natureza. Se o cliente depende da própria memória para voltar, existe receita ficando na mesa. Vamos mapear veículo, histórico e retorno.",
    cta: "Criar recorrência no meu lava jato",
    whatsapp: "Olá! Tenho lava jato/estética automotiva e quero organizar clientes, veículos, serviços e recorrência.",
  },
  petshops: {
    tip: "Banho, tosa e cuidados têm ciclo de retorno. Eu posso te mostrar como agenda, histórico do pet, lembretes e fidelidade formam uma jornada contínua.",
    cta: "Diagnosticar meu negócio pet",
    whatsapp: "Olá! Tenho pet shop/serviço pet e quero organizar agenda, histórico, retorno e fidelização.",
  },
  "saloes-estetica": {
    tip: "Agenda cheia hoje não garante agenda cheia no próximo mês. Vamos medir retorno por profissional, clientes inativos e oportunidades de pacote ou recorrência.",
    cta: "Diagnosticar meu salão",
    whatsapp: "Olá! Tenho salão/barbearia/estética e quero organizar agenda, CRM, retorno e fidelização.",
  },
  clinicas: {
    tip: "Em saúde, organização e relacionamento precisam respeitar privacidade e regras do setor. Posso mapear captação, agenda, comunicação e retorno sem prometer o que não está homologado.",
    whatsapp: "Olá! Tenho clínica/consultório e quero entender a jornada Impulsionando para captação, agenda e relacionamento.",
  },
  psicologia: {
    tip: "Vamos olhar agenda, recorrência, comunicação, privacidade e acompanhamento do paciente sem misturar dados clínicos com marketing indevido.",
    whatsapp: "Olá! Trabalho com psicologia e quero entender como a Impulsionando pode organizar agenda e relacionamento.",
  },
  imobiliaria: {
    tip: "Lead imobiliário perde valor quando demora ou não recebe follow-up. Vamos conectar origem, interesse, visita, proposta e retomada da oportunidade.",
    whatsapp: "Olá! Tenho imobiliária e quero entender CRM, captação, visitas e follow-up na Impulsionando.",
  },
  contabilidade: {
    tip: "Escritórios ganham eficiência quando documentos, demandas, contratos, cobrança e relacionamento deixam de depender de mensagens dispersas.",
    whatsapp: "Olá! Tenho escritório contábil e quero entender CRM, portal, contratos e automações na Impulsionando.",
  },
  juridico: {
    tip: "Vamos mapear captação, conflitos de interesse, relacionamento, documentos, prazos e financeiro com controle de acesso adequado ao contexto jurídico.",
    whatsapp: "Olá! Tenho escritório jurídico e quero entender CRM, relacionamento e operação na Impulsionando.",
  },
  microcervejarias: {
    tip: "Pedido B2B, estoque, comprador recorrente e sell-out não deveriam viver separados. Eu te mostro como transformar recompra em processo.",
    whatsapp: "Olá! Tenho microcervejaria e quero organizar pedidos B2B, estoque, CRM e recompra.",
  },
  eventos: {
    tip: "Cada inscrição ou presença pode alimentar relacionamento, desde que haja consentimento e jornada correta. Vamos conectar captação, evento, pesquisa e próxima ação.",
    whatsapp: "Olá! Produzo eventos e quero entender inscrições, relacionamento, comunicação e BI na Impulsionando.",
  },
  veiculos: {
    tip: "Venda de veículo é uma jornada longa: origem do lead, interesse, proposta, financiamento, compra e pós-venda. Eu te mostro onde automatizar sem perder o contexto humano.",
    whatsapp: "Olá! Trabalho com veículos e quero entender CRM, estoque, propostas e pós-venda na Impulsionando.",
  },
  servicos: {
    tip: "Em serviços, a principal perda costuma acontecer entre pedido de orçamento, follow-up, execução, cobrança e recompra. Vamos mapear esse ciclo.",
    whatsapp: "Olá! Sou prestador de serviços e quero organizar CRM, propostas, agenda, execução e recorrência.",
  },
  ecommerce: {
    tip: "Carrinho, compra, recompra e atendimento precisam alimentar o mesmo perfil. Vamos olhar aquisição, conversão, estoque e relacionamento pós-venda.",
    whatsapp: "Olá! Tenho e-commerce/varejo e quero entender CRM, estoque, vendas e relacionamento na Impulsionando.",
  },
};

export function getImpulsionitoContext(pathname: string, niche?: string): ImpulsionitoContext {
  const base = ROUTE_CONTEXTS.find((r) => r.match.test(pathname))?.ctx ?? DEFAULT;
  if (!niche) return base;
  const override = NICHE_CONTEXTS[niche];
  if (!override) return base;
  return { ...base, ...override, id: `${base.id}:${niche}` };
}
