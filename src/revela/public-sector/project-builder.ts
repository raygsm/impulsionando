export type PublicFundingProgram = {
  id: string;
  name: string;
  authority: string;
  legalBasis: string[];
  eligibleApplicants: string[];
  allowedExpenses: string[];
  prohibitedExpenses: string[];
  requiredDocuments: string[];
  submissionChannel: string;
  deadline?: string;
  currentRulesVerifiedAt: string;
};

export type SchoolProjectInput = {
  schoolId: string;
  schoolName: string;
  applicantType: string;
  territory: { city: string; state: string };
  studentCount: number;
  evidenceSummary: string;
  problem: string;
  objectives: string[];
  recommendations: Array<{ area: string; rationale: string; capexMin: number; capexMax: number; opexMonthlyMin: number; opexMonthlyMax: number }>;
  targetIndicators: string[];
};

export type PublicProjectDraft = {
  title: string;
  diagnosis: string;
  publicInterest: string;
  objectives: string[];
  targetAudience: string;
  methodology: string[];
  workPlan: Array<{ deliverable: string; evidence: string; timing: string }>;
  budget: { capexRange: [number, number]; annualOpexRange: [number, number]; requiresQuotes: boolean };
  indicators: string[];
  accountabilityPlan: string[];
  complianceChecklist: string[];
  status: "draft_requires_human_legal_review";
};

export function buildPublicProjectDraft(input: SchoolProjectInput, program: PublicFundingProgram): PublicProjectDraft {
  const capexMin = input.recommendations.reduce((sum, item) => sum + item.capexMin, 0);
  const capexMax = input.recommendations.reduce((sum, item) => sum + item.capexMax, 0);
  const opexMin = input.recommendations.reduce((sum, item) => sum + item.opexMonthlyMin * 12, 0);
  const opexMax = input.recommendations.reduce((sum, item) => sum + item.opexMonthlyMax * 12, 0);

  return {
    title: `REVELA — Plano de oportunidades e desenvolvimento de potenciais — ${input.schoolName}`,
    diagnosis: `${input.problem}\n\nEvidências consolidadas pelo REVELA: ${input.evidenceSummary}`,
    publicInterest: "Ampliar oportunidades educacionais baseadas em evidências, aproximar formação, cidadania e mundo do trabalho e reduzir lacunas de acesso a experiências formativas relevantes.",
    objectives: input.objectives,
    targetAudience: `${input.studentCount} estudantes da unidade, com implantação dimensionada por interesse observado, capacidade atual e critérios de equidade.`,
    methodology: [
      "escuta longitudinal de estudantes",
      "observação docente estruturada",
      "experiências práticas pré e pós avaliadas",
      "comitê humano de acompanhamento",
      "monitoramento de indicadores e revisão trimestral",
      "prestação de contas física e financeira vinculada a entregáveis",
    ],
    workPlan: input.recommendations.map((item, index) => ({
      deliverable: `${index + 1}. Implantar capacidade em ${item.area}`,
      evidence: item.rationale,
      timing: index === 0 ? "0–90 dias" : "90–180 dias",
    })),
    budget: { capexRange: [capexMin, capexMax], annualOpexRange: [opexMin, opexMax], requiresQuotes: true },
    indicators: input.targetIndicators,
    accountabilityPlan: [
      "vincular cada despesa ao item elegível e à fonte do recurso",
      "armazenar documentos fiscais, cotações, aprovações e evidências de entrega",
      "registrar execução física e financeira separadamente",
      "comparar indicadores pré/pós sem fabricar causalidade",
      "gerar pacote de prestação de contas conforme regra vigente do programa",
    ],
    complianceChecklist: [
      `confirmar elegibilidade do proponente em ${program.name}`,
      "revalidar legislação, resolução, edital, prazo e saldo antes da submissão",
      "validar despesas de custeio e capital separadamente",
      "verificar impedimentos, inadimplências e situação de prestação de contas",
      "obter aprovação do responsável legal pela entidade",
      "submeter minuta à revisão jurídica/contábil humana antes do protocolo",
      `protocolar somente pelo canal oficial: ${program.submissionChannel}`,
    ],
    status: "draft_requires_human_legal_review",
  };
}
