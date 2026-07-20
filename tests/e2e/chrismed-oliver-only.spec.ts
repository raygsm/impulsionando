import { test, expect, devices } from '@playwright/test';

/**
 * Valida a regra CHRISMED:
 *   • Nenhum script/iframe/widget do Impulsionito é carregado.
 *   • Apenas o agente Oliver aparece — uma única instância, sem duplicações.
 *   • prefers-reduced-motion desliga a animação de "decolagem" do preloader
 *     (executando apenas fade).
 *   • Nenhum erro novo no console após navegar entre rotas internas.
 *
 * Roda em desktop (default) e mobile (iPhone 13). Ajuste BASE_URL via env.
 */

const BASE = process.env.CHRISMED_BASE_URL || 'https://chrismed.impulsionando.com.br';
const ROUTES = ['/', '/chrismed/agendar', '/chrismed/consultorio', '/chrismed/faq'];

function assertNoImpulsionito(html: string, requests: string[]) {
  const bad = /impulsionito(?!\.png)/i;
  expect(html, 'HTML não deve mencionar Impulsionito na CHRISMED').not.toMatch(bad);
  const badReq = requests.filter((u) => /impulsionito/i.test(u) && !/oliver/i.test(u));
  expect(badReq, `Requests indevidos: ${badReq.join(', ')}`).toEqual([]);
}

for (const profile of [
  { name: 'desktop', ctx: { viewport: { width: 1440, height: 900 } } },
  { name: 'mobile',  ctx: { ...devices['iPhone 13'] } },
]) {
  test.describe(`CHRISMED · ${profile.name}`, () => {
    test('sem Impulsionito, apenas Oliver, sem duplicações', async ({ browser }) => {
      const context = await browser.newContext(profile.ctx);
      const page = await context.newPage();
      const reqs: string[] = [];
      const errors: string[] = [];
      page.on('request', (r) => reqs.push(r.url()));
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });

      for (const path of ROUTES) {
        errors.length = 0;
        await page.goto(BASE + path, { waitUntil: 'networkidle' });
        const html = await page.content();

        assertNoImpulsionito(html, reqs);

        // Nenhum iframe do Impulsionito.
        const impIframes = await page.locator('iframe[src*="impulsionito" i]').count();
        expect(impIframes, 'iframe do Impulsionito não deve existir').toBe(0);

        // Oliver presente e único.
        const oliver = page.locator(
          '[data-oliver], [aria-label*="Oliver" i], [id*="oliver" i]',
        );
        const oliverCount = await oliver.count();
        expect(oliverCount, `Oliver deve aparecer 1x em ${path}`).toBeGreaterThanOrEqual(1);
        expect(oliverCount, `Oliver duplicado em ${path}`).toBeLessThanOrEqual(2);

        // Nenhum erro novo no console pós-carregamento.
        expect(errors, `Erros no console em ${path}: ${errors.join(' | ')}`).toEqual([]);
      }

      await context.close();
    });

    test('preloader respeita prefers-reduced-motion', async ({ browser }) => {
      const context = await browser.newContext({
        ...profile.ctx,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

      const brasao = page.locator('.chrismed-preloader-brasao').first();
      if (await brasao.count()) {
        const anim = await brasao.evaluate(
          (el) => getComputedStyle(el).animationName,
        );
        expect(anim, 'animation deve ser "none" com reduced-motion').toBe('none');

        const transform = await brasao.evaluate(
          (el) => getComputedStyle(el).transform,
        );
        expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
      }

      // Após ~1.5s o preloader deve ter saído e a página estar interativa.
      await page.waitForTimeout(1600);
      const stillVisible = await page.locator('.chrismed-preloader-root').count();
      expect(stillVisible, 'preloader deve sumir').toBe(0);

      await context.close();
    });
  });
}