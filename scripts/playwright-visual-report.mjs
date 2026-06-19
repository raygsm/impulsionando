#!/usr/bin/env node
/**
 * Gera um relatório markdown agrupando falhas de visual regression do
 * Playwright por componente / viewport / estado.
 *
 * Entrada: pasta `test-results/` produzida pelo `bun run test:e2e`.
 *   Para cada cenário falho, o Playwright deposita:
 *     <test-dir>/<snapshot-name>-expected.png
 *     <test-dir>/<snapshot-name>-actual.png
 *     <test-dir>/<snapshot-name>-diff.png
 *
 * Saída:
 *   - stdout: markdown resumido
 *   - $GITHUB_STEP_SUMMARY (se definido): mesmo markdown
 *   - $GITHUB_OUTPUT (se definido): variável `report` com o markdown
 *     (multi-line, escapado para uso no `actions/github-script`).
 *
 * Categorias reconhecidas (via padrão no nome do snapshot):
 *   - vertical-offer-educacao-<viewport>-<state>
 *   - public-footer-<viewport>
 *   - public-footer-nichos-col-<viewport>
 *   - hero-cta-<width>          (já existente)
 *   - macro-<slug>-<viewport>   (escolher-nicho)
 *
 * Qualquer diff fora dessas categorias entra em "Outros".
 */

import { readdirSync, statSync, readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";

const ROOT = process.argv[2] ?? "test-results";

const KNOWN_VIEWPORTS = ["mobile-375", "tablet-768", "desktop-1280"];
const KNOWN_STATES = ["default", "hover", "focus"];

/** @returns {string[]} all `*-diff.png` paths under root */
function walkDiffs(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkDiffs(full));
    else if (st.isFile() && entry.endsWith("-diff.png")) out.push(full);
  }
  return out;
}

/**
 * Tenta decompor um nome de snapshot em {component, viewport, state}.
 * Retorna null se não bater com nenhum padrão conhecido.
 */
function categorize(snapshotName) {
  // vertical-offer-educacao-<viewport>-[secondary-]<state>
  let m = snapshotName.match(
    /^vertical-offer-educacao-(mobile-375|tablet-768|desktop-1280)-(secondary-)?(default|hover|focus)$/,
  );
  if (m) {
    const target = m[2] ? "CTA secundário" : "CTA principal";
    return {
      component: `verticalOffer (educacao · ${target})`,
      viewport: m[1],
      state: m[3],
    };
  }


  // public-footer-nichos-col-<viewport>
  m = snapshotName.match(/^public-footer-nichos-col-(mobile-375|tablet-768|desktop-1280)$/);
  if (m) return { component: "PublicFooter · coluna Nichos", viewport: m[1], state: "default" };

  // public-footer-<viewport>
  m = snapshotName.match(/^public-footer-(mobile-375|tablet-768|desktop-1280)$/);
  if (m) return { component: "PublicFooter", viewport: m[1], state: "default" };

  // macro-<slug>-<viewport>
  m = snapshotName.match(/^macro-([\w-]+)-(mobile-375|tablet-768|desktop-1280)$/);
  if (m) return { component: `escolher-nicho · macro=${m[1]}`, viewport: m[2], state: "default" };

  // hero-cta-<width>
  m = snapshotName.match(/^hero-cta-(\d+)$/);
  if (m) {
    const w = Number(m[1]);
    const vp = w <= 480 ? "mobile-375" : w <= 900 ? "tablet-768" : "desktop-1280";
    return { component: "Hero CTAs", viewport: vp, state: "default" };
  }

  return null;
}

function snapshotNameFromDiff(file) {
  return basename(file).replace(/-diff\.png$/, "");
}

function buildReport(diffs) {
  if (diffs.length === 0) {
    return "## ✅ Visual regression — sem diffs\n\nNenhum `*-diff.png` foi gerado nesta run.\n";
  }

  /** @type {Map<string, Array<{viewport:string,state:string,file:string}>>} */
  const byComponent = new Map();
  const others = [];

  for (const file of diffs) {
    const snap = snapshotNameFromDiff(file);
    const cat = categorize(snap);
    if (!cat) {
      others.push({ snap, file });
      continue;
    }
    if (!byComponent.has(cat.component)) byComponent.set(cat.component, []);
    byComponent.get(cat.component).push({ viewport: cat.viewport, state: cat.state, file });
  }

  const lines = [];
  lines.push("## 🖼️ Visual regression — diffs detectados");
  lines.push("");
  lines.push(`Total de snapshots divergentes: **${diffs.length}**`);
  lines.push("");

  // Tabela por componente × viewport × estado
  const priorityComponents = [
    "verticalOffer (educacao)",
    "PublicFooter",
    "PublicFooter · coluna Nichos",
    "Hero CTAs",
  ];
  const orderedComponents = [
    ...priorityComponents.filter((c) => byComponent.has(c)),
    ...[...byComponent.keys()].filter((c) => !priorityComponents.includes(c)),
  ];

  for (const comp of orderedComponents) {
    const rows = byComponent.get(comp);
    lines.push(`### ${comp}`);
    lines.push("");
    lines.push("| Viewport | Estado | Diff |");
    lines.push("|---|---|---|");
    // Ordena por viewport conhecido depois estado
    rows.sort((a, b) => {
      const va = KNOWN_VIEWPORTS.indexOf(a.viewport);
      const vb = KNOWN_VIEWPORTS.indexOf(b.viewport);
      if (va !== vb) return va - vb;
      return KNOWN_STATES.indexOf(a.state) - KNOWN_STATES.indexOf(b.state);
    });
    for (const r of rows) {
      const flag =
        r.viewport === "mobile-375" ? "📱" :
        r.viewport === "tablet-768" ? "📲" :
        r.viewport === "desktop-1280" ? "🖥️" : "❔";
      const rel = r.file.replace(/^\.?\//, "");
      lines.push(`| ${flag} ${r.viewport} | ${r.state} | \`${rel}\` |`);
    }
    lines.push("");
  }

  if (others.length) {
    lines.push("### Outros snapshots divergentes");
    lines.push("");
    for (const o of others) {
      lines.push(`- \`${o.snap}\` → \`${o.file}\``);
    }
    lines.push("");
  }

  lines.push("> Baixe o artifact **playwright-visual-diffs** para inspecionar os PNGs `*-expected.png`, `*-actual.png` e `*-diff.png` lado a lado.");
  lines.push("> Se a mudança for intencional, regenere os baselines com `E2E_VISUAL=1 bunx playwright test --update-snapshots`.");

  return lines.join("\n") + "\n";
}

function main() {
  const diffs = walkDiffs(ROOT);
  const md = buildReport(diffs);

  process.stdout.write(md);

  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    try { appendFileSync(summary, md); } catch { /* ignore */ }
  }

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    try {
      // multi-line output via heredoc delimiter
      const delim = "EOF_VISUAL_REPORT_" + Date.now();
      appendFileSync(out, `report<<${delim}\n${md}\n${delim}\n`);
      appendFileSync(out, `diff_count=${diffs.length}\n`);
    } catch { /* ignore */ }
  }
}

main();
