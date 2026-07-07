import { test, expect } from "@playwright/test";
import { APPROVAL_CSV_COLUMNS } from "@/lib/approval-csv";

/**
 * /core/automacao/aprovacoes — download + validação estrita do CSV.
 *
 * Complementa `automacao-aprovacoes-csv.spec.ts` amarrando o arquivo
 * gerado ao contrato canônico exportado em `src/lib/approval-csv.ts`:
 *   - nome carrega `tenant-<slug>` e `mode-<mode>` do filtro corrente;
 *   - cabeçalho tem EXATAMENTE as colunas de APPROVAL_CSV_COLUMNS, na
 *     mesma ordem — regressão do helper quebra este teste.
 *
 * Sem sessão o gate manda para /auth → skip.
 */

const TENANT = "tenant-e2e-csv-schema";
const MODE = "demo" as const;

test("Exportar CSV: filename e cabeçalho seguem o contrato canônico", async ({ page }) => {
  await page.goto(`/core/automacao/aprovacoes?tenant=${TENANT}&mode=${MODE}`);
  if (/\/auth(\b|\/|\?)/.test(page.url())) {
    test.skip(true, "rota protegida sem sessão em CI");
  }

  // Garante ao menos uma linha renderizada (o botão só habilita com dados).
  await page.getByTestId("btn-manual-test").click();
  await page.getByTestId(`filter-mode-${MODE}`).click();

  const exportBtn = page.getByTestId("btn-export-csv");
  await expect(exportBtn).toBeEnabled({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportBtn.click(),
  ]);

  const name = download.suggestedFilename();
  expect(name.startsWith("automation-approvals_")).toBe(true);
  expect(name).toContain(`tenant-${TENANT}`);
  expect(name).toContain(`mode-${MODE}`);
  expect(name.endsWith(".csv")).toBe(true);

  const path = await download.path();
  const fs = await import("node:fs/promises");
  const raw = (await fs.readFile(path!, "utf8")).replace(/^\ufeff/, "");
  const header = raw.split("\n").filter(Boolean)[0]!.split(";");

  // Cabeçalho == contrato do helper, exatamente na mesma ordem.
  expect(header).toEqual([...APPROVAL_CSV_COLUMNS]);
});
