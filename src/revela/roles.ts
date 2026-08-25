export const revelaRoles = [
  "impulsionando_master",
  "revela_admin",
  "network_admin",
  "school_admin",
  "committee",
  "teacher",
  "company",
  "independent_professional",
  "student",
  "guardian",
  "researcher",
] as const;

export type RevelaRole = (typeof revelaRoles)[number];

export const roleHome: Record<RevelaRole, string> = {
  impulsionando_master: "/revela/master",
  revela_admin: "/revela/admin",
  network_admin: "/revela/rede",
  school_admin: "/revela/escola",
  committee: "/revela/comite",
  teacher: "/revela/professor",
  company: "/revela/empresa",
  independent_professional: "/revela/profissional",
  student: "/revela/aluno",
  guardian: "/revela/responsavel",
  researcher: "/revela/pesquisa",
};

export const roleCapabilities: Record<RevelaRole, string[]> = {
  impulsionando_master: ["global:*", "audit:read", "methodology:manage", "tenant:manage", "journey:manage", "template:manage"],
  revela_admin: ["revela:manage", "methodology:review", "reports:read"],
  network_admin: ["network:read", "schools:manage", "aggregate:read"],
  school_admin: ["school:manage", "students:manage", "teachers:manage", "committee:manage"],
  committee: ["student:review", "recommendation:review", "exploration_plan:manage"],
  teacher: ["student:observe", "class:read", "recommendation:read"],
  company: ["opportunity:manage", "challenge:manage", "authorized_profile:read"],
  independent_professional: ["profile:manage", "committee:apply", "research:participate", "availability:manage", "contribution:create"],
  student: ["self:read", "self:answer", "self:consent", "self:share"],
  guardian: ["minor:consent", "minor:allowed_read"],
  researcher: ["anonymous_aggregate:read"],
};

export function hasCapability(role: RevelaRole, capability: string) {
  const grants = roleCapabilities[role] ?? [];
  return grants.includes("global:*") || grants.includes(capability);
}
