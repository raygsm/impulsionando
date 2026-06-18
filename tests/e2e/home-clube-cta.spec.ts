import { test, expect } from "@playwright/test";

/**
 * E2E: Garantias visuais + interativas do CTA "Clube Impulsionando" no hero
 * da home. Usa o token reutilizável `glass-cta` e precisa preservar:
 *  - aparência (snapshot) em tema claro e escuro;
 *  - rota correta (/clube);
 *  - foco visível (focus ring) ao tabular;
 *  - hover/active mudando o background (não regredindo para o estado base).
 *
 * O teste roda no servidor preview (público), sem login.
 */

const ROUTE = "/";

test.describe("Home — CTA Clube Impulsionando (glass-cta)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
  });

  test("aponta para /clube e dispara hero_cta_click", async ({ page }) => {
    const events: string[] = [];
    await page.exposeFunction("__pushEvent", (id: string) => {
      events.push(id);
    });
    await page.addInitScript(() => {
      (window as unknown as { dataLayer: unknown[] }).dataLayer = new Proxy(
        [] as unknown[],
        {
          set(target, key, value) {
            (target as unknown[])[key as unknown as number] = value;
            const ev = value as { event?: string; cta_id?: string } | undefined;
            if (ev && ev.event === "hero_cta_click" && ev.cta_id) {
              (window as unknown as {
                __pushEvent?: (id: string) => void;
              }).__pushEvent?.(ev.cta_id);
            }
            return true;
          },
        },
      );
    });
    await page.goto(ROUTE);

    const cta = page.locator('[data-cta="clube"]');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /\/clube$/);
    await cta.click();
    await page.waitForURL(/\/clube$/);
    expect(events).toContain("clube");
  });

  test("foco visível: Tab até o CTA aplica ring focus-visible", async ({ page }) => {
    const cta = page.locator('[data-cta="clube"]');
    await cta.focus();
    const shadow = await cta.evaluate(
      (el) => getComputedStyle(el as HTMLElement).boxShadow,
    );
    // O token define um duplo box-shadow (2px bg + 2px primary-glow)
    expect(shadow).not.toBe("none");
    expect(shadow.length).toBeGreaterThan(10);
  });

  test("hover altera background sem perder borda", async ({ page }) => {
    const cta = page.locator('[data-cta="clube"]');
    const baseBg = await cta.evaluate(
      (el) => getComputedStyle(el as HTMLElement).backgroundColor,
    );
    await cta.hover();
    // Espera transição (150ms no token)
    await page.waitForTimeout(250);
    const hoverBg = await cta.evaluate(
      (el) => getComputedStyle(el as HTMLElement).backgroundColor,
    );
    expect(hoverBg).not.toBe(baseBg);
    const border = await cta.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderTopWidth,
    );
    expect(parseFloat(border)).toBeGreaterThan(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`snapshot visual no tema ${theme} (gated por E2E_VISUAL=1)`, async ({
      page,
    }, testInfo) => {
      testInfo.skip(
        !!process.env.CI && !process.env.E2E_VISUAL,
        "Visual snapshots geram baselines no primeiro run — habilite com E2E_VISUAL=1.",
      );

      await page.evaluate((mode) => {
        document.documentElement.classList.toggle("dark", mode === "dark");
      }, theme);
      // Aguarda fontes + duas RAFs para estabilizar
      await page.evaluate(
        () =>
          (document as Document & { fonts?: { ready: Promise<unknown> } })
            .fonts?.ready,
      );
      await page.evaluate(
        () =>
          new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          ),
      );

      const cta = page.locator('[data-cta="clube"]');
      await expect(cta).toHaveScreenshot(`hero-clube-cta-${theme}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});
