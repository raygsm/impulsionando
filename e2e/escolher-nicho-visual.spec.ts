import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Visual regression dos cards de /escolher-nicho agrupados por macro.
 *
 * Captura o bloco da section que contém o grid de cada macro-nicho
 * (heading + descrição + grid de cards) em três breakpoints chave:
 *  - mobile  (375px)  — 1 coluna
 *  - tablet  (768px)  — 2 colunas
 *  - desktop (1280px) — 3 colunas
 *
 * Garante que a hierarquia macro → subnichos se mantém visualmente
 * íntegra e que nenhum subnicho "vaza" para fora do agrupamento.
 *
 * Gated por E2E_VISUAL=1 (mesmo padrão dos demais snapshots).
 */

function listMacros(): { slug: string; label: string }[] {
  const src = readFileSync(
    join(process.cwd(), "src/components/marketing/nichoMacros.ts"),
    "utf8",
  );
  const re = /slug:\s*"([^"]+)"[\s\S]*?label:\s*"([^"]+)"[\s\S]*?slugs:\s*\[[^\]]*\]/g;
  const out: { slug: string; label: string }[] = [];
  let m;
  while ((m = re.exec(src)) !== null) out.push({ slug: m[1], label: m[2] });
  return out;
}

const MACROS = listMacros();
const WIDTHS = [
  { name: "mobile-375", w: 375, h: 1200 },
  { name: "tablet-768", w: 768, h: 1200 },
  { name: "desktop-1280", w: 1280, h: 1200 },
];

test.describe("Visual regression — /escolher-nicho por macro", () => {
  for (const { name, w, h } of WIDTHS) {
    test(`grid de macros alinhado @ ${name}`, async ({ page }, testInfo) => {
      testInfo.skip(
        !process.env.E2E_VISUAL,
        "Gated: rode com E2E_VISUAL=1 para gerar/validar baselines.",
      );
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/escolher-nicho", { waitUntil: "domcontentloaded" });
      await page.evaluate(() =>
        (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready,
      );
      await page.evaluate(
        () => new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
      );

      // Snapshot por macro: localizamos pelo heading h2 com o label exato
      // e capturamos o container pai (heading + descrição + grid de cards).
      for (const macro of MACROS) {
        const heading = page.getByRole("heading", { level: 2, name: macro.label, exact: true });
        const exists = await heading.count();
        if (!exists) continue; // macro vazio (slugs filtrados) — pula
        const block = heading.locator("xpath=ancestor::div[contains(@class,'mb-4')]/parent::*");
        await expect(block).toBeVisible();
        await expect(block).toHaveScreenshot(`macro-${macro.slug}-${name}.png`, {
          maxDiffPixelRatio: 0.02,
          animations: "disabled",
        });
      }
    });
  }
});
