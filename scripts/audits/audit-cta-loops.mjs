#!/usr/bin/env node
/**
 * P6.8-A — Auditoria de CTAs no front-end Impulsionando.
 *
 * Varre src/routes/ e src/components/ procurando:
 *   1. Loops potenciais: CTA em rota /nichos/X que aponta para
 *      /demo/escolher-nicho (ou vice-versa), quando o próprio nicho
 *      já tem plano/rota dedicada.
 *   2. Links quebrados internos: <Link to="/algo"> onde /algo não
 *      existe em src/routes/ (heurística por filename).
 *   3. CTAs mudos: <Button> ou <a> sem href/onClick/to visíveis
 *      (best-effort, apenas alerta).
 *   4. Uso de <a href="/rota-dinamica/${...}"> em vez de <Link>.
 *
 * Saída: JSON + Markdown em /mnt/documents/impulsionando-noite/.
 * Nunca modifica código — apenas relata.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src/routes");
const COMPONENTS_DIR = join(ROOT, "src/components");
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
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

function filenameToRoute(file) {
  // src/routes/foo.bar.$id.tsx -> /foo/bar/$id
  const rel = relative(ROUTES_DIR, file).replace(/\.(tsx?|jsx?)$/, "");
  if (rel === "__root" || rel.endsWith("/README") || rel.endsWith(".gen"))
    return null;
  // folders and dots both map to slashes
  const parts = rel.split(/[./]/).filter(Boolean);
  const cleaned = parts
    .filter((p) => !p.startsWith("_") || p === "_authenticated") // keep layout id
    .map((p) => (p === "index" ? "" : p))
    .filter(Boolean);
  return "/" + cleaned.join("/");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const routeFiles = await walk(ROUTES_DIR);
  const compFiles = await walk(COMPONENTS_DIR);
  const allFiles = [...routeFiles, ...compFiles];

  // Build set of known internal routes (best-effort, strip $params)
  const knownRoutes = new Set();
  for (const f of routeFiles) {
    const r = filenameToRoute(f);
    if (!r) continue;
    knownRoutes.add(r);
    // also add without _authenticated prefix (URL form)
    knownRoutes.add(r.replace("/_authenticated", ""));
  }

  const findings = {
    potentialLoops: [],
    unknownInternalLinks: [],
    rawAnchorDynamic: [],
    silentButtons: [],
    stats: {
      filesScanned: allFiles.length,
      routeFiles: routeFiles.length,
      knownRoutes: knownRoutes.size,
    },
  };

  const linkToRe = /<Link\s+[^>]*to=["'`]([^"'`]+)["'`]/g;
  const hrefRe = /href=["'`](\/[^"'`${}]+)["'`]/g;
  const hrefDynRe = /href=\{`(\/[^`]*\$\{[^`]*)`\}/g;

  for (const f of allFiles) {
    let src;
    try {
      src = await readFile(f, "utf8");
    } catch {
      continue;
    }
    const rel = relative(ROOT, f);

    // Loop heuristic: file lives under /nichos or /demo AND references opposite bucket in a Link
    const isNichoFile = /routes\/nichos\./.test(rel) || /NichoPage/.test(rel);
    if (isNichoFile && /demo\/escolher-nicho/.test(src)) {
      findings.potentialLoops.push({
        file: rel,
        pattern: "nicho -> /demo/escolher-nicho",
        note:
          "Rota de nicho não deve mandar lead de volta para o picker de nichos.",
      });
    }

    // Internal <Link to="..."> targets
    let m;
    while ((m = linkToRe.exec(src))) {
      const to = m[1];
      if (!to.startsWith("/")) continue;
      // normalize $params: /users/$id -> known if any /users/$id exists
      const normalized = to.replace(/\$\w+/g, "$_");
      const anyMatch =
        knownRoutes.has(to) ||
        [...knownRoutes].some(
          (k) => k.replace(/\$\w+/g, "$_") === normalized,
        );
      if (!anyMatch) {
        findings.unknownInternalLinks.push({ file: rel, to });
      }
    }

    // Raw <a href="/..."> with template literals & dynamic segments
    while ((m = hrefDynRe.exec(src))) {
      findings.rawAnchorDynamic.push({ file: rel, snippet: m[0].slice(0, 120) });
    }

    // Silent buttons: <Button ...>...</Button> with no onClick / asChild / type=submit
    const btnMatches = src.match(/<Button[^>]*>[\s\S]{0,80}?<\/Button>/g) || [];
    for (const b of btnMatches) {
      if (
        !/onClick|asChild|type=["']submit|to=|href=|form=/.test(b) &&
        !/Loader2|Spinner/.test(b)
      ) {
        // ignore icon-only or disabled placeholders
        if (b.length < 300)
          findings.silentButtons.push({ file: rel, snippet: b.slice(0, 140) });
      }
    }
  }

  // Cap noisy sections
  const cap = (arr, n) => arr.slice(0, n);
  const capped = {
    ...findings,
    unknownInternalLinks: cap(findings.unknownInternalLinks, 300),
    silentButtons: cap(findings.silentButtons, 100),
    rawAnchorDynamic: cap(findings.rawAnchorDynamic, 100),
  };

  await writeFile(
    join(OUT_DIR, "cta-audit.json"),
    JSON.stringify(capped, null, 2),
  );

  const md = [
    "# P6.8-A — Auditoria de CTAs (Impulsionando)",
    "",
    `Gerado: ${new Date().toISOString()}`,
    "",
    "## Resumo",
    `- Arquivos varridos: **${findings.stats.filesScanned}**`,
    `- Rotas conhecidas: **${findings.stats.knownRoutes}**`,
    `- Loops potenciais: **${findings.potentialLoops.length}**`,
    `- Links internos apontando para rota desconhecida: **${findings.unknownInternalLinks.length}**`,
    `- <a href> dinâmico (deveria ser <Link>): **${findings.rawAnchorDynamic.length}**`,
    `- Botões suspeitos sem ação clara: **${findings.silentButtons.length}**`,
    "",
    "## Loops potenciais (PRIORIDADE MÁXIMA)",
    findings.potentialLoops.length
      ? findings.potentialLoops
          .map((x) => `- \`${x.file}\` — ${x.pattern}: ${x.note}`)
          .join("\n")
      : "_Nenhum detectado._",
    "",
    "## Top 40 links internos para rotas desconhecidas",
    capped.unknownInternalLinks
      .slice(0, 40)
      .map((x) => `- \`${x.file}\` → \`${x.to}\``)
      .join("\n") || "_Nenhum._",
    "",
    "## Recomendações",
    "1. Corrigir todos os loops potenciais antes de qualquer campanha paga.",
    "2. Revisar cada link interno desconhecido — pode ser typo, rota renomeada ou rota faltando.",
    "3. Substituir `<a href={\\`/algo/${x}\\`}>` por `<Link to=\"/algo/$x\" params={{x}}>` (tipagem + preload).",
    "4. Auditar manualmente os botões sem ação — muitos podem ser CTA mudo que perde lead.",
    "",
    "Arquivos completos em `cta-audit.json` neste mesmo diretório.",
  ].join("\n");

  await writeFile(join(OUT_DIR, "cta-audit.md"), md);

  console.log("CTA audit done.");
  console.log(JSON.stringify(findings.stats, null, 2));
  console.log("Loops:", findings.potentialLoops.length);
  console.log("Unknown links:", findings.unknownInternalLinks.length);
  console.log("Dynamic <a href>:", findings.rawAnchorDynamic.length);
  console.log("Silent buttons:", findings.silentButtons.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
