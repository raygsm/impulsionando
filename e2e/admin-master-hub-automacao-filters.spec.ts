import { test, expect } from "@playwright/test";

/**
 * /admin/master-hub → /core/automacao/* — reflexão de filtros na UI.
 *
 * Complementa `admin-master-hub-automacao-links.spec.ts` (que valida
 * apenas o contrato do href). Aqui abrimos cada link e confirmamos que
 * a página destino REFLETE o `tenant` e o `mode` da URL na própria UI:
 *   - o banner de escopo do layout de Automação mostra o slug do tenant;
 *   - quando `mode=demo|producao`, o botão de filtro correspondente fica
 *     na variante "default" (selecionado) na tela de Aprovações.
 *
 * Sem sessão o gate manda para /auth → skip.
 */

const TENANT = "tenant-hub-filters-e2e";
const MODE = "demo" as const;

test("Master-hub → filtros de tenant/mode refletem na página destino", async ({ page }) => {
  await page.goto(`/admin/master-hub?tenant=${TENANT}&mode=${MODE}`);
  if (/\/auth(\b|\/|\?)/.test(page.url())) {
    test.skip(true, "rota protegida sem sessão em CI");
  }

  const links = await page.locator('[data-testid="master-hub-menu-link"]').all();
  const targets: string[] = [];
  for (const l of links) {
    const href = await l.getAttribute("href");
    if (href && href.startsWith("/core/automacao")) targets.push(href);
  }
  expect(targets.length, "hub deve expor pelo menos um link de /core/automacao").toBeGreaterThan(0);

  for (const target of targets) {
    await page.goto(target);
    await page.waitForURL(/\/core\/automacao/, { timeout: 15_000 });

    // 1) Search params preservados na URL final.
    const url = new URL(page.url());
    expect(url.searchParams.get("tenant")).toBe(TENANT);
    expect(url.searchParams.get("mode")).toBe(MODE);

    // 2) Banner de escopo do layout mostra o slug do tenant filtrado.
    await expect(page.locator(`code:has-text("${TENANT}")`).first()).toBeVisible({ timeout: 10_000 });

    // 3) Em /aprovacoes, o filtro de modo destaca o mode da URL como selecionado.
    if (target.includes("/core/automacao/aprovacoes")) {
      const selected = page.getByTestId(`filter-mode-${MODE}`);
      await expect(selected).toBeVisible();
      // shadcn Button variant="default" adiciona a classe bg-primary.
      await expect(selected).toHaveClass(/bg-primary/);
    }
  }
});
