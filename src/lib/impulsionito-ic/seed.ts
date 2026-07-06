import type {
  HistoryEntry,
  ICItem,
  ICSectionKey,
  Learning,
  PromptVersion,
} from "./types";

const now = () => new Date().toISOString();
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const responsible = "raygs@hotmail.com";

function makeItem(
  id: string,
  title: string,
  body: string,
  tags: string[] = [],
): ICItem {
  const created = daysAgo(30);
  return {
    id,
    title,
    body,
    tags,
    status: "ativo",
    version: 1,
    createdAt: created,
    updatedAt: created,
    updatedBy: responsible,
    history: [
      {
        version: 1,
        updatedAt: created,
        updatedBy: responsible,
        note: "Versão inicial (seed)",
        snapshot: { title, body, tags, status: "ativo" },
      },
    ],
  };
}

export const SEED_ITEMS: Partial<Record<ICSectionKey, ICItem[]>> = {
  "prompt-mestre": [
    makeItem(
      "pm-01",
      "Prompt Mestre — Núcleo",
      `Você é o Impulsionito, cérebro oficial do Ecossistema Impulsionando.

- Fale em português do Brasil, tom direto, gentil e objetivo.
- Nunca invente informação de serviço, plano, módulo, nicho ou preço — sempre use APENAS o que está na Base de Conhecimento anexada.
- Se a pergunta não tem resposta na base, ofereça abrir chamado humano.
- Não peça dados sensíveis (senha, cartão, CPF completo).
- Ao encerrar, sugira o próximo passo dentro do funil (captar, converter, relacionar, reter, expandir).`,
      ["nucleo", "core"],
    ),
  ],
  "base-conhecimento": [
    makeItem(
      "bc-01",
      "O que é o Ecossistema Impulsionando",
      "Plataforma multi-tenant que unifica captação, conversão, retenção e expansão de clientes em qualquer nicho.",
      ["institucional"],
    ),
    makeItem(
      "bc-02",
      "Como cadastrar uma nova empresa (tenant)",
      "Passo a passo: /demo/cadastro → escolher nicho → confirmar plano → onboarding guiado.",
      ["onboarding"],
    ),
  ],
  servicos: [
    makeItem("sv-01", "Consultoria de implantação", "Time dedicado por 30 dias no go-live."),
    makeItem("sv-02", "Migração de dados", "Importa clientes, produtos e agendas de sistemas anteriores."),
    makeItem("sv-03", "Design white-label", "Aplica identidade visual do tenant em todo o portal."),
  ],
  planos: [
    makeItem("pl-01", "Essencial", "Núcleo do core + 3 módulos. Ideal para começar."),
    makeItem("pl-02", "Profissional", "Core completo + automações N8N + IA embarcada."),
    makeItem("pl-03", "Avançado", "Multi-unidade, white-label total, SLA prioritário."),
  ],
  nichos: [
    makeItem("ni-01", "Clínica / Consultório", "Agenda, prontuário, teleconsulta."),
    makeItem("ni-02", "Imobiliária", "Vitrine, corretor parceiro, portal do proprietário."),
    makeItem("ni-03", "Eventos", "Ingressos, check-in, produtor."),
    makeItem("ni-04", "Bar / Restaurante", "PDV, comanda, clube."),
    makeItem("ni-05", "Advocacia", "Casos, agenda de audiências, honorários."),
    makeItem("ni-06", "Fitness", "Alunos, treinos, planos recorrentes."),
  ],
  modulos: [
    makeItem("mo-01", "CRM", "Leads, oportunidades, funil."),
    makeItem("mo-02", "Agenda", "Compromissos, salas, recursos."),
    makeItem("mo-03", "Financeiro", "Cobrança, inadimplência, boletos."),
    makeItem("mo-04", "Marketing", "Campanhas, réguas, N8N."),
    makeItem("mo-05", "Suporte", "Tickets, base de ajuda, FAQ."),
  ],
  faq: [
    makeItem(
      "fq-01",
      "Como faço para testar antes de contratar?",
      "Todo nicho tem uma demo pública em /demo. Basta escolher e navegar.",
      ["comercial"],
    ),
    makeItem(
      "fq-02",
      "Vocês emitem nota fiscal?",
      "Sim. NF-e é emitida automaticamente após confirmação de pagamento.",
      ["financeiro"],
    ),
    makeItem(
      "fq-03",
      "Como cancelo minha assinatura?",
      "Menu → Conta → Assinatura → Cancelar. Sem multa, valor pró-rata devolvido.",
      ["retencao"],
    ),
  ],
  "scripts-comerciais": [
    makeItem(
      "sc-01",
      "Abordagem inicial WhatsApp",
      "Olá {nome}, sou do Impulsionando. Vi que você tem interesse em {nicho}. Quer ver uma demo em 3 minutos?",
      ["captar"],
    ),
    makeItem(
      "sc-02",
      "Follow-up 24h",
      "Oi {nome}, tudo bem? Consegue 5 min hoje para eu te mostrar o painel funcionando com dados do seu negócio?",
      ["converter"],
    ),
  ],
  "scripts-suporte": [
    makeItem(
      "ss-01",
      "Boas-vindas ao chamado",
      "Olá! Recebi seu chamado #{ticket}. Já estou verificando e retorno em até 15 minutos com um diagnóstico.",
      ["ticket"],
    ),
    makeItem(
      "ss-02",
      "Encerramento com CSAT",
      "Chamado resolvido! Pode nos avaliar de 1 a 5? Sua nota nos ajuda a melhorar.",
      ["ticket"],
    ),
  ],
  objecoes: [
    makeItem(
      "ob-01",
      "'Está caro'",
      "Compare o custo mensal com uma única venda perdida por falha de agenda. O core paga em ~2 clientes/mês.",
      ["preco"],
    ),
    makeItem(
      "ob-02",
      "'Já uso outro sistema'",
      "Nosso módulo de migração importa seus dados atuais em até 48h. Você não recomeça do zero.",
      ["migracao"],
    ),
    makeItem(
      "ob-03",
      "'Preciso pensar'",
      "Faz sentido. Posso deixar a demo aberta na sua conta por 7 dias, sem custo, para você testar com calma?",
      ["fechamento"],
    ),
  ],
  "regras-agente": [
    makeItem(
      "rg-01",
      "Nunca prometer o que não está na base",
      "Se não encontrar na Base de Conhecimento, dizer explicitamente que vai verificar com o time.",
    ),
    makeItem(
      "rg-02",
      "Sempre oferecer fallback humano",
      "Ao detectar frustração, insatisfação ou 3 tentativas sem resolução, ofertar contato com atendente humano.",
    ),
    makeItem(
      "rg-03",
      "Preservar LGPD",
      "Nunca solicitar CPF completo, senha, cartão ou dados médicos por chat.",
    ),
  ],
  "fontes-conhecimento": [
    makeItem(
      "fc-01",
      "Documentação oficial",
      "https://impulsionando.com.br/docs — Confiabilidade: alta.",
      ["docs"],
    ),
    makeItem(
      "fc-02",
      "Base de tickets resolvidos",
      "Últimos 12 meses de atendimentos com resolução confirmada.",
      ["suporte"],
    ),
    makeItem(
      "fc-03",
      "Playbooks comerciais",
      "Scripts validados pelo time comercial em campanhas com CAC ≤ R$150.",
      ["comercial"],
    ),
  ],
};

