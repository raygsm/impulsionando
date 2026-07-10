#!/usr/bin/env node
/**
 * Auditoria de metadata SEO em src/routes/*.tsx.
 * - Detecta rotas sem head()/meta title/description.
 * - Detecta títulos/descrições duplicados.
 * - Detecta placeholders "Lovable App" / "Lovable Generated Project".
 *
 * Saída: /mnt/documents/impulsionando-noite/seo-meta-audit.{json,md}
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src/routes");
const OUT_DIR = "/mnt/documents/impulsionando-noite";

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await walk(ROUTES_DIR)).filter(
    (f) => !/routeTree\.gen|__root|README/.test(f),
  );

  const noHead = [];
  const noTitle = [];
  const noDesc = [];
  const placeholder = [];
  const titles = new Map();
  const descs = new Map();

  for (const f of files) {
    const src = await readFile(f, "utf8");
    const rel = relative(ROOT, f);
    const hasHead = /head\s*:\s*\(/.test(src);
    if (!hasHead) {
      noHead.push(rel);
      continue;
    }
    const titleM = src.match(/title:\s*["'`]([^"'`]{2,200})["'`]/);
    const descM = src.match(
      /name:\s*["']description["'],\s*content:\s*["'`]([^"'`]{2,400})["'`]/,
    );
    if (!titleM) noTitle.push(rel);
    else {
      const t = titleM[1];
      titles.set(t, [...(titles.get(t) ?? []), rel]);
      if (/Lovable App|Lovable Generated/i.test(t))
        placeholder.push({ file: rel, kind: "title", value: t });
    }
    if (!descM) noDesc.push(rel);
    else {
      const d = descM[1];
      descs.set(d, [...(descs.get(d) ?? []), rel]);
      if (/Lovable Generated Project|Lovable App/i.test(d))
        placeholder.push({ file: rel, kind: "description", value: d });
    }
  }

  const dupTitles = [...titles.entries()].filter(([, v]) => v.length > 1);
  const dupDescs = [...descs.entries()].filter(([, v]) => v.length > 1);

  const report = {
    stats: {
      routeFiles: files.length,
      noHead: noHead.length,
      noTitle: noTitle.length,
      noDesc: noDesc.length,
      duplicateTitles: dupTitles.length,
      duplicateDescs: dupDescs.length,
      placeholders: placeholder.length,
    },
    noHead,
    noTitle,
    noDesc,
    duplicateTitles: dupTitles.map(([t, v]) => ({ title: t, files: v })),
    duplicateDescs: dupDescs.map(([d, v]) => ({ desc: d, files: v })),
    placeholders: placeholder,
  };

  await writeFile(
    join(OUT_DIR, "seo-meta-audit.json"),
    JSON.stringify(report, null, 2),
  );

  const md = [
    "# Auditoria SEO — meta por rota",
    "",
    `Gerado: ${new Date().toISOString()}`,
    "",
    `- Rotas: **${report.stats.routeFiles}**`,
    `- Sem head(): **${report.stats.noHead}**`,
    `- Sem title: **${report.stats.noTitle}**`,
    `- Sem description: **${report.stats.noDesc}**`,
    `- Títulos duplicados: **${report.stats.duplicateTitles}**`,
    `- Descrições duplicadas: **${report.stats.duplicateDescs}**`,
    `- Placeholders Lovable: **${report.stats.placeholders}**`,
    "",
    "## Top 30 rotas sem head()",
    noHead.slice(0, 30).map((f) => `- \`${f}\``).join("\n") || "_ok_",
    "",
    "## Top 20 títulos duplicados",
    dupTitles
      .slice(0, 20)
      .map(([t, v]) => `- **${t}** (${v.length}x): ${v.slice(0, 3).join(", ")}${v.length > 3 ? "…" : ""}`)
      .join("\n") || "_ok_",
    "",
    "## Placeholders 'Lovable App' / 'Lovable Generated'",
    placeholder.length
      ? placeholder.map((p) => `- \`${p.file}\` (${p.kind}): ${p.value}`).join("\n")
      : "_Nenhum — bom sinal._",
    "",
    "Detalhes completos em `seo-meta-audit.json`.",
  ].join("\n");

  await writeFile(join(OUT_DIR, "seo-meta-audit.md"), md);
  console.log("SEO meta audit done.", report.stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
