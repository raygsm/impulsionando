#!/usr/bin/env node
/**
 * Verificação de consistência de destinos do funil de nichos.
 *
 * Falha o build se algum macro/subnicho declarado em
 * `src/components/marketing/nichoMacros.ts` não tiver destino válido em:
 *  - `/escolher-nicho`         → `NICHO_CARDS` em src/routes/escolher-nicho.tsx
 *  - `/recomendacao/$nicho`    → `RECOMENDACOES` em src/routes/recomendacao.$nicho.tsx
 *
 * Roda no `prebuild` para garantir invariante antes de qualquer deploy.
 * Não depende de TypeScript: extrai chaves dos objetos literais por regex
 * balanceada (mesma técnica do teste tests/nichos-funnel-routes.test.ts).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** Extrai chaves de primeiro nível de um literal `const NAME = { ... }`. */
function extractRecordKeys(source, varName) {
  const re = new RegExp(`const\\s+${varName}\\b[^=]*=\\s*\\{`);
  const m = source.match(re);
  if (!m || m.index === undefined) {
    throw new Error(`Não encontrei a constante ${varName}.`);
  }
  const openIdx = source.indexOf("{", m.index);
  let depth = 0;
  let endIdx = -1;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  if (endIdx === -1) throw new Error(`Chaves desbalanceadas em ${varName}.`);
  const body = source.slice(openIdx + 1, endIdx);
  const keys = new Set();
  depth = 0;
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === "{") { depth++; i++; continue; }
    if (ch === "}") { depth--; i++; continue; }
    if (depth === 0) {
      if (ch === '"' || ch === "'" || ch === "`") {
        const q = ch; i++;
        while (i < body.length && body[i] !== q) {
          if (body[i] === "\\") i++;
          i++;
        }
        i++; continue;
      }
      const rest = body.slice(i);
      const km = rest.match(/^\s*(?:"([^"]+)"|([a-zA-Z0-9_-]+))\s*:/);
      if (km && /[\n,{]/.test(body[i - 1] ?? "\n")) {
        keys.add(km[1] ?? km[2]);
        i += km[0].length;
        continue;
      }
    }
    i++;
  }
  return [...keys];
}

/** Extrai os slugs declarados em MACRO_NICHOS (slug do macro + subnichos). */
function extractMacroNichos(source) {
  const re = /const\s+MACRO_NICHOS[^=]*=\s*\[/;
  const m = source.match(re);
  if (!m) throw new Error("Não encontrei MACRO_NICHOS.");
  const macros = [];
  const slugRe = /\{\s*[\s\S]*?slug:\s*"([^"]+)"[\s\S]*?slugs:\s*\[([^\]]*)\]/g;
  const body = source.slice(m.index);
  let mm;
  while ((mm = slugRe.exec(body)) !== null) {
    const macroSlug = mm[1];
    const subs = [...mm[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    macros.push({ macro: macroSlug, subs });
  }
  if (!macros.length) throw new Error("Nenhum macro extraído.");
  return macros;
}

const errors = [];
try {
  const macrosSrc = read("src/components/marketing/nichoMacros.ts");
  const escolherSrc = read("src/routes/escolher-nicho.tsx");
  const recoSrc = read("src/routes/recomendacao.$nicho.tsx");

  const macros = extractMacroNichos(macrosSrc);
  const cardKeys = new Set(extractRecordKeys(escolherSrc, "NICHO_CARDS"));
  const recoKeys = new Set(extractRecordKeys(recoSrc, "RECOMENDACOES"));

  for (const { macro, subs } of macros) {
    if (!subs.length) {
      errors.push(`Macro "${macro}" sem subnichos declarados.`);
      continue;
    }
    for (const slug of subs) {
      if (!cardKeys.has(slug)) {
        errors.push(
          `Macro "${macro}" → subnicho "${slug}" não tem card em /escolher-nicho ` +
          `(falta em NICHO_CARDS de src/routes/escolher-nicho.tsx).`,
        );
      }
      if (!recoKeys.has(slug)) {
        errors.push(
          `Macro "${macro}" → subnicho "${slug}" não tem destino em /recomendacao/$nicho ` +
          `(falta em RECOMENDACOES de src/routes/recomendacao.$nicho.tsx).`,
        );
      }
    }
  }
} catch (err) {
  errors.push(`Erro lendo catálogos: ${err.message}`);
}

if (errors.length) {
  console.error("\n✖ Inconsistência no catálogo de nichos:\n");
  for (const e of errors) console.error("  - " + e);
  console.error(
    "\nCorrija adicionando a entrada faltante (NICHO_CARDS ou RECOMENDACOES) " +
    "ou remova o slug de MACRO_NICHOS.\n",
  );
  process.exit(1);
}

console.log("✓ Catálogo de nichos consistente: todos macros/subnichos têm destino válido.");
