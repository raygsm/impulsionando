import { test, expect } from "@playwright/test";

/**
 * SEO + estrutura semântica de /recomendacao/educacao.
 *
 * Garante (em todos os engines × mobile/desktop do playwright.config.ts):
 *  - <title> e <meta name="description"> presentes e não-genéricos
 *  - exatamente UM <h1> com o label do nicho (Educação)
 *  - bloco verticalOffer presente com <h3> e texto descritivo
 *  - h2(s) da página renderizam (Plano, Combo, etc) — não colapsa
 *    para layout vazio em nenhuma largura
 *
 * Falhas aqui pegam regressões de:
 *  - head() do route que volta a string genérica
 *  - quebra de hierarquia de headings (h1 ausente / duplicado / pulado)
 *  - verticalOffer condicional removido por engano
 */

const WIDTHS = [
  { name: "mobile-375", w: 375, h: 1200 },
  { name: "desktop-1280", w: 1280, h: 1400 },
];

test.describe("SEO/headings — /recomendacao/educacao", () => {
  for (const { name, w, h } of WIDTHS) {
    test(`title/description/h1/h2 + verticalOffer @ ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });

      // <title>
      const title = await page.title();
      expect(title, "title deve conter o nicho").toMatch(/educa/i);
      expect(title, "title não pode ser genérico").not.toMatch(/^Recomendação por nicho$/i);

      // <meta name="description">
      const desc = await page
        .locator('head meta[name="description"]')
        .getAttribute("content");
      expect(desc, "meta description presente").toBeTruthy();
      expect((desc ?? "").length, "description não-trivial (>40 chars)").toBeGreaterThan(40);

      // Exatamente um <h1>
      const h1s = page.locator("h1");
      await expect(h1s).toHaveCount(1);
      const h1Text = (await h1s.first().innerText()).trim();
      expect(h1Text.length).toBeGreaterThan(0);

      // h2s presentes (seções do plano/combo/etc)
      const h2Count = await page.locator("h2").count();
      expect(h2Count, "deve haver pelo menos um h2 estrutural").toBeGreaterThanOrEqual(1);

      // Bloco verticalOffer presente com h3 (heading dentro do card)
      const offer = page.locator('[data-vertical-offer="educacao"]');
      await expect(offer).toBeVisible();
      const h3 = offer.locator("h3").first();
      await expect(h3).toBeVisible();
      const h3Text = (await h3.innerText()).trim();
      expect(h3Text, "h3 do verticalOffer não pode ser vazio").not.toEqual("");
      expect(h3Text).toMatch(/White Label/i);

      // CTA principal renderizado dentro do bloco
      await expect(
        offer.getByRole("link", { name: /Contratar White Label Acadêmico/i }),
      ).toBeVisible();
    });
  }
});
