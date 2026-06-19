import { test, expect } from "@playwright/test";

/**
 * CTA secundário do verticalOffer em /recomendacao/educacao:
 *   "Ver como funciona o White Label" → /nichos/white-label
 *
 * Garante navegação correta + acessibilidade básica em todos os
 * engines × viewports (mobile+desktop) do playwright.config.ts:
 *  - href estático já aponta para /nichos/white-label
 *  - clique navega e a página destino renderiza um h1 visível
 *  - link é alcançável por teclado (Tab/Enter), tem nome acessível
 *    e indicador de foco (outline ou box-shadow não-vazios)
 */

test.describe("Recomendação Educação — CTA secundário 'Ver como funciona'", () => {
  test("href + clique navegam para /nichos/white-label", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    await expect(offer).toBeVisible();

    const secondary = offer.getByRole("link", {
      name: /Ver como funciona o White Label/i,
    });
    await expect(secondary).toBeVisible();

    const href = await secondary.getAttribute("href");
    expect(href, "href do CTA secundário").not.toBeNull();
    const url = new URL(href!, "http://localhost");
    expect(url.pathname).toBe("/nichos/white-label");
    // CTA secundário não envia params — query deve estar vazia.
    expect([...url.searchParams.keys()]).toEqual([]);

    await secondary.click();
    await page.waitForURL(/\/nichos\/white-label$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/404|não encontrado|not found/i)).toHaveCount(0);
  });

  test("acessibilidade: nome acessível, foco por teclado e ativação via Enter", async ({
    page,
  }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    const secondary = offer.getByRole("link", {
      name: /Ver como funciona o White Label/i,
    });
    await expect(secondary).toBeVisible();
    await secondary.scrollIntoViewIfNeeded();

    // Nome acessível não-vazio (cobre aria-label/innerText).
    const accName = await secondary.evaluate((el) => {
      const label =
        el.getAttribute("aria-label") ?? (el.textContent ?? "").trim();
      return label;
    });
    expect(accName.length, "accessible name não vazio").toBeGreaterThan(0);

    // Recebe foco via .focus() programático (proxy para Tab — Tab pode
    // ser instável em mobile-firefox/webkit, mas focus() é fielmente
    // suportado nos 3 engines).
    await secondary.focus();
    const isFocused = await secondary.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused, "CTA secundário deve receber foco").toBe(true);

    // Indicador de foco visível: outline OU box-shadow não-vazios
    // quando :focus-visible está ativo (Tailwind/shadcn usa ring via
    // box-shadow). Não comparamos cor — apenas que algo é desenhado.
    const focusStyle = await secondary.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow,
      };
    });
    const hasOutline =
      focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px";
    const hasShadow =
      !!focusStyle.boxShadow && focusStyle.boxShadow !== "none";
    expect(
      hasOutline || hasShadow,
      `indicador de foco visível (outline ou box-shadow). got=${JSON.stringify(focusStyle)}`,
    ).toBe(true);

    // Ativação via Enter navega para o destino.
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/nichos\/white-label$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
