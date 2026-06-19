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
  // List para o log em tempo real + HTML para o artifact navegável
  // (review de falhas com screenshots inline, traces, videos e snapshots
  // de DOM já anexados pelo Playwright).
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    // Ao falhar, retemos: trace completo (DOM snapshots + network + console),
    // screenshot do estado final e video da execução. Tudo é coletado pelo
    // workflow e disponibilizado como artifacts.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  /**
   * Matriz de projetos: cobrimos os 3 engines (Chromium, Firefox, WebKit)
   * em forma desktop e mobile para capturar diferenças de renderização e
   * roteamento. A seleção por engine pode ser feita com:
   *   bunx playwright test --project=desktop-chromium
   *   bunx playwright test --project=mobile-webkit
   */
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1800 } } },
    { name: "desktop-firefox",  use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 1800 } } },
    { name: "desktop-webkit",   use: { ...devices["Desktop Safari"],  viewport: { width: 1280, height: 1800 } } },
    { name: "mobile-chromium",  use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit",    use: { ...devices["iPhone 14"] } },
    // Firefox mobile não tem device preset estável — emulamos Pixel 7.
    {
      name: "mobile-firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 412, height: 915 },
        isMobile: false, // Firefox não suporta isMobile=true
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0",
      },
    },
  ],
});
