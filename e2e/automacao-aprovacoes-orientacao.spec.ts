import { test, expect } from "@playwright/test";

/**
 * /core/automacao/fluxos → toast de orientação preserva tenant+mode.
 *
 * O botão "Ativar produção" NÃO dispara nada em produção real: mostra um
 * toast de aviso com botão "Ver aprovações" que navega para
 * /core/automacao/aprovacoes mantendo `tenant` e `mode` da URL — assim o
 * operador acompanha o status da solicitação no mesmo contexto.
 *
 * A rota é protegida por `_authenticated`. Em CI sem sessão o gate
 * redireciona para /auth; nesse caso o teste é ignorado (skip) em vez
 * de falhar — a cobertura funcional principal do contrato vive em
 * tests/automation-approvals.test.ts (vitest).
 */

const TENANT = "tenant-e2e-orientacao";
const MODE = "producao";

test.describe("/core/automacao/fluxos — orientação de bloqueio", () => {
  test("toast expõe link para /aprovacoes preservando tenant+mode", async ({ page }) => {
    await page.goto(`/core/automacao/fluxos?tenant=${TENANT}&mode=${MODE}`);

    // Gate de autenticação: se caiu em /auth, pula. O contrato de UI é
    // coberto pelos testes de integração; aqui garantimos apenas o
    // roteamento client-side quando há sessão.
    if (/\/auth(\b|\/|\?)/.test(page.url())) {
      test.skip(true, "rota protegida sem sessão em CI — coberto por vitest");
    }

    // Aguarda a página de fluxos hidratar (aviso amarelo sempre presente).
    await expect(page.getByText(/Downloads estão liberados/i)).toBeVisible({ timeout: 15_000 });

    // Confirma que os links de orientação (aviso + rodapé de card) já
    // apontam para /core/automacao/aprovacoes com o mesmo tenant+mode.
    const orientLink = page
      .locator("a[href*='/core/automacao/aprovacoes']")
      .first();
    await expect(orientLink).toBeVisible();
    const href = await orientLink.getAttribute("href");
    expect(href).toContain("/core/automacao/aprovacoes");
    expect(href).toContain(`tenant=${TENANT}`);
    expect(href).toContain(`mode=${MODE}`);

    // Clica em "Ativar produção" no primeiro card → toast com botão "Ver aprovações".
    const ativar = page.getByRole("button", { name: /Ativar produção/i }).first();
    await ativar.click();

    const verAprov = page.getByRole("button", { name: /Ver aprovações/i });
    await expect(verAprov).toBeVisible({ timeout: 10_000 });
    await Promise.all([
      page.waitForURL(/\/core\/automacao\/aprovacoes/, { timeout: 15_000 }),
      verAprov.click(),
    ]);

    const finalUrl = page.url();
    expect(finalUrl).toContain("/core/automacao/aprovacoes");
    expect(finalUrl).toContain(`tenant=${TENANT}`);
    expect(finalUrl).toContain(`mode=${MODE}`);
  });
});
