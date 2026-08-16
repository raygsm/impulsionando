#!/usr/bin/env node
/**
 * Gate de consistência do catálogo público de nichos.
 *
 * O frontend passou a ter UMA fonte pública: `public-niche-catalog.ts`.
 * Este prebuild não exige mais `NICHO_CARDS`/`MACRO_NICHOS`, porque essas
 * listas paralelas eram justamente a causa de segmentos invisíveis no front.
 *
 * Invariantes:
 *  1. Todo slug publicado em GROUPS existe em NICHO_DETAILS ou no playbook comercial.
 *  2. Nichos críticos de demanda histórica permanecem publicados.
 *  3. A rota `/nichos/$slug` suporta tanto nichos canônicos quanto playbooks.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const errors = [];

function extractSlugProperties(source) {
  return new Set([...source.matchAll(/\bslug:\s*["']([^"']+)["']/g)].map((m) => m[1]));
}

function extractGroupSlugs(source) {
  const result = new Set();
  for (const block of source.matchAll(/\bslugs:\s*\[([^\]]*)\]/g)) {
    for (const item of block[1].matchAll(/["']([^"']+)["']/g)) result.add(item[1]);
  }
  return result;
}

try {
  const catalogSrc = read("src/data/public-niche-catalog.ts");
  const detailsSrc = read("src/components/marketing/nichoDetails.ts");
  const playbookSrc = read("src/data/commercial-niche-playbook.ts");
  const routeSrc = read("src/routes/nichos.$slug.tsx");
  const escolherSrc = read("src/routes/escolher-nicho.tsx");
  const hubSrc = read("src/routes/nichos.index.tsx");
  const headerSrc = read("src/components/marketing/PublicHeader.tsx");

  const published = extractGroupSlugs(catalogSrc);
  const canonical = extractSlugProperties(detailsSrc);
  const playbook = extractSlugProperties(playbookSrc);

  if (!published.size) errors.push("PUBLIC_NICHE_GROUPS/GROUPS não publicou nenhum segmento.");

  for (const slug of published) {
    if (!canonical.has(slug) && !playbook.has(slug)) {
      errors.push(`Segmento público "${slug}" não existe em NICHO_DETAILS nem COMMERCIAL_NICHE_PLAYBOOK.`);
    }
  }

  const critical = [
    "supermercados",
    "materiais-construcao",
    "corretoras-seguros-planos-saude",
    "farmacias",
    "padarias",
    "bares-restaurantes",
    "oficinas-autopecas",
    "academias-fitness",
    "hoteis-pousadas",
    "transportes-logistica",
  ];
  for (const slug of critical) {
    if (!published.has(slug)) errors.push(`Segmento crítico ausente do catálogo público: "${slug}".`);
  }

  const requiredCatalogConsumers = [
    ["/escolher-nicho", escolherSrc],
    ["/nichos", hubSrc],
    ["PublicHeader", headerSrc],
  ];
  for (const [name, src] of requiredCatalogConsumers) {
    if (!src.includes("PUBLIC_NICHE")) errors.push(`${name} não consome mais a fonte pública unificada.`);
  }

  if (!routeSrc.includes("findNichePlaybook") || !routeSrc.includes("findNicho")) {
    errors.push("A rota /nichos/$slug não suporta simultaneamente nichos canônicos e playbooks comerciais.");
  }
} catch (err) {
  errors.push(`Erro lendo catálogos: ${err.message}`);
}

if (errors.length) {
  console.error("\n✖ Inconsistência no catálogo público de nichos:\n");
  for (const e of errors) console.error("  - " + e);
  console.error("\nCorrija a fonte pública unificada antes do deploy.\n");
  process.exit(1);
}

console.log("✓ Catálogo público de nichos consistente: fonte única, segmentos críticos e rotas validados.");
