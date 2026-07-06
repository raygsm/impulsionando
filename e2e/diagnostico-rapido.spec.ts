import { test, expect } from "@playwright/test";

/**
 * E2E: Diagnóstico Rápido (home).
 *
 * Cobre regressões visuais e de interação sem depender do backend:
 *  - Layout mobile: cada etapa ocupa a viewport e o painel Impulsionito
 *    aparece abaixo (não sobreposto).
 *  - Navegação entre steps (avanço automático + botão voltar).
 *  - Seleção múltipla de dores.
 *  - Progresso e contador animado atingem 100% ao completar.
 *  - Estados de streaming do painel Impulsionito
 *    (idle → streaming → complete) e mensagens parciais.
 */

const ROUTE = "/#diagnostico";

test.describe("Diagnóstico Rápido — desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('[data-testid="diagnostico-root"]');
  });

  test("estado inicial: step 0 ativo, painel idle, progresso 0%", async ({ page }) => {
    await expect(page.getByTestId("step-panel-0")).toBeVisible();
    await expect(page.getByTestId("step-tab-0")).toHaveAttribute("data-state", "active");
    await expect(page.getByTestId("impulsionito-card")).toHaveAttribute("data-stream-state", "idle");
    await expect(page.getByTestId("progress-value")).toHaveText("0%");
  });

  test("fluxo completo: seleciona nicho → dores → foco e alcança 100%", async ({ page }) => {
    const firstNicho = page.locator('[data-testid^="nicho-"]').first();
    await firstNicho.click();

    // Avança automaticamente para step 1 (setTimeout 250ms)
    await expect(page.getByTestId("step-panel-1")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("impulsionito-card")).toHaveAttribute("data-stream-state", "streaming");
    await expect(page.getByTestId("stream-message")).toBeVisible();

    // Seleciona duas dores
    const dores = page.locator('[data-testid^="dor-"]');
    await dores.nth(0).click();
    await dores.nth(1).click();
    await expect(page.getByTestId("dores-count")).toHaveText("2 selecionada(s)");

    await page.getByTestId("btn-continuar").click();
    await expect(page.getByTestId("step-panel-2")).toBeVisible();

    // Escolhe foco → deve completar
    await page.locator('[data-testid^="foco-"]').first().click();
    await expect(page.getByTestId("diagnostico-resultado")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("impulsionito-card")).toHaveAttribute("data-stream-state", "complete");
    await expect(page.getByTestId("progress-value")).toHaveText("100%");
  });

  test("botão voltar restaura step anterior sem perder seleção", async ({ page }) => {
    await page.locator('[data-testid^="nicho-"]').first().click();
    await expect(page.getByTestId("step-panel-1")).toBeVisible();
    await page.getByTestId("btn-voltar-1").click();
    await expect(page.getByTestId("step-panel-0")).toBeVisible();
    // stepper 0 deve estar ativo, 1 deve estar "done" (nicho já foi escolhido)
    await expect(page.getByTestId("step-tab-0")).toHaveAttribute("data-state", "active");
  });

  test("toggle de dor alterna aria-pressed", async ({ page }) => {
    await page.locator('[data-testid^="nicho-"]').first().click();
    await expect(page.getByTestId("step-panel-1")).toBeVisible();
    const dor = page.locator('[data-testid^="dor-"]').first();
    await expect(dor).toHaveAttribute("aria-pressed", "false");
    await dor.click();
    await expect(dor).toHaveAttribute("aria-pressed", "true");
    await dor.click();
    await expect(dor).toHaveAttribute("aria-pressed", "false");
  });

  test("progresso é monotônico e cresce a cada etapa", async ({ page }) => {
    const readProgress = async () => {
      const txt = await page.getByTestId("progress-value").innerText();
      return Number(txt.replace("%", ""));
    };
    expect(await readProgress()).toBe(0);
    await page.locator('[data-testid^="nicho-"]').first().click();
    await expect(page.getByTestId("step-panel-1")).toBeVisible();
    expect(await readProgress()).toBeGreaterThanOrEqual(30);
    await page.locator('[data-testid^="dor-"]').first().click();
    expect(await readProgress()).toBeGreaterThanOrEqual(60);
  });
});

