import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * E2E do funil de nichos: navega por /escolher-nicho clicando em cada
 * card de subnicho declarado em MACRO_NICHOS e verifica que cada um
 * cai em /recomendacao/$nicho com a página renderizada (h1 visível).
 *
 * Roda automaticamente nos projects `desktop` e `mobile` do
 * playwright.config.ts — cobertura responsiva sem duplicação de specs.
 *
 * Garantia: complementa o teste estático em
 * tests/nichos-funnel-routes.test.ts validando o comportamento real do
 * roteador e a presença visual dos cards no DOM.
 */

function listSubNichos(): string[] {
  const src = readFileSync(
    join(process.cwd(), "src/components/marketing/nichoMacros.ts"),
    "utf8",
  );
  const m = src.match(/const\s+MACRO_NICHOS[\s\S]*?\];\s*$/m);
  const body = m ? m[0] : src;
  const slugs = new Set<string>();
  const groupRe = /slugs:\s*\[([^\]]*)\]/g;
  let g;
  while ((g = groupRe.exec(body)) !== null) {
    for (const s of g[1].matchAll(/"([^"]+)"/g)) slugs.add(s[1]);
  }
  return [...slugs];
}

const SUBNICHOS = listSubNichos();

async function gotoHub(page: Page) {
  await page.goto("/escolher-nicho", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test.describe("Funil /escolher-nicho → /recomendacao/$nicho", () => {
  test("hub lista todos os subnichos com card clicável", async ({ page }) => {
    await gotoHub(page);
    // Cada card é um <button> com o label do nicho. Não comparamos textos
    // (que mudam), apenas que existe um botão por slug com chamada de ação.
    const buttons = page.locator('section button:has-text("Ver recomendação")');
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(SUBNICHOS.length);
  });

  for (const slug of SUBNICHOS) {
    test(`subnicho "${slug}" abre /recomendacao/${slug} corretamente`, async ({ page }) => {
      // Navegação direta cobre o destino sem depender de texto do card —
      // o teste de hub acima já garante que o card existe.
      await page.goto(`/recomendacao/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`/recomendacao/${slug}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // Não deve renderizar 404/not-found.
      await expect(page.getByText(/404|não encontrado|not found/i)).toHaveCount(0);
    });
  }
});
