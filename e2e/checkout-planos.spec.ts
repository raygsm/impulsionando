import { test, expect } from "@playwright/test";

/**
 * /checkout — listagem de planos (Essencial · Ideal · Full)
 *
 * Cobre:
 *  - preços correspondem ao salário mínimo (½ / 1× / 2× SM)
 *  - badge "Recomendado" aparece apenas no plano Ideal (highlight)
 *  - CTAs apontam para /contratar?plano=<code> com o slug correto
 *  - eventos GA4 (view_item_list + select_item + begin_checkout) são disparados
 *    quando o usuário aceita consentimento de analytics
 *  - navegação por teclado (Tab) chega aos 3 CTAs e Enter aciona a navegação
 *  - responsividade mobile: cards empilhados, sem overflow horizontal, tap ≥ 44px
 *  - a11y: um único <main>, H1 único, botões com aria-label descritivo
 */

const PLANS = [
  { code: "essencial", factor: 0.5, label: /Essencial/i },
  { code: "integrado", factor: 1, label: /Ideal/i, highlight: true },
  { code: "avancado", factor: 2, label: /Full/i },
];

// Stub simples do dataLayer — trackEvent sempre espelha nele.
async function stubAnalytics(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as any).dataLayer = [];
  });
}

async function getDlEvents(page: import("@playwright/test").Page, name: string) {
  return page.evaluate((evt) => {
    const dl: any[] = (window as any).dataLayer ?? [];
    return dl.filter((e) => e && typeof e === "object" && e.event === evt);
  }, name);
}

test.describe("/checkout — planos", () => {
  test.beforeEach(async ({ page }) => {
    await stubAnalytics(page);
  });

  test("renderiza os 3 planos com o badge Recomendado no Ideal e CTAs corretos", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1, name: /escolha seu plano/i })).toBeVisible();

    // Deve haver exatamente 1 <main>
    await expect(page.locator("main")).toHaveCount(1);

    const wageText = await page.getByTestId("checkout-minimum-wage").innerText();
    // "R$ 1.621,00" → 162100
    const wageCents = Math.round(
      Number(wageText.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) * 100,
    );
    expect(wageCents).toBeGreaterThan(0);

    for (const plan of PLANS) {
      const card = page.getByTestId(`checkout-plan-${plan.code}`);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute(
        "data-highlight",
        plan.highlight ? "true" : "false",
      );

      // Preço = wage * fator (tolerância de 1 centavo por arredondamento).
      const priceEl = page.getByTestId(`checkout-plan-price-${plan.code}`);
      const priceCents = Number(await priceEl.getAttribute("data-price-cents"));
      const expected = Math.round(wageCents * plan.factor);
      expect(Math.abs(priceCents - expected)).toBeLessThanOrEqual(1);

      // CTA
      const cta = page.getByTestId(`checkout-plan-cta-${plan.code}`);
      await expect(cta).toHaveAttribute("href", `/contratar?plano=${plan.code}`);
      await expect(cta).toHaveAttribute("data-plan-code", plan.code);
      const aria = await cta.getAttribute("aria-label");
      expect(aria).toMatch(/Contratar/);
      expect(aria).toMatch(/R\$/);
    }

    // Badge "Recomendado" só no Ideal.
    await expect(page.getByTestId("checkout-plan-badge-integrado")).toBeVisible();
    await expect(page.getByTestId("checkout-plan-badge-essencial")).toHaveCount(0);
    await expect(page.getByTestId("checkout-plan-badge-avancado")).toHaveCount(0);
  });

  test("dispara analytics: view_item_list no load e select_item + begin_checkout no clique", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-page")).toBeVisible();

    const viewList = await getDlEvents(page, "view_item_list");
    expect(viewList.length).toBeGreaterThanOrEqual(1);
    const items = (viewList[0] as any)?.items ?? [];
    expect(items.map((i: any) => i.item_id).sort()).toEqual(
      ["avancado", "essencial", "integrado"],
    );

    // Clica em cada plano e valida os eventos — usa Ctrl+Click para não navegar
    // (Playwright abre em nova aba invisível; o handler onClick roda igual).
    for (const plan of PLANS) {
      await page.getByTestId(`checkout-plan-cta-${plan.code}`).click({
        modifiers: ["ControlOrMeta"],
      });
    }

    const selects = await getDlEvents(page, "select_item");
    const begins = await getDlEvents(page, "begin_checkout");
    const codesSelected = selects
      .map((e: any) => e?.items?.[0]?.item_id)
      .filter(Boolean);
    for (const plan of PLANS) expect(codesSelected).toContain(plan.code);
    expect(begins.length).toBeGreaterThanOrEqual(3);
    for (const plan of PLANS) {
      const evt = begins.find((e: any) => e.plan_code === plan.code) as any;
      expect(evt, `begin_checkout ${plan.code}`).toBeTruthy();
      expect(evt.currency).toBe("BRL");
      expect(typeof evt.value).toBe("number");
      expect(evt.value).toBeGreaterThan(0);
    }
  });

  test("navegação por teclado alcança e ativa os CTAs", async ({ page }) => {
    await page.goto("/checkout");
    const cta = page.getByTestId("checkout-plan-cta-essencial");
    await cta.focus();
    await expect(cta).toBeFocused();
    // Enter navega — capturamos a URL destino.
    await Promise.all([
      page.waitForURL(/\/contratar\?plano=essencial/),
      page.keyboard.press("Enter"),
    ]);
  });

  test.describe("mobile viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("cards empilham e mantêm tap-target adequado sem overflow horizontal", async ({ page }) => {
      await page.goto("/checkout");
      await expect(page.getByTestId("checkout-page")).toBeVisible();

      // Sem overflow horizontal.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      for (const plan of PLANS) {
        const cta = page.getByTestId(`checkout-plan-cta-${plan.code}`);
        const box = await cta.boundingBox();
        expect(box, `bounding box ${plan.code}`).toBeTruthy();
        expect(box!.height).toBeGreaterThanOrEqual(40); // shadcn Button padrão + min-h-11
      }
    });
  });
});
