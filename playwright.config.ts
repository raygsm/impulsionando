import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL?.trim();
const localBaseUrl = "http://127.0.0.1:4173";
const usePreview = process.env.E2E_USE_PREVIEW === "1";
const localServerCommand = usePreview
  ? "bun run preview -- --host 127.0.0.1 --port 4173 --strictPort"
  : "bun run dev -- --host 127.0.0.1 --port 4173 --strictPort";

/**
 * Playwright config para a suíte de jornada nicho-primeiro.
 * Usa dev server por padrão e somente usa o bundle previamente compilado quando
 * o workflow define E2E_USE_PREVIEW=1. E2E_BASE_URL continua permitindo validar
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
