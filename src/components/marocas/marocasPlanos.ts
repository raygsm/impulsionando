// Planos Marocas — gestão de locação por temporada para anfitriões e
// proprietários de imóveis. Reutilizável por futuros clientes do nicho
// dentro do ecossistema Impulsionando.

export type MarocasPlanoId = "essencial" | "gestao" | "full";

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
    id: "essencial",
    nome: "Essencial",
    tagline: "Comunicação automatizada + agenda",
    resumo:
      "Para anfitriões que já cuidam da operação e querem profissionalizar a comunicação com o hóspede e centralizar a agenda do imóvel.",
    preco: "R$ 149/mês por imóvel",
    precoNota: "Sem taxa por reserva.",
    publico:
      "Proprietários de 1 a 2 imóveis que fazem a operação por conta própria.",
    inclui: [
      "Cadastro completo do imóvel (regras, capacidade, horários)",
      "Agenda unificada de reservas, limpezas e bloqueios",
      "Comunicação automatizada com o hóspede (boas-vindas, senha, regras, check-out)",
      "Cadastro de hóspedes com perfil e histórico",
      "Painel do anfitrião com KPIs básicos",
      "Suporte por e-mail em horário comercial",
    ],
    naoInclui: [
      "Execução de limpeza e manutenção",
      "Rede de prestadores homologados",
    ],
    diferenciais: [
      { titulo: "Comunicação sem esforço", descricao: "Réguas de WhatsApp e e-mail já configuradas para cada etapa da estadia." },
      { titulo: "Um só calendário", descricao: "Reservas, bloqueios e serviços do imóvel em uma única visão." },
      { titulo: "Sem taxa por reserva", descricao: "Você fica com 100% do valor recebido do hóspede." },
    ],
    faq: [
      { q: "Preciso integrar com Airbnb/Booking?", a: "Sim. A agenda importa reservas por iCal ou API assim que as credenciais forem configuradas." },
      { q: "Consigo migrar depois para Gestão ou Full?", a: "Sim, sem taxa de migração. O histórico do imóvel é preservado." },
    ],
    ctaLabel: "Começar com Essencial",
  },
  {
    id: "gestao",
    nome: "Gestão",
    tagline: "Operação executada pela Marocas",
    resumo:
      "Marocas executa limpeza, reposição, manutenção e comunicação com o hóspede. Você acompanha tudo em tempo real pelo painel do proprietário.",
    preco: "A partir de R$ 349/mês + serviços",
    precoNota:
      "Fee mensal por imóvel + preço por serviço executado (limpeza, manutenção).",
    destaque: true,
    publico:
      "Proprietários que querem terceirizar a operação do imóvel com padrão de qualidade auditado.",
    inclui: [
      "Tudo do Essencial",
      "Equipe de limpeza homologada com checklist fotográfico",
      "Reposição de enxoval, amenities, café e água",
      "Rede de prestadores para manutenção (elétrica, hidráulica, ar-condicionado)",
      "Vistoria antes e depois de cada estadia",
      "Painel do proprietário com relatórios financeiros mensais",
      "Suporte ao hóspede 8h—20h + plantão de emergências",
    ],
    naoInclui: [
      "Anúncios pagos em portais",
      "Marketing e captação de hóspedes premium",
    ],
    diferenciais: [
      { titulo: "Operação com padrão auditado", descricao: "Checklist fotográfico obrigatório em toda limpeza e vistoria." },
      { titulo: "Prestadores substituíveis", descricao: "Se algum profissional cancela, a fila reprograma automaticamente." },
      { titulo: "Transparência total", descricao: "Cada custo, cada serviço, cada foto — visível no painel do proprietário." },
    ],
    faq: [
      { q: "Quem é responsável pela contratação dos prestadores?", a: "A Marocas contrata, homologa, treina e substitui. Você não lida com prestador individualmente." },
      { q: "Como funciona o repasse financeiro?", a: "Mensal, com demonstrativo detalhado. Custos são debitados da receita do imóvel." },
    ],
    ctaLabel: "Solicitar diagnóstico",
  },
  {
    id: "full",
    nome: "Full",
    tagline: "Gestão completa + captação + IA",
    resumo:
      "Operação Marocas de ponta a ponta: captação de hóspedes, precificação dinâmica, gestão de anúncios em portais e Cérebro IA por imóvel.",
    preco: "Sob consulta",
    precoNota: "Fee mensal + percentual sobre receita bruta.",
    publico:
      "Proprietários com múltiplos imóveis, investidores e pequenas administradoras.",
    inclui: [
      "Tudo do Gestão",
      "Fotografia profissional e criação de anúncios",
      "Gestão de anúncios em Airbnb, Booking e portais parceiros",
      "Precificação dinâmica por temporada e evento",
      "Cérebro IA por imóvel (respostas automáticas ao hóspede + sugestões de melhoria)",
      "CRM de proprietários e hóspedes recorrentes",
      "Dashboard consolidado multi-imóvel",
      "Gerente de conta dedicado + SLA de plataforma",
    ],
    diferenciais: [
      { titulo: "Portfólio como ativo", descricao: "Múltiplos imóveis operados como um portfólio, com meta de ocupação por unidade." },
      { titulo: "IA que responde por você", descricao: "Cérebro IA treinado com as regras do seu imóvel responde 90% das dúvidas do hóspede." },
      { titulo: "Precificação inteligente", descricao: "Preços ajustados por temporada, feriados e demanda em tempo real." },
    ],
    faq: [
      { q: "Tenho quantos imóveis no mínimo?", a: "A partir de 3 unidades já compensa. Investidores com 10+ ganham painel consolidado avançado." },
      { q: "A Marocas assume contratos como intermediária?", a: "Sim, mediante contrato de administração. Repasses são mensais." },
    ],
    ctaLabel: "Falar com consultor Full",
  },
];

export function getMarocasPlano(id: string): MarocasPlano | undefined {
  return marocasPlanos.find((p) => p.id === id);
}
