/**
 * E2E: redirect do subdomínio legado colorssaude.impulsionando.com.br
 * para o subdomínio oficial colors.impulsionando.com.br, preservando
 * pathname + query + hash em qualquer rota.
 *
 * Executa contra a app rodando em http://localhost:8080, injetando
 * `window.location.hostname = 'colorssaude.impulsionando.com.br'` antes
 * do bundle rodar para acionar o guard client-side (o replace real fica
 * apontando para o host absoluto novo).
 */
import { test, expect } from "@playwright/test";

const LEGACY_HOST = "colorssaude.impulsionando.com.br";
const NEW_HOST = "colors.impulsionando.com.br";

async function assertRedirect(page: import("@playwright/test").Page, path: string, query: string, hash: string) {
  // Intercepta o replace para não abrir cross-origin de verdade — só validamos o alvo.
  await page.addInitScript(({ host, target }) => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new Proxy(window.location, {
        get(t, k) {
          if (k === "hostname") return host;
          if (k === "host") return host;
          if (k === "replace") {
            return (url: string) => {
              (window as unknown as { __redirectedTo?: string }).__redirectedTo = url;
            };
          }
          const v = Reflect.get(t, k);
          return typeof v === "function" ? v.bind(t) : v;
        },
      }),
    });
    void target;
  }, { host: LEGACY_HOST, target: NEW_HOST });

  await page.goto(`http://localhost:8080${path}${query}${hash}`, { waitUntil: "networkidle" });
  // Aguarda o efeito rodar
  await page.waitForFunction(() => Boolean((window as unknown as { __redirectedTo?: string }).__redirectedTo), null, { timeout: 5000 });
  const to = await page.evaluate(() => (window as unknown as { __redirectedTo?: string }).__redirectedTo);
  return to!;
}

test.describe("Legacy subdomain redirect", () => {
  test("root path", async ({ page }) => {
    const to = await assertRedirect(page, "/", "", "");
    expect(to).toBe(`https://${NEW_HOST}/`);
  });

  test("deep route", async ({ page }) => {
    const to = await assertRedirect(page, "/colors/super-green-black", "", "");
    expect(to).toBe(`https://${NEW_HOST}/colors/super-green-black`);
  });

  test("preserva query + hash em qualquer rota", async ({ page }) => {
    const to = await assertRedirect(page, "/colors", "?utm_source=email&utm_campaign=jan", "#produtos");
    expect(to).toBe(`https://${NEW_HOST}/colors?utm_source=email&utm_campaign=jan#produtos`);
  });

  test("rota arbitrária permanece", async ({ page }) => {
    const to = await assertRedirect(page, "/colors/painel", "?debug=1", "");
    expect(to).toBe(`https://${NEW_HOST}/colors/painel?debug=1`);
  });
});