export const SEED_LEARNINGS: Learning[] = [
  {
    id: "ap-01",
    kind: "duvida_recorrente",
    summary: "Clientes perguntando se o core integra com Bling.",
    transcript:
      "Cliente perguntou 3x nas últimas 48h se o financeiro sincroniza com o Bling ERP.",
    suggestedAnswer:
      "Atualmente exportamos CSV; integração nativa está no roadmap Q1. Você aceita alerta quando liberar?",
    origin: { tenant: "chrismed", page: "/planos", userProfile: "gestor", channel: "web" },
    detectedAt: daysAgo(1),
    frequency: 3,
    status: "pendente",
  },
  {
    id: "ap-02",
    kind: "objecao",
    summary: "'Não quero migrar agora, muito trabalho.'",
    transcript:
      "Lead do nicho imobiliária alegou temor de perder histórico ao migrar do sistema atual.",
    suggestedAnswer:
      "Nossa migração espelha o legado por 30 dias. Se algo faltar, revertemos sem custo.",
    origin: { tenant: "imob-marocas", page: "/nichos/imobiliaria", userProfile: "diretor", channel: "web" },
    detectedAt: daysAgo(2),
    frequency: 5,
    status: "pendente",
  },
  {
    id: "ap-03",
    kind: "elogio",
    summary: "Elogio recorrente ao design do painel do consumidor final.",
    transcript: "3 clientes finais elogiaram a experiência do clube.",
    origin: { tenant: "chrismed", page: "/clube", userProfile: "consumidor", channel: "web" },
    detectedAt: daysAgo(3),
    frequency: 3,
    status: "pendente",
  },
  {
    id: "ap-04",
    kind: "pedido_funcionalidade",
    summary: "Exportar contratos assinados em PDF único (dossiê).",
    transcript: "Advocacia pediu 'baixar tudo do caso em 1 PDF'.",
    origin: { tenant: "adv-souza", page: "/casos", userProfile: "advogado", channel: "web" },
    detectedAt: daysAgo(5),
    frequency: 2,
    status: "pendente",
  },
  {
    id: "ap-05",
    kind: "reclamacao",
    summary: "Notificação de cobrança chegando 2x.",
    transcript: "2 tickets em 24h reportaram duplicidade de e-mail de cobrança.",
    origin: { tenant: "riomed", page: "/financeiro", userProfile: "cliente", channel: "email" },
    detectedAt: daysAgo(1),
    frequency: 4,
    status: "pendente",
  },
  {
    id: "ap-06",
    kind: "sugestao",
    summary: "Modo escuro no portal do proprietário.",
    transcript: "Corretor sugeriu dark mode para uso noturno.",
    origin: { tenant: "imob-marocas", page: "/portal/proprietario", userProfile: "corretor", channel: "web" },
    detectedAt: daysAgo(7),
    frequency: 1,
    status: "pendente",
  },
];

