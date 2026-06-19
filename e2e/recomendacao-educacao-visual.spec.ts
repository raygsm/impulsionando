import { test, expect } from "@playwright/test";

/**
 * Visual regression do bloco verticalOffer em /recomendacao/educacao.
 *
 * Captura snapshots em 375/768/1280px nos estados:
 *   - default (estado base)
 *   - hover  (mouse sobre o CTA principal)
 *   - focus  (CTA principal focado via teclado)
 *
 * Gated por E2E_VISUAL=1; roda em todos os engines do
 * playwright.config.ts (chromium/firefox/webkit, desktop+mobile).
 * Diferenças de renderização de gradient, sombras, focus ring ou
 * tipografia entre engines aparecem como diff de snapshot.
 */

const WIDTHS = [
  { name: "mobile-375", w: 375, h: 1100 },
  { name: "tablet-768", w: 768, h: 1100 },
  { name: "desktop-1280", w: 1280, h: 1100 },
];

test.describe("Visual regression — verticalOffer /recomendacao/educacao", () => {
  for (const { name, w, h } of WIDTHS) {
    test(`verticalOffer estados default/hover/focus @ ${name}`, async ({ page }, testInfo) => {
      testInfo.skip(
        !process.env.E2E_VISUAL,
        "Gated: rode com E2E_VISUAL=1 para gerar/validar baselines.",
      );
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
      await page.evaluate(() =>
        (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready,
      );
      await page.evaluate(
        () => new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
      );

      const offer = page.locator('[data-vertical-offer="educacao"]');
      await expect(offer).toBeVisible();
      await offer.scrollIntoViewIfNeeded();

      // Default
      await expect(offer).toHaveScreenshot(`vertical-offer-educacao-${name}-default.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });

      const cta = offer.getByRole("link", { name: /Contratar White Label Acadêmico/i });

      // Hover
      await cta.hover();
      // Pequena espera de transição (transitions desabilitadas pelo flag, mas
      // alguns browsers ainda precisam de um frame para repaint do hover).
      await page.evaluate(
        () => new Promise<void>((r) => requestAnimationFrame(() => r())),
      );
      await expect(offer).toHaveScreenshot(`vertical-offer-educacao-${name}-hover.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });

      // Focus (via teclado, para capturar focus-visible ring real)
      await page.mouse.move(0, 0);
      await cta.focus();
      await expect(offer).toHaveScreenshot(`vertical-offer-educacao-${name}-focus.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});
