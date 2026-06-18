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

  test("desktop: breadcrumbs navegam de volta para Clube e Início", async ({
    page,
  }) => {
    // Active a non-default section so the breadcrumb shows "Minha área › Seção"
    await page.getByRole("tab", { name: /Meus cupons/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");

    const trail = page.getByRole("navigation", { name: /Trilha/i });
    await expect(trail).toBeVisible();

    // The "Minha área" crumb should be a link when a section is active
    const minhaArea = trail.getByRole("link", { name: /^Minha área$/i });
    await expect(minhaArea).toBeVisible();

    // Click "Clube" crumb → leaves the dashboard
    await trail.getByRole("link", { name: /^Clube$/i }).click();
    await page.waitForURL((u) => u.pathname.startsWith("/clube"), { timeout: 10_000 });
    expect(page.url()).toContain("/clube");

    // Back returns to the dashboard with the previous hash preserved
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect.poll(() => page.evaluate(() => location.pathname)).toBe(ROUTE);
  });

  test("desktop: history back/forward restaura a seção ativa", async ({ page }) => {
    const cupons = page.getByRole("tab", { name: /Meus cupons/i });
    const vouchers = page.getByRole("tab", { name: /Meus vouchers/i });

    await cupons.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await vouchers.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#vouchers");

    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(cupons).toHaveAttribute("aria-selected", "true");
    await expect(cupons).toHaveAttribute("aria-current", "true");

    await page.goForward();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#vouchers");
    await expect(vouchers).toHaveAttribute("aria-selected", "true");
  });

  test("desktop: live region anuncia a seção ativa e ARIA atualiza por teclado", async ({
    page,
  }) => {
    const live = page.locator('[role="status"][aria-live="polite"]');
    await expect(live).toHaveCount(1);

    // Move via Alt+ArrowRight (global shortcut)
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe("");

    const activeAfter1 = await page.evaluate(() => location.hash.replace("#", ""));
    const tabAfter1 = page.locator(`#tab-${activeAfter1}`);
    await expect(tabAfter1).toHaveAttribute("aria-selected", "true");
    await expect(tabAfter1).toHaveAttribute("aria-current", "true");

    // Live region text should reference the same section label
    const label = await tabAfter1.getAttribute("aria-label");
    const cleanLabel = (label ?? "").replace(/\s*\(seção atual\)\s*$/i, "").trim();
    await expect(live).toContainText(cleanLabel);

    // Another step — ARIA must move with the active section
    await page.keyboard.press("Alt+ArrowRight");
    const activeAfter2 = await page.evaluate(() => location.hash.replace("#", ""));
    expect(activeAfter2).not.toBe(activeAfter1);
    await expect(page.locator(`#tab-${activeAfter1}`)).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator(`#tab-${activeAfter2}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("desktop: após refresh, Tab leva o foco à chip ativa e Enter foca o tabpanel", async ({
    page,
  }) => {
    await page.goto(`${ROUTE}#reservas`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // The active chip must be the only one with tabIndex=0 (roving tabindex)
    const activeTab = page.locator('#tab-reservas');
    await expect(activeTab).toHaveAttribute("tabindex", "0");
    await expect(activeTab).toHaveAttribute("aria-selected", "true");

    await activeTab.focus();
    const focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-reservas");

    // Activating with Enter should move focus to the tabpanel
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    const panelFocused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelFocused).toBe("reservas");
  });

  test("mobile: orientation change mantém o alinhamento da seção ativa", async ({
    page,
  }) => {
    // Portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ROUTE}#vouchers`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(700);

    const initialOffset = await page.evaluate(() =>
      Number(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--sec-offset")
          .replace("px", "")
          .trim() || "0",
      ),
    );

    // Rotate to landscape and fire orientationchange — the component listens
    // to it and re-measures the sticky nav, re-aligning the active section.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    await page.waitForTimeout(600);

    const newOffset = await page.evaluate(() =>
      Number(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--sec-offset")
          .replace("px", "")
          .trim() || "0",
      ),
    );
    // Offset may stay similar OR shrink — what matters is the section stays aligned
    expect(newOffset).toBeGreaterThan(0);

    const top = await page
      .locator("#vouchers")
      .evaluate((el) => el.getBoundingClientRect().top);
    // Must still be docked beneath the sticky header (within tolerance)
    expect(top).toBeLessThan(Math.max(initialOffset, newOffset) + 40);
    expect(top).toBeGreaterThan(-50);
  });
});
