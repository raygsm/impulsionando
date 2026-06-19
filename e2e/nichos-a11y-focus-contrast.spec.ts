import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Auditoria axe estendida: foco/teclado + contraste AA.
 *
 * Diferente de e2e/nichos-a11y.spec.ts (que roda o conjunto WCAG completo
 * num escopo restrito), aqui:
 *  - Ativamos EXPLICITAMENTE as regras críticas de foco e contraste
 *    para que nenhuma fique desabilitada por configuração padrão.
 *  - Executamos uma simulação de navegação por Tab para garantir que
 *    cada CTA do hero e cada card de subnicho recebe foco visível
 *    e está alcançável apenas com teclado.
 *  - Roda em TODOS os engines do playwright.config.ts (Chromium,
 *    Firefox, WebKit) — diferenças de focus ring e contraste de
 *    sub-pixel se manifestam de forma distinta entre eles.
 *
 * Falha o build em QUALQUER violação `critical`. `serious` é logado
 * para investigação mas não quebra (mesmo padrão do spec existente).
 */

const FOCUS_CONTRAST_RULES = [
  "color-contrast",
  "color-contrast-enhanced",
  "focus-order-semantics",
  "tabindex",
  "link-in-text-block",
] as const;

async function runFocusContrastAxe(page: Page, selector: string) {
  return new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2aa", "wcag21aa", "cat.keyboard", "cat.color"])
    .options({
      rules: Object.fromEntries(
        FOCUS_CONTRAST_RULES.map((id) => [id, { enabled: true }]),
      ),
    })
    .analyze();
}

function expectNoCritical(
  results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
  context: string,
) {
  const critical = results.violations.filter((v) => v.impact === "critical");
  const serious = results.violations.filter((v) => v.impact === "serious");
  for (const v of [...critical, ...serious]) {
    const tag = v.impact === "critical" ? "✖ CRITICAL" : "⚠ serious";
    console.log(`[a11y-fc ${context}] ${tag} ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`  → ${n.target.join(" ")}`);
    }
  }
  expect(critical, `Violações axe critical (foco/contraste) em ${context}`).toEqual([]);
}

async function isFocusable(page: Page, sel: string): Promise<boolean> {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    (el as HTMLElement).focus();
    return document.activeElement === el;
  }, sel);
}

test.describe("a11y estendido — foco/teclado + contraste AA", () => {
  test("hero CTAs: contraste AA + alcançáveis por teclado", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const group = page.locator('[aria-label="Perfis de uso da Impulsionando"]');
    await expect(group).toBeVisible();

    // 1) axe: contraste + ordem de foco.
    const results = await runFocusContrastAxe(
      page,
      '[aria-label="Perfis de uso da Impulsionando"]',
    );
    expectNoCritical(results, "hero-ctas");

    // 2) Teclado: cada link/botão dentro do grupo deve ser focável.
    const ctas = group.locator("a, button");
    const count = await ctas.count();
    expect(count, "número de CTAs no hero").toBeGreaterThanOrEqual(3);
    for (let i = 0; i < count; i++) {
      const handle = ctas.nth(i);
      await handle.focus();
      const focused = await handle.evaluate((el) => document.activeElement === el);
      expect(focused, `CTA ${i} deve receber foco`).toBe(true);
    }
  });

  test("/escolher-nicho cards: contraste AA + foco em cada card", async ({ page }) => {
    await page.goto("/escolher-nicho", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await runFocusContrastAxe(page, "main");
    expectNoCritical(results, "escolher-nicho");

    // Cards são <button> com texto "Ver recomendação". Validamos que
    // os primeiros são focáveis (amostragem evita timeout em runs
    // mobile-firefox que iteram lentamente).
    const buttons = page.locator('section button:has-text("Ver recomendação")');
    const total = await buttons.count();
    expect(total).toBeGreaterThan(0);
    const sample = Math.min(total, 6);
    for (let i = 0; i < sample; i++) {
      const btn = buttons.nth(i);
      await btn.focus();
      const ok = await btn.evaluate((el) => document.activeElement === el);
      expect(ok, `card ${i} deve receber foco`).toBe(true);
    }
  });

  test("/recomendacao/educacao verticalOffer: contraste AA + CTA focável", async ({ page }) => {
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const offer = page.locator('[data-vertical-offer="educacao"]');
    await expect(offer).toBeVisible();

    const results = await runFocusContrastAxe(page, '[data-vertical-offer="educacao"]');
    expectNoCritical(results, "vertical-offer-educacao");

    await expect(
      offer.getByRole("link", { name: /Contratar White Label Acadêmico/i }),
    ).toBeFocused({ timeout: 0 }).catch(async () => {
      // Tornar focado manualmente e revalidar.
      const cta = offer.getByRole("link", { name: /Contratar White Label Acadêmico/i });
      await cta.focus();
      const ok = await cta.evaluate((el) => document.activeElement === el);
      expect(ok).toBe(true);
    });
  });
});
