import { describe, expect, it, vi } from "vitest";
import { alimentacaoRestaurante } from "@/data/demo-templates/alimentacao-restaurante";
import { buildDemoSiteDraft } from "@/lib/demo-site-draft";

describe("buildDemoSiteDraft", () => {
  it("gera rascunho coerente com template e qualificação do cliente", () => {
    vi.setSystemTime(new Date("2026-07-14T12:00:00.000Z"));

    const draft = buildDemoSiteDraft(alimentacaoRestaurante, {
      name: "Rafael",
      email: "rafael@bella.com.br",
      phone: "(21) 99999-9999",
      company: "Bella Norte",
      city: "Niterói",
      teamSize: "11-25",
      monthlyRevenue: "R$ 80k-150k",
      goal: "aumentar reservas e recompra",
      planLabel: "Ideal",
    });

    expect(draft.templateId).toBe("alimentacao-restaurante");
    expect(draft.companyName).toBe("Bella Norte");
    expect(draft.hero.subtitle).toContain("Niterói");
    expect(draft.hero.subtitle).toContain("aumentar reservas e recompra");
    expect(draft.sections).toHaveLength(4);
    expect(draft.seo.title).toContain("Bella Norte");
  });
});