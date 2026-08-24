export type ReportDataMode = "real" | "synthetic_demo";

export const reportPresentationPolicy = {
  real: {
    badge: "DADOS REAIS",
    requirements: ["authorized_source", "freshness_timestamp", "privacy_scope", "methodology_version"],
    rule: "Never alter values for visual impact. Missing data remains missing.",
  },
  synthetic_demo: {
    badge: "DEMONSTRAÇÃO — DADOS FICTÍCIOS",
    requirements: ["visible_demo_badge", "no_real_person_identity", "plausible_but_not_claimed_outcomes"],
    rule: "Synthetic examples must never be presented as pilot, school, student or company results.",
  },
  charts: {
    student: ["timeline", "experience_map", "pre_post", "evidence_cards"],
    teacher: ["change_timeline", "evidence_triangle", "opportunity_gap", "cohort_aggregate"],
    company: ["job_dimension_profile", "evidence_matrix", "learning_curve", "match_explanation"],
    master: ["cohort", "funnel", "sankey", "trend", "opportunity_gap", "quality_metrics"],
  },
  interpretation: [
    "Charts describe evidence in context; they do not rank human worth.",
    "Introversion/extroversion, creativity/rationality and similar characteristics are contextual—not good/bad axes.",
    "Employer-facing views must connect each requested characteristic to observable job behavior and a legitimate task need.",
    "Always show uncertainty, data source and period when a chart can influence a decision.",
  ],
} as const;

export const exampleCompanyInsight = {
  title: "O que esta oportunidade realmente pede?",
  explanation: "Em vez de procurar uma personalidade ideal, o REVELA traduz o trabalho em comportamentos observáveis e evidências necessárias.",
  examples: [
    { need: "Atendimento sob conflito", evidence: "escuta, regulação, clareza e recuperação após objeção" },
    { need: "Análise operacional", evidence: "detecção de padrão, precisão, sequência e decisão com dados" },
    { need: "Criação de produto", evidence: "curiosidade, geração de alternativas, prototipagem e aprendizagem com feedback" },
    { need: "Rotina de alta precisão", evidence: "consistência, atenção, processo e responsabilidade; extroversão não é requisito" },
  ],
} as const;
