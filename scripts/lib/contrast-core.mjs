/**
 * contrast-core.mjs — Núcleo compartilhado da varredura de contraste.
 *
 * Exporta:
 *  - loadConfig(): lê contrast.config.json (com defaults) e resolve
 *    thresholds por rota (glob simples com "**").
 *  - buildClientScan(cfg): gera o snippet JS que roda no browser via
 *    page.evaluate. Usa sampling multi-ponto para lidar com gradientes
 *    e overlays opacos.
 *
 * Algoritmo documentado em docs/CONTRAST_METHODOLOGY.md.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

/** @typedef {{normal:number,large:number,strict:boolean,ignoreBelowPx?:number,tolerance?:number,samplesPerElement?:number}} RouteThresholds */

export async function loadConfig(file = "contrast.config.json") {
  const raw = await readFile(path.resolve(file), "utf8");
  const cfg = JSON.parse(raw);
  return cfg;
}

export function resolveThresholds(cfg, route) {
  const merged = { ...cfg.defaults };
  // exact match wins
  if (cfg.routes?.[route]) return { ...merged, ...cfg.routes[route] };
  // glob "**" fallback
  for (const [pattern, val] of Object.entries(cfg.routes ?? {})) {
    if (!pattern.includes("**")) continue;
    const re = new RegExp(
      "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*") + "$",
    );
    if (re.test(route)) return { ...merged, ...val };
  }
  return merged;
}

/**
 * Gera o código injetado no browser. Recebe cfg pronto (thresholds e
 * seletores a ignorar). O snippet retorna:
 *   { checked, sampled, violations, warnings }
 */
