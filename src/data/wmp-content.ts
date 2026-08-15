// Conteúdo comercial WMP — somente informações institucionais e operacionais validadas.
// Não publicar preços, cases, depoimentos, SLAs, seguros, ART ou capacidades numéricas sem fonte documental aprovada.

export type WmpPacote = {
  slug: "essencial" | "premium" | "show";
  nome: string;
  publico: string;
  preco_a_partir: string;
  destaque?: boolean;
  bullets: string[];
  cta: string;
};

export const WMP_PACOTES: WmpPacote[] = [
  {
    slug: "essencial",
    nome: "Evento Essencial",
    publico: "Estrutura dimensionada conforme briefing técnico",
    preco_a_partir: "sob proposta",
    bullets: [
      "Sonorização compatível com o ambiente e público",
      "Microfones e operação conforme necessidade do evento",
      "Iluminação configurada conforme escopo",
      "Montagem, operação e desmontagem discriminadas na proposta",
      "Equipamentos e mão de obra orçados separadamente",
    ],
    cta: "Solicitar proposta",
  },
  {
    slug: "premium",
    nome: "Evento Premium",
    publico: "Produção ampliada e experiência personalizada",
    preco_a_partir: "sob proposta",
    destaque: true,
    bullets: [
      "Som, luz, vídeo e estrutura combinados conforme briefing",
      "Equipe técnica dimensionada para a operação",
      "DJs e parceiros selecionados conforme perfil e disponibilidade",
      "Adicionais de equipamento configuráveis",
      "Logística e responsabilidades apresentadas separadamente",
    ],
    cta: "Montar meu evento",
  },
  {
    slug: "show",
    nome: "Show / Produção Especial",
    publico: "Projetos com produção técnica sob medida",
    preco_a_partir: "sob consulta",
    bullets: [
      "Projeto técnico conforme rider e características do local",
      "Fornecedores e equipamentos escolhidos por necessidade real",
      "Coordenação de montagem, operação e desmontagem",
      "Planejamento de contingências conforme risco do evento",
      "Proposta comercial antes do contrato formal",
    ],
    cta: "Falar com produção",
  },
];

export type WmpCase = {
  titulo: string;
  categoria: "Corporativo" | "Casamento" | "Festival" | "Show" | "Formatura";
  publico: string;
  local: string;
  ano: number;
  destaque: string;
};

// Cases públicos só devem ser cadastrados após validação documental/autorização de publicação.
export const WMP_CASES: WmpCase[] = [];

export type WmpDepoimento = {
  nome: string;
  cargo: string;
  texto: string;
  evento: string;
};

// Depoimentos públicos só devem ser publicados com origem e autorização verificadas.
export const WMP_DEPOIMENTOS: WmpDepoimento[] = [];

export type WmpFaq = { pergunta: string; resposta: string };

export const WMP_FAQ: WmpFaq[] = [
  {
    pergunta: "Como recebo uma proposta?",
    resposta: "A WMP primeiro coleta um briefing objetivo do evento. A proposta comercial preliminar apresenta o tipo de serviço, a data ou período e o preço. O contrato formal só é enviado depois da concordância comercial inicial.",
  },
  {
    pergunta: "Como a estrutura do evento é definida?",
    resposta: "Som, iluminação, vídeo, palco, DJs, técnicos e demais recursos são dimensionados a partir das características reais do evento, do local, do público e das necessidades informadas no briefing.",
  },
  {
    pergunta: "Equipamento e mão de obra são cobrados juntos?",
    resposta: "Não. A WMP controla equipamento e mão de obra como itens distintos. Sempre que um equipamento é utilizado, ele é tratado como locação, com proprietário, beneficiário, valor e histórico próprios.",
  },
  {
    pergunta: "Posso solicitar equipamentos adicionais?",
    resposta: "Sim. Microfones, caixas, subwoofers, iluminação, monitores, estruturas, telas, projetores e outros itens podem ser adicionados conforme disponibilidade e valor cadastrado pela gestão WMP.",
  },
  {
    pergunta: "Como funciona a rede de parceiros WMP?",
    resposta: "DJs, músicos, técnicos e fornecedores cadastrados podem ser acionados de acordo com perfil, localização, disponibilidade e necessidade de cada evento. Valores e responsabilidades são definidos antes da confirmação.",
  },
  {
    pergunta: "O que o Milito faz?",
    resposta: "Milito é o agente comercial e operacional da WMP. Ele recebe o cliente, entende o contexto, coleta briefing, registra protocolo, orienta jornadas, apoia propostas e encaminha para atendimento humano quando necessário.",
  },
];

export const WMP_CERTIFICACOES = [
  { titulo: "Escopo documentado", desc: "Serviços, equipamentos, mão de obra, logística e condições comerciais são registrados antes da execução." },
  { titulo: "Equipamentos rastreáveis", desc: "Cada locação pode registrar proprietário, beneficiário, valor, quantidade, evento e histórico." },
  { titulo: "Proposta antes do contrato", desc: "A formalização contratual só avança após a concordância com a proposta comercial preliminar." },
  { titulo: "Operação auditável", desc: "CRM, agenda, parceiros, protocolos, propostas e movimentações operacionais permanecem registrados no ecossistema WMP." },
];
