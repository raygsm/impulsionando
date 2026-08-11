import { expect, test } from '@playwright/test';

const BASE =
  process.env.CHRISMED_BASE_URL ||
  process.env.E2E_BASE_URL ||
  'http://127.0.0.1:4173/chrismed';
const ORIGIN = new URL(BASE).origin;

test.describe('CHRISMED · localização e isolamento', () => {
  test('GMS em português traduz integralmente a jornada', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Conteúdo localizado coberto uma vez em Chromium.');
    await page.goto(`${BASE}/?lang=pt`, { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/Global Medical Support/i);
    await expect(
      page.getByRole('heading', {
        name: /Coordenação médica internacional, discreta e multilíngue/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/CHRISMED não substitui o serviço público de emergência/i),
    ).toBeVisible();
    await expect(
      page.getByText(/International medical coordination, discreet and multilingual/i),
    ).toHaveCount(0);
  });

  test('/alth redireciona para cadastro CHRISMED sem marca global', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Compatibilidade legada coberta uma vez em Chromium.');
    await page.goto(`${ORIGIN}/alth`, { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/auth\?mode=signup$/);
    await expect(
      page.getByRole('heading', { name: /Área dos Profissionais da Saúde/i }),
    ).toBeVisible();
    await expect(page.getByText(/Produzido e Gerenciado por/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Abrir Impulsionito/i })).toHaveCount(0);
  });
});
