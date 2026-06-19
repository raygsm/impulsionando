import { test, expect } from "@playwright/test";

/**
 * Robustez do /orcamento quando os SearchParams são desconhecidos ou
 * inválidos. O banner contextual SÓ deve aparecer para segmentos
 * reconhecidos (hoje: "white-label-educacao"). Qualquer outro valor —
 * desconhecido, vazio, malformado ou injetado — deve ser tolerado:
 *  - validateSearch não pode lançar
 *  - a página deve renderizar normalmente
 *  - o banner NÃO deve aparecer
 *  - o wizard deve continuar funcional (h1 + step inicial visíveis)
 *
 * Também cobre o cenário "clique vindo de /recomendacao/educacao com
 * SearchParams inválidos" reescrevendo o href do CTA em runtime antes
 * de clicar — simula manipulação de URL ou regressão futura que sirva
 * params errados.
 */

const INVALID_SEGMENTOS = [
  { name: "valor desconhecido", segmento: "foo-bar-inexistente" },
  { name: "string vazia", segmento: "" },
  { name: "com caracteres especiais", segmento: "<script>alert(1)</script>" },
  { name: "valor numérico-like", segmento: "12345" },
];

test.describe("/orcamento — robustez com SearchParams inválidos", () => {
  for (const { name, segmento } of INVALID_SEGMENTOS) {
    test(`segmento inválido (${name}) não exibe banner e funil não quebra`, async ({ page }) => {
      const qs = new URLSearchParams();
      if (segmento !== "") qs.set("segmento", segmento);
      qs.set("origem", "recomendacao-educacao");

      // captura erros de runtime para garantir que a página não estoura
      const pageErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));

      await page.goto(`/orcamento?${qs.toString()}`, { waitUntil: "domcontentloaded" });

      // Página carrega e renderiza o wizard.
      await expect(
        page.getByRole("heading", { level: 1, name: /Monte seu Orçamento/i }),
      ).toBeVisible();

      // Banner contextual NÃO deve aparecer para segmentos desconhecidos.
      await expect(
        page.locator('[data-segmento-banner="white-label-educacao"]'),
      ).toHaveCount(0);

      // Nenhum erro de runtime durante o load.
      expect(pageErrors, `pageerrors: ${pageErrors.join(" | ")}`).toEqual([]);
    });
  }

  test("clique vindo de /recomendacao/educacao com params adulterados não quebra e não exibe banner", async ({ page }) => {
    // Origem: a rota real. Reescrevemos o href do CTA para simular
    // params inválidos antes do clique (regressão hipotética no
    // search serializer ou manipulação manual de URL).
    await page.goto("/recomendacao/educacao", { waitUntil: "domcontentloaded" });
    const cta = page
      .locator('[data-vertical-offer="educacao"]')
      .getByRole("link", { name: /Contratar White Label Acadêmico/i });
    await expect(cta).toBeVisible();

    await cta.evaluate((el) => {
      (el as HTMLAnchorElement).setAttribute(
        "href",
        "/orcamento?segmento=segmento-invalido&origem=origem-invalida",
      );
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await cta.click();
    await page.waitForURL(/\/orcamento\?/);

    const url = new URL(page.url());
    expect(url.searchParams.get("segmento")).toBe("segmento-invalido");
    expect(url.searchParams.get("origem")).toBe("origem-invalida");

    // Página renderiza normalmente.
    await expect(
      page.getByRole("heading", { level: 1, name: /Monte seu Orçamento/i }),
    ).toBeVisible();
    // Banner contextual ausente.
    await expect(
      page.locator('[data-segmento-banner="white-label-educacao"]'),
    ).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test("sem nenhum SearchParam — fluxo padrão funciona e não exibe banner", async ({ page }) => {
    await page.goto("/orcamento", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Monte seu Orçamento/i }),
    ).toBeVisible();
    await expect(
      page.locator('[data-segmento-banner="white-label-educacao"]'),
    ).toHaveCount(0);
  });
});
