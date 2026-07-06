import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * /checkout → /contratar — validações complementares
 *
 * Este arquivo cobre 3 blocos que faltavam na suíte:
 *
 *  1. NAVEGAÇÃO DE CTA
 *     Clica no CTA de cada plano em /checkout e valida que /contratar?plano=<code>
 *     renderiza o banner com o **nome**, **preço** e **badge** corretos.
 *
 *  2. FALLBACK DO SALÁRIO MÍNIMO
 *     Simula falha de `useMinimumWage` (bloqueando toda chamada `/_serverFn/*`)
 *     e garante que /checkout cai no `MINIMUM_WAGE_FALLBACK = R$ 1.621,00`,
 *     mantendo CTAs, `data-price-cents` e eventos GA4 coerentes.
 *
 *  3. ACESSIBILIDADE (axe-core)
 *     Auditoria WCAG 2.1 AA em /checkout — mobile e desktop — falhando em
 *     violações `critical` ou `serious`. Cobre foco, labels, contraste, ARIA.
 */

const PLANS_META = {
  essencial: { displayName: "Essencial", factor: 0.5, highlight: false },
  integrado: { displayName: "Ideal",     factor: 1,   highlight: true  },
  avancado:  { displayName: "Full",      factor: 2,   highlight: false },
} as const;
type PlanCode = keyof typeof PLANS_META;

const FALLBACK_WAGE = 1621;

async function stubAnalytics(page: Page) {
  await page.addInitScript(() => {
    (window as any).dataLayer = [];
  });
}

/** Bloqueia todas as chamadas RPC do TanStack Start para forçar o fallback. */
async function blockServerFns(page: Page) {
  await page.route("**/_serverFn/**", (route) => {
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "simulated_failure" }),
    });
  });
}

async function readPriceCents(page: Page, code: PlanCode) {
  const el = page.getByTestId(`checkout-plan-price-${code}`);
  await expect(el).toBeVisible();
  const v = await el.getAttribute("data-price-cents");
  return Number(v ?? 0);
}

