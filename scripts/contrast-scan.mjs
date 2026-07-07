#!/usr/bin/env node
/**
 * Varredura WCAG por rota, com thresholds do contrast.config.json e
 * sampling multi-ponto (gradientes/overlays) via scripts/lib/contrast-core.
 *
 * Uso:
 *   node scripts/contrast-scan.mjs
 *   node scripts/contrast-scan.mjs --url=/foo --url=/bar
 *   node scripts/contrast-scan.mjs --fail    # falha se rota "strict" violar
 *   node scripts/contrast-scan.mjs --pdf     # gera contrast-report.pdf
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadConfig, resolveThresholds, buildClientScan } from "./lib/contrast-core.mjs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const args = process.argv.slice(2);
const extraUrls = args.filter((a) => a.startsWith("--url=")).map((a) => a.slice(6));
const FAIL = args.includes("--fail");
const PDF = args.includes("--pdf");

const cfg = await loadConfig();
const routes = extraUrls.length ? extraUrls : Object.keys(cfg.routes ?? {}).filter((r) => !r.includes("**"));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const results = [];

for (const route of routes) {
  const thresholds = resolveThresholds(cfg, route);
  const scan = buildClientScan({ ignoreSelectors: cfg.ignoreSelectors, thresholds });
  const url = BASE + route;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(400);
    const r = await page.evaluate(scan);
    results.push({ route, url, ok: true, thresholds, ...r });
  } catch (e) {
    results.push({ route, url, ok: false, error: String(e?.message ?? e), thresholds, checked: 0, sampled: 0, violations: [], warnings: [] });
  }
}

await browser.close();

const strictViolations = results
  .filter((r) => r.thresholds?.strict)
  .reduce((a, r) => a + (r.violations?.length ?? 0), 0);
const totalViolations = results.reduce((a, r) => a + (r.violations?.length ?? 0), 0);
const totalWarnings = results.reduce((a, r) => a + (r.warnings?.length ?? 0), 0);

const summary = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  scanned: results.length,
  totalViolations,
  strictViolations,
  totalWarnings,
  config: { ignoreSelectors: cfg.ignoreSelectors, defaults: cfg.defaults },
  results,
};

await mkdir("playwright-report", { recursive: true });
const jsonOut = path.resolve("playwright-report/contrast-report.json");
await writeFile(jsonOut, JSON.stringify(summary, null, 2));

console.log(`\nContraste WCAG — ${results.length} rotas | ${totalViolations} viol. (${strictViolations} strict) | ${totalWarnings} warn`);
for (const r of results) {
  const tag = r.ok
    ? `${r.violations.length} viol / ${r.warnings.length} warn — ${r.checked} nós, ${r.sampled} amostras${r.thresholds.strict ? " [strict]" : ""}`
    : `ERRO: ${r.error}`;
  console.log(`  ${r.route.padEnd(24)} ${tag}`);
  for (const v of (r.violations ?? []).slice(0, 5)) {
    console.log(`    · ${v.ratio.toFixed(2)}/${v.required}${v.hasGradient ? " grad" : ""} ${v.selector} — "${v.text}"`);
  }
}
console.log(`\nJSON: ${jsonOut}`);

if (PDF) {
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ["scripts/contrast-report-pdf.mjs", jsonOut], { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`pdf exit ${code}`))));
  });
}

if (FAIL && strictViolations > 0) {
  console.error(`\n✖ ${strictViolations} violações em rotas strict`);
  process.exit(1);
}
