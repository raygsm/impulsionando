import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 4173);
const BASE_URL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  // Auto-start the preview server when E2E_BASE_URL is not provided externally.
  // CI workflows that boot their own server should set E2E_BASE_URL to skip this.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `bun run build && bunx vite preview --port ${PORT} --host 127.0.0.1`,
        url: BASE_URL,
        timeout: 180_000,
        reuseExistingServer: !isCI,
        stdout: "pipe",
        stderr: "pipe",
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
