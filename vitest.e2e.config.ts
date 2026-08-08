import { defineConfig } from "vitest/config";
import path from "node:path";

/** Backend integration suites intentionally excluded from the default unit-test projects. */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    name: "backend-e2e",
    environment: "node",
    include: ["tests/e2e/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.git/**"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