export function buildClientScan(cfg) {
  const payload = JSON.stringify({
    ignoreSelectors: cfg.ignoreSelectors ?? [],
    thresholds: cfg.thresholds,
  });
  // Snippet auto-contido; toda a álgebra WCAG vive aqui para casar 1:1
  // com o script CLI e com o teste Playwright.
  return `
(() => {
  const CFG = ${payload};
  const THRESH = CFG.thresholds;
  const IGNORE = CFG.ignoreSelectors ?? [];
  const TOL = THRESH.tolerance ?? 0.05;
  const MIN_PX = THRESH.ignoreBelowPx ?? 10;
  const N = Math.max(1, THRESH.samplesPerElement ?? 5);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const parseColor = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] };
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

  /** Parse simples de linear-gradient. Retorna { angleDeg, stops:[{color,pos01}] } */
  const parseLinearGradient = (bgImg) => {
    const m = bgImg.match(/linear-gradient\\(([^)]+(?:\\([^)]*\\)[^)]*)*)\\)/);
    if (!m) return null;
    const parts = [];
    let depth = 0, cur = '';
    for (const ch of m[1]) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    let angle = 180; // "to bottom"
    let stopStart = 0;
    const dir = parts[0];
    if (dir && /(deg|to\\s)/.test(dir)) {
      stopStart = 1;
      const d = dir.match(/(-?\\d+(\\.\\d+)?)deg/);
      if (d) angle = parseFloat(d[1]);
      else if (/to top/i.test(dir)) angle = 0;
      else if (/to right/i.test(dir)) angle = 90;
      else if (/to left/i.test(dir)) angle = 270;
    }
    const stops = [];
    parts.slice(stopStart).forEach((p, i, arr) => {
      const cm = p.match(/^(rgba?\\([^)]+\\)|#[0-9a-f]+|[a-z]+)\\s*(?:(-?\\d+(?:\\.\\d+)?)%)?/i);
      if (!cm) return;
      const probe = document.createElement('span');
      probe.style.color = cm[1];
      document.body.appendChild(probe);
      const col = parseColor(getComputedStyle(probe).color);
      probe.remove();
      if (!col) return;
      const pos = cm[2] != null ? parseFloat(cm[2]) / 100 : i / Math.max(1, arr.length - 1);
      stops.push({ color: col, pos: clamp(pos, 0, 1) });
    });
    if (stops.length < 2) return null;
    stops.sort((a, b) => a.pos - b.pos);
    return { angle, stops };
  };
  const gradientColorAt = (grad, u, v) => {
    // u = x/width em [0,1], v = y/height em [0,1]. Projeta na direção do gradiente.
    const rad = ((grad.angle - 90) * Math.PI) / 180; // css 0deg = para cima
    const dx = Math.cos(rad), dy = Math.sin(rad);
    // fração ao longo do eixo (aproximada para bbox quadrada)
    let t = 0.5 + ((u - 0.5) * dx + (v - 0.5) * dy);
    t = clamp(t, 0, 1);
    for (let i = 0; i < grad.stops.length - 1; i++) {
      const a = grad.stops[i], b = grad.stops[i + 1];
      if (t >= a.pos && t <= b.pos) {
        const range = Math.max(1e-6, b.pos - a.pos);
        const f = (t - a.pos) / range;
        return {
          r: a.color.r + (b.color.r - a.color.r) * f,
          g: a.color.g + (b.color.g - a.color.g) * f,
          b: a.color.b + (b.color.b - a.color.b) * f,
          a: a.color.a + (b.color.a - a.color.a) * f,
        };
      }
    }
    return { ...grad.stops[grad.stops.length - 1].color };
  };

  /**
   * Sobe a árvore acumulando camadas (cor sólida + gradiente) até uma
   * base opaca. Para cada camada guarda a bbox absoluta para poder
   * amostrar a cor efetiva num ponto (x,y) global.
   */
  const collectLayers = (el) => {
    const layers = [];
    let cur = el, guard = 0;
    while (cur && cur.nodeType === 1 && guard++ < 40) {
      const s = getComputedStyle(cur);
      const rect = cur.getBoundingClientRect();
      const color = parseColor(s.backgroundColor);
      const bgImg = s.backgroundImage && s.backgroundImage !== 'none' ? s.backgroundImage : null;
      const grad = bgImg ? parseLinearGradient(bgImg) : null;
      const hasImg = !!bgImg && !grad;
      if (color && color.a > 0) layers.push({ kind: 'color', color, rect });
      if (grad) layers.push({ kind: 'grad', grad, rect });
      if (hasImg) layers.push({ kind: 'img', rect });
      if (color && color.a >= 0.999 && !bgImg) break;
      cur = cur.parentElement;
    }
    return layers;
  };
  const effectiveBgAt = (layers, x, y) => {
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    let hasGradient = false, hasImage = false;
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      const inside = x >= L.rect.left && x <= L.rect.right && y >= L.rect.top && y <= L.rect.bottom;
      if (!inside) continue;
      if (L.kind === 'color') bg = blend(L.color, bg);
      else if (L.kind === 'grad') {
        hasGradient = true;
        const u = (x - L.rect.left) / Math.max(1, L.rect.width);
        const v = (y - L.rect.top) / Math.max(1, L.rect.height);
        const c = gradientColorAt(L.grad, u, v);
        bg = blend(c, bg);
      } else if (L.kind === 'img') {
        hasImage = true; // conservador: assume base branca; sinaliza warning
      }
    }
    return { color: bg, hasGradient, hasImage };
  };

  const matchesIgnore = (el) => IGNORE.some((sel) => {
    try { return el.matches(sel); } catch { return false; }
  });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const t = n.textContent?.trim();
      if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      if (!p || ['SCRIPT','STYLE','NOSCRIPT','SVG'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      const s = getComputedStyle(p);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.1) return NodeFilter.FILTER_REJECT;
      if (parseFloat(s.fontSize) < MIN_PX) return NodeFilter.FILTER_REJECT;
      if (matchesIgnore(p)) return NodeFilter.FILTER_REJECT;
      const r = p.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const violations = [], warnings = [];
  const seen = new Set();
  let checked = 0, sampled = 0, node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (seen.has(el)) continue;
    seen.add(el);
    checked++;
    const s = getComputedStyle(el);
    const fg = parseColor(s.color);
    if (!fg || fg.a === 0) continue;
    const rect = el.getBoundingClientRect();
    const layers = collectLayers(el);
    const size = parseFloat(s.fontSize);
    const bold = Number(s.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const min = large ? THRESH.large : THRESH.normal;

    // Sample N pontos dentro da bbox: 4 cantos + centro.
    const pts = [
      [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
      [rect.left + rect.width * 0.15, rect.top + rect.height * 0.25],
      [rect.left + rect.width * 0.85, rect.top + rect.height * 0.25],
      [rect.left + rect.width * 0.15, rect.top + rect.height * 0.75],
      [rect.left + rect.width * 0.85, rect.top + rect.height * 0.75],
    ].slice(0, N);

    let worst = Infinity, worstBg = null, gradSeen = false, imgSeen = false;
    for (const [x, y] of pts) {
      sampled++;
      const eff = effectiveBgAt(layers, x, y);
      const fgEff = fg.a < 1 ? blend(fg, eff.color) : fg;
      const ratio = contrast(fgEff, eff.color);
      if (ratio < worst) { worst = ratio; worstBg = eff.color; }
      if (eff.hasGradient) gradSeen = true;
      if (eff.hasImage) imgSeen = true;
    }
    const item = {
      selector: (el.tagName?.toLowerCase() ?? '') + (el.id ? '#' + el.id : '') +
        (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : ''),
      text: node.textContent.trim().slice(0, 80),
      color: s.color,
      bg: worstBg ? 'rgb(' + worstBg.r + ',' + worstBg.g + ',' + worstBg.b + ')' : '',
      ratio: Math.round(worst * 100) / 100,
      required: min,
      fontSize: size,
      bold,
      hasGradient: gradSeen,
      hasImage: imgSeen,
    };
    if (imgSeen && worst + TOL < min) {
      // com imagem de fundo o cálculo é aproximado — reporta como warning
      warnings.push({ ...item, reason: 'background-image (não amostrado)' });
      continue;
    }
    if (worst + TOL < min) violations.push(item);
  }
  return { checked, sampled, violations, warnings };
})();
`;
}
