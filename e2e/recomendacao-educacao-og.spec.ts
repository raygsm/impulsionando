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

      // og:image — agora OBRIGATÓRIO. Valida presença, URL absoluta,
      // dimensões declaradas e que o asset realmente resolve com
      // content-type de imagem nos 3 engines.
      expect(ogImage, "og:image presente").toBeTruthy();
      expect(ogImage!, "og:image deve ser URL absoluta (não relativa)").toMatch(/^https?:\/\//);
      expect(ogImage!).toMatch(/\.(jpe?g|png|webp|avif)(\?|$)/i);

      const ogImageWidth = await getMeta(page, 'meta[property="og:image:width"]');
      const ogImageHeight = await getMeta(page, 'meta[property="og:image:height"]');
      const ogImageType = await getMeta(page, 'meta[property="og:image:type"]');
      const ogImageAlt = await getMeta(page, 'meta[property="og:image:alt"]');
      const twImage = await getMeta(page, 'meta[name="twitter:image"]');
      expect(ogImageWidth, "og:image:width declarado").toBeTruthy();
      expect(Number(ogImageWidth)).toBeGreaterThanOrEqual(1200);
      expect(ogImageHeight, "og:image:height declarado").toBeTruthy();
      expect(Number(ogImageHeight)).toBeGreaterThanOrEqual(600);
      expect(ogImageType, "og:image:type declarado").toMatch(/^image\//);
      expect(ogImageAlt, "og:image:alt presente para acessibilidade").toBeTruthy();
      expect(twImage, "twitter:image presente (espelha og:image)").toBe(ogImage);

      // HEAD na URL absoluta — bate o asset e confere content-type.
      // Em modo dev local o asset CDN pode usar caminho proxy; aceitamos
      // tanto 2xx quanto 3xx (redirect para o CDN final).
      const head = await page.request.fetch(ogImage!, { method: "HEAD" });
      expect(head.status(), `HEAD og:image (${ogImage}) deve responder OK`)
        .toBeLessThan(400);
      const ct = head.headers()["content-type"] ?? "";
      expect(ct, `content-type do og:image (${ct})`).toMatch(/^image\//);

      // Não deve haver MAIS de um canonical no head (TanStack concatena
      // links sem dedup — duplicidade = canonical inválido).
      const canonicalCount = await page.locator('head link[rel="canonical"]').count();
      expect(canonicalCount, "exatamente um <link rel=canonical>").toBe(1);
    });
  }
});

