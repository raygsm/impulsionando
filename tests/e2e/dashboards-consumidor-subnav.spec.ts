import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: Minha área (/dashboards/consumidor) — sub-nav, hash, restore on refresh.
 *
 * Skips automatically when E2E_EMAIL/E2E_PASSWORD are not provided since the
 * route lives under _authenticated/.
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const ROUTE = "/dashboards/consumidor";

const SECTIONS = [
  "favoritos",
  "historico",
  "cupons",
  "vouchers",
  "reservas",
  "avaliacoes",
  "comprovantes",
  "notas",
  "creditos",
] as const;

async function login(page: Page) {
  await page.goto("/auth");
  await page.getByLabel(/e-?mail/i).first().fill(EMAIL!);
  await page.getByLabel(/senha/i).first().fill(PASSWORD!);
  await page
    .getByRole("button", { name: /entrar|acessar|login/i })
    .first()
    .click();
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
    timeout: 20_000,
  });
}

test.describe("Minha área — sub-nav, hash e restauração", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "E2E_EMAIL/E2E_PASSWORD não definidos — pulando testes autenticados.",
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
  });

  test("desktop: clicar em uma chip ativa a seção, atualiza aria-selected e hash", async ({
    page,
  }) => {
    const tablist = page.getByRole("tablist", { name: /Seções da Minha área/i });
    await expect(tablist).toBeVisible();

    const target = "cupons";
    const tab = tablist.getByRole("tab", { name: /Meus cupons/i });
    await tab.click();

    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(tab).toHaveAttribute("aria-current", "true");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${target}`);

    // The associated tabpanel exists and is referenced by the active tab
    const tabId = await tab.getAttribute("id");
    expect(tabId).toBe(`tab-${target}`);
    const panel = page.locator(`#${target}[role="tabpanel"]`);
    await expect(panel).toBeVisible();
  });

  test("desktop: refresh com hash restaura a seção ativa", async ({ page }) => {
    await page.goto(`${ROUTE}#vouchers`);
    await page.waitForLoadState("networkidle");
    // Allow the scroll-restoration rAF + IntersectionObserver to settle
    await page.waitForTimeout(800);

    const tab = page.getByRole("tab", { name: /Meus vouchers/i });
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#vouchers");

    // Section should be near the top of the viewport (within sticky header offset)
    const top = await page.locator("#vouchers").evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(top).toBeLessThan(200);
    expect(top).toBeGreaterThan(-50);
  });

  test("desktop: navegação por teclado com setas move o foco entre chips", async ({
    page,
  }) => {
    const first = page.getByRole("tab", { name: /Meus favoritos|seção atual/i }).first();
    await first.focus();
    await page.keyboard.press("ArrowRight");
    const focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute("data-chip") ?? "",
    );
    expect(focusedId).toBe("historico");

    await page.keyboard.press("End");
    const lastId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute("data-chip") ?? "",
    );
    expect(lastId).toBe(SECTIONS[SECTIONS.length - 1]);
  });

  test("mobile: botões anterior/próxima avançam a seção e atualizam hash", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    const next = page.getByRole("button", { name: /Próxima seção/i });
    await expect(next).toBeVisible();
    await next.click();

    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#historico");
    const tab = page.getByRole("tab", { name: /Histórico de visitas|seção atual/i });
    await expect(tab).toHaveAttribute("aria-selected", "true");

    const prev = page.getByRole("button", { name: /Seção anterior/i });
    await prev.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#favoritos");
  });

  test("mobile: refresh restaura a seção salva", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ROUTE}#notas`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#notas");
    const tab = page.getByRole("tab", { name: /Minhas notas|seção atual/i });
    await expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("prefers-reduced-motion: scroll-snap é desativado nas chips", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");

    const snap = await page
      .getByRole("tablist", { name: /Seções da Minha área/i })
      .evaluate((el) => getComputedStyle(el).scrollSnapType);
    // When reduced motion is on we omit snap-x/snap-mandatory utilities
    expect(snap === "none" || snap === "" || snap.startsWith("none")).toBe(true);

    await context.close();
  });
});
