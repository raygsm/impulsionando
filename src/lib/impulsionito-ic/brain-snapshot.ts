/**
 * Coletor client-side do "cérebro" do Impulsionito.
 *
 * Lê o Centro de Inteligência do localStorage (mesmas chaves usadas por
 * `useICItems`, `useLearnings`, `usePromptVersions`) e monta o
 * `BrainSnapshot` que o transport envia junto a cada mensagem.
 *
 * Vive no cliente por causa da trava `frontend-only-lock` (o CI ainda é
 * localStorage). Nenhuma leitura server-side é feita.
 */
import type { BrainKnowledgeItem, BrainSnapshot } from "@/lib/impulsionito/types";
import type { ICItem, ICSectionKey, Learning, PromptVersion } from "./types";
import { SEED_ITEMS, SEED_LEARNINGS, SEED_PROMPT_VERSIONS } from "./seed";

const NS = "impulsionito-ic-v1";

function readSection(section: ICSectionKey): ICItem[] {
  if (typeof window === "undefined") return SEED_ITEMS[section] ?? [];
  try {
    const raw = window.localStorage.getItem(`${NS}:items:${section}`);
    if (!raw) return SEED_ITEMS[section] ?? [];
    return JSON.parse(raw) as ICItem[];
  } catch {
    return SEED_ITEMS[section] ?? [];
  }
}

function readLearnings(): Learning[] {
  if (typeof window === "undefined") return SEED_LEARNINGS;
  try {
    const raw = window.localStorage.getItem(`${NS}:learnings`);
    return raw ? (JSON.parse(raw) as Learning[]) : SEED_LEARNINGS;
  } catch {
    return SEED_LEARNINGS;
  }
}

function readPromptVersions(): PromptVersion[] {
  if (typeof window === "undefined") return SEED_PROMPT_VERSIONS;
  try {
    const raw = window.localStorage.getItem(`${NS}:prompt-versions`);
    return raw ? (JSON.parse(raw) as PromptVersion[]) : SEED_PROMPT_VERSIONS;
  } catch {
    return SEED_PROMPT_VERSIONS;
  }
}

function mapItems(items: ICItem[]): BrainKnowledgeItem[] {
  return items
    .filter((i) => i.status === "ativo")
    .map((i) => ({ title: i.title, body: i.body, tags: i.tags }));
}

export function collectBrainSnapshot(): BrainSnapshot {
  const promptItems = readSection("prompt-mestre").filter((i) => i.status === "ativo");
  const promptMaster = promptItems.map((i) => i.body).join("\n\n").trim();
  const versions = readPromptVersions();
  const activeVersion = versions.find((v) => v.activated)?.version;

  const approvedLearnings: BrainKnowledgeItem[] = readLearnings()
    .filter((l) => l.status === "aprovado" || l.status === "convertido")
    .slice(0, 20)
    .map((l) => ({
      title: l.summary,
      body: l.suggestedAnswer ?? l.transcript,
      tags: [l.kind],
    }));

  return {
    promptMaster,
    rules: mapItems(readSection("regras-agente")),
    services: mapItems(readSection("servicos")),
    plans: mapItems(readSection("planos")),
    niches: mapItems(readSection("nichos")),
    modules: mapItems(readSection("modulos")),
    faq: mapItems(readSection("faq")),
    knowledge: mapItems(readSection("base-conhecimento")),
    approvedLearnings,
    promptVersion: activeVersion,
  };
}
