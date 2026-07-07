#!/usr/bin/env node
/**
 * Varredura automática de contraste (WCAG 2.1).
 *
 * Uso:
 *   node scripts/contrast-scan.mjs                 # rotas padrão (marketing)
 *   node scripts/contrast-scan.mjs --url=/nichos   # url extra
 *   node scripts/contrast-scan.mjs --min=4.5       # ratio mínimo
 *   node scripts/contrast-scan.mjs --fail          # exit 1 se violar
 *
 * Percorre cada rota, extrai TODOS os nós de texto visíveis, calcula o
 * contraste efetivo contra o fundo pintado (subindo a árvore até achar
 * uma cor sólida, respeitando opacidade e gradientes). Emite relatório
 * JSON em playwright-report/contrast-report.json e um resumo no stdout.
 *
 * Regras WCAG:
 *  - texto normal >= 4.5
 *  - texto grande (>= 24px, ou >= 18.66px + bold) >= 3.0
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);

const DEFAULT_ROUTES = [
  "/",
  "/nichos",
  "/showroom",
  "/demo",
  "/planos",
  "/vitrine",
];
const routes = [
  ...DEFAULT_ROUTES,
  ...(args.get("url") ? [args.get("url")] : []),
];
const MIN = Number(args.get("min") ?? "4.5");
const FAIL_ON_VIOLATION = args.has("fail");

/**
 * Injetado no browser: encontra nós de texto visíveis, calcula contraste
 * contra o primeiro ancestral com background pintado.
 */
const CLIENT_SCAN = /* js */ `
(() => {
  const parseColor = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  };
  const relLum = ({ r, g, b }) => {
    const s = [r, g, b].map((v) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const contrast = (a, b) => {
    const la = relLum(a), lb = relLum(b);
    const [L1, L2] = la > lb ? [la, lb] : [lb, la];
    return (L1 + 0.05) / (L2 + 0.05);
  };
  const blend = (fg, bg) => {
    const a = fg.a;
    return {
      r: Math.round(fg.r * a + bg.r * (1 - a)),
      g: Math.round(fg.g * a + bg.g * (1 - a)),
      b: Math.round(fg.b * a + bg.b * (1 - a)),
      a: 1,
    };
  };
  const solidBg = (el) => {
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    let cur = el;
    while (cur && cur.nodeType === 1) {
      const s = getComputedStyle(cur);
      const c = parseColor(s.backgroundColor);
      const img = s.backgroundImage && s.backgroundImage !== 'none';
      if (img) stack.push({ gradient: true, source: cur });
      if (c && c.a > 0) stack.push({ color: c, source: cur });
      if (c && c.a >= 0.999 && !img) break;
      cur = cur.parentElement;
    }
    for (const layer of stack.reverse()) {
      if (layer.gradient) return { color: bg, hasGradient: true, source: layer.source };
      bg = blend(layer.color, bg);
    }
    return { color: bg, hasGradient: false };
  };
  const isVisible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.1) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const truncate = (t) => (t.length > 80 ? t.slice(0, 77) + '…' : t);
  const selectorFor = (el) => {
    if (!el) return '';
    const id = el.id ? '#' + el.id : '';
    const cls = (el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
      : '');
    return (el.tagName?.toLowerCase() ?? '') + id + cls;
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const t = n.textContent?.trim();
      if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (!isVisible(p)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const seen = new Set();
  const violations = [];
  let checked = 0;
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (seen.has(el)) continue;
    seen.add(el);
    checked++;
    const s = getComputedStyle(el);
    const fg = parseColor(s.color);
    if (!fg || fg.a === 0) continue;
    const bg = solidBg(el);
    const eff = fg.a < 1 ? blend(fg, bg.color) : fg;
    const ratio = contrast(eff, bg.color);
    const size = parseFloat(s.fontSize);
    const bold = Number(s.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const min = large ? 3 : 4.5;
    if (ratio + 0.01 < min) {
      violations.push({
        selector: selectorFor(el),
        text: truncate(node.textContent.trim()),
        color: s.color,
        backgroundColor: 'rgb(' + bg.color.r + ',' + bg.color.g + ',' + bg.color.b + ')',
        ratio: Math.round(ratio * 100) / 100,
        required: min,
        fontSize: size,
        bold,
        hasGradient: bg.hasGradient,
      });
    }
  }
  return { checked, violations };
})();
`;

const results = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const route of routes) {
  const url = BASE + route;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    const r = await page.evaluate(CLIENT_SCAN);
    results.push({ route, url, ok: true, ...r });
  } catch (e) {
    results.push({ route, url, ok: false, error: String(e?.message ?? e), checked: 0, violations: [] });
  }
}

await browser.close();

const total = results.reduce((a, r) => a + (r.violations?.length ?? 0), 0);
const summary = {
  base: BASE,
  min: MIN,
  scanned: results.length,
  totalViolations: total,
  results,
  generatedAt: new Date().toISOString(),
};

await mkdir("playwright-report", { recursive: true });
const out = path.resolve("playwright-report/contrast-report.json");
await writeFile(out, JSON.stringify(summary, null, 2));

console.log(`\nContraste WCAG (min ${MIN}) — ${results.length} rotas`);
for (const r of results) {
  const tag = r.ok ? `${r.violations.length} violações / ${r.checked} nós` : `ERRO: ${r.error}`;
  console.log(`  ${r.route.padEnd(24)} ${tag}`);
  for (const v of (r.violations ?? []).slice(0, 5)) {
    console.log(`    · ${v.ratio.toFixed(2)}${v.hasGradient ? " (gradiente)" : ""}  ${v.selector}  "${v.text}"`);
  }
  if ((r.violations?.length ?? 0) > 5) {
    console.log(`    … +${r.violations.length - 5} outros`);
  }
}
console.log(`\nRelatório: ${out}`);

if (FAIL_ON_VIOLATION && total > 0) {
  console.error(`\n✖ ${total} violações de contraste detectadas`);
  process.exit(1);
}
