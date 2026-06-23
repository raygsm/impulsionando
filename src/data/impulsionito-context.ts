/**
 * Mapa de contexto do Impulsionito (assistente virtual da Impulsionando).
 * Cada rota / nicho tem:
 *  - tip: dica curta exibida no balão
 *  - cta: rótulo do botão principal
 *  - whatsapp: mensagem pré-preenchida quando o lead clica em "Falar agora"
 *
 * O FAB cai no fallback "default" quando a rota não tem entrada própria,
 * e tem matchers por prefixo de path + por `?nicho=` (quando aplicável).
 */
export type ImpulsionitoContext = {
  id: string;
  tip: string;
  cta: string;
  whatsapp: string;
};

const DEFAULT: ImpulsionitoContext = {
  id: "default",
  tip: "Sou o Impulsionito — em qualquer página posso te apontar o próximo passo, módulo certo ou plano ideal.",
  cta: "Falar com um especialista",
  whatsapp:
    "Olá! Vim pelo site da Impulsionando e quero entender qual plano e módulos fazem sentido pra mim.",
};

/** Contexto por prefixo de rota (mais específico primeiro). */
const ROUTE_CONTEXTS: Array<{ match: RegExp; ctx: ImpulsionitoContext }> = [
  {
    match: /^\/planos/,
    ctx: {
      id: "planos",
      tip: "Em dúvida entre Essencial, Ideal e Full? Conta o que você precisa resolver primeiro e eu te indico o plano + módulos ideais.",
      cta: "Quero ajuda pra escolher o plano",
      whatsapp:
        "Olá! Estou na página de Planos da Impulsionando e quero ajuda para escolher entre Essencial / Ideal / Full + os módulos certos para o meu negócio.",
    },
  },
  {
    match: /^\/checkout/,
    ctx: {
      id: "checkout",
      tip: "Posso te ajudar a finalizar agora — Pix gera na hora, cartão libera em 1 minuto e boleto rola pro anual.",
      cta: "Preciso de ajuda no pagamento",
      whatsapp:
        "Olá! Estou no checkout da Impulsionando e preciso de ajuda para concluir o pagamento (setup + 1ª mensalidade).",
    },
  },
  {
    match: /^\/demo\/simulador/,
    ctx: {
      id: "demo-simulador",
      tip: "Cada botão aqui dispara automações reais. Faça um pedido, agende uma visita ou rode uma campanha — eu explico o impacto.",
      cta: "Tirar dúvida sobre o simulador",
      whatsapp:
        "Olá! Estou no simulador da Impulsionando e quero entender como os módulos funcionam integrados no meu nicho.",
    },
  },
  {
    match: /^\/demo\/escolher-nicho/,
    ctx: {
      id: "demo-niche",
      tip: "Escolha o nicho mais próximo do seu — não precisa ser exato. O simulador adapta a história e os módulos.",
      cta: "Não vejo meu nicho aqui",
      whatsapp:
        "Olá! Meu negócio não se encaixa em nenhum nicho da demo da Impulsionando. Posso conversar com alguém?",
    },
  },
  {
    match: /^\/demo\/cadastro/,
    ctx: {
      id: "demo-signup",
      tip: "É só email, nome e WhatsApp. Nada de cartão. Em segundos você cai num ambiente recheado com dados reais do seu nicho.",
      cta: "Tenho dúvida no cadastro",
      whatsapp:
        "Olá! Estou no cadastro da demo da Impulsionando e tenho uma dúvida antes de continuar.",
    },
  },
  {
    match: /^\/nichos/,
    ctx: {
      id: "nichos",
      tip: "Conta seu segmento que eu te levo direto ao plano e aos módulos certos — pulando a parte de quiz.",
      cta: "Recomendação rápida pra meu nicho",
      whatsapp:
        "Olá! Quero uma recomendação rápida da Impulsionando para o meu nicho específico (sem responder o quiz).",
    },
  },
  {
    match: /^\/recomendacao/,
    ctx: {
      id: "recomendacao",
      tip: "Te conheço pela resposta do quiz. Se algo soa estranho na recomendação, eu refaço com você em 1 min.",
      cta: "Refinar minha recomendação",
      whatsapp:
        "Olá! Acabei de receber uma recomendação no site da Impulsionando e quero refiná-la com alguém do time.",
    },
  },
  {
    match: /^\/orcamento/,
    ctx: {
      id: "orcamento",
      tip: "Para Sob Medida e Avançado eu já te conecto direto com o consultor responsável.",
      cta: "Quero um orçamento sob medida",
      whatsapp:
        "Olá! Estou montando um orçamento sob medida na Impulsionando e quero falar com um consultor.",
    },
  },
  {
    match: /^\/clube/,
    ctx: {
      id: "clube",
      tip: "O Clube libera vantagens em todos os tenants da Impulsionando — uma única assinatura, descontos em vários parceiros.",
      cta: "Quero entender o Clube",
      whatsapp:
        "Olá! Quero entender como funciona o Clube Impulsionando e quais vantagens estão disponíveis no momento.",
    },
  },
  {
    match: /^\/contratar/,
    ctx: {
      id: "contratar",
      tip: "Posso te conduzir pelo Trial de 7 dias ou pelo contrato anual com 2 meses grátis.",
      cta: "Falar com vendas",
      whatsapp:
        "Olá! Quero contratar a Impulsionando — pode me ajudar a escolher entre Trial, mensal e anual?",
    },
  },
  {
    match: /^\/trial/,
    ctx: {
      id: "trial",
      tip: "O Trial libera tudo do plano escolhido por 7 dias, sem cartão. Posso te ajudar a destravar qualquer parte.",
      cta: "Tirar dúvida do Trial",
      whatsapp:
        "Olá! Estou no Trial da Impulsionando e quero ajuda para aproveitar melhor os 7 dias.",
    },
  },
  {
    match: /^\/empresas|^\/white-label/,
    ctx: {
      id: "white-label",
      tip: "White Label coloca a sua marca em tudo — domínio próprio, app instalável, e o core Impulsionando rodando por trás.",
      cta: "Quero detalhes do White Label",
      whatsapp:
        "Olá! Quero entender como funciona o White Label da Impulsionando (marca própria, domínio, multi-tenant).",
    },
  },
  {
    match: /^\/contato/,
    ctx: {
      id: "contato",
      tip: "Você pode falar direto comigo pelo WhatsApp — ou usar o formulário se preferir registrar por escrito.",
      cta: "Abrir WhatsApp agora",
      whatsapp:
        "Olá! Vim pela página de Contato da Impulsionando e quero falar com o time.",
    },
  },
];

