export type HealthProfession = {
  id: string;
  slug: string;
  name: string;
  councilAcronym: string | null;
  councilRequired: boolean;
};

export type HealthSpecialty = {
  id: string;
  professionId: string;
  name: string;
  parentId: string | null;
};

export const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";
export const CHRISMED_ONBOARDING_PATH = "/chrismed/profissional/onboarding";

/**
 * Fallback de disponibilidade. A fonte de verdade é health_professions no
 * Supabase; o fallback mantém o cadastro utilizável durante uma indisponibilidade.
 */
export const DEFAULT_HEALTH_PROFESSIONS: HealthProfession[] = [
  ["medico", "Médico", "CRM", true],
  ["dentista", "Dentista", "CRO", true],
  ["psicologo", "Psicólogo", "CRP", true],
  ["nutricionista", "Nutricionista", "CRN", true],
  ["enfermeiro", "Enfermeiro", "COREN", true],
  ["tecnico-enfermagem", "Técnico de Enfermagem", "COREN", true],
  ["fisioterapeuta", "Fisioterapeuta", "CREFITO", true],
  ["fonoaudiologo", "Fonoaudiólogo", "CREFONO", true],
  ["terapeuta-ocupacional", "Terapeuta Ocupacional", "CREFITO", true],
  ["farmaceutico", "Farmacêutico", "CRF", true],
  ["biomedico", "Biomédico", "CRBM", true],
  ["educador-fisico", "Educador Físico", "CREF", true],
  ["medico-veterinario", "Médico Veterinário", "CRMV", true],
  ["assistente-social", "Assistente Social", "CRESS", true],
  ["terapeuta", "Terapeuta", null, false],
  ["acupunturista", "Acupunturista", null, false],
  ["quiropraxista", "Quiropraxista", null, false],
  ["osteopata", "Osteopata", null, false],
  ["podologo", "Podólogo", null, false],
].map(([slug, name, councilAcronym, councilRequired]) => ({
  id: String(slug),
  slug: String(slug),
  name: String(name),
  councilAcronym: councilAcronym ? String(councilAcronym) : null,
  councilRequired: Boolean(councilRequired),
}));

export const SEEDED_SPECIALTIES: Record<string, string[]> = {
  medico: ["Clínica Médica", "Cardiologia", "Dermatologia", "Ginecologia", "Pediatria"],
  psicologo: [
    "Psicologia Clínica",
    "Neuropsicologia",
    "Psicologia Infantil",
    "Psicologia Organizacional",
  ],
  fisioterapeuta: [
    "Fisioterapia Traumato-Ortopédica",
    "Fisioterapia Respiratória",
    "Fisioterapia Neurológica",
    "Fisioterapia Pélvica",
  ],
  nutricionista: [
    "Nutrição Clínica",
    "Nutrição Esportiva",
    "Nutrição Materno-Infantil",
    "Nutrição Comportamental",
  ],
  enfermeiro: ["Enfermagem Clínica", "Saúde da Família", "Urgência e Emergência", "Estomaterapia"],
};

export function validateProfessionalRegistration(input: {
  profession: HealthProfession | null;
  councilNumber: string;
  primaryArea: string;
}) {
  if (!input.profession) return "Selecione sua profissão.";
  if (input.profession.councilRequired && !input.councilNumber.trim()) {
    return `Informe seu registro no ${input.profession.councilAcronym}.`;
  }
  if (!input.primaryArea.trim()) return "Informe sua área principal de atendimento.";
  return null;
}

export function isChrismedHost(hostname: string) {
  return hostname.toLowerCase() === "chrismed.impulsionando.com.br";
}
