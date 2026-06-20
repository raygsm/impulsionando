export type MarocasPlanoId = "avulso" | "mensal" | "care-plus";

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
    id: "avulso",
    nome: "Plano Avulso",
    tagline: "Sob demanda, sem mensalidade",
    resumo: "Para proprietários que gerenciam o próprio apartamento e contratam serviços conforme a necessidade.",
    preco: "A partir de R$ 160,00",
    precoNota: "Limpeza completa. Lavanderia opcional.",
    publico: "Quem já administra reservas e quer apenas a operação de limpeza e enxoval.",
    inclui: [
      "Limpeza completa do apartamento (R$ 160,00)",
      "Cozinha, banheiros, áreas sociais e quartos",
      "Organização e conferência visual",
      "Preparação para o próximo hóspede",
      "Checklist operacional fotográfico",
      "Lavagem + troca de roupa de cama (R$ 29,90 com limpeza)",
      "Apenas lavagem de roupa de cama (R$ 49,90 avulso)",
    ],
    naoInclui: [
      "Atendimento ao hóspede",
      "Manutenção preventiva",
      "Cobertura de danos",
    ],
    diferenciais: [
      { titulo: "Sem fidelidade", descricao: "Contrate quando precisar, sem mensalidade." },
      { titulo: "Equipe própria", descricao: "Profissionais treinados pela Marocas, não terceirizados." },
      { titulo: "Fotos antes/depois", descricao: "Você acompanha o serviço pelo portal, mesmo no avulso." },
    ],
    faq: [
      { q: "Posso solicitar a qualquer momento?", a: "Sim, com antecedência mínima de 24h. Para datas com alta demanda recomendamos 48h." },
      { q: "Cobram taxa de deslocamento?", a: "Não, para imóveis na Zona Sul do Rio. Outras regiões sob consulta." },
    ],
    ctaLabel: "Contratar serviço avulso",
  },
  {
    id: "mensal",
    nome: "Plano Marocas Mensal",
    tagline: "Gestão 360º completa",
    resumo: "Operação completa do seu apartamento de temporada com previsibilidade, portal do proprietário e repasse PIX automático.",
    preco: "Sob consulta",
    precoNota: "Valor calculado por metragem, ocupação e perfil do imóvel.",
    destaque: true,
    publico: "Quem quer entregar o apartamento e receber repasse mensal sem se preocupar com operação.",
    inclui: [
      "Limpezas ilimitadas entre estadias",
      "Enxoval e lavanderia inclusos",
      "Vistoria fotográfica check-in / check-out",
      "Atendimento ao hóspede 7 dias por semana",
      "Manutenção preventiva agendada",
      "Cobrança do hóspede e conciliação financeira",
      "Portal do proprietário com diário operacional",
      "Repasse PIX automático no início do mês",
      "Anúncio multi-plataforma (Airbnb, Booking, Vrbo)",
    ],
    diferenciais: [
      { titulo: "Previsibilidade", descricao: "Mensalidade fixa, sem surpresas de operação." },
      { titulo: "Portal transparente", descricao: "Você vê cada estadia, foto, despesa e ocupação em tempo real." },
      { titulo: "Equipe local", descricao: "Equipe operacional baseada na Zona Sul, com tempo de resposta médio de 45 min." },
    ],
    faq: [
      { q: "Qual a taxa cobrada?", a: "Trabalhamos com taxa percentual sobre a receita líquida, definida na proposta após visita técnica." },
      { q: "Tem fidelidade?", a: "Contrato mínimo de 6 meses para garantir investimento em fotografia profissional e anúncios." },
      { q: "E se o apartamento ficar vazio?", a: "Não há cobrança fixa em meses sem reservas — apenas limpezas avulsas, se solicitadas." },
    ],
    ctaLabel: "Solicitar proposta personalizada",
  },
  {
    id: "care-plus",
    nome: "Marocas Care+",
    tagline: "Proteção patrimonial contínua",
    resumo: "Camada extra de cobertura operacional e mediação para danos, avarias, reposições e emergências durante a estadia.",
    preco: "Add-on do Plano Mensal",
    precoNota: "Disponível em conjunto com o Plano Marocas Mensal.",
    publico: "Proprietários que querem cobertura adicional contra danos e plantão de emergência 24h.",
    inclui: [
      "Cobertura operacional de danos causados pelo hóspede",
      "Reposição expressa de itens essenciais (até 48h)",
      "Plantão de emergência 24h, inclusive feriados",
      "Relatório de incidentes com fotos e laudo",
      "Mediação direta com Airbnb, Booking e Vrbo",
      "Inspeção patrimonial trimestral",
      "Inventário digital atualizado",
    ],
    diferenciais: [
      { titulo: "Tempo de resposta", descricao: "Equipe própria com SLA de 45 min em emergências na Zona Sul." },
      { titulo: "Mediação especializada", descricao: "Abrimos e acompanhamos disputas pelo proprietário nas plataformas." },
      { titulo: "Inventário digital", descricao: "Todo item do apartamento catalogado, facilitando reposição e disputa." },
    ],
    faq: [
      { q: "É um seguro?", a: "Não. É uma cobertura operacional Marocas, com limites definidos em contrato. Para seguro patrimonial completo, indicamos parceiros." },
      { q: "Qual o limite por incidente?", a: "Definido em contrato, conforme valor do inventário e perfil do imóvel." },
    ],
    ctaLabel: "Adicionar proteção ao plano",
  },
];

export function getMarocasPlano(id: string): MarocasPlano | undefined {
  return marocasPlanos.find((p) => p.id === id);
}