/** Contexto por nicho (sobrescreve o de rota quando estiver presente). */
const NICHE_CONTEXTS: Record<string, Partial<ImpulsionitoContext>> = {
  "bares-restaurantes": {
    tip: "Bares e restaurantes começam pelo PDV + Comanda + Fidelização. Cardápio digital sai grátis no Ideal.",
    whatsapp:
      "Olá! Tenho um bar/restaurante e quero entender PDV, comanda, fidelização e cardápio digital da Impulsionando.",
  },
  clinicas: {
    tip: "Clínicas integram Agenda + Prontuário (EHR) + WhatsApp. Plano Ideal já cobre confirmação automática.",
    whatsapp:
      "Olá! Tenho uma clínica e quero entender Agenda, Prontuário e confirmação automática da Impulsionando.",
  },
  psicologia: {
    tip: "Psicologia precisa de agenda recorrente, prontuário sigiloso e área do paciente. Tudo cabe no Essencial.",
    whatsapp:
      "Olá! Sou psicólogo(a) e quero entender Agenda, Prontuário e Área do Paciente da Impulsionando.",
  },
  imobiliaria: {
    tip: "Imobiliária roda em Vitrine + CRM + Agenda de visitas. Lead do Instagram vira proposta sem digitar duas vezes.",
    whatsapp:
      "Olá! Tenho uma imobiliária e quero entender Vitrine, CRM e Agenda de visitas da Impulsionando.",
  },
  contabilidade: {
    tip: "Contábil escala com Área do Cliente + ERP + automação de cobrança. Posso te mostrar o template.",
    whatsapp:
      "Olá! Tenho um escritório contábil e quero entender Área do Cliente, ERP e cobrança automática da Impulsionando.",
  },
  juridico: {
    tip: "Jurídico usa CRM de casos + Área do Cliente + Financeiro. Auditoria expandida já vem no Full.",
    whatsapp:
      "Olá! Tenho um escritório de advocacia e quero entender CRM de casos e Área do Cliente da Impulsionando.",
  },
  microcervejarias: {
    tip: "Microcervejaria mistura Commerce + PDV + Eventos. Posso te mostrar o template pronto.",
    whatsapp:
      "Olá! Tenho uma microcervejaria e quero entender Commerce, PDV e Eventos da Impulsionando.",
  },
  eventos: {
    tip: "Eventos precisam de inscrições, área do participante e BI por edição. Tudo no plano Ideal.",
    whatsapp:
      "Olá! Produzo eventos e quero entender Inscrições, Área do Participante e BI da Impulsionando.",
  },
  veiculos: {
    tip: "Loja de veículos roda em Estoque + CRM + Financiamento. O BI mostra giro por modelo.",
    whatsapp:
      "Olá! Tenho uma loja de veículos e quero entender Estoque, CRM e BI da Impulsionando.",
  },
  servicos: {
    tip: "Prestadores de serviço começam por Agenda + CRM + Contratos recorrentes.",
    whatsapp:
      "Olá! Sou prestador de serviços e quero entender Agenda, CRM e Contratos recorrentes da Impulsionando.",
  },
  ecommerce: {
    tip: "E-commerce integra Commerce + Estoque + Marketing. Remarketing dispara sozinho no Ideal.",
    whatsapp:
      "Olá! Tenho um e-commerce e quero entender Commerce, Estoque e Marketing da Impulsionando.",
  },
};

export function getImpulsionitoContext(
  pathname: string,
  niche?: string,
): ImpulsionitoContext {
  const base = ROUTE_CONTEXTS.find((r) => r.match.test(pathname))?.ctx ?? DEFAULT;
  if (!niche) return base;
  const override = NICHE_CONTEXTS[niche];
  if (!override) return base;
  return { ...base, ...override, id: `${base.id}:${niche}` };
}
