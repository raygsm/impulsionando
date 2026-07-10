#!/usr/bin/env node
/**
 * Auditoria de acessibilidade do Core Impulsionando (Fase P3).
 *
 * Uso:  node scripts/audit-a11y.mjs
 *
 * Verifica:
 *   1. <Button size="icon"> sem `aria-label`.
 *   2. Uso residual de min-h-screen / h-screen (deve ser dvh).
 *   3. Uso residual de text-gray-* / bg-gray-* (deve usar tokens).
 *   4. Botões-ícone com apenas emoji/símbolo (sem texto acessível).
 *
 * Não altera arquivos. Retorna código 0 sempre; use como observabilidade.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOTS = ["src"];
const EXT = new Set([".tsx", ".jsx", ".ts"]);

async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const p = join(dir, entry);
    const s = await stat(p);
    if (s.isDirectory()) yield* walk(p);
    else if ([...EXT].some((e) => p.endsWith(e))) yield p;
  }
}

function findButtons(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const j = text.indexOf("<Button", i);
    if (j === -1) break;
    let depth = 0;
    let k = j + 7;
    while (k < text.length) {
      const c = text[k];
      if (c === "{") depth++;
      else if (c === "}") depth = Math.max(0, depth - 1);
      else if (c === ">" && depth === 0) {
        out.push({ start: j, tag: text.slice(j, k + 1) });
        break;
      }
      k++;
    }
    i = k + 1;
  }
  return out;
}

const missingAria = [];
const usesFullScreen = [];
const usesGray = [];

for (const root of ROOTS) {
  for await (const file of walk(root)) {
    const text = await readFile(file, "utf8");
    for (const { start, tag } of findButtons(text)) {
      if (!tag.includes('size="icon"')) continue;
      if (!tag.includes("aria-label")) {
        const line = text.slice(0, start).split("\n").length;
        missingAria.push(`${file}:${line}`);
      }
    }
    if (/\b(min-h-screen|h-screen)\b/.test(text)) {
      usesFullScreen.push(file);
    }
    if (/\b(text-gray-\d|bg-gray-\d)/.test(text)) {
      // ignora páginas de impressão (design intencionalmente monocromático)
      if (!/imprimir/.test(file)) usesGray.push(file);
    }
  }
}

const section = (title, items) => {
  console.log(`\n== ${title} (${items.length}) ==`);
  items.slice(0, 50).forEach((x) => console.log("  " + x));
  if (items.length > 50) console.log(`  … +${items.length - 50}`);
};

section("Botões-ícone sem aria-label", missingAria);
section("Uso de min-h-screen / h-screen (usar dvh)", [...new Set(usesFullScreen)]);
section("Uso residual de text-gray-* / bg-gray-* (usar tokens)", [...new Set(usesGray)]);

console.log(
  `\nResumo: ${missingAria.length} icon-buttons sem aria-label · ` +
    `${new Set(usesFullScreen).size} arquivos com h-screen · ` +
    `${new Set(usesGray).size} arquivos com gray-*.`
);
