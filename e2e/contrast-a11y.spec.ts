/**
 * Contraste WCAG — falha o CI quando texto/fundo cai abaixo do mínimo
 * exigido nas rotas marketing principais.
 *
 * Reusa o mesmo algoritmo de `scripts/contrast-scan.mjs` (portado
 * inline) para não depender do build do script. Percorre nós de texto
 * visíveis, resolve o fundo composto (com opacidade) e detecta
 * gradientes — marcados como "warning" para revisão manual.
 */
import { test, expect, type Page } from "@playwright/test";

const SCAN = /* js */ `
(() => {
  const parseColor = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
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
  const blend = (fg, bg) => ({
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  });
  const solidBg = (el) => {
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    let cur = el, hasGradient = false;
    while (cur && cur.nodeType === 1) {
      const s = getComputedStyle(cur);
      const c = parseColor(s.backgroundColor);
      const img = s.backgroundImage && s.backgroundImage !== 'none';
      if (img) hasGradient = true;
      if (c && c.a > 0) stack.push(c);
      if (c && c.a >= 0.999) break;
      cur = cur.parentElement;
    }
    for (const layer of stack.reverse()) bg = blend(layer, bg);
    return { color: bg, hasGradient };
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const t = n.textContent?.trim();
      if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      const s = getComputedStyle(p);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.1) return NodeFilter.FILTER_REJECT;
      const r = p.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const seen = new Set();
  const violations = [];
  let checked = 0, node;
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
    const min = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio + 0.01 < min) {
      violations.push({
        text: node.textContent.trim().slice(0, 60),
        selector: (el.tagName?.toLowerCase() ?? '') + (el.id ? '#' + el.id : ''),
        ratio: Math.round(ratio * 100) / 100,
        required: min,
        hasGradient: bg.hasGradient,
        color: s.color,
        bg: 'rgb(' + bg.color.r + ',' + bg.color.g + ',' + bg.color.b + ')',
      });
    }
  }
  return { checked, violations };
})();
`;

async function scan(page: Page, route: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  return page.evaluate(SCAN) as Promise<{
    checked: number;
    violations: Array<{ text: string; selector: string; ratio: number; required: number; hasGradient: boolean; color: string; bg: string }>;
  }>;
}

const ROUTES = ["/", "/nichos", "/showroom", "/demo", "/planos"];

for (const route of ROUTES) {
  test(`contraste WCAG AA em ${route}`, async ({ page }) => {
    const { checked, violations } = await scan(page, route);
    expect(checked, "deveria varrer pelo menos 1 nó de texto").toBeGreaterThan(0);
    if (violations.length > 0) {
      const msg = violations
        .slice(0, 20)
        .map((v) => `  ${v.ratio.toFixed(2)}/${v.required} ${v.hasGradient ? "[grad] " : ""}${v.selector} "${v.text}"`)
        .join("\n");
      throw new Error(`${violations.length} violações de contraste em ${route}:\n${msg}`);
    }
  });
}
