import { test, expect } from "@playwright/test";

/**
 * Visual + estrutural do PublicFooter:
 *  - Coluna "Soluções por Nicho" deve permanecer AGRUPADA por macros
 *    (Saúde, Alimentação, Imobiliário, Serviços, Educação, Eventos,
 *    Varejo, Fornecedores, White Label, Clube). Subnichos NÃO podem
 *    aparecer paralelos aos macros (regressão histórica: "Psicologia"
 *    e "Clínicas" listados ao lado de "Saúde").
 *  - Screenshots em 375/768/1280px para garantir alinhamento da grade
 *    de colunas em qualquer largura.
 *
 * Snapshots gated por E2E_VISUAL=1. A checagem estrutural (labels e
 * ausência de itens paralelos proibidos) roda SEM o flag — é guarda
 * funcional, não visual.
 */

const WIDTHS = [
  { name: "mobile-375", w: 375, h: 1600 },
  { name: "tablet-768", w: 768, h: 1400 },
  { name: "desktop-1280", w: 1280, h: 1200 },
];

const EXPECTED_MACRO_LABELS = [
  /Saúde/i,
  /Alimentação/i,
  /Imobiliário/i,
  /Serviços/i,
  /Educação/i,
  /Eventos/i,
  /Varejo/i,
  /Fornecedores/i,
];

// Labels que NÃO podem aparecer como itens de topo paralelos aos macros
// dentro da coluna "Soluções por Nicho". Eles devem estar nestados
// dentro do macro Saúde (ex.: "Saúde (clínicas, psicologia, fitness)").
const FORBIDDEN_PARALLEL_LABELS = [
  /^Psicologia$/i,
  /^Clínicas?( e Consultórios?)?$/i,
  /^Consultórios?$/i,
];

async function getSolutionsColumn(page: import("@playwright/test").Page) {
  // A coluna é um <div> cujo título é "Soluções por Nicho".
  const title = page.locator("footer >> text=Soluções por Nicho").first();
  await expect(title).toBeVisible();
  return title.locator("xpath=ancestor::div[1]");
}

test.describe("PublicFooter — Soluções por Nicho agrupado por macro", () => {
  test("contém todos os macros esperados e nenhum subnicho paralelo proibido", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const col = await getSolutionsColumn(page);
    const items = col.locator("li");
    const labels = (await items.allInnerTexts()).map((t) => t.trim());

    for (const macro of EXPECTED_MACRO_LABELS) {
      expect(
        labels.some((l) => macro.test(l)),
        `coluna deve conter macro ${macro}`,
      ).toBe(true);
    }
    for (const forbidden of FORBIDDEN_PARALLEL_LABELS) {
      const leaked = labels.find((l) => forbidden.test(l));
      expect(
        leaked,
        `coluna NÃO pode conter subnicho paralelo "${leaked}" (deve estar nestado em Saúde)`,
      ).toBeUndefined();
    }
  });

  for (const { name, w, h } of WIDTHS) {
    test(`screenshot do footer @ ${name}`, async ({ page }, testInfo) => {
      testInfo.skip(
        !process.env.E2E_VISUAL,
        "Gated: rode com E2E_VISUAL=1 para gerar/validar baselines.",
      );
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() =>
        (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready,
      );

      const footer = page.locator("footer").first();
      await footer.scrollIntoViewIfNeeded();
      await page.evaluate(
        () => new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
      );
      await expect(footer).toBeVisible();
      await expect(footer).toHaveScreenshot(`public-footer-${name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });

      // Snapshot focado só na coluna agrupada (mais sensível a regressões
      // de agrupamento que o footer inteiro).
      const col = await getSolutionsColumn(page);
      await expect(col).toHaveScreenshot(`public-footer-nichos-col-${name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});
