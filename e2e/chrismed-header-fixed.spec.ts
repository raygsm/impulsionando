import { expect, test } from "@playwright/test";

const PUBLIC_CHRISMED_HOST = process.env.E2E_BASE_URL?.includes("chrismed.impulsionando.com.br");
const CHRISMED_ROUTES = [
  "",
  "/agendar",
  "/app",
  "/checkout",
  "/clinica",
  "/consultorio",
  "/contato",
  "/domiciliar",
  "/dra-cristiane",
  "/especialidades",
  "/exames",
  "/faq",
  "/internacional",
  "/medicos",
  "/minha-conta",
  "/ocupacional",
  "/ocupacional/agendar",
  "/ofertas",
  "/privacidade",
  "/teleconsulta",
].map((path) => PUBLIC_CHRISMED_HOST ? path || "/" : `/chrismed${path}`);

test.describe("CHRISMED — cabeçalho fixo em todas as rotas", () => {
  test.describe.configure({ timeout: 120_000 });
  for (const route of CHRISMED_ROUTES) {
    test(`mantém o menu fixo em ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const header = page.locator("[data-chrismed-header]").first();
      await expect(header).toBeVisible({ timeout: 15_000 });

      await expect(header).toHaveCSS("position", "fixed");
      await expect(header).toHaveCSS("top", "0px");

      await page.evaluate(() => window.scrollTo(0, 1400));
      await page.waitForTimeout(100);

      await expect
        .poll(
          async () => {
            try {
              return await page
                .locator("[data-chrismed-header]")
                .first()
                .evaluate((element) => element.getBoundingClientRect().y);
            } catch {
              return null;
            }
          },
          { timeout: 30_000 },
        )
        .toBe(0);
      await expect(header).toHaveCSS("position", "fixed");
    });
  }
});