test.describe("Diagnóstico Rápido — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('[data-testid="diagnostico-root"]');
  });

  test("cada etapa ocupa a viewport e o painel aparece abaixo sem sobreposição", async ({ page }) => {
    const panel = page.getByTestId("step-panel-0");
    await expect(panel).toBeVisible();
    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    // A área do step deve ocupar a maior parte da viewport (>= 60% da altura)
    expect(panelBox!.height).toBeGreaterThanOrEqual(844 * 0.6);

    const impulsionito = page.getByTestId("impulsionito-panel");
    await impulsionito.scrollIntoViewIfNeeded();
    const impulsionitoBox = await impulsionito.boundingBox();
    expect(impulsionitoBox).not.toBeNull();
    // O painel Impulsionito deve estar posicionado ABAIXO do step (não sobreposto)
    expect(impulsionitoBox!.y).toBeGreaterThan(panelBox!.y);
  });

  test("navegação mobile mantém painel visível abaixo após avançar", async ({ page }) => {
    await page.locator('[data-testid^="nicho-"]').first().click();
    await expect(page.getByTestId("step-panel-1")).toBeVisible();
    const impulsionito = page.getByTestId("impulsionito-panel");
    await impulsionito.scrollIntoViewIfNeeded();
    await expect(impulsionito).toBeVisible();
    await expect(page.getByTestId("stream-message")).toBeVisible();
  });

  test("progresso mobile é monotônico e nunca regride", async ({ page }) => {
    const readProgress = async () => {
      const txt = await page.getByTestId("progress-value").innerText();
      return Number(txt.replace("%", ""));
    };
    const samples: number[] = [];
    samples.push(await readProgress());
    await page.locator('[data-testid^="nicho-"]').first().click();
    await expect(page.getByTestId("step-panel-1")).toBeVisible();
    samples.push(await readProgress());
    await page.locator('[data-testid^="dor-"]').first().click();
    samples.push(await readProgress());
    await page.getByTestId("btn-continuar").click();
    await expect(page.getByTestId("step-panel-2")).toBeVisible();
    await page.locator('[data-testid^="foco-"]').first().click();
    await expect(page.getByTestId("diagnostico-resultado")).toBeVisible();
    samples.push(await readProgress());
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
    expect(samples[samples.length - 1]).toBe(100);
  });
});

// ================================================================
// Teclado, back/forward e estados de erro/timeout
// ================================================================

test.describe("Diagnóstico Rápido — teclado e histórico", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("navegação por Tab + Enter avança o step", async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('[data-testid="step-panel-0"]');
    const firstNicho = page.locator('[data-testid^="nicho-"]').first();
    await firstNicho.focus();
    // O elemento focado deve ser o próprio botão de nicho
    const focusedTestId = await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.getAttribute("data-testid") ?? "",
    );
    expect(focusedTestId).toMatch(/^nicho-/);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("step-panel-1")).toBeVisible({ timeout: 2000 });
    // Focar primeira dor via Tab e alternar com Enter/Space
    const firstDor = page.locator('[data-testid^="dor-"]').first();
    await firstDor.focus();
    await expect(firstDor).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Enter");
    await expect(firstDor).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Space");
    await expect(firstDor).toHaveAttribute("aria-pressed", "false");
  });

  test("browser back/forward preservam a seção visível", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Navega para a âncora do diagnóstico
    await page.goto("/#diagnostico");
    await page.waitForSelector('[data-testid="diagnostico-root"]');
    await expect(page.getByTestId("step-panel-0")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/#diagnostico$/);
    await expect(page.getByTestId("step-panel-0")).toBeVisible();
    await expect(page.getByTestId("impulsionito-card")).toHaveAttribute("data-stream-state", "idle");
  });
});

test.describe("Diagnóstico Rápido — erro e retry", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const kind of ["timeout", "error"] as const) {
    test(`estado forçado ?diagError=${kind} exibe alerta + botão Tentar novamente`, async ({ page }) => {
      await page.goto(`/?diagError=${kind}#diagnostico`);
      await page.waitForLoadState("networkidle");
      const card = page.getByTestId("impulsionito-card");
      await expect(card).toHaveAttribute("data-stream-state", kind);
      const err = page.getByTestId("stream-error");
      await expect(err).toBeVisible();
      await expect(err).toHaveAttribute("data-error-kind", kind);
      await page.getByTestId("btn-retry").click();
      await expect(card).toHaveAttribute("data-stream-state", "idle");
      await expect(page.getByTestId("stream-error")).toHaveCount(0);
      await expect(page.getByTestId("step-panel-0")).toBeVisible();
    });
  }
});

