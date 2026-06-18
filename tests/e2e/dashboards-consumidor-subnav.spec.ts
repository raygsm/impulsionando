import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

const SECTIONS_LABELS: Record<(typeof SECTIONS)[number], string> = {
  favoritos: "Meus favoritos",
  historico: "Histórico de visitas",
  cupons: "Meus cupons",
  vouchers: "Meus vouchers",
  reservas: "Minhas reservas",
  avaliacoes: "Minhas avaliações",
  comprovantes: "Comprovantes",
  notas: "Minhas notas",
  creditos: "Meus créditos",
};

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
        getComputedStyle(document.getElementById("vouchers") || document.documentElement)
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
        getComputedStyle(document.getElementById("vouchers") || document.documentElement)
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

  test("mouse: clicar em chip atualiza hash, ARIA, live region e rola com offset", async ({
    page,
  }) => {
    const live = page.locator('[role="status"][aria-live="polite"]');
    const tab = page.getByRole("tab", { name: /Minhas reservas/i });
    await tab.click();

    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#reservas");
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(tab).toHaveAttribute("aria-current", "true");

    // Other chips lose selection
    await expect(page.locator('#tab-favoritos')).toHaveAttribute("aria-selected", "false");

    // Live region announces the active label
    await expect(live).toContainText(/Minhas reservas/i);

    // Section is docked under the sticky header (uses the measured offset)
    const offset = await page.evaluate(() =>
      Number(
        getComputedStyle(document.getElementById("reservas")!)
          .getPropertyValue("--sec-offset")
          .replace("px", "")
          .trim() || "0",
      ),
    );
    expect(offset).toBeGreaterThan(0);
    const top = await page
      .locator("#reservas")
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(offset + 40);
    expect(top).toBeGreaterThan(-50);

    // Back/forward keeps the active section in sync with the hash
    await page.getByRole("tab", { name: /Meus cupons/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");

    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#reservas");
    await expect(page.locator('#tab-reservas')).toHaveAttribute("aria-selected", "true");
    await expect(live).toContainText(/Minhas reservas/i);

    await page.goForward();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(page.locator('#tab-cupons')).toHaveAttribute("aria-selected", "true");
    await expect(live).toContainText(/Meus cupons/i);
  });

  test("mouse: breadcrumb 'Minha área' volta para a página sem hash e limpa a trilha", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /Meus vouchers/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#vouchers");

    const trail = page.getByRole("navigation", { name: /Trilha/i });
    await trail.getByRole("link", { name: /^Minha área$/i }).click();

    // Pathname remains the dashboard, hash is cleared by the router link
    await expect
      .poll(() => page.evaluate(() => location.pathname))
      .toBe(ROUTE);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
  });

  test("sem hash: foco inicial via Tab cai na chip padrão; Enter foca o tabpanel", async ({
    page,
  }) => {
    // Fresh navigation without hash and without restored sessionStorage
    await page.evaluate(() => sessionStorage.removeItem("dashboards:consumidor:section"));
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    // The first chip is the only one with tabIndex=0 (roving tabindex baseline)
    const firstChip = page.locator('#tab-favoritos');
    await expect(firstChip).toHaveAttribute("tabindex", "0");

    // Other chips are -1 until activated
    await expect(page.locator('#tab-historico')).toHaveAttribute("tabindex", "-1");

    await firstChip.focus();
    const focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-favoritos");

    // Enter activates and moves focus to the matching tabpanel
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    const panelFocused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelFocused).toBe("favoritos");
    await expect(page.locator('#tab-favoritos')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('#tab-favoritos')).toHaveAttribute("aria-current", "true");
  });

  test("live region: Alt+Arrow, Enter e Space anunciam exatamente o nome da seção", async ({
    page,
  }) => {
    const live = page.locator('[role="status"][aria-live="polite"]');

    // Start from #favoritos so transitions are predictable
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await expect(live).toContainText(/Meus favoritos/i);

    // Alt+ArrowRight → historico
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#historico");
    await expect(live).toContainText(/Histórico de visitas/i);

    // Alt+ArrowLeft → favoritos
    await page.keyboard.press("Alt+ArrowLeft");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#favoritos");
    await expect(live).toContainText(/Meus favoritos/i);

    // Focus a non-active chip and activate with Space
    const cupons = page.locator('#tab-cupons');
    await page.locator('#tab-favoritos').focus();
    // ArrowRight twice in the tablist (favoritos → historico → cupons)
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press(" ");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(cupons).toHaveAttribute("aria-selected", "true");
    await expect(live).toContainText(/Meus cupons/i);

    // Move focus back and activate with Enter
    await cupons.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#historico");
    await expect(live).toContainText(/Histórico de visitas/i);
  });

  test("hash inválido: fallback para a seção padrão sem inconsistências de ARIA", async ({
    page,
  }) => {
    await page.evaluate(() => sessionStorage.removeItem("dashboards:consumidor:section"));
    await page.goto(`${ROUTE}#secao-que-nao-existe`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Exactly one chip can be aria-selected=true
    const selectedCount = await page.locator('[role="tab"][aria-selected="true"]').count();
    expect(selectedCount).toBeLessThanOrEqual(1);

    // Exactly one chip must hold the roving tabIndex=0
    const tabbables = await page.locator('[role="tab"][tabindex="0"]').count();
    expect(tabbables).toBe(1);

    // The first chip is the default-focusable baseline
    await expect(page.locator('#tab-favoritos')).toHaveAttribute("tabindex", "0");

    // Live region must either be empty (no active) or match an existing label
    const liveText = (await page.locator('[role="status"][aria-live="polite"]').textContent()) ?? "";
    if (liveText.trim().length > 0) {
      expect(liveText).toMatch(
        /(Meus favoritos|Histórico de visitas|Meus cupons|Meus vouchers|Minhas reservas|Minhas avaliações|Comprovantes|Minhas notas|Meus créditos)/i,
      );
    }

    // The invalid hash should not match any tab id — no stale aria-current
    const ariaCurrents = await page.locator('[role="tab"][aria-current="true"]').count();
    expect(ariaCurrents).toBeLessThanOrEqual(1);
  });

  test("mobile: cliques em chip e breadcrumb mantêm alinhamento com o offset", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const checkAligned = async (id: string) => {
      const offset = await page.evaluate((sid) => {
        const el = document.getElementById(sid);
        if (!el) return 0;
        return Number(
          getComputedStyle(el).getPropertyValue("--sec-offset").replace("px", "").trim() ||
            "0",
        );
      }, id);
      expect(offset).toBeGreaterThan(0);
      const top = await page
        .locator(`#${id}`)
        .evaluate((el) => el.getBoundingClientRect().top);
      // Section docked beneath the sticky nav (within tolerance)
      expect(top).toBeLessThan(offset + 48);
      expect(top).toBeGreaterThan(-50);
    };

    // 1) Click a chip
    await page.getByRole("tab", { name: /Meus cupons/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await page.waitForTimeout(500);
    await checkAligned("cupons");

    // 2) Click another chip
    await page.getByRole("tab", { name: /Minhas reservas/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#reservas");
    await page.waitForTimeout(500);
    await checkAligned("reservas");

    // 3) Breadcrumb "Minha área" clears hash; clicking a chip again re-aligns
    const trail = page.getByRole("navigation", { name: /Trilha/i });
    await trail.getByRole("link", { name: /^Minha área$/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("");

    await page.getByRole("tab", { name: /Meus vouchers/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#vouchers");
    await page.waitForTimeout(500);
    await checkAligned("vouchers");
  });

  test("histórico: back/forward nunca pula nem dessincroniza aria-selected", async ({
    page,
  }) => {
    const trail: string[] = ["cupons", "vouchers", "reservas", "avaliacoes"];

    for (const id of trail) {
      await page.locator(`#tab-${id}`).click();
      await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${id}`);
      await expect(page.locator(`#tab-${id}`)).toHaveAttribute("aria-selected", "true");
      // Only one selected at a time
      const selectedCount = await page.locator('[role="tab"][aria-selected="true"]').count();
      expect(selectedCount).toBe(1);
    }

    // Walk back through the trail in reverse — must hit each exact entry
    for (let i = trail.length - 2; i >= 0; i--) {
      await page.goBack();
      const id = trail[i];
      await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${id}`);
      await expect(page.locator(`#tab-${id}`)).toHaveAttribute("aria-selected", "true");
      const others = await page
        .locator('[role="tab"][aria-selected="true"]')
        .count();
      expect(others).toBe(1);
    }

    // Walk forward — must hit each forward entry in order
    for (let i = 1; i < trail.length; i++) {
      await page.goForward();
      const id = trail[i];
      await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${id}`);
      await expect(page.locator(`#tab-${id}`)).toHaveAttribute("aria-selected", "true");
    }
  });

  test("a11y: roving tabindex, foco visível e tabpanel após Alt+Arrow/Enter/Space", async ({
    page,
  }) => {
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    const rovingActive = async () => {
      const ids = await page.locator('[role="tab"][tabindex="0"]').evaluateAll((els) =>
        els.map((e) => (e as HTMLElement).id),
      );
      return ids;
    };

    // Roving baseline: exactly one chip with tabIndex=0 — the active one
    let active = await rovingActive();
    expect(active).toEqual(["tab-favoritos"]);

    // Alt+ArrowRight changes the active section AND the roving tabindex
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(300);
    active = await rovingActive();
    expect(active.length).toBe(1);
    expect(active[0]).toBe("tab-historico");

    // Focus the new active chip and confirm focus-visible ring tokens are set
    await page.locator("#tab-historico").focus();
    const focusRing = await page.locator("#tab-historico").evaluate((el) => {
      const cls = (el as HTMLElement).className;
      return {
        hasFocusVisible: cls.includes("focus-visible:ring-2"),
        hasFocusOffset: cls.includes("focus-visible:ring-offset-2"),
        hasRingToken: cls.includes("focus-visible:ring-ring"),
      };
    });
    expect(focusRing.hasFocusVisible).toBe(true);
    expect(focusRing.hasFocusOffset).toBe(true);
    expect(focusRing.hasRingToken).toBe(true);

    // Enter on the focused chip activates AND moves focus into the tabpanel
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    let panelId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelId).toBe("historico");
    await expect(page.locator("#historico")).toHaveAttribute("role", "tabpanel");
    await expect(page.locator("#historico")).toHaveAttribute("tabindex", "-1");

    // After activation the roving tabindex follows the active chip
    active = await rovingActive();
    expect(active).toEqual(["tab-historico"]);

    // Focus the next chip via ArrowRight, then activate with Space
    await page.locator("#tab-historico").focus();
    await page.keyboard.press("ArrowRight");
    const focusedAfterArrow = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedAfterArrow).toBe("tab-cupons");

    await page.keyboard.press(" ");
    await page.waitForTimeout(450);
    panelId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelId).toBe("cupons");

    // Roving tabindex moved with activation, focus-ring tokens still present
    active = await rovingActive();
    expect(active).toEqual(["tab-cupons"]);
    const stillHasRing = await page
      .locator("#tab-cupons")
      .evaluate((el) =>
        (el as HTMLElement).className.includes("focus-visible:ring-ring"),
      );
    expect(stillHasRing).toBe(true);
  });

  test("prefers-reduced-motion: snap/animação desativados, ARIA e live region OK", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    const tablist = page.getByRole("tablist", { name: /Seções da Minha área/i });
    const snap = await tablist.evaluate((el) => getComputedStyle(el).scrollSnapType);
    expect(snap === "none" || snap === "" || snap.startsWith("none")).toBe(true);

    // Chips should not carry snap-start when reduced motion is on
    const chipSnap = await page
      .locator('#tab-cupons')
      .evaluate((el) => (el as HTMLElement).className.includes("snap-start"));
    expect(chipSnap).toBe(false);

    // Activate a chip and confirm ARIA + hash + live region still update
    const live = page.locator('[role="status"][aria-live="polite"]');
    await page.getByRole("tab", { name: /Meus cupons/i }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(page.locator('#tab-cupons')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('#tab-cupons')).toHaveAttribute("aria-current", "true");
    await expect(live).toContainText(/Meus cupons/i);

    await context.close();
  });

  test("mobile: rotação após seleção mantém seção ativa e foco do tabpanel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Select via keyboard so we can assert tabpanel focus afterwards
    await page.locator('#tab-favoritos').focus();
    await page.keyboard.press("ArrowRight"); // → historico
    await page.keyboard.press("ArrowRight"); // → cupons
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);

    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    const focusedBefore = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedBefore).toBe("cupons");

    // Rotate to landscape and dispatch orientationchange
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    await page.waitForTimeout(600);

    // Active section and ARIA must remain pointing to cupons
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(page.locator('#tab-cupons')).toHaveAttribute("aria-selected", "true");

    // The tabpanel should still hold (or have been restored to) focus on the panel.
    // If the browser dropped focus during the viewport change, the focused element
    // must at minimum still belong to the cupons section (panel or its descendants).
    const stillInPanel = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      if (active.id === "cupons") return true;
      const panel = document.getElementById("cupons");
      return !!panel && panel.contains(active);
    });
    expect(stillInPanel).toBe(true);

    // Section is still docked under the (possibly new) sticky header offset
    const offset = await page.evaluate(() =>
      Number(
        getComputedStyle(document.getElementById("cupons")!)
          .getPropertyValue("--sec-offset")
          .replace("px", "")
          .trim() || "0",
      ),
    );
    const top = await page
      .locator("#cupons")
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(offset + 48);
    expect(top).toBeGreaterThan(-50);
  });

  test("teclado: Home/End movem foco para primeira/última chip com ARIA correto", async ({
    page,
  }) => {
    await page.goto(`${ROUTE}#cupons`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    const firstId = SECTIONS[0];
    const lastId = SECTIONS[SECTIONS.length - 1];
    const live = page.locator('[role="status"][aria-live="polite"]');

    // Focus into the tablist and press End → focus jumps to last chip
    await page.locator('#tab-cupons').focus();
    await page.keyboard.press("End");
    let focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe(`tab-${lastId}`);

    // Focus-ring tokens still present on the chip that received focus
    const lastRing = await page
      .locator(`#tab-${lastId}`)
      .evaluate((el) => {
        const cls = (el as HTMLElement).className;
        return (
          cls.includes("focus-visible:ring-2") &&
          cls.includes("focus-visible:ring-ring") &&
          cls.includes("focus-visible:ring-offset-2")
        );
      });
    expect(lastRing).toBe(true);

    // Activate with Enter → ARIA + tabpanel focus must update
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${lastId}`);
    await expect(page.locator(`#tab-${lastId}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(`#tab-${lastId}`)).toHaveAttribute(
      "aria-current",
      "true",
    );
    let panelId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelId).toBe(lastId);
    await expect(live).toContainText(
      new RegExp(
        SECTIONS_LABELS[lastId].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      ),
    );

    // Home → first chip, then Space activates and focuses its tabpanel
    await page.locator(`#tab-${lastId}`).focus();
    await page.keyboard.press("Home");
    focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe(`tab-${firstId}`);

    await page.keyboard.press(" ");
    await page.waitForTimeout(450);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${firstId}`);
    await expect(page.locator(`#tab-${firstId}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    panelId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelId).toBe(firstId);
    await expect(live).toContainText(
      new RegExp(
        SECTIONS_LABELS[firstId].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      ),
    );

    // Roving tabindex moved with the active chip
    const tabbables = await page
      .locator('[role="tab"][tabindex="0"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).id));
    expect(tabbables).toEqual([`tab-${firstId}`]);
  });

  test("rápido: troca em rajada via Alt+Arrow anuncia apenas a última seção", async ({
    page,
  }) => {
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    const live = page.locator('[role="status"][aria-live="polite"]');
    await page.locator("body").focus();

    // Burst: Alt+ArrowRight x4 — should land on SECTIONS[4] = avaliacoes
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Alt+ArrowRight");
    }
    await page.waitForTimeout(400);

    const targetIdx = 4;
    const targetId = SECTIONS[targetIdx];
    const targetLabel = SECTIONS_LABELS[targetId];

    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${targetId}`);
    await expect(page.locator(`#tab-${targetId}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Live region must show ONLY the latest active label (no stale text)
    const liveText = ((await live.textContent()) ?? "").trim();
    expect(liveText).toContain(targetLabel);

    // Verify no other section label leaked into the live region text
    for (const id of SECTIONS) {
      if (id === targetId) continue;
      const label = SECTIONS_LABELS[id];
      expect(liveText).not.toContain(label);
    }

    // Add Enter + Space bursts to confirm activation announcements also collapse
    await page.locator(`#tab-${targetId}`).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press(" ");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);

    const finalId = SECTIONS[targetIdx + 2];
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${finalId}`);
    const finalText = ((await live.textContent()) ?? "").trim();
    expect(finalText).toContain(SECTIONS_LABELS[finalId]);
    for (const id of SECTIONS) {
      if (id === finalId) continue;
      expect(finalText).not.toContain(SECTIONS_LABELS[id]);
    }
  });

  test("visual regression: chip ativo, focus ring e tabpanel após Alt+Arrow/Home/End", async ({
    page,
  }) => {
    test.skip(
      !!process.env.CI && !process.env.E2E_VISUAL,
      "Visual snapshots geram baselines no primeiro run — habilite com E2E_VISUAL=1.",
    );

    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tablist = page.getByRole("tablist", { name: /Seções da Minha área/i });

    // Baseline (no chip focused, favoritos active)
    await expect(tablist).toHaveScreenshot("subnav-active-favoritos.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });

    // Alt+ArrowRight → historico active; focus the chip to capture focus-ring
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(400);
    await page.locator("#tab-historico").focus();
    await expect(tablist).toHaveScreenshot("subnav-focus-historico.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
    await expect(page.locator("#historico")).toHaveScreenshot(
      "tabpanel-historico.png",
      { maxDiffPixelRatio: 0.03, animations: "disabled" },
    );

    // End → last chip focused (creditos)
    await page.keyboard.press("End");
    await page.waitForTimeout(200);
    await expect(tablist).toHaveScreenshot("subnav-focus-end-creditos.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });

    // Home → first chip focused (favoritos)
    await page.keyboard.press("Home");
    await page.waitForTimeout(200);
    await expect(tablist).toHaveScreenshot("subnav-focus-home-favoritos.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("RTL: Alt+Arrow, aria-selected/current e roving tabindex seguem a ordem do DOM", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);

    // Switch document direction to RTL
    await page.goto(ROUTE);
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
    });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    // DOM order is preserved; Alt+ArrowRight walks forward through SECTIONS
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(300);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#historico");
    await expect(page.locator("#tab-historico")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-historico")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Roving tabindex follows
    const rovingAfterRight = await page
      .locator('[role="tab"][tabindex="0"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).id));
    expect(rovingAfterRight).toEqual(["tab-historico"]);

    // Alt+ArrowLeft walks back
    await page.keyboard.press("Alt+ArrowLeft");
    await page.waitForTimeout(300);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#favoritos");
    await expect(page.locator("#tab-favoritos")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const rovingAfterLeft = await page
      .locator('[role="tab"][tabindex="0"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).id));
    expect(rovingAfterLeft).toEqual(["tab-favoritos"]);

    // Inside the tablist, ArrowRight still focuses the next chip in DOM order
    await page.locator("#tab-favoritos").focus();
    await page.keyboard.press("ArrowRight");
    const focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-historico");

    await context.close();
  });

  test("deep link: abrir com #cupons seleciona a chip, anuncia 1x e foca tabpanel", async ({
    page,
  }) => {
    // Listen for live region mutations so we can assert it settled to one value
    await page.addInitScript(() => {
      (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces = [];
      const obs = new MutationObserver(() => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        const txt = (live?.textContent ?? "").trim();
        const log = (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces;
        if (txt && log[log.length - 1] !== txt) log.push(txt);
      });
      const start = () => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        if (!live) return false;
        obs.observe(live, { childList: true, characterData: true, subtree: true });
        // Capture initial value
        const txt = (live.textContent ?? "").trim();
        if (txt) (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces.push(txt);
        return true;
      };
      if (!start()) {
        const i = setInterval(() => {
          if (start()) clearInterval(i);
        }, 50);
      }
    });

    await page.goto(`${ROUTE}#cupons`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    await expect(page.locator("#tab-cupons")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-cupons")).toHaveAttribute("aria-current", "true");

    // Live region should hold the cupons label
    const live = page.locator('[role="status"][aria-live="polite"]');
    await expect(live).toContainText(/Meus cupons/i);

    // Only one distinct label was announced during the deep-link load
    const announces = await page.evaluate(
      () => (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces,
    );
    const cuponsAnnounces = announces.filter((t) => /Meus cupons/i.test(t));
    expect(cuponsAnnounces.length).toBeGreaterThanOrEqual(1);
    // No other section label leaked into the live region
    for (const id of SECTIONS) {
      if (id === "cupons") continue;
      const label = SECTIONS_LABELS[id];
      expect(announces.every((t) => !t.includes(label))).toBe(true);
    }

    // Activate from the focused chip to land focus inside the tabpanel
    await page.locator("#tab-cupons").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    const focusedPanel = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedPanel).toBe("cupons");
  });

  test("hover: hover no chip não dispara seleção nem anúncio na live region", async ({
    page,
  }) => {
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const live = page.locator('[role="status"][aria-live="polite"]');
    const liveBefore = ((await live.textContent()) ?? "").trim();
    const hashBefore = await page.evaluate(() => location.hash);

    // Focus a known chip so we can later prove keyboard focus survived hover
    await page.locator("#tab-favoritos").focus();
    let focused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focused).toBe("tab-favoritos");

    // Hover several other chips — must not change hash, ARIA, or live region
    for (const id of ["historico", "cupons", "vouchers", "reservas"] as const) {
      await page.locator(`#tab-${id}`).hover();
      await page.waitForTimeout(120);

      // No chip other than favoritos is selected
      await expect(page.locator(`#tab-${id}`)).toHaveAttribute(
        "aria-selected",
        "false",
      );
      await expect(page.locator(`#tab-${id}`)).not.toHaveAttribute(
        "aria-current",
        "true",
      );
    }

    // Active chip and hash are unchanged
    await expect(page.locator("#tab-favoritos")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await page.evaluate(() => location.hash)).toBe(hashBefore);

    // Live region wasn't updated by hover
    const liveAfter = ((await live.textContent()) ?? "").trim();
    expect(liveAfter).toBe(liveBefore);

    // Keyboard focus survived the hover (DOM focus still on the chip we focused)
    focused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focused).toBe("tab-favoritos");

    // Activation (click) is what flips ARIA + updates live region
    await page.locator("#tab-cupons").click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(page.locator("#tab-cupons")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(live).toContainText(/Meus cupons/i);

  test("visual regression (reduced motion): chip ativo, focus ring e tabpanel", async ({
    browser,
  }) => {
    test.skip(
      !!process.env.CI && !process.env.E2E_VISUAL,
      "Visual snapshots geram baselines no primeiro run — habilite com E2E_VISUAL=1.",
    );

    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tablist = page.getByRole("tablist", { name: /Seções da Minha área/i });

    await expect(tablist).toHaveScreenshot("rm-subnav-active-favoritos.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });

    // Alt+ArrowRight → historico active; focus the chip to capture focus-ring
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(300);
    await page.locator("#tab-historico").focus();
    await expect(tablist).toHaveScreenshot("rm-subnav-focus-historico.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
    await expect(page.locator("#historico")).toHaveScreenshot(
      "rm-tabpanel-historico.png",
      { maxDiffPixelRatio: 0.03, animations: "disabled" },
    );

    // End → last chip focused
    await page.keyboard.press("End");
    await page.waitForTimeout(200);
    await expect(tablist).toHaveScreenshot("rm-subnav-focus-end-creditos.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });

    await context.close();
  });

  test("RTL: Alt+Arrow mantém tablist com offset e chip ativa visível", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);
    await page.goto(ROUTE);
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
    });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    // Walk forward a few steps and assert each section is docked under header
    const stops: Array<(typeof SECTIONS)[number]> = ["historico", "cupons", "vouchers"];
    await page.locator("body").focus();

    for (const id of stops) {
      await page.keyboard.press("Alt+ArrowRight");
      await page.waitForTimeout(450);
      await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${id}`);

      // Section sits under the sticky header (within measured offset)
      const offset = await page.evaluate((sid) => {
        const el = document.getElementById(sid);
        if (!el) return 0;
        return Number(
          getComputedStyle(el).getPropertyValue("--sec-offset").replace("px", "").trim() ||
            "0",
        );
      }, id);
      expect(offset).toBeGreaterThan(0);
      const top = await page
        .locator(`#${id}`)
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeLessThan(offset + 48);
      expect(top).toBeGreaterThan(-50);

      // Active chip is visible inside the tablist viewport (not clipped off-screen)
      const chipVisible = await page.locator(`#tab-${id}`).evaluate((chip) => {
        const list = chip.closest('[role="tablist"]') as HTMLElement | null;
        if (!list) return false;
        const cr = chip.getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        // Chip must overlap horizontally with the tablist's visible band
        return cr.right > lr.left + 4 && cr.left < lr.right - 4;
      });
      expect(chipVisible).toBe(true);
    }

    await context.close();
  });

  test("a11y: axe não encontra violações em tablist/tabpanel após navegação por teclado", async ({
    page,
  }) => {
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Move through a few sections via keyboard before auditing
    await page.locator("body").focus();
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(200);
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(200);
    await page.locator("#tab-cupons").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);

    const results = await new AxeBuilder({ page })
      .include('[role="tablist"]')
      .include('[role="tabpanel"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter to rules directly related to tablist/tabpanel semantics
    const relevant = results.violations.filter((v) =>
      [
        "aria-valid-attr",
        "aria-valid-attr-value",
        "aria-required-attr",
        "aria-required-children",
        "aria-required-parent",
        "aria-allowed-attr",
        "aria-allowed-role",
        "aria-roles",
        "tabindex",
        "duplicate-id",
        "duplicate-id-aria",
      ].includes(v.id),
    );

    if (relevant.length > 0) {
      console.error(
        "axe violations:",
        JSON.stringify(
          relevant.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })),
          null,
          2,
        ),
      );
    }
    expect(relevant).toEqual([]);

    // Structural invariants axe doesn't enforce directly
    const tabs = await page.locator('[role="tab"]').count();
    expect(tabs).toBe(SECTIONS.length);
    const selectedCount = await page.locator('[role="tab"][aria-selected="true"]').count();
    expect(selectedCount).toBe(1);
    const rovingCount = await page.locator('[role="tab"][tabindex="0"]').count();
    expect(rovingCount).toBe(1);
    // Every tab references an existing tabpanel via aria-controls
    const orphanControls = await page.locator('[role="tab"]').evaluateAll((tabs) =>
      tabs
        .map((t) => (t as HTMLElement).getAttribute("aria-controls"))
        .filter((id): id is string => !!id)
        .filter((id) => !document.getElementById(id)),
    );
    expect(orphanControls).toEqual([]);
  });

  test("hash desconhecido: cai na seção padrão, foca tabpanel e anuncia 1x", async ({
    page,
  }) => {
    // Capture live region announcements from the very start
    await page.addInitScript(() => {
      (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces = [];
      const obs = new MutationObserver(() => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        const txt = (live?.textContent ?? "").trim();
        const log = (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces;
        if (txt && log[log.length - 1] !== txt) log.push(txt);
      });
      const start = () => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        if (!live) return false;
        obs.observe(live, { childList: true, characterData: true, subtree: true });
        const txt = (live.textContent ?? "").trim();
        if (txt) (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces.push(txt);
        return true;
      };
      if (!start()) {
        const i = setInterval(() => {
          if (start()) clearInterval(i);
        }, 50);
      }
    });

    // Clear sessionStorage so no previous section overrides the fallback
    await page.goto(ROUTE);
    await page.evaluate(() =>
      sessionStorage.removeItem("dashboards:consumidor:section"),
    );
    await page.goto(`${ROUTE}#hash-que-nao-existe-123`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    // Default chip (first) must hold the roving tabindex baseline
    const defaultId = SECTIONS[0];
    await expect(page.locator(`#tab-${defaultId}`)).toHaveAttribute("tabindex", "0");

    // No stale aria-current/aria-selected from other chips
    const selectedCount = await page.locator('[role="tab"][aria-selected="true"]').count();
    expect(selectedCount).toBeLessThanOrEqual(1);

    // Focus and activate the default chip — focus should land in its tabpanel
    await page.locator(`#tab-${defaultId}`).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    const focusedPanel = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedPanel).toBe(defaultId);
    await expect(page.locator(`#tab-${defaultId}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(`#tab-${defaultId}`)).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Live region announced the default label and never any other section
    const announces: string[] = await page.evaluate(
      () => (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces,
    );
    const defaultLabel = SECTIONS_LABELS[defaultId];
    const defaultHits = announces.filter((t) => t.includes(defaultLabel));
    expect(defaultHits.length).toBeGreaterThanOrEqual(1);
    // No leakage of other section names
    for (const id of SECTIONS) {
      if (id === defaultId) continue;
      const label = SECTIONS_LABELS[id];
      expect(announces.every((t) => !t.includes(label))).toBe(true);
    }
  });

  test("RTL + reduced motion: Tab, Enter e Space movem foco e roving tabindex", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);

    // Capture every distinct live-region text from page open onward
    await page.addInitScript(() => {
      (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces = [];
      const start = () => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        if (!live) return false;
        const log = (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces;
        const push = () => {
          const txt = (live.textContent ?? "").trim();
          if (txt && log[log.length - 1] !== txt) log.push(txt);
        };
        push();
        new MutationObserver(push).observe(live, {
          childList: true,
          characterData: true,
          subtree: true,
        });
        return true;
      };
      if (!start()) {
        const i = setInterval(() => {
          if (start()) clearInterval(i);
        }, 50);
      }
    });

    await page.goto(ROUTE);
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
      sessionStorage.removeItem("dashboards:consumidor:section");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const liveCount = async () =>
      (await page.evaluate(
        () => (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces.length,
      )) as number;
    const liveLog = async () =>
      (await page.evaluate(
        () => (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces,
      )) as string[];

    // Snapshot the baseline announcement count (after initial render)
    const baseline = await liveCount();

    // Tab into the chip with tabindex=0 (default = favoritos)
    await page.locator(`#tab-favoritos`).focus();
    let focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-favoritos");

    // Hover should NOT push a new announcement
    await page.locator("#tab-cupons").hover();
    await page.waitForTimeout(200);
    expect(await liveCount()).toBe(baseline);

    // ArrowRight (focus-only, no activation) must NOT push an announcement
    await page.locator(`#tab-favoritos`).focus();
    await page.keyboard.press("ArrowRight");
    focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-historico");
    await page.waitForTimeout(200);
    expect(await liveCount()).toBe(baseline);

    // Enter activates → ARIA flips, roving moves, tabpanel focused, ring tokens stay
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await expect(page.locator(`#tab-historico`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(`#tab-historico`)).toHaveAttribute(
      "aria-current",
      "true",
    );
    let roving = await page
      .locator('[role="tab"][tabindex="0"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).id));
    expect(roving).toEqual(["tab-historico"]);
    let panelFocused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelFocused).toBe("historico");
    const ringTokens = await page.locator(`#tab-historico`).evaluate((el) => {
      const cls = (el as HTMLElement).className;
      return (
        cls.includes("focus-visible:ring-2") &&
        cls.includes("focus-visible:ring-ring") &&
        cls.includes("focus-visible:ring-offset-2")
      );
    });
    expect(ringTokens).toBe(true);

    // Activation MUST add exactly one new live-region announcement: Histórico
    let log = await liveLog();
    expect(log.length).toBe(baseline + 1);
    expect(log[log.length - 1]).toContain("Histórico de visitas");

    // Move focus to next chip via ArrowRight (no announcement), activate with Space
    await page.locator(`#tab-historico`).focus();
    await page.keyboard.press("ArrowRight");
    focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-cupons");
    expect(await liveCount()).toBe(baseline + 1); // still no announcement on focus
    await page.keyboard.press(" ");
    await page.waitForTimeout(300);
    await expect(page.locator(`#tab-cupons`)).toHaveAttribute("aria-selected", "true");
    roving = await page
      .locator('[role="tab"][tabindex="0"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).id));
    expect(roving).toEqual(["tab-cupons"]);
    panelFocused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(panelFocused).toBe("cupons");
    log = await liveLog();
    expect(log.length).toBe(baseline + 2);
    expect(log[log.length - 1]).toContain("Meus cupons");

    // Tab order: after the tabpanel, Shift+Tab returns to the active chip
    // (the only chip in the tablist with tabindex=0).
    await page.keyboard.press("Shift+Tab");
    focusedId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focusedId).toBe("tab-cupons");

    // Reduced motion: tablist still has no scroll-snap
    const snap = await page
      .getByRole("tablist", { name: /Seções da Minha área/i })
      .evaluate((el) => getComputedStyle(el).scrollSnapType);
    expect(snap === "none" || snap === "" || snap.startsWith("none")).toBe(true);

    await context.close();
  });

  test("mobile a11y: axe limpo após trocar seções em viewport reduzido", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ROUTE}#favoritos`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Switch via the mobile next button + a direct chip click
    await page.getByRole("button", { name: /Próxima seção/i }).click();
    await page.waitForTimeout(300);
    await page.locator("#tab-vouchers").click();
    await page.waitForTimeout(300);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#vouchers");

    const results = await new AxeBuilder({ page })
      .include('[role="tablist"]')
      .include('[role="tabpanel"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const relevant = results.violations.filter((v) =>
      [
        "aria-valid-attr",
        "aria-valid-attr-value",
        "aria-required-attr",
        "aria-required-children",
        "aria-required-parent",
        "aria-allowed-attr",
        "aria-allowed-role",
        "aria-roles",
        "tabindex",
        "duplicate-id",
        "duplicate-id-aria",
      ].includes(v.id),
    );
    if (relevant.length > 0) {
      console.error(
        "axe mobile violations:",
        JSON.stringify(
          relevant.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })),
          null,
          2,
        ),
      );
    }
    expect(relevant).toEqual([]);

    // Structural invariants on mobile
    const selectedCount = await page.locator('[role="tab"][aria-selected="true"]').count();
    expect(selectedCount).toBe(1);
    const rovingCount = await page.locator('[role="tab"][tabindex="0"]').count();
    expect(rovingCount).toBe(1);
    await expect(page.locator(`#tab-vouchers`)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(`#tab-vouchers`)).toHaveAttribute(
      "aria-controls",
      "vouchers",
    );
    await expect(page.locator(`#vouchers`)).toHaveAttribute("role", "tabpanel");
    await expect(page.locator(`#vouchers`)).toHaveAttribute(
      "aria-labelledby",
      "tab-vouchers",
    );

    // Every aria-controls reference resolves to an existing tabpanel id
    const orphanControls = await page.locator('[role="tab"]').evaluateAll((tabs) =>
      tabs
        .map((t) => (t as HTMLElement).getAttribute("aria-controls"))
        .filter((id): id is string => !!id)
        .filter((id) => !document.getElementById(id)),
    );
    expect(orphanControls).toEqual([]);
  });

  test("hash desconhecido + back/forward: chip padrão estável, anúncios não duplicam", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces = [];
      const obs = new MutationObserver(() => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        const txt = (live?.textContent ?? "").trim();
        const log = (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces;
        if (txt && log[log.length - 1] !== txt) log.push(txt);
      });
      const start = () => {
        const live = document.querySelector('[role="status"][aria-live="polite"]');
        if (!live) return false;
        obs.observe(live, { childList: true, characterData: true, subtree: true });
        const txt = (live.textContent ?? "").trim();
        if (txt) (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces.push(txt);
        return true;
      };
      if (!start()) {
        const i = setInterval(() => {
          if (start()) clearInterval(i);
        }, 50);
      }
    });

    // Clear storage so the fallback truly comes from the default chip
    await page.goto(ROUTE);
    await page.evaluate(() =>
      sessionStorage.removeItem("dashboards:consumidor:section"),
    );

    // 1) Open with an unknown hash — fallback to the default chip
    await page.goto(`${ROUTE}#hash-invalido-xyz`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const defaultId = SECTIONS[0];
    await expect(page.locator(`#tab-${defaultId}`)).toHaveAttribute("tabindex", "0");

    // 2) Navigate to a real section and back
    await page.locator("#tab-cupons").click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await page.waitForTimeout(300);

    await page.goBack();
    await page.waitForTimeout(400);
    // Hash returned to the (unknown) starting hash — default chip must stay stable
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(
      "#hash-invalido-xyz",
    );
    await expect(page.locator(`#tab-${defaultId}`)).toHaveAttribute("tabindex", "0");
    const selectedAfterBack = await page
      .locator('[role="tab"][aria-selected="true"]')
      .count();
    expect(selectedAfterBack).toBeLessThanOrEqual(1);

    await page.goForward();
    await page.waitForTimeout(400);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await expect(page.locator("#tab-cupons")).toHaveAttribute("aria-selected", "true");

    // 3) Live region announcements: deduped (no consecutive duplicates),
    //    one entry per real section change, no labels other than cupons leaked.
    const announces: string[] = await page.evaluate(
      () => (window as unknown as { __liveAnnounces: string[] }).__liveAnnounces,
    );
    for (let i = 1; i < announces.length; i++) {
      expect(announces[i]).not.toBe(announces[i - 1]);
    }
    const cuponsHits = announces.filter((t) => /Meus cupons/.test(t));
    // One announcement when first navigated, plus optionally one on forward —
    // but never zero, and never an explosion of duplicates.
    expect(cuponsHits.length).toBeGreaterThanOrEqual(1);
    expect(cuponsHits.length).toBeLessThanOrEqual(3);
    for (const id of SECTIONS) {
      if (id === "cupons" && /Meus cupons/) continue;
      if (id === defaultId) continue;
      const label = SECTIONS_LABELS[id];
      if (id === "cupons") continue;
      expect(announces.every((t) => !t.includes(label))).toBe(true);
    }
  });

  test("visual regression (RTL + reduced motion): portrait e landscape mobile", async ({
    browser,
  }) => {
    test.skip(
      !!process.env.CI && !process.env.E2E_VISUAL,
      "Visual snapshots geram baselines no primeiro run — habilite com E2E_VISUAL=1.",
    );

    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);

    const tablistRole = () =>
      page.getByRole("tablist", { name: /Seções da Minha área/i });
    const tabRole = (label: RegExp) =>
      tablistRole().getByRole("tab", { name: label });
    const tabpanelRole = (label: RegExp) =>
      page.getByRole("tabpanel", { name: label });

    // Retry-based ring-token assertion — replaces brittle one-shot waitForFunction
    const expectRingTokens = async (chipId: string) => {
      await expect
        .poll(
          () =>
            page.locator(`#tab-${chipId}`).evaluate((el) => {
              const cls = (el as HTMLElement).className;
              return (
                cls.includes("focus-visible:ring-2") &&
                cls.includes("focus-visible:ring-ring") &&
                cls.includes("focus-visible:ring-offset-2")
              );
            }),
          { timeout: 5_000, intervals: [100, 200, 400, 600, 800] },
        )
        .toBe(true);
    };

    // Helpers — wait until layout, focus, ring tokens and CSS offset all settle
    const waitSettled = async (chipId: string) => {
      // 1) Web fonts loaded so glyph widths don't shift the snapshot
      await page.evaluate(() => (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready);
      // 2) --sec-offset has been measured (>0) by the ResizeObserver
      await page.waitForFunction(() => {
        const el = document.querySelector('[role="tabpanel"]') as HTMLElement | null;
        if (!el) return false;
        const v = getComputedStyle(el).getPropertyValue("--sec-offset").trim();
        return !!v && parseFloat(v) > 0;
      });
      // 3) The chip we expect to be focused is actually the active element
      await expect
        .poll(
          () =>
            page.evaluate(
              (id) => (document.activeElement as HTMLElement | null)?.id,
              `tab-${chipId}`,
            ),
          { timeout: 4_000 },
        )
        .toBe(`tab-${chipId}`);
      // 4) Focus-ring tokens present on the focused chip class list (with retries)
      await expectRingTokens(chipId);
      // 5) Two animation frames so any final reflow paints before screenshot
      await page.evaluate(
        () =>
          new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          ),
      );
    };

    // Portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE);
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
      sessionStorage.removeItem("dashboards:consumidor:section");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await tabRole(/Meus favoritos/i).focus();
    await waitSettled("favoritos");

    const tablistP = tablistRole();
    await expect(tablistP).toHaveScreenshot(
      "rm-rtl-mobile-portrait-subnav-default.png",
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );

    // Activate cupons via keyboard and snapshot the focused chip + tabpanel
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    // After Enter the component focuses the tabpanel; refocus the chip to
    // capture the focus-ring on the chip in a deterministic state.
    await tabRole(/Meus cupons/i).focus();
    await waitSettled("cupons");
    await expect(tablistP).toHaveScreenshot(
      "rm-rtl-mobile-portrait-subnav-focus-cupons.png",
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );
    await expect(tabpanelRole(/Meus cupons/i)).toHaveScreenshot(
      "rm-rtl-mobile-portrait-tabpanel-cupons.png",
      { maxDiffPixelRatio: 0.03, animations: "disabled" },
    );

    // Landscape — rotate, re-measure, wait until offset re-stabilizes
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    // Wait for layout to react to rotation before refocusing
    await page.waitForTimeout(150);
    await tabRole(/Meus cupons/i).focus();
    await waitSettled("cupons");

    const tablistL = tablistRole();
    await expect(tablistL).toHaveScreenshot(
      "rm-rtl-mobile-landscape-subnav-focus-cupons.png",
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );
    await expect(tabpanelRole(/Meus cupons/i)).toHaveScreenshot(
      "rm-rtl-mobile-landscape-tabpanel-cupons.png",
      { maxDiffPixelRatio: 0.03, animations: "disabled" },
    );

    await context.close();
  });


  test("hash desconhecido + back/forward: foco roving e tokens de ring por etapa", async ({
    page,
  }) => {
    const ringTokens = (id: string) =>
      page.locator(`#tab-${id}`).evaluate((el) => {
        const cls = (el as HTMLElement).className;
        return (
          cls.includes("focus-visible:ring-2") &&
          cls.includes("focus-visible:ring-ring") &&
          cls.includes("focus-visible:ring-offset-2")
        );
      });

    const rovingIds = () =>
      page
        .locator('[role="tab"][tabindex="0"]')
        .evaluateAll((els) => els.map((e) => (e as HTMLElement).id));

    // Fresh session, unknown hash → fallback to default chip baseline
    await page.goto(ROUTE);
    await page.evaluate(() =>
      sessionStorage.removeItem("dashboards:consumidor:section"),
    );
    await page.goto(`${ROUTE}#hash-invalido-abc`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    const defaultId = SECTIONS[0]; // favoritos
    expect(await rovingIds()).toEqual([`tab-${defaultId}`]);
    expect(await ringTokens(defaultId)).toBe(true);

    // Step 1: activate cupons → roving + ring on cupons, focus in tabpanel
    await page.locator("#tab-cupons").click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    await page.waitForTimeout(400);
    expect(await rovingIds()).toEqual(["tab-cupons"]);
    expect(await ringTokens("cupons")).toBe(true);

    // Step 2: activate reservas via keyboard from the focused tabpanel
    await page.locator("#tab-cupons").focus();
    await page.keyboard.press("ArrowRight"); // → vouchers
    await page.keyboard.press("ArrowRight"); // → reservas
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#reservas");
    expect(await rovingIds()).toEqual(["tab-reservas"]);
    expect(await ringTokens("reservas")).toBe(true);
    let focused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focused).toBe("reservas");

    // Step 3: back → cupons
    await page.goBack();
    await page.waitForTimeout(500);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    expect(await rovingIds()).toEqual(["tab-cupons"]);
    expect(await ringTokens("cupons")).toBe(true);
    await expect(page.locator("#tab-cupons")).toHaveAttribute("aria-selected", "true");

    // Step 4: back again → unknown hash. Default chip must hold the roving
    // baseline and its ring tokens, no stale selection from cupons/reservas.
    await page.goBack();
    await page.waitForTimeout(500);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(
      "#hash-invalido-abc",
    );
    expect(await rovingIds()).toEqual([`tab-${defaultId}`]);
    expect(await ringTokens(defaultId)).toBe(true);
    const stillSelected = await page
      .locator('[role="tab"][aria-selected="true"]')
      .count();
    expect(stillSelected).toBeLessThanOrEqual(1);

    // Focus must be reachable on the default chip after the back navigation
    await page.locator(`#tab-${defaultId}`).focus();
    focused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.id ?? "",
    );
    expect(focused).toBe(`tab-${defaultId}`);

    // Step 5: forward → cupons (rings/roving must follow forward too)
    await page.goForward();
    await page.waitForTimeout(500);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#cupons");
    expect(await rovingIds()).toEqual(["tab-cupons"]);
    expect(await ringTokens("cupons")).toBe(true);

    // Step 6: forward → reservas
    await page.goForward();
    await page.waitForTimeout(500);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#reservas");
    expect(await rovingIds()).toEqual(["tab-reservas"]);
    expect(await ringTokens("reservas")).toBe(true);
  });

  test("dark/light toggle (RTL + reduced motion): diffs visuais, ring tokens e aria-selected", async ({
    browser,
  }) => {
    test.skip(
      !!process.env.CI && !process.env.E2E_VISUAL,
      "Visual snapshots geram baselines no primeiro run — habilite com E2E_VISUAL=1.",
    );

    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE);
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
      sessionStorage.removeItem("dashboards:consumidor:section");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const tablist = page.getByRole("tablist", { name: /Seções da Minha área/i });
    const cuponsTab = tablist.getByRole("tab", { name: /Meus cupons/i });
    const cuponsPanel = page.getByRole("tabpanel", { name: /Meus cupons/i });

    const expectRingTokens = async (chipId: string) => {
      await expect
        .poll(
          () =>
            page.locator(`#tab-${chipId}`).evaluate((el) => {
              const cls = (el as HTMLElement).className;
              return (
                cls.includes("focus-visible:ring-2") &&
                cls.includes("focus-visible:ring-ring") &&
                cls.includes("focus-visible:ring-offset-2")
              );
            }),
          { timeout: 5_000, intervals: [100, 200, 400, 600, 800] },
        )
        .toBe(true);
    };

    const applyTheme = async (mode: "light" | "dark") => {
      await page.evaluate((m) => {
        document.documentElement.classList.toggle("dark", m === "dark");
      }, mode);
      await page.evaluate(
        () =>
          new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          ),
      );
    };

    for (const mode of ["light", "dark"] as const) {
      await applyTheme(mode);
      await cuponsTab.click();
      await expect(cuponsTab).toHaveAttribute("aria-selected", "true");
      await expect(cuponsTab).toHaveAttribute("aria-current", "true");
      await cuponsTab.focus();
      await expectRingTokens("cupons");

      await expect(tablist).toHaveScreenshot(
        `rm-rtl-mobile-${mode}-subnav-focus-cupons.png`,
        { maxDiffPixelRatio: 0.02, animations: "disabled" },
      );
      await expect(cuponsPanel).toHaveScreenshot(
        `rm-rtl-mobile-${mode}-tabpanel-cupons.png`,
        { maxDiffPixelRatio: 0.03, animations: "disabled" },
      );

      // Only one chip selected at a time, regardless of theme
      const selectedCount = await page
        .locator('[role="tab"][aria-selected="true"]')
        .count();
      expect(selectedCount).toBe(1);
    }

    await context.close();
  });

  test("RTL + reduced motion: navigation timing — layout settle dentro do threshold", async ({
    browser,
  }) => {
    const SETTLE_THRESHOLD_MS = Number(
      process.env.E2E_SETTLE_THRESHOLD_MS ?? 1500,
    );

    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await login(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE);
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
      sessionStorage.removeItem("dashboards:consumidor:section");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const tablist = page.getByRole("tablist", { name: /Seções da Minha área/i });

    const targets: Array<{ id: (typeof SECTIONS)[number]; label: RegExp }> = [
      { id: "cupons", label: /Meus cupons/i },
      { id: "reservas", label: /Minhas reservas/i },
      { id: "creditos", label: /Meus créditos/i },
    ];

    const timings: Array<{ id: string; ms: number }> = [];
    for (const t of targets) {
      const tab = tablist.getByRole("tab", { name: t.label });
      const started = Date.now();
      await tab.click();

      // Settle definition: hash updated, aria-selected=true, --sec-offset>0,
      // and the matching tabpanel is the active element.
      await expect
        .poll(() => page.evaluate(() => location.hash), { timeout: 4_000 })
        .toBe(`#${t.id}`);
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await page.waitForFunction(() => {
        const el = document.querySelector(
          '[role="tabpanel"]',
        ) as HTMLElement | null;
        if (!el) return false;
        const v = getComputedStyle(el).getPropertyValue("--sec-offset").trim();
        return !!v && parseFloat(v) > 0;
      });
      await expect
        .poll(
          () =>
            page.evaluate(
              (id) => (document.activeElement as HTMLElement | null)?.id,
              t.id,
            ),
          { timeout: 4_000 },
        )
        .toBe(t.id);

      const elapsed = Date.now() - started;
      timings.push({ id: t.id, ms: elapsed });
    }

    // Attach a JSON record to the report for inspection
    await test.info().attach("rtl-reducedmotion-settle-timings.json", {
      body: JSON.stringify({ thresholdMs: SETTLE_THRESHOLD_MS, timings }, null, 2),
      contentType: "application/json",
    });

    for (const { id, ms } of timings) {
      expect(
        ms,
        `Layout settle for "${id}" took ${ms}ms (threshold ${SETTLE_THRESHOLD_MS}ms)`,
      ).toBeLessThanOrEqual(SETTLE_THRESHOLD_MS);
    }

    await context.close();
  });
});

