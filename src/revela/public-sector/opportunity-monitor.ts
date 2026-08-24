export type PublicOpportunity = {
  id: string;
  title: string;
  authority: string;
  sourceUrl: string;
  publishedAt?: string;
  deadline?: string;
  territory?: string[];
  applicantTypes: string[];
  themes: string[];
  budgetMin?: number;
  budgetMax?: number;
  status: "open" | "upcoming" | "closed" | "unknown";
  verifiedAt: string;
};

export type SchoolFundingProfile = {
  schoolId: string;
  applicantType: string;
  territory: { city: string; state: string };
  themes: string[];
  requestedBudget?: number;
};

export type FundingMatch = {
  opportunityId: string;
  score: number;
  reasons: string[];
  blockers: string[];
  action: "monitor" | "prepare" | "eligible_review" | "not_fit";
};

export function scoreFundingOpportunity(profile: SchoolFundingProfile, opportunity: PublicOpportunity): FundingMatch {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (opportunity.status !== "open" && opportunity.status !== "upcoming") {
    blockers.push("Oportunidade não está aberta ou prevista como próxima.");
  }

  if (opportunity.applicantTypes.includes(profile.applicantType)) {
    score += 35;
    reasons.push("Tipo de proponente compatível.");
  } else {
    blockers.push("Tipo de proponente ainda não confirmado como elegível.");
  }

  const themeOverlap = profile.themes.filter(theme => opportunity.themes.includes(theme));
  if (themeOverlap.length) {
    score += Math.min(35, themeOverlap.length * 10);
    reasons.push(`Aderência temática: ${themeOverlap.join(", ")}.`);
  }

  if (!opportunity.territory || opportunity.territory.length === 0 || opportunity.territory.includes(profile.territory.state) || opportunity.territory.includes("BR")) {
    score += 15;
    reasons.push("Território potencialmente compatível.");
  } else {
    blockers.push("Território não compatível com a regra registrada.");
  }

  if (profile.requestedBudget && opportunity.budgetMax) {
    if (profile.requestedBudget <= opportunity.budgetMax) {
      score += 15;
      reasons.push("Faixa de orçamento preliminar compatível.");
    } else {
      blockers.push("Orçamento solicitado supera o teto registrado.");
    }
  }

  const action: FundingMatch["action"] = blockers.length >= 2 ? "not_fit" : score >= 70 ? "eligible_review" : score >= 45 ? "prepare" : "monitor";
  return { opportunityId: opportunity.id, score: Math.min(100, score), reasons, blockers, action };
}
