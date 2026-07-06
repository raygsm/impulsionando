// Tipos compartilhados do Centro de Inteligência do Impulsionito.
// Estrutura preparada para futura ligação com backend (mesmos campos).
export type ICStatus = "ativo" | "inativo" | "rascunho";

export type ICVersion = {
  version: number;
  updatedAt: string; // ISO
  updatedBy: string;
  note?: string;
  snapshot: Record<string, unknown>;
};

export type ICItem = {
  id: string;
  title: string;
  body: string; // conteúdo principal (markdown-friendly)
  tags?: string[];
  status: ICStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: ICVersion[];
};

export type ICSectionKey =
  | "prompt-mestre"
  | "base-conhecimento"
  | "servicos"
  | "planos"
  | "nichos"
  | "modulos"
  | "faq"
  | "scripts-comerciais"
  | "scripts-suporte"
  | "objecoes"
  | "aprendizados"
  | "historico"
  | "versoes-prompt"
  | "regras-agente"
  | "fontes-conhecimento"
  | "configuracoes-llm";

export type LearningKind =
  | "duvida_recorrente"
  | "objecao"
  | "elogio"
  | "pedido_funcionalidade"
  | "reclamacao"
  | "sugestao";

export type LearningStatus = "pendente" | "aprovado" | "rejeitado" | "convertido";

export type Learning = {
  id: string;
  kind: LearningKind;
  summary: string;
  transcript: string;
  suggestedAnswer?: string;
  origin: {
    tenant?: string;
    page?: string;
    userProfile?: string;
    channel?: string; // web, whatsapp...
  };
  detectedAt: string; // ISO
  frequency: number;
  status: LearningStatus;
  convertedInto?: {
    section: ICSectionKey;
    itemId: string;
  };
};

export type HistoryEntry = {
  id: string;
  when: string;
  tenant: string;
  page: string;
  userProfile: string;
  question: string;
  answer: string;
  resolved: boolean;
  escalated: boolean;
  latencyMs: number;
  knowledgeUsed: string[]; // titles
};

export type PromptVersion = {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  note: string;
  composition: string[]; // blocos usados na composição
  activated: boolean;
};
