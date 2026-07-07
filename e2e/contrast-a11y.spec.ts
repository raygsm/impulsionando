/**
 * Contraste WCAG por rota — falha o CI apenas em rotas marcadas como
 * `strict: true` em contrast.config.json. Rotas não-strict entram como
 * warning no relatório JSON gerado por `bun run contrast:scan`.
 *
 * Algoritmo: scripts/lib/contrast-core.mjs
 * Documentação: docs/CONTRAST_METHODOLOGY.md
 */
import { test, expect } from "@playwright/test";
import { loadConfig, resolveThresholds, buildClientScan } from "../scripts/lib/contrast-core.mjs";

const cfg = await loadConfig();
const ROUTES = Object.entries(cfg.routes ?? {})
  .filter(([r]) => !r.includes("**"))
  .map(([route]) => ({ route, thresholds: resolveThresholds(cfg, route) }));

for (const { route, thresholds } of ROUTES) {
  test(`contraste WCAG em ${route} (strict=${thresholds.strict})`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const scan = buildClientScan({ ignoreSelectors: cfg.ignoreSelectors, thresholds });
    const { checked, sampled, violations, warnings } = (await page.evaluate(scan)) as {
      checked: number;
      sampled: number;
      violations: Array<{ text: string; selector: string; ratio: number; required: number; hasGradient: boolean }>;
      warnings: Array<unknown>;
    };
    expect(checked, "deveria varrer pelo menos 1 nó de texto").toBeGreaterThan(0);
    if (!thresholds.strict) {
      test.info().annotations.push({
        type: "contrast",
        description: `não-strict: ${violations.length} viol, ${warnings.length} warn (${sampled} amostras)`,
      });
      return;
    }
    if (violations.length > 0) {
      const msg = violations
        .slice(0, 20)
        .map((v) => `  ${v.ratio.toFixed(2)}/${v.required} ${v.hasGradient ? "[grad] " : ""}${v.selector} "${v.text}"`)
        .join("\n");
      throw new Error(
        `${violations.length} violações de contraste em ${route} (strict):\n${msg}`,
      );
    }
  });
}
