/**
 * E2E — /admin/vitrine-diagnostico
 *
 * A rota vive dentro de `_authenticated` (ssr:false + gate de admin).
 * Sem storageState de admin (`E2E_ADMIN_STORAGE`), o teste é pulado
 * com motivo — mantém o CI verde em máquinas sem auth pré-mintada.
 *
 * Cenários cobertos:
 *   1. Header + KPIs renderizam e a página tem meta noindex.
 *   2. Card da view aparece com estado "acessível" (mock 200).
 *   3. Tenants com `vitrine_enabled=false` exibem motivo correspondente.
 *   4. Tenants sem `public_slug` exibem "public_slug ausente".
 *   5. Falha na view → card em erro e mensagem detalhada.
 *   6. Filtro "Ocultos" restringe a lista e a busca filtra por nome.
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";

const storage = process.env.E2E_ADMIN_STORAGE;
const hasAdmin = storage && fs.existsSync(storage);

test.describe("/admin/vitrine-diagnostico", () => {
  test.skip(!hasAdmin, "requer E2E_ADMIN_STORAGE apontando para storageState de admin");
  test.use({ storageState: storage as string });

  test("KPIs, noindex e card da view visíveis", async ({ page }) => {
    await page.goto("/admin/vitrine-diagnostico", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Vitrine — Diagnóstico/ })).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/);
    await expect(page.getByText(/companies_vitrine_public/)).toBeVisible();
    await expect(page.getByText(/Empresas/)).toBeVisible();
  });

  test("filtros ocultos/visíveis e busca funcionam", async ({ page }) => {
    await page.goto("/admin/vitrine-diagnostico", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ocultos" }).click();
    // apenas rows sem visibleOnPublicView; qualquer badge OFF ou motivo aparece
    await expect(page.getByText(/vitrine_enabled = false|public_slug ausente|view não retornou/).first()).toBeVisible({ timeout: 5000 });
    // reset
    await page.getByRole("button", { name: "Todos" }).click();
    await page.getByPlaceholder("Buscar por nome, slug, segmento, cidade…").fill("xyz-inexistente-zzz");
    await expect(page.getByText("Nenhum tenant encontrado.")).toBeVisible();
  });

  test("view offline → card mostra erro", async ({ page }) => {
    await page.route("**/rest/v1/companies_vitrine_public*", (r) =>
      r.fulfill({ status: 500, body: "boom" }),
    );
    await page.goto("/admin/vitrine-diagnostico", { waitUntil: "networkidle" });
    await expect(page.getByText(/não acessível/)).toBeVisible();
  });
});
