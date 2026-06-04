import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

const ADMIN_ROUTES = [
  { path: "/dashboard", label: "dashboard" },
  { path: "/crm", label: "crm" },
  { path: "/agenda", label: "agenda" },
  { path: "/finance", label: "finance" },
  { path: "/talents", label: "talents" },
];

const LOGO_ALT = "Impulsionando Tecnologia";
// Asset CDN path served by Lovable Assets pipeline (see logo-impulsionando.png.asset.json)
const LOGO_URL_FRAGMENT = "/__l5e/assets-v1/";

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "E2E_EMAIL and E2E_PASSWORD must be set in the environment to run admin e2e tests.",
    );
  }
  await page.goto("/auth");
  await page.getByLabel(/e-?mail/i).first().fill(EMAIL);
  await page.getByLabel(/senha/i).first().fill(PASSWORD);
  await page.getByRole("button", { name: /entrar|acessar|login/i }).first().click();
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
    timeout: 20_000,
  });
}

test.describe("Admin shell — correct logo across main routes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const route of ADMIN_ROUTES) {
    test(`renders the correct logo on ${route.path}`, async ({ page }, testInfo) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // At least one <img> with the canonical alt text must be present (Sidebar/MobileSidebar)
      const logos = page.locator(`img[alt="${LOGO_ALT}"]`);
      const count = await logos.count();
      expect(count, `expected logo on ${route.path}`).toBeGreaterThan(0);

      // And it must point to the Lovable Assets CDN (no stale/old asset).
      const src = await logos.first().getAttribute("src");
      expect(src, `logo src on ${route.path}`).toBeTruthy();
      expect(src!).toContain(LOGO_URL_FRAGMENT);

      // Capture screenshot for manual review.
      const shot = await page.screenshot({ fullPage: false });
      await testInfo.attach(`${route.label}.png`, {
        body: shot,
        contentType: "image/png",
      });
    });
  }
});
