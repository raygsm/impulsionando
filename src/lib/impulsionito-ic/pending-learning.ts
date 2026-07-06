/**
 * Captura de aprendizados pendentes.
 *
 * Toda conversa gera automaticamente um rascunho de aprendizado que vai
 * para Administração → Impulsionito → Centro de Inteligência → Aprendizados.
 * Nada entra na Base sem aprovação humana (aprovar / rejeitar / editar /
 * transformar em FAQ, script, conhecimento etc.).
 */
import type { Learning, LearningKind } from "./types";

const NS = "impulsionito-ic-v1";
const KEY = `${NS}:learnings`;

function detectKind(question: string): LearningKind {
  const t = question.toLowerCase();
  if (/(preço|preco|custa|caro|barato|desconto)/.test(t)) return "objecao";
  if (/(gostei|amei|excelente|top|parabéns|parabens)/.test(t)) return "elogio";
  if (/(bug|erro|não funciona|nao funciona|falhou|quebrou)/.test(t)) return "reclamacao";
  if (/(poderia ter|seria bom|falta|precisava)/.test(t)) return "pedido_funcionalidade";
  if (/(sugiro|sugestão|sugestao|ideia)/.test(t)) return "sugestao";
  return "duvida_recorrente";
}

export interface PendingLearningInput {
  question: string;
  answer: string;
  tenant?: string;
  page?: string;
  userProfile?: string;
  channel?: string;
}

export function pushPendingLearning(input: PendingLearningInput): void {
  if (typeof window === "undefined") return;
  const q = input.question.trim();
  const a = input.answer.trim();
  if (!q || !a) return;

  try {
    const raw = window.localStorage.getItem(KEY);
    const current: Learning[] = raw ? (JSON.parse(raw) as Learning[]) : [];

    const nowIso = new Date().toISOString();
    const summary = q.length > 120 ? `${q.slice(0, 117)}…` : q;

    // Deduplicação simples: pergunta idêntica em <24h → só incrementa frequency.
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const dup = current.find(
      (l) =>
        l.status === "pendente" &&
        l.summary.toLowerCase() === summary.toLowerCase() &&
        new Date(l.detectedAt).getTime() > cutoff,
    );
    if (dup) {
      const next = current.map((l) =>
        l.id === dup.id ? { ...l, frequency: l.frequency + 1, detectedAt: nowIso } : l,
      );
      window.localStorage.setItem(KEY, JSON.stringify(next));
      return;
    }

    const created: Learning = {
      id: `ap-auto-${Date.now().toString(36)}`,
      kind: detectKind(q),
      summary,
      transcript: `P: ${q}\nR: ${a.slice(0, 400)}${a.length > 400 ? "…" : ""}`,
      suggestedAnswer: a.slice(0, 400),
      origin: {
        tenant: input.tenant,
        page: input.page,
        userProfile: input.userProfile,
        channel: input.channel ?? "web",
      },
      detectedAt: nowIso,
      frequency: 1,
      status: "pendente",
    };
    window.localStorage.setItem(KEY, JSON.stringify([created, ...current]));
  } catch {
    /* noop — captura de aprendizado nunca deve quebrar o dock */
  }
}
