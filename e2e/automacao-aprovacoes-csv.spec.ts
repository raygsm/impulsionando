import { test, expect } from "@playwright/test";

/**
 * /core/automacao/aprovacoes — botão "Exportar CSV".
 *
 * Valida:
 *  - o clique dispara download real (event `download`)
 *  - nome do arquivo carrega tenant e modo do filtro corrente
 *  - o CSV tem o cabeçalho canônico esperado
 *  - todas as linhas do CSV correspondem ao tenant/mode filtrados
 *
 * Como a rota é protegida (`_authenticated`), sem sessão o gate manda
 * para /auth — nesse caso o teste é ignorado (skip). O contrato server
 * (RLS) que garante que outro usuário não vê linhas do tenant fica em
 * tests/automation-approvals.test.ts (vitest + Supabase).
 */

const TENANT = "tenant-e2e-csv";
const MODE = "demo";

test("Exportar CSV: nome, cabeçalho e linhas respeitam tenant+mode", async ({ page }) => {
  await page.goto(`/core/automacao/aprovacoes?tenant=${TENANT}&mode=${MODE}`);

  if (/\/auth(\b|\/|\?)/.test(page.url())) {
    test.skip(true, "rota protegida sem sessão em CI");
  }

  // Garante ao menos uma linha para exportar: usa o botão "Disparar teste"
  // que já está na tela e respeita o `mode` da URL.
  await expect(page.getByTestId("btn-manual-test")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("btn-manual-test").click();

  const exportBtn = page.getByTestId("btn-export-csv");
  await expect(exportBtn).toBeEnabled({ timeout: 15_000 });

  // Filtra explicitamente pelo modo atual antes de exportar.
  await page.getByTestId(`filter-mode-${MODE}`).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportBtn.click(),
  ]);

  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/^automation-approvals_/);
  expect(suggested).toContain(`tenant-${TENANT}`);
  expect(suggested).toContain(`mode-${MODE}`);
  expect(suggested).toMatch(/\.csv$/);

  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(path!, "utf8");
  // BOM UTF-8 esperado (Excel-friendly) — remove antes de parsear.
  const csv = raw.replace(/^\ufeff/, "");
  const [header, ...body] = csv.split("\n").filter(Boolean);

  expect(header.split(";")).toEqual([
    "created_at",
    "tenant_slug",
    "mode",
    "regua",
    "action",
    "status",
    "files",
    "note",
  ]);
  expect(body.length).toBeGreaterThan(0);

  // Toda linha deve pertencer ao tenant+mode filtrados.
  for (const line of body) {
    const cols = line.split(";");
    expect(cols[1]).toBe(TENANT);
    expect(cols[2]).toBe(MODE);
  }
});
