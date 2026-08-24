export type EvidenceSource = "self" | "teacher" | "practice" | "longitudinal";

export type EvidencePoint = {
  source: EvidenceSource;
  dimension: string;
  score: number;
  observedAt: string;
  weight?: number;
};

export type DimensionSignal = {
  dimension: string;
  score: number | null;
  confidence: "low" | "moderate" | "high" | "very_high";
  sourceCount: number;
  sourceDiversity: number;
  divergence: boolean;
  explanation: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function calculateDimensionSignal(dimension: string, evidence: EvidencePoint[]): DimensionSignal {
  const points = evidence.filter((item) => item.dimension === dimension);
  if (!points.length) return { dimension, score: null, confidence: "low", sourceCount: 0, sourceDiversity: 0, divergence: false, explanation: "Ainda não há evidências suficientes. Vale experimentar e observar antes de concluir." };

  const weighted = points.map((p) => ({ ...p, w: p.weight ?? (p.source === "practice" ? 1.3 : p.source === "teacher" ? 1.1 : 1) }));
  const totalWeight = weighted.reduce((sum, p) => sum + p.w, 0);
  const score = clamp(weighted.reduce((sum, p) => sum + clamp(p.score) * p.w, 0) / totalWeight);
  const sources = new Set(points.map((p) => p.source));
  const values = points.map((p) => clamp(p.score));
  const spread = Math.max(...values) - Math.min(...values);
  const divergence = sources.size >= 2 && spread >= 25;
  const volume = Math.min(points.length / 6, 1);
  const diversity = sources.size / 4;
  const consistency = Math.max(0, 1 - spread / 100);
  const confidenceValue = volume * 0.35 + diversity * 0.4 + consistency * 0.25;
  const confidence = confidenceValue >= 0.82 ? "very_high" : confidenceValue >= 0.64 ? "high" : confidenceValue >= 0.42 ? "moderate" : "low";

  const explanation = divergence
    ? "Há percepções diferentes entre as fontes. Recomenda-se uma nova experiência estruturada antes de qualquer interpretação mais forte."
    : sources.size === 1
      ? "O sinal aparece, mas vem de uma única fonte. É necessário triangular com outras evidências."
      : "O sinal combina fontes diferentes e deve continuar sendo acompanhado ao longo do tempo.";

  return { dimension, score: Math.round(score), confidence, sourceCount: points.length, sourceDiversity: sources.size, divergence, explanation };
}

export function compareWithSelf(current: DimensionSignal, previous?: DimensionSignal) {
  if (current.score == null || previous?.score == null) return { delta: null, direction: "unknown" as const };
  const delta = current.score - previous.score;
  return { delta, direction: delta >= 8 ? "up" as const : delta <= -8 ? "down" as const : "stable" as const };
}
