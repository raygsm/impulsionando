import { test, expect } from "@playwright/test";

/**
 * Visual regression dos três CTAs do hero ("Sou empresa",
 * "White Label", "Clube de Vantagens"). Garante que o agrupamento se
 * mantém alinhado em 1 coluna (mobile) e 3 colunas (tablet/desktop).
 *
 * Gated por E2E_VISUAL=1 (mesmo padrão de tests/e2e/home-clube-cta.spec.ts)
 * para não rodar em CI por padrão. Atualize baselines com:
 *   E2E_VISUAL=1 bunx playwright test e2e/hero-cta-visual.spec.ts --update-snapshots
 */

const WIDTHS = [
  { name: "mobile-375", w: 375, h: 900 },
  { name: "tablet-768", w: 768, h: 1024 },
  { name: "desktop-1280", w: 1280, h: 900 },
];

test.describe("Hero CTAs — visual regression por largura", () => {
  for (const { name, w, h } of WIDTHS) {
    test(`grupo de CTAs alinhado @ ${name}`, async ({ page }, testInfo) => {
      testInfo.skip(
        !process.env.E2E_VISUAL,
        "Gated: rode com E2E_VISUAL=1 (snapshots seriam geradas no primeiro run).",
      );

      await page.setViewportSize({ width: w, height: h });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() =>
        (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready,
      );
      await page.evaluate(
        () => new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
      );

      const group = page.locator('[aria-label="Perfis de uso da Impulsionando"]');
      await expect(group).toBeVisible();

      // Sanidade de alinhamento: em mobile (<640) o grid é 1 coluna,
      // em >=sm são 3 colunas com mesma altura via items-stretch.
      const boxes = await group.locator("article > a").evaluateAll((els) =>
        (els as HTMLElement[]).map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width) };
        }),
      );
      expect(boxes.length).toBe(3);
      if (w >= 640) {
        // Mesma linha (tops iguais) e mesma altura (items-stretch).
        const top0 = boxes[0].top;
        for (const b of boxes) expect(Math.abs(b.top - top0)).toBeLessThanOrEqual(1);
        const h0 = boxes[0].height;
        for (const b of boxes) expect(Math.abs(b.height - h0)).toBeLessThanOrEqual(1);
      } else {
        // Empilhados: cada CTA abaixo do anterior.
        expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
        expect(boxes[2].top).toBeGreaterThan(boxes[1].top);
      }

      await expect(group).toHaveScreenshot(`hero-ctas-${name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});