// ─────────────────────────────────────────────────────────────
// Bloco 1 — Navegação do CTA
// ─────────────────────────────────────────────────────────────
test.describe("/checkout → /contratar — navegação por plano", () => {
  test.beforeEach(async ({ page }) => {
    await stubAnalytics(page);
  });

  for (const code of Object.keys(PLANS_META) as PlanCode[]) {
    test(`CTA do plano ${code} navega para /contratar?plano=${code} com nome, preço e badge corretos`, async ({ page }) => {
      await page.goto("/checkout");
      await expect(page.getByTestId("checkout-page")).toBeVisible();

      const priceCents = await readPriceCents(page, code);
      expect(priceCents).toBeGreaterThan(0);

      const cta = page.getByTestId(`checkout-plan-cta-${code}`);
      await expect(cta).toHaveAttribute("href", `/contratar?plano=${code}`);

      await Promise.all([
        page.waitForURL(new RegExp(`/contratar\\?plano=${code}`)),
        cta.click(),
      ]);

      // Banner de plano selecionado
      const banner = page.getByTestId("contratar-selected-plan");
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-plan-code", code);

      // Nome do plano
      await expect(page.getByTestId("contratar-selected-name")).toContainText(
        PLANS_META[code].displayName,
      );

      // Preço bate (tolerância 1 centavo)
      const shownCents = Number(
        await page.getByTestId("contratar-selected-price").getAttribute("data-price-cents"),
      );
      expect(Math.abs(shownCents - priceCents)).toBeLessThanOrEqual(1);

      // Badge "Recomendado" só aparece no Ideal
      if (PLANS_META[code].highlight) {
        await expect(page.getByTestId("contratar-selected-badge")).toBeVisible();
      } else {
        await expect(page.getByTestId("contratar-selected-badge")).toHaveCount(0);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Bloco 2 — Fallback do salário mínimo
// ─────────────────────────────────────────────────────────────
test.describe("/checkout — fallback do salário mínimo quando useMinimumWage falha", () => {
  test.beforeEach(async ({ page }) => {
    await stubAnalytics(page);
    await blockServerFns(page);
  });

  test("usa MINIMUM_WAGE_FALLBACK, mantém CTAs e emite view_item_list coerentes", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-page")).toBeVisible();

    // Wage exibido no header bate com o fallback (R$ 1.621,00).
    const wageText = await page.getByTestId("checkout-minimum-wage").innerText();
    const wageCents = Math.round(
      Number(wageText.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) * 100,
    );
    expect(wageCents).toBe(FALLBACK_WAGE * 100);

    // Preço de cada plano é derivado do fallback.
    for (const code of Object.keys(PLANS_META) as PlanCode[]) {
      const cents = await readPriceCents(page, code);
      const expected = Math.round(FALLBACK_WAGE * PLANS_META[code].factor * 100);
      expect(Math.abs(cents - expected)).toBeLessThanOrEqual(1);

      // CTA continua acessível, com href e aria-label consistentes.
      const cta = page.getByTestId(`checkout-plan-cta-${code}`);
      await expect(cta).toHaveAttribute("href", `/contratar?plano=${code}`);
      const aria = (await cta.getAttribute("aria-label")) ?? "";
      expect(aria).toMatch(/Contratar/);
      expect(aria).toMatch(/R\$/);
    }

    // view_item_list é disparado com os 3 itens e price = valor do fallback.
    await page.waitForFunction(
      () => ((window as any).dataLayer ?? []).some((e: any) => e?.event === "view_item_list"),
      undefined,
      { timeout: 15_000 },
    );
    const dl = await page.evaluate(() => (window as any).dataLayer ?? []);
    const view = dl.find((e: any) => e?.event === "view_item_list");
    expect(view).toBeTruthy();
    const items = (view.items ?? []) as Array<{ item_id: string; price: number }>;
    expect(items.map((i) => i.item_id).sort()).toEqual(["avancado", "essencial", "integrado"]);
    for (const it of items) {
      const expected = FALLBACK_WAGE * PLANS_META[it.item_id as PlanCode].factor;
      expect(Math.abs(it.price - expected)).toBeLessThanOrEqual(0.01);
    }

    // begin_checkout com value = preço do fallback ao clicar (Ctrl+Click evita navegar).
    await page.getByTestId("checkout-plan-cta-integrado").click({ modifiers: ["ControlOrMeta"] });
    const dl2 = await page.evaluate(() => (window as any).dataLayer ?? []);
    const begin = dl2.find((e: any) => e?.event === "begin_checkout" && e?.plan_code === "integrado");
    expect(begin).toBeTruthy();
    expect(Math.abs((begin.value as number) - FALLBACK_WAGE)).toBeLessThanOrEqual(0.01);
  });
});

// ─────────────────────────────────────────────────────────────
// Bloco 3 — Acessibilidade automatizada (axe-core)
// ─────────────────────────────────────────────────────────────
async function runAxe(page: Page) {
  return new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
}

function reportViolations(
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
      if (n.failureSummary) console.log(`    ${n.failureSummary.split("\n").join(" | ")}`);
    }
  }
  return { critical, serious };
}

test.describe("/checkout — axe-core (WCAG 2.1 AA)", () => {
  test.beforeEach(async ({ page }) => {
    await stubAnalytics(page);
  });

  test("desktop 1280×1800 — sem violações critical/serious", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    // Aguarda o primeiro CTA estar montado antes da varredura.
    await expect(page.getByTestId("checkout-plan-cta-essencial")).toBeVisible();

    const results = await runAxe(page);
    const { critical, serious } = reportViolations(results, "checkout-desktop");
    expect(
      critical,
      `Violações críticas em /checkout desktop:\n${critical.map((v) => v.id).join(", ")}`,
    ).toHaveLength(0);
    expect(
      serious,
      `Violações sérias em /checkout desktop:\n${serious.map((v) => v.id).join(", ")}`,
    ).toHaveLength(0);
  });

  test("mobile 390×844 — sem violações critical/serious", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    await expect(page.getByTestId("checkout-plan-cta-essencial")).toBeVisible();

    const results = await runAxe(page);
    const { critical, serious } = reportViolations(results, "checkout-mobile");
    expect(
      critical,
      `Violações críticas em /checkout mobile:\n${critical.map((v) => v.id).join(", ")}`,
    ).toHaveLength(0);
    expect(
      serious,
      `Violações sérias em /checkout mobile:\n${serious.map((v) => v.id).join(", ")}`,
    ).toHaveLength(0);
  });
});
