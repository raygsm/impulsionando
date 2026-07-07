import { test, expect } from "@playwright/test";

/**
 * /core/automacao/aprovacoes — Exportar CSV bloqueado por RLS.
 *
 * Cenário: usuário autenticado mas SEM linhas visíveis para o tenant
 * filtrado (por RLS, `listAutomationRequests` retorna vazio). Nesse
 * caso a UI:
 *   - renderiza 0 linhas na tabela;
 *   - deixa o botão "Exportar CSV" DESABILITADO;
 *   - não dispara nenhum download.
 *
 * O contrato server-side (RLS impede leitura cruzada entre tenants)
 * já é coberto em tests/automation-approvals.test.ts. Este E2E fecha o
 * loop na camada visual — se algum dia o botão for habilitado sem
 * dados, um download vazio/erro apareceria para o usuário.
 *
 * Sem sessão → gate manda para /auth → skip.
 */

const TENANT_SEM_DADOS = `tenant-rls-empty-${Date.now()}`;
const MODE = "demo" as const;

test("Exportar CSV é bloqueado quando RLS não expõe linhas do tenant filtrado", async ({ page }) => {
  await page.goto(`/core/automacao/aprovacoes?tenant=${TENANT_SEM_DADOS}&mode=${MODE}`);

  if (/\/auth(\b|\/|\?)/.test(page.url())) {
    test.skip(true, "rota protegida sem sessão em CI");
  }

  const exportBtn = page.getByTestId("btn-export-csv");
  await expect(exportBtn).toBeVisible({ timeout: 15_000 });

  // Filtro de modo alinhado ao search param — não há linhas p/ o tenant.
  await page.getByTestId(`filter-mode-${MODE}`).click().catch(() => {});

  // O botão deve permanecer DESABILITADO (visibleRows.length === 0).
  await expect(exportBtn).toBeDisabled({ timeout: 10_000 });

  // Reforço: tentar clicar não gera download.
  let downloadFired = false;
  page.on("download", () => { downloadFired = true; });
  await exportBtn.click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  expect(downloadFired).toBe(false);
});
