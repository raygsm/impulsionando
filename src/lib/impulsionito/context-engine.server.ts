/**
 * Motor de Contexto — server-only.
 *
 * Monta dinamicamente o prompt final a cada requisição, combinando:
 *   - Conhecimento Permanente   → Prompt Mestre + Regras + Aprendizados aprovados
 *   - Conhecimento Temporário   → Serviços, Planos, Módulos, Nichos, FAQ, Base
 *   - Contexto Atual            → Tenant, página, canal, perfil, audiência
 *   - Histórico da Conversa     → últimas mensagens
 *
 * NENHUM prompt fixo é definido em código de negócio: se o `BrainSnapshot`
 * vier vazio, o motor emite um esqueleto neutro e sinaliza fallback.
 */
import type {
  BrainKnowledgeItem,
  BrainSnapshot,
  ImpulsionitoRequestContext,
} from "./types";

const MAX_ITEMS_PER_SECTION = 24;
const MAX_ITEM_BODY_CHARS = 480;

function truncate(text: string, max = MAX_ITEM_BODY_CHARS): string {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function renderItems(label: string, items: BrainKnowledgeItem[] | undefined): string {
  if (!items || items.length === 0) return "";
  const list = items.slice(0, MAX_ITEMS_PER_SECTION).map((it) => {
    const tags = it.tags && it.tags.length ? ` [${it.tags.join(", ")}]` : "";
    return `- ${it.title}${tags}: ${truncate(it.body)}`;
  });
  return `\n## ${label}\n${list.join("\n")}`;
}

function renderContext(ctx: ImpulsionitoRequestContext | undefined): string {
  if (!ctx) return "";
  const lines: string[] = [];
  if (ctx.tenant) lines.push(`- Tenant: ${ctx.tenant}`);
  if (ctx.channel) lines.push(`- Canal: ${ctx.channel}`);
  if (ctx.pathname) lines.push(`- Rota atual: ${ctx.pathname}`);
  if (ctx.screen) lines.push(`- Tela: ${ctx.screen}`);
  if (ctx.audience) lines.push(`- Audiência: ${ctx.audience}`);
  if (ctx.userProfile) lines.push(`- Perfil do usuário: ${ctx.userProfile}`);
  if (lines.length === 0) return "";
  return `\n## Contexto Atual\n${lines.join("\n")}`;
}

export interface AssembledPrompt {
  system: string;
  meta: {
    promptVersion?: number;
    hasBrain: boolean;
    sections: Record<string, number>;
  };
}

const FALLBACK_CORE = [
  "Você é o Impulsionito, agente central do Core Impulsionando.",
  "Fale em português do Brasil, tom direto, gentil e objetivo.",
  "Nunca invente serviços, planos, preços ou módulos — se o Conhecimento anexado não trouxer a resposta, ofereça abrir chamado humano.",
  "Não peça dados sensíveis (senha, cartão, CPF completo).",
].join("\n");

export function assemblePrompt(
  brain: BrainSnapshot | undefined,
  context: ImpulsionitoRequestContext | undefined,
): AssembledPrompt {
  const hasBrain = !!brain && (
    !!brain.promptMaster ||
    (brain.rules?.length ?? 0) > 0 ||
    (brain.services?.length ?? 0) > 0 ||
    (brain.plans?.length ?? 0) > 0 ||
    (brain.modules?.length ?? 0) > 0 ||
    (brain.niches?.length ?? 0) > 0 ||
    (brain.faq?.length ?? 0) > 0 ||
    (brain.knowledge?.length ?? 0) > 0 ||
    (brain.approvedLearnings?.length ?? 0) > 0
  );

  const parts: string[] = [];

  // ── Conhecimento Permanente ──────────────────────────────────────
  parts.push("# Conhecimento Permanente");
  parts.push(
    brain?.promptMaster?.trim()
      ? brain.promptMaster.trim()
      : FALLBACK_CORE,
  );
  parts.push(renderItems("Regras do Agente", brain?.rules));
  parts.push(renderItems("Aprendizados Aprovados", brain?.approvedLearnings));

  // ── Conhecimento Temporário ──────────────────────────────────────
  const temp = [
    renderItems("Serviços", brain?.services),
    renderItems("Planos", brain?.plans),
    renderItems("Módulos", brain?.modules),
    renderItems("Nichos", brain?.niches),
    renderItems("FAQ", brain?.faq),
    renderItems("Base de Conhecimento", brain?.knowledge),
  ].filter(Boolean).join("");
  if (temp) {
    parts.push("\n# Conhecimento Temporário (sessão)");
    parts.push(temp);
  }

  // ── Contexto atual ───────────────────────────────────────────────
  const ctx = renderContext(context);
  if (ctx) {
    parts.push("\n# Ambiente");
    parts.push(ctx);
  }

  // ── Comportamento ────────────────────────────────────────────────
  parts.push([
    "",
    "# Comportamento",
    "- Responda em até 4 parágrafos curtos ou uma lista curta.",
    "- Cite APENAS o que está no Conhecimento acima; nunca invente preços, prazos ou integrações.",
    "- Se a pergunta exigir ação que depende de outro módulo (agenda, financeiro, WhatsApp), oriente o caminho no menu — não afirme que executou.",
    "- Encerre sugerindo o próximo passo dentro do funil (captar → converter → relacionar → reter → expandir) quando fizer sentido.",
  ].join("\n"));

  return {
    system: parts.join("\n"),
    meta: {
      promptVersion: brain?.promptVersion,
      hasBrain,
      sections: {
        rules: brain?.rules?.length ?? 0,
        services: brain?.services?.length ?? 0,
        plans: brain?.plans?.length ?? 0,
        modules: brain?.modules?.length ?? 0,
        niches: brain?.niches?.length ?? 0,
        faq: brain?.faq?.length ?? 0,
        knowledge: brain?.knowledge?.length ?? 0,
        approvedLearnings: brain?.approvedLearnings?.length ?? 0,
      },
    },
  };
}