export const SEED_HISTORY: HistoryEntry[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `hi-${i + 1}`,
  when: daysAgo(i),
  tenant: ["chrismed", "riomed", "imob-marocas", "core"][i % 4],
  page: ["/planos", "/nichos/clinica", "/clube", "/checkout"][i % 4],
  userProfile: ["gestor", "consumidor", "corretor", "admin"][i % 4],
  question: [
    "Como emito nota fiscal?",
    "Vocês têm demo de clínica?",
    "Consigo pagar via Pix?",
    "Qual o preço do plano avançado?",
  ][i % 4],
  answer: "Resposta gerada pelo Impulsionito usando FAQ #fq-02 + Serviços #sv-02.",
  resolved: i % 5 !== 0,
  escalated: i % 5 === 0,
  latencyMs: 800 + i * 45,
  knowledgeUsed: ["FAQ • Nota fiscal", "Serviços • Migração"],
}));

export const SEED_PROMPT_VERSIONS: PromptVersion[] = [
  {
    id: "pv-1",
    version: 1,
    createdAt: daysAgo(30),
    createdBy: responsible,
    note: "Versão inicial (seed).",
    composition: ["Prompt Mestre", "Serviços", "Planos", "FAQ"],
    activated: false,
  },
  {
    id: "pv-2",
    version: 2,
    createdAt: daysAgo(10),
    createdBy: responsible,
    note: "Incluídos Módulos e Nichos.",
    composition: ["Prompt Mestre", "Serviços", "Planos", "Módulos", "Nichos", "FAQ"],
    activated: false,
  },
  {
    id: "pv-3",
    version: 3,
    createdAt: daysAgo(2),
    createdBy: responsible,
    note: "Aprendizados aprovados incorporados. Ativa.",
    composition: [
      "Prompt Mestre",
      "Serviços",
      "Planos",
      "Módulos",
      "Nichos",
      "FAQ",
      "Aprendizados aprovados",
      "Contexto dinâmico",
    ],
    activated: true,
  },
];
