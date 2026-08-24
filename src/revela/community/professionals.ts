export type ProfessionalKind = "hr" | "psychologist" | "educator" | "musician" | "music_educator" | "researcher" | "mentor" | "technical_specialist" | "other";

export type ProfessionalProfile = {
  id: string;
  name: string;
  kind: ProfessionalKind;
  companyId?: string;
  expertise: string[];
  territories: string[];
  contributionInterests: string[];
  verification: "unverified" | "identity_verified" | "credential_verified";
  status: "registered" | "candidate" | "under_review" | "approved" | "inactive";
};

export type CommitteeReview = {
  subjectType: "professional" | "company" | "project" | "partnership";
  subjectId: string;
  evidence: string[];
  reviewers: string[];
  recommendation: "approve" | "request_changes" | "decline" | "defer";
  rationale: string;
  reviewedAt: string;
};

export const professionalOnboarding = [
  "identity",
  "professional_context",
  "optional_company_association",
  "expertise_and_evidence",
  "contribution_interests",
  "availability",
  "ethics_and_data_terms",
  "community_participation",
  "optional_revela_team_application",
] as const;

export const committeeRules = [
  "Approval requires evidence and recorded rationale.",
  "Independent and company-linked professionals may participate.",
  "Community participation and REVELA Team approval are separate statuses.",
  "Committee decisions are auditable and may request more evidence before approval.",
  "Students remain under school and guardian governance when applicable.",
] as const;
