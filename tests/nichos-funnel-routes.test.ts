/**
 * Cobertura do funil de nichos.
 *
 * Garante que todo macro-nicho e todo card de subnicho exposto em
 * `MACRO_NICHOS` aponta para um destino real em:
 *  - `/escolher-nicho` (cards de subnicho declarados em NICHO_CARDS)
 *  - `/recomendacao/$nicho` (entradas em RECOMENDACOES)
 *  - `/nichos/$slug` (NICHO_DETAILS)
 *
 * Esse teste é a rede de segurança contra o problema de slugs órfãos que
 * geravam 404s silenciosos quando o catálogo crescia.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MACRO_NICHOS } from "../src/components/marketing/nichoMacros";
import { NICHO_DETAILS } from "../src/components/marketing/nichoDetails";

const ROOT = process.cwd();

/** Lê um arquivo do projeto como texto. */
function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/**
 * Extrai as chaves de primeiro nível de um Record literal em um arquivo,
 * dado o nome da constante (`const NAME = { ... }` ou `const NAME: T = {...}`).
 *
 * Aceita chaves quotadas (`"bares-restaurantes"`) ou nuas (`clinicas`).
 * Suficiente para os nossos catálogos, que são objetos literais simples.
 */
function extractRecordKeys(source: string, varName: string): string[] {
  const re = new RegExp(`const\\s+${varName}\\b[^=]*=\\s*\\{`);
  const start = source.match(re);
  if (!start || start.index === undefined) {
    throw new Error(`Não encontrei a constante ${varName} no arquivo.`);
  }
  // Encontra o `{` de abertura e percorre balanceando chaves para isolar o corpo.
  const openIdx = source.indexOf("{", start.index);
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

  // Varre só o nível raiz — ignora qualquer coisa dentro de chaves aninhadas.
  const keys = new Set<string>();
  depth = 0;
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === "{") { depth++; i++; continue; }
    if (ch === "}") { depth--; i++; continue; }
    if (depth === 0) {
      // Pula strings entre aspas pra não confundir o cursor.
      if (ch === '"' || ch === "'" || ch === "`") {
        const quote = ch;
        i++;
        while (i < body.length && body[i] !== quote) {
          if (body[i] === "\\") i++;
          i++;
        }
        i++;
        continue;
      }
      // Casa início de propriedade: ou `"slug":` ou `slug:`
      const rest = body.slice(i);
      const m = rest.match(/^\s*(?:"([^"]+)"|([a-zA-Z0-9_-]+))\s*:/);
      if (m && /[\n,{]/.test(body[i - 1] ?? "\n")) {
        keys.add(m[1] ?? m[2]);
        i += m[0].length;
        continue;
      }
    }
    i++;
  }
  return [...keys];
}

const escolherNichoSrc = read("src/routes/escolher-nicho.tsx");
const recomendacaoSrc = read("src/routes/recomendacao.$nicho.tsx");

const NICHO_CARDS_KEYS = extractRecordKeys(escolherNichoSrc, "NICHO_CARDS");
const RECOMENDACOES_KEYS = extractRecordKeys(recomendacaoSrc, "RECOMENDACOES");
const NICHO_DETAILS_SLUGS = NICHO_DETAILS.map((n) => n.slug);

describe("Funil de nichos — macro-nichos", () => {
  it("MACRO_NICHOS não está vazio", () => {
    expect(MACRO_NICHOS.length).toBeGreaterThan(0);
  });

  it("todo slug listado em MACRO_NICHOS aparece em NICHO_DETAILS", () => {
    const macroSlugs = MACRO_NICHOS.flatMap((m) => m.slugs);
    const missing = macroSlugs.filter((s) => !NICHO_DETAILS_SLUGS.includes(s));
    expect(missing, `Slugs sem NichoDetail: ${missing.join(", ")}`).toEqual([]);
  });

  it("não há slug duplicado entre macros", () => {
    const all = MACRO_NICHOS.flatMap((m) => m.slugs);
    const dupes = all.filter((s, i) => all.indexOf(s) !== i);
    expect(dupes, `Slugs em mais de um macro: ${dupes.join(", ")}`).toEqual([]);
  });
});

describe("Funil de nichos — /escolher-nicho", () => {
  it("todo card em NICHO_CARDS tem destino em RECOMENDACOES (evita 404)", () => {
    const orphan = NICHO_CARDS_KEYS.filter(
      (slug) => !RECOMENDACOES_KEYS.includes(slug),
    );
    expect(
      orphan,
      `Cards de /escolher-nicho sem entrada em RECOMENDACOES: ${orphan.join(", ")}`,
    ).toEqual([]);
  });

  it("todo slug agrupado em MACRO_NICHOS tem card correspondente em NICHO_CARDS", () => {
    const macroSlugs = MACRO_NICHOS.flatMap((m) => m.slugs);
    const missing = macroSlugs.filter((s) => !NICHO_CARDS_KEYS.includes(s));
    expect(
      missing,
      `Slugs com macro mas sem card em /escolher-nicho: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});

describe("Funil de nichos — /recomendacao/$nicho", () => {
  it("RECOMENDACOES cobre todos os slugs presentes em NICHO_DETAILS", () => {
    const missing = NICHO_DETAILS_SLUGS.filter(
      (s) => !RECOMENDACOES_KEYS.includes(s),
    );
    expect(
      missing,
      `Slugs do catálogo sem recomendação: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("RECOMENDACOES não declara slugs órfãos (sem NichoDetail)", () => {
    const orphan = RECOMENDACOES_KEYS.filter(
      (s) => !NICHO_DETAILS_SLUGS.includes(s),
    );
    expect(
      orphan,
      `Recomendações sem NichoDetail correspondente: ${orphan.join(", ")}`,
    ).toEqual([]);
  });
});
