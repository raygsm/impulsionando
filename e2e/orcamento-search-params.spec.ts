import { test, expect } from "@playwright/test";

/**
 * Valida no DESTINO (/orcamento) que os SearchParams enviados pelo CTA
 * "Contratar White Label Acadêmico" chegam preservados e que o funil
 * renderiza o estado correspondente (página de orçamento ativa, com
 * a categoria White Label disponível para seleção).
 *
 * Complementa e2e/recomendacao-educacao-cta.spec.ts (que testa o
 * lado da origem) cobrindo o lado do destino — uma das partes pode
 * quebrar sem a outra (ex.: route validator stripando params).
 */

test.describe("/orcamento — recebe SearchParams white-label-educacao", () => {
  test("params chegam preservados via navegação direta + UI renderiza", async ({ page }) => {
    await page.goto(
      "/orcamento?segmento=white-label-educacao&origem=recomendacao-educacao",
      { waitUntil: "domcontentloaded" },
    );

    // 1) URL preserva ambos os params (validateSearch não os strippou).
    const url = new URL(page.url());
    expect(url.pathname).toBe("/orcamento");
    expect(url.searchParams.get("segmento")).toBe("white-label-educacao");
    expect(url.searchParams.get("origem")).toBe("recomendacao-educacao");

    // 2) Página do orçamento realmente renderiza (h1 visível).
    await expect(
      page.getByRole("heading", { level: 1, name: /Monte seu Orçamento/i }),
    ).toBeVisible();

    // 3) Funil avança/exibe seleções condizentes com White Label.
    //    Em qualquer etapa visível do wizard, o texto "White Label"
    //    deve estar presente como opção/seleção (categoria do segmento).
    const whiteLabelMentions = page.getByText(/White Label/i);
    await expect(whiteLabelMentions.first()).toBeVisible();
  });

  test("navegação real do CTA preserva params no destino", async ({ page }) => {
    // Origem → clique → destino, end-to-end (sem deep-link).
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const cta = page
      .locator('[data-vertical-offer="educacao"]')
      .getByRole("link", { name: /Contratar White Label Acadêmico/i });
    await cta.click();
    await page.waitForURL(/\/orcamento\?/);

    const url = new URL(page.url());
    expect(url.searchParams.get("segmento")).toBe("white-label-educacao");
    expect(url.searchParams.get("origem")).toBe("recomendacao-educacao");
    await expect(
      page.getByRole("heading", { level: 1, name: /Monte seu Orçamento/i }),
    ).toBeVisible();
  });
});
