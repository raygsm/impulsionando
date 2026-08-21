import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL?.trim();
const localBaseUrl = "http://127.0.0.1:4173";
const localServerCommand = process.env.CI
  ? "bun run preview -- --host 127.0.0.1 --port 4173 --strictPort"
  : "bun run dev -- --host 127.0.0.1 --port 4173 --strictPort";

/**
 * Playwright config para a suíte de jornada nicho-primeiro.
 * Localmente roda contra o dev server. No CI roda contra o bundle previamente
 * compilado e servido por `vite preview`, evitando que o timeout do webServer
 * inclua a compilação da aplicação. E2E_BASE_URL continua permitindo validar
 * uma implantação externa quando uma URL não vazia for informada.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: externalBaseUrl || localBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: localServerCommand,
        url: localBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1800 } } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 1800 } } },
    { name: "desktop-webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 1800 } } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 14"] } },
    {
      name: "mobile-firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 412, height: 915 },
        isMobile: false,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0",
      },
    },
  ],
});
