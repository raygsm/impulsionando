import { test, expect } from "@playwright/test";

/**
 * Open Graph + Twitter Card meta de /recomendacao/educacao.
 *
 * Garante (todos engines × mobile/desktop) que o head() do route emite
 * og:title, og:description, og:type=article, og:url e twitter:card,
 * além de canonical apontando para a própria URL (regra: per-route, leaf).
 *
 * og:image é opcional aqui (não temos arte por nicho hoje). Quando
 * estiver presente, validamos que é uma URL absoluta — uma URL relativa
 * é comum ser ignorada por crawlers.
 *
 * Pega regressões silenciosas como:
 *  - alguém colocar { title } no topo do head() (TanStack ignora)
 *  - canonical/og:url apontando para a home (atribui SEO desta página
 *    para a home no índice do Google)
 */

const WIDTHS = [
  { name: "mobile-375", w: 375, h: 1200 },
  { name: "desktop-1280", w: 1280, h: 1400 },
];

async function getMeta(
  page: import("@playwright/test").Page,
  selector: string,
  attr: "content" | "href" = "content",
): Promise<string | null> {
  const el = page.locator(`head ${selector}`).first();
  if ((await el.count()) === 0) return null;
  return el.getAttribute(attr);
}

test.describe("Open Graph — /recomendacao/educacao", () => {
  for (const { name, w, h } of WIDTHS) {
    test(`og/twitter/canonical íntegros @ ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });

      const ogTitle = await getMeta(page, 'meta[property="og:title"]');
      const ogDesc = await getMeta(page, 'meta[property="og:description"]');
      const ogType = await getMeta(page, 'meta[property="og:type"]');
      const ogUrl = await getMeta(page, 'meta[property="og:url"]');
      const ogImage = await getMeta(page, 'meta[property="og:image"]');
      const twCard = await getMeta(page, 'meta[name="twitter:card"]');
      const canonical = await getMeta(page, 'link[rel="canonical"]', "href");
      const docTitle = await page.title();

      // og:title — não-vazio, alinhado ao <title>, menciona o nicho.
      expect(ogTitle, "og:title presente").toBeTruthy();
      expect(ogTitle!).toMatch(/educa/i);
      expect(ogTitle, "og:title deve corresponder ao <title>").toBe(docTitle);

      // og:description — não-vazio e não-genérico.
      expect(ogDesc, "og:description presente").toBeTruthy();
      expect((ogDesc ?? "").length).toBeGreaterThan(40);
      expect(ogDesc).not.toMatch(/^Recomendação inteligente de plano e módulos por nicho\.?$/);

      // og:type — leaf de conteúdo → "article" (não "website").
      expect(ogType, "og:type deve ser article (leaf)").toBe("article");

      // og:url + canonical — auto-referentes e absolutos.
      expect(ogUrl, "og:url presente").toBeTruthy();
      expect(ogUrl!).toMatch(/^https?:\/\//);
      expect(ogUrl!).toMatch(/\/recomendacao\/educacao$/);
      expect(canonical, "canonical presente").toBeTruthy();
      expect(canonical!).toBe(ogUrl);

      // twitter:card — declarado explicitamente.
      expect(twCard, "twitter:card presente").toBeTruthy();
      expect(["summary", "summary_large_image"]).toContain(twCard);

      // og:image — opcional. Quando presente, deve ser URL absoluta.
      if (ogImage) {
        expect(ogImage, "og:image (quando presente) deve ser URL absoluta").toMatch(/^https?:\/\//);
      }

      // Não deve haver MAIS de um canonical no head (TanStack concatena
      // links sem dedup — duplicidade = canonical inválido).
      const canonicalCount = await page.locator('head link[rel="canonical"]').count();
      expect(canonicalCount, "exatamente um <link rel=canonical>").toBe(1);
    });
  }
});
