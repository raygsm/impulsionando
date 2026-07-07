import { test, expect } from "@playwright/test";

/**
 * E2E: quiz → seleção de nicho → /demo/nicho/$slug com verificação de
 * funnel tracking (traceId estável, alias_resolvido, isFallback, rotaDestino).
 * Também cobre o fluxo de alias desconhecido caindo no DemoFallbackLanding.
 */

const QUIZ_KEY = "impulsionando:quiz-respostas";
const TRACE_KEY = "impulsionando:funnel-trace-id";
const EVENTS_KEY = "impulsionando:funnel-events";
const FALLBACK_KEY = "impulsionando:demo-fallback-log";

test.describe("Funnel tracking — quiz → nicho → demo", () => {
  test("clicar em nicho no quiz persiste slug em localStorage", async ({ page }) => {
    await page.goto("/");
    // Rola até o diagnóstico (o quiz).
    await page.locator('[data-testid="diagnostico-root"]').scrollIntoViewIfNeeded();
    await page.getByTestId("nicho-saude").click();
    // O componente avança para step-1 após selecionar nicho.
    await expect(page.getByTestId("step-panel-1")).toBeVisible();
    const stored = await page.evaluate((k) => window.localStorage.getItem(k), QUIZ_KEY);
    expect(stored).toBeTruthy();
    expect(stored!).toContain('"nicho":"saude"');
  });

  test("CTA do simulador dispara funnel tracking com traceId estável e alias resolvido", async ({ page }) => {
    // Pré-carrega resposta do quiz para expor o CTA 'Ver demo do meu nicho'
    // no simulador sem depender do streaming do painel Impulsionito.
    await page.addInitScript(([qk, payload]) => {
      window.localStorage.setItem(qk, payload);
    }, [QUIZ_KEY, JSON.stringify({ nicho: "saude", dores: [], foco: "" })]);

    await page.goto("/");
    const ctaDemo = page.getByRole("link", { name: /Ver demo do meu nicho/i }).first();
    await ctaDemo.scrollIntoViewIfNeeded();
    await expect(ctaDemo).toBeVisible();

    // traceId antes do clique: pode ainda não existir. Vamos capturá-lo após.
    await ctaDemo.click();
    await expect(page).toHaveURL(/\/demo\/nicho\/saude$/);

    const traceId = await page.evaluate((k) => window.sessionStorage.getItem(k), TRACE_KEY);
    expect(traceId).toBeTruthy();
    expect(traceId!.length).toBeGreaterThan(6);

    const events = await page.evaluate((k) => {
      const raw = window.localStorage.getItem(k);
      return raw ? JSON.parse(raw) : [];
    }, EVENTS_KEY);

    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    const evt = events.find((e: any) => e.cta === "simulador-ver-demo");
    expect(evt, "evento simulador-ver-demo deve estar bufferizado").toBeTruthy();
    expect(evt.traceId).toBe(traceId);
    expect(evt.alias_resolvido).toBe("saude");
    expect(evt.isFallback).toBe(false);
    expect(evt.rotaDestino).toBe("/demo/nicho/saude");
    expect(evt.origem).toBe("home-simulador");
  });

  test("dois CTAs consecutivos compartilham o mesmo traceId (correlação quiz→demo)", async ({ page }) => {
    await page.addInitScript(([qk, payload]) => {
      window.localStorage.setItem(qk, payload);
    }, [QUIZ_KEY, JSON.stringify({ nicho: "bares-restaurantes", dores: [], foco: "" })]);

    await page.goto("/");
    const cta1 = page.getByRole("link", { name: /Ver demo do meu nicho/i }).first();
    await cta1.scrollIntoViewIfNeeded();
    await cta1.click();
    await expect(page).toHaveURL(/\/demo\/nicho\/bares-restaurantes|\/demo\/nicho\/bar/);

    const traceA = await page.evaluate((k) => window.sessionStorage.getItem(k), TRACE_KEY);

    // Segundo CTA a partir da página de demo: link para /demo (voltar) preserva a sessão.
    await page.goto("/");
    const cta2 = page.getByRole("link", { name: /Ver demo do meu nicho/i }).first();
    await cta2.scrollIntoViewIfNeeded();
    await cta2.click();

    const traceB = await page.evaluate((k) => window.sessionStorage.getItem(k), TRACE_KEY);
    expect(traceB).toBe(traceA);

    const events = await page.evaluate((k) => {
      const raw = window.localStorage.getItem(k);
      return raw ? JSON.parse(raw) : [];
    }, EVENTS_KEY);
    const matching = events.filter((e: any) => e.cta === "simulador-ver-demo");
    expect(matching.length).toBeGreaterThanOrEqual(2);
    for (const e of matching) expect(e.traceId).toBe(traceA);
  });
});

test.describe("Funnel tracking — alias desconhecido", () => {
  test("navegar para alias inexistente renderiza DemoFallbackLanding e loga fallback", async ({ page }) => {
    const warns: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" && msg.text().includes("[demo-fallback]")) {
        warns.push(msg.text());
      }
    });

    await page.goto("/demo/nicho/nicho-fantasma-xyz-999");
    const landing = page.getByTestId("demo-fallback-landing");
    await expect(landing).toBeVisible();
    await expect(landing).toHaveAttribute("data-requested-slug", "nicho-fantasma-xyz-999");
    await expect(landing).toHaveAttribute("data-resolved-slug", "servicos");
    await expect(page.getByRole("heading", { name: /Não encontramos uma demo/i })).toBeVisible();

    // O buffer client-side deve ter registrado o fallback via useEffect.
    const log = await page.evaluate((k) => {
      const raw = window.localStorage.getItem(k);
      return raw ? JSON.parse(raw) : [];
    }, FALLBACK_KEY);
    expect(log.length).toBeGreaterThan(0);
    const entry = log.find((e: any) => e.requested === "nicho-fantasma-xyz-999");
    expect(entry, "fallback do slug fantasma deve estar bufferizado").toBeTruthy();
    expect(entry.slug).toBe("servicos");
    expect(entry.reason).toBe("unknown-slug");
  });
});
