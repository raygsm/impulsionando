export const revelaBrand = {
  positioning: {
    essence: "Aproximar educação, potencial humano e oportunidades reais.",
    promise: "Descobrir, desenvolver e demonstrar potencial com evidências, contexto e oportunidade.",
    bridge: "Educação com linguagem humana + confiança institucional + clareza corporativa.",
  },
  visual: {
    palette: {
      forest: "#173E2A",
      deepForest: "#102C1E",
      sage: "#6E8B78",
      mint: "#DDE9E0",
      ivory: "#F7F4ED",
      sand: "#E9DFD0",
      amber: "#D69E2E",
      ink: "#17231C",
      slate: "#526057",
      white: "#FFFFFF",
    },
    rules: [
      "Use ivory and white to communicate openness, education and possibility.",
      "Use forest and deep forest for trust, authority, data and corporate contexts.",
      "Use sage and mint for guidance, progress and human support.",
      "Use amber sparingly for opportunity, action and high-intent CTAs.",
      "Maintain WCAG-compliant contrast; never place low-contrast pastel text on pastel backgrounds.",
      "Avoid clinical blue, HR-software gray and school-report-card aesthetics.",
    ],
  },
  voice: {
    attributes: ["humana", "direta", "inteligente", "acolhedora", "não infantilizada", "precisa", "sem promessas mágicas"],
    rules: [
      "Lead with the human problem before technology.",
      "Explain value in one sentence before adding detail.",
      "Use active verbs and concrete outcomes.",
      "Never imply that a score defines a person.",
      "Never exaggerate compatibility or certainty.",
      "Use evidence, context and next action in every decision-oriented message.",
    ],
  },
} as const;

export const revelaAudienceCopy = {
  student: {
    eyebrow: "SEU CAMINHO NÃO PRECISA VIR PRONTO",
    headline: "Descubra o que faz sentido para você.",
    body: "O REVELA acompanha o que você gosta, o que quer experimentar e o que aprende fazendo. Você pode mudar de ideia. Isso também é evolução.",
    primaryCta: "Quero começar a me descobrir",
    secondaryCta: "Ver como funciona",
  },
  teacher: {
    eyebrow: "VOCÊ VÊ O QUE A NOTA NÃO MOSTRA",
    headline: "Transforme percepção em oportunidade.",
    body: "Registre sinais simples, compare evolução e receba sugestões práticas para ajudar cada estudante a experimentar mais caminhos — sem rotular.",
    primaryCta: "Conhecer o painel docente",
    secondaryCta: "Ver uma análise de exemplo",
  },
  school: {
    eyebrow: "DA INTUIÇÃO À EVIDÊNCIA",
    headline: "Conheça seus alunos além do boletim.",
    body: "Consolide escuta, observações, experiências e evolução em um painel que ajuda a escola a decidir onde criar mais oportunidades.",
    primaryCta: "Quero levar o REVELA para minha escola",
    secondaryCta: "Ver indicadores",
  },
  company: {
    eyebrow: "PARE DE FILTRAR SÓ PELO PASSADO",
    headline: "Descubra quem consegue fazer.",
    body: "Cadastre o problema real da vaga, defina competências relevantes e convide pessoas a demonstrar capacidade em desafios práticos e auditáveis.",
    primaryCta: "Quero encontrar potencial real",
    secondaryCta: "Ver como o RH analisa",
  },
  hr: {
    eyebrow: "MENOS CURRÍCULO. MAIS EVIDÊNCIA.",
    headline: "Compare aderência sem reduzir pessoas a rótulos.",
    body: "Veja competências demonstradas, lacunas observadas, velocidade de aprendizagem e contexto — sempre com explicação e incerteza visíveis.",
    primaryCta: "Criar uma oportunidade",
    secondaryCta: "Ver relatório demonstrativo",
  },
  master: {
    eyebrow: "INTELIGÊNCIA CONTÍNUA, GOVERNANÇA HUMANA",
    headline: "Um ecossistema que aprende sem perder o controle.",
    body: "Acompanhe jornadas, metodologia, indicadores, automações, qualidade dos dados e propostas de melhoria com auditoria completa.",
    primaryCta: "Abrir Central REVELA",
    secondaryCta: "Ver governança",
  },
} as const;
