import { test, expect } from "@playwright/test";

/**
 * E2E do CTA "Contratar White Label Acadêmico" na rota
 * /recomendacao/educacao. Garante que ao clicar navega para /orcamento
 * carregando os SearchParams corretos:
 *   - segmento=white-label-educacao
 *   - origem=recomendacao-educacao
 *
 * Roda em todos os projects do playwright.config.ts, então cobre
 * automaticamente mobile + desktop nos 3 engines (Chromium/Firefox/WebKit).
 */

test.describe("Recomendação Educação — CTA White Label Acadêmico", () => {
  test("clicar no CTA principal navega para /orcamento com search params", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });

    const offer = page.locator('[data-vertical-offer="educacao"]');
    await expect(offer).toBeVisible();

    const cta = offer.getByRole("link", { name: /Contratar White Label Acadêmico/i });
    await expect(cta).toBeVisible();

    // Validação 1 (estática): o href já carrega os params corretos antes
    // mesmo do clique — protege contra regressão na serialização do Link.
    const href = await cta.getAttribute("href");
    expect(href, "href do CTA").not.toBeNull();
    const url = new URL(href!, "http://localhost");
    expect(url.pathname).toBe("/orcamento");
    expect(url.searchParams.get("segmento")).toBe("white-label-educacao");
    expect(url.searchParams.get("origem")).toBe("recomendacao-educacao");

    // Validação 2 (runtime): clicar realmente navega com os params.
    await cta.click();
    await page.waitForURL(/\/orcamento\?/);
    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).toBe("/orcamento");
    expect(finalUrl.searchParams.get("segmento")).toBe("white-label-educacao");
    expect(finalUrl.searchParams.get("origem")).toBe("recomendacao-educacao");
  });

  test("CTA secundário aponta para /nichos/white-label", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    const secondary = offer.getByRole("link", { name: /White Label/i }).last();
    const href = await secondary.getAttribute("href");
    expect(href).toMatch(/\/nichos\/white-label$/);
  });
});
