/**
 * Tipos compartilhados entre cliente e servidor para o Impulsionito.
 * Este arquivo NÃO importa código server-only, para poder ser usado
 * também pelo transport e pelo dock.
 *
 * Arquitetura oficial (W111):
 *
 *   USUÁRIO
 *     ↓
 *   Impulsionito (front-end)
 *     ↓ (envia mensagens + snapshot do cérebro + config LLM)
 *   Core Impulsionando (backend / server fn / route)
 *     ↓
 *   Motor de Contexto (monta prompt final dinamicamente)
 *     ↓
 *   Provedor LLM (OpenAI padrão, Gemini fallback, Claude/Ollama preparados)
 *     ↓
 *   Core Impulsionando (registra aprendizado)
 *     ↓
 *   CRM / Usuário
 */

export type LlmProviderId = "openai" | "gemini" | "claude" | "ollama";

export interface LlmConfig {
  /** Provedor pedido pelo cliente. O backend pode fazer fallback. */
  provider: LlmProviderId;
  /** Nome do modelo (ex: gpt-4o-mini, google/gemini-2.5-flash). */
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  streaming: boolean;
  retry: number;
  /** Cadeia de fallback caso o provedor pedido falhe/não esteja disponível. */
  fallback: LlmProviderId[];
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0.4,
  maxTokens: 1024,
  timeoutMs: 30_000,
  streaming: true,
  retry: 1,
  fallback: ["gemini"],
};

/**
 * Snapshot compacto do Centro de Inteligência que o cliente envia ao
 * backend a cada requisição. Como o CI mora em localStorage (trava
 * `frontend-only-lock`), o próprio cliente é quem coleta e envia. O
 * backend nunca acessa esse conhecimento por conta própria.
 */
export interface BrainKnowledgeItem {
  title: string;
  body: string;
  tags?: string[];
}

export interface BrainSnapshot {
  /** Prompt Mestre ativo (concatenação dos itens marcados como ativos). */
  promptMaster: string;
  /** Regras curtas de comportamento. */
  rules: BrainKnowledgeItem[];
  services: BrainKnowledgeItem[];
  plans: BrainKnowledgeItem[];
  niches: BrainKnowledgeItem[];
  modules: BrainKnowledgeItem[];
  faq: BrainKnowledgeItem[];
  knowledge: BrainKnowledgeItem[];
  /** Aprendizados já aprovados que devem entrar no contexto permanente. */
  approvedLearnings: BrainKnowledgeItem[];
  /** Versão numérica atual do prompt (para telemetria). */
  promptVersion?: number;
}

export interface ImpulsionitoRequestContext {
  pathname?: string;
  screen?: string;
  /** "web" | "crm" | "whatsapp" | ... */
  channel?: string;
  audience?: string;
  tenant?: string;
  userProfile?: string;
}

export interface ImpulsionitoWireMessage {
  role: "user" | "assistant" | "system";
  text: string;
}

export interface ImpulsionitoChatRequestBody {
  messages: ImpulsionitoWireMessage[];
  context?: ImpulsionitoRequestContext;
  brain?: BrainSnapshot;
  llm?: Partial<LlmConfig>;
}
