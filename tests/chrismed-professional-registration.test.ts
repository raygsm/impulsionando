import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEALTH_PROFESSIONS,
  validateProfessionalRegistration,
} from "../src/lib/chrismed-professionals";

const CASES = [
  ["medico", "CRM"],
  ["psicologo", "CRP"],
  ["fisioterapeuta", "CREFITO"],
  ["nutricionista", "CRN"],
  ["enfermeiro", "COREN"],
  ["dentista", "CRO"],
] as const;

describe("cadastro multiprofissional CHRISMED", () => {
  it.each(CASES)("aceita %s com o conselho %s", (slug, council) => {
    const profession = DEFAULT_HEALTH_PROFESSIONS.find((item) => item.slug === slug) ?? null;
    expect(profession?.councilAcronym).toBe(council);
    expect(
      validateProfessionalRegistration({
        profession,
        councilNumber: "123456",
        primaryArea: "Atendimento clínico",
      }),
    ).toBeNull();
  });

  it.each(CASES)("impede %s sem registro profissional", (slug) => {
    const profession = DEFAULT_HEALTH_PROFESSIONS.find((item) => item.slug === slug) ?? null;
    expect(
      validateProfessionalRegistration({
        profession,
        councilNumber: "",
        primaryArea: "Atendimento clínico",
      }),
    ).toContain("Informe seu registro");
  });

  it("mantém profissões sem conselho obrigatório cadastráveis", () => {
    const profession = DEFAULT_HEALTH_PROFESSIONS.find((item) => item.slug === "terapeuta") ?? null;
    expect(
      validateProfessionalRegistration({
        profession,
        councilNumber: "",
        primaryArea: "Terapia integrativa",
      }),
    ).toBeNull();
  });
});
