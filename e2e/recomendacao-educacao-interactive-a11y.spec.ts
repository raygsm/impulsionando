import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Auditoria axe complementar focada em:
 *  1. Banner contextual do /orcamento (segmento white-label-educacao):
 *     contraste, semântica, role e nome acessível.
 *  2. verticalOffer em /recomendacao/educacao nos ESTADOS interativos
 *     (hover e focus dos CTAs principal e secundário). Estados pseudo
 *     (:hover/:focus-visible) podem ter contraste pior que o default —
 *     rodamos axe DEPOIS de aplicar o estado para pegar regressões
 *     reais que só aparecem com o usuário interagindo.
 *
 * Falha o build em QUALQUER violação `critical`. Violações `serious`
 * são logadas. Roda em TODOS os engines do playwright.config.ts.
 */

async function runAxe(page: Page, selector: string) {
  return new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .options({
      rules: {
        "color-contrast": { enabled: true },
        "focus-order-semantics": { enabled: true },
      },
    })
    .analyze();
}

function expectNoCritical(
  results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
  context: string,
) {
  const critical = results.violations.filter((v) => v.impact === "critical");
  const serious = results.violations.filter((v) => v.impact === "serious");
  for (const v of [...critical, ...serious]) {
    const tag = v.impact === "critical" ? "✖ CRITICAL" : "⚠ serious";
    console.log(`[a11y ${context}] ${tag} ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`  → ${n.target.join(" ")}`);
  }
  expect(critical, `Violações axe critical em ${context}`).toEqual([]);
}

test.describe("a11y — banner /orcamento + estados interativos do verticalOffer", () => {
  test("banner contextual do /orcamento (white-label-educacao) sem violação crítica", async ({ page }) => {
    await page.goto(
      "/orcamento?segmento=white-label-educacao&origem=recomendacao-educacao",
      { waitUntil: "domcontentloaded" },
    );
    const banner = page.locator('[data-segmento-banner="white-label-educacao"]');
    await expect(banner).toBeVisible();
    const results = await runAxe(page, '[data-segmento-banner="white-label-educacao"]');
    expectNoCritical(results, "orcamento-banner");
  });

  test("verticalOffer /recomendacao/educacao — CTA principal hover sem violação crítica", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    await expect(offer).toBeVisible();
    await offer.scrollIntoViewIfNeeded();

    const cta = offer.getByRole("link", { name: /Contratar White Label Acadêmico/i });
    await cta.hover();
    // frame extra para o repaint do :hover
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    const results = await runAxe(page, '[data-vertical-offer="educacao"]');
    expectNoCritical(results, "verticalOffer-cta-principal-hover");
  });

  test("verticalOffer /recomendacao/educacao — CTA principal focus sem violação crítica", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    await expect(offer).toBeVisible();
    await offer.scrollIntoViewIfNeeded();

    await page.mouse.move(0, 0);
    const cta = offer.getByRole("link", { name: /Contratar White Label Acadêmico/i });
    await cta.focus();
    const results = await runAxe(page, '[data-vertical-offer="educacao"]');
    expectNoCritical(results, "verticalOffer-cta-principal-focus");
  });

  test("verticalOffer /recomendacao/educacao — CTA secundário hover+focus sem violação crítica", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    await expect(offer).toBeVisible();
    await offer.scrollIntoViewIfNeeded();

    const secondary = offer.getByRole("link", {
      name: /Ver como funciona o White Label/i,
    });
    await secondary.hover();
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    let results = await runAxe(page, '[data-vertical-offer="educacao"]');
    expectNoCritical(results, "verticalOffer-cta-secundario-hover");

    await page.mouse.move(0, 0);
    await secondary.focus();
    results = await runAxe(page, '[data-vertical-offer="educacao"]');
    expectNoCritical(results, "verticalOffer-cta-secundario-focus");
  });
});
