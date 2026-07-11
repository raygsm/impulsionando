import { expect, test } from "@playwright/test";

const CHRISMED_ROUTES = [
  "/chrismed",
  "/chrismed/agendar",
  "/chrismed/app",
  "/chrismed/checkout",
  "/chrismed/clinica",
  "/chrismed/consultorio",
  "/chrismed/contato",
  "/chrismed/domiciliar",
  "/chrismed/dra-cristiane",
  "/chrismed/especialidades",
  "/chrismed/exames",
  "/chrismed/faq",
  "/chrismed/internacional",
  "/chrismed/medicos",
  "/chrismed/minha-conta",
  "/chrismed/ocupacional",
  "/chrismed/ocupacional/agendar",
  "/chrismed/ofertas",
  "/chrismed/privacidade",
  "/chrismed/teleconsulta",
];

test.describe("CHRISMED — cabeçalho fixo em todas as rotas", () => {
  for (const route of CHRISMED_ROUTES) {
    test(`mantém o menu fixo em ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const header = page.locator("[data-chrismed-header]").first();
      await expect(header).toBeVisible();

      await expect(header).toHaveCSS("position", "fixed");
      await expect(header).toHaveCSS("top", "0px");

      await page.evaluate(() => window.scrollTo(0, 1400));
      await page.waitForTimeout(100);

      const box = await header.boundingBox();
      expect(box?.y).toBe(0);
      await expect(header).toHaveCSS("position", "fixed");
    });
  }
});