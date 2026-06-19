import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Auditoria de acessibilidade (axe-core) dos pontos críticos do funil:
 *  - CTAs do hero da home ("Sou empresa", "White Label", "Clube de Vantagens")
 *  - Cards de subnicho em /escolher-nicho (agrupados por macro)
 *
 * Falha o build se aparecer QUALQUER violação de severidade `critical`.
 * Violações `serious`/`moderate` são listadas como warning para revisão,
 * mas não quebram o pipeline. Isso evita ruído sem deixar regressões
 * graves passarem.
 *
 * Roda em todos os projects (Chromium/Firefox/WebKit, desktop+mobile) —
 * problemas de contraste/focus podem se manifestar em só um engine.
 */

async function runAxe(page: import("@playwright/test").Page, selector: string) {
  return new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
}

function failOnCritical(
  results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
  context: string,
) {
  const critical = results.violations.filter((v) => v.impact === "critical");
  const serious = results.violations.filter((v) => v.impact === "serious");
  for (const v of [...critical, ...serious]) {
    const tag = v.impact === "critical" ? "✖ CRITICAL" : "⚠ serious";
    console.log(`[a11y ${context}] ${tag} ${v.id}: ${v.help} (${v.nodes.length} nó(s))`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`  → ${n.target.join(" ")}`);
      if (n.failureSummary) {
        console.log(`    ${n.failureSummary.split("\n").join(" | ")}`);
      }
    }
  }
  expect(critical, `Violações axe critical em ${context}`).toEqual([]);
}

test.describe("Acessibilidade — hero CTAs e cards de subnicho", () => {
  test("hero CTAs (Sou empresa / White Label / Clube) sem violação crítica", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const group = page.locator('[aria-label="Perfis de uso da Impulsionando"]');
    await expect(group).toBeVisible();
    const results = await runAxe(page, '[aria-label="Perfis de uso da Impulsionando"]');
    failOnCritical(results, "hero-ctas");
  });

  test("/escolher-nicho cards agrupados por macro sem violação crítica", async ({ page }) => {
    await page.goto("/escolher-nicho", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // O grid principal vive na primeira <section> com cards; auditamos o main inteiro
    // (cobre headings de macro + todos os botões/cards de subnicho).
    const results = await runAxe(page, "main, body > div > section");
    failOnCritical(results, "escolher-nicho");
  });
});
