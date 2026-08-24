export type CapacityArea = "music" | "arts" | "science" | "technology" | "making" | "communication" | "service" | "entrepreneurship";

export type CapacityEvidence = {
  area: CapacityArea;
  students: number;
  totalStudents: number;
  repeatedPeriods: number;
  practicalEvidenceRate: number;
  currentSeats: number;
};

export type CapacityPlan = {
  area: CapacityArea;
  stage: "observe" | "pilot" | "expand" | "permanent";
  recommendedSeats: number;
  utilizationGap: number;
  rationale: string[];
  nextReviewDays: number;
};

export function createCapacityPlan(evidence: CapacityEvidence): CapacityPlan {
  const interestRate = evidence.totalStudents ? evidence.students / evidence.totalStudents : 0;
  const demonstrated = evidence.practicalEvidenceRate >= 0.5;
  const persistent = evidence.repeatedPeriods >= 2;

  let stage: CapacityPlan["stage"] = "observe";
  if (interestRate >= 0.08 && persistent) stage = "pilot";
  if (interestRate >= 0.15 && persistent && demonstrated) stage = "expand";
  if (interestRate >= 0.25 && evidence.repeatedPeriods >= 3 && demonstrated) stage = "permanent";

  const demandSeats = Math.ceil(evidence.students * (stage === "observe" ? 0.25 : stage === "pilot" ? 0.4 : stage === "expand" ? 0.65 : 0.8));
  const recommendedSeats = Math.max(0, demandSeats);

  return {
    area: evidence.area,
    stage,
    recommendedSeats,
    utilizationGap: Math.max(0, recommendedSeats - evidence.currentSeats),
    rationale: [
      `${Math.round(interestRate * 100)}% dos estudantes apresentam interesse registrado.`,
      `Sinal observado em ${evidence.repeatedPeriods} período(s).`,
      `${Math.round(evidence.practicalEvidenceRate * 100)}% possuem alguma evidência prática relacionada.`,
      "O dimensionamento é recomendação para teste e revisão; não representa diagnóstico vocacional.",
    ],
    nextReviewDays: stage === "observe" ? 30 : 90,
  };
}

export const musicRoomGuidance = {
  objective: "Permitir descoberta e prática musical individual e coletiva com implantação modular.",
  zones: ["prática coletiva", "prática individual/dupla", "instrumentos e armazenamento", "escuta/gravação simples", "circulação acessível"],
  rules: [
    "Dimensionar por turmas simultâneas, não pelo total de interessados.",
    "Começar por um piloto quando a evidência ainda não for longitudinal.",
    "Priorizar variedade de experiências antes de compra em grande escala de um único instrumento.",
    "Prever acústica, ventilação, acessibilidade, segurança, guarda e manutenção.",
    "Validar layout, instalações e normas locais com profissionais habilitados antes da obra.",
  ],
  starterExperiences: ["voz/coral", "percussão", "teclado", "violão", "sopros", "criação digital", "produção/gravação"],
} as const;
