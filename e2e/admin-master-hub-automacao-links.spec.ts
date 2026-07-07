import { test, expect } from "@playwright/test";

/**
 * /admin/master-hub — auditoria de links de /core/automacao/*
 *
 * Regras validadas:
 *  1. Cada `<Link>` renderizado como card/item de menu que aponte para
 *     /core/automacao/* deve preservar `tenant` e `mode` da URL do hub
 *     no `href`.
 *  2. Todo `data-route` declarado deve começar com "/" (rota válida).
 *  3. Ao clicar em cada link, a página destino carrega mantendo tenant
 *     e mode nos search params (fluxo o hub → detalhe).
 *
 * A rota é `_authenticated` — sem sessão, o gate manda para /auth e o
 * teste é ignorado (skip).
 */

const TENANT = "tenant-hub-e2e";
const MODE = "demo" as const;

test("Master-hub: links de /core/automacao preservam tenant+mode", async ({ page }) => {
  await page.goto(`/admin/master-hub?tenant=${TENANT}&mode=${MODE}`);

  if (/\/auth(\b|\/|\?)/.test(page.url())) {
    test.skip(true, "rota protegida sem sessão em CI");
  }

  // Espera o hub renderizar ao menos um link de menu.
  const anyLink = page.locator('[data-testid="master-hub-menu-link"]').first();
  await expect(anyLink).toBeVisible({ timeout: 20_000 });

  // 1) Coleta todos os hrefs renderizados e valida contrato de rota.
  const links = await page.locator('[data-testid="master-hub-menu-link"]').all();
  expect(links.length).toBeGreaterThan(0);

  const automacaoTargets: string[] = [];
  for (const link of links) {
    const href = await link.getAttribute("href");
    const route = await link.getAttribute("data-route");
    expect(route, "todo item precisa declarar data-route").toBeTruthy();
    expect(route!.startsWith("/"), `data-route inválido: ${route}`).toBe(true);
    if (href && href.startsWith("/core/automacao")) {
      // Regra principal: tenant e mode preservados no href.
      expect(href, `tenant deve estar no href: ${href}`).toContain(`tenant=${TENANT}`);
      expect(href, `mode deve estar no href: ${href}`).toContain(`mode=${MODE}`);
      automacaoTargets.push(href);
    }
  }

  // 2) Se o hub tiver links de automação, clica em cada um e confirma
  //    que a URL destino também carrega tenant+mode.
  for (const target of automacaoTargets) {
    await page.goto(`/admin/master-hub?tenant=${TENANT}&mode=${MODE}`);
    const link = page.locator(`[data-testid="master-hub-menu-link"][href="${target}"]`).first();
    await link.click();
    await page.waitForURL(/\/core\/automacao\//, { timeout: 15_000 });
    const url = new URL(page.url());
    expect(url.searchParams.get("tenant")).toBe(TENANT);
    expect(url.searchParams.get("mode")).toBe(MODE);
  }
});
