import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para a suíte de jornada nicho-primeiro.
 * Roda contra o dev server local (Vite/TanStack Start na porta 8080).
 *
 * Execute com:
 *   bunx playwright test
 *   bunx playwright test --project=mobile
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1800 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
