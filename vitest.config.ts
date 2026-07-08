import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest v4 usa `projects` para configurar múltiplos ambientes no mesmo run.
// Mantemos os testes de backend/RLS em Node e os testes que tocam DOM
// (componentes React) em happy-dom.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts", "src/**/*.node.test.ts", "src/lib/**/*.test.ts"],
          exclude: ["**/node_modules/**", "**/.git/**", "tests/e2e/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "happy-dom",
          include: ["src/**/*.test.tsx", "src/components/**/*.test.ts"],
          exclude: ["**/node_modules/**", "**/.git/**"],
        },
      },
    ],
  },
});
