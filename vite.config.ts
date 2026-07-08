// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Blindagem de produção: sem sourcemaps + minificação agressiva (terser).
// Assim o bundle publicado em impulsionando.com.br fica muito mais difícil
// de reengenhar / copiar. Dev/preview continuam legíveis para debug.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [mcpPlugin()],
    build: {
      sourcemap: false,
      cssMinify: "lightningcss",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
          ecma: 2020,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
        mangle: {
          toplevel: true,
        },
        format: {
          comments: false,
        },
      },
    },
    esbuild: {
      legalComments: "none",
    },
  },
});
