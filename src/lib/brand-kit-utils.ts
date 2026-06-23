/**
 * Utilidades de marca usadas pelas tabs de Preview/Export:
 *   - WCAG: contraste relativo (0..21)
 *   - Favicon: render do logo em canvas → PNG + ICO (PNG embutido)
 *   - ZIP: empacotar kit completo via JSZip
 */
import JSZip from "jszip";

// ---------- WCAG ----------

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

export function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 3 && h.length !== 6) return null;
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG 2.x contrast ratio (1..21). Inputs em hex `#RRGGBB`. */
export function contrastRatio(fg: string, bg: string): number {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return 1;
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

// ---------- Favicon ----------

/** Carrega uma imagem e devolve um Image element pronto pra desenhar em canvas. */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não consegui carregar a imagem (CORS ou URL inválida)."));
    img.src = src;
  });
}

/**
 * Gera um PNG do logo ajustado em um quadrado size×size com fundo opcional.
 * Quando logoUrl é null, desenha as iniciais do brandName sobre `primary`.
 */
export async function renderFaviconPng(opts: {
  logoUrl: string | null;
  brandName: string;
  primary: string;
  size: number;
  background?: string | null;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = opts.size;
  canvas.height = opts.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível.");

  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, opts.size, opts.size);
  }

  if (opts.logoUrl) {
    const img = await loadImage(opts.logoUrl);
    // contain
    const ratio = Math.min(opts.size / img.width, opts.size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (opts.size - w) / 2;
    const y = (opts.size - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  } else {
    ctx.fillStyle = opts.primary;
    ctx.fillRect(0, 0, opts.size, opts.size);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.floor(opts.size * 0.5)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((opts.brandName || "??").slice(0, 2).toUpperCase(), opts.size / 2, opts.size / 2 + opts.size * 0.03);
  }

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), "image/png"),
  );
}

/**
 * Constrói um arquivo .ico mínimo embutindo um PNG (suportado por Windows Vista+).
 * Estrutura: ICONDIR (6) + ICONDIRENTRY (16) + PNG raw bytes.
 */
export async function pngBlobToIco(pngBlob: Blob, size: number): Promise<Blob> {
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new ArrayBuffer(6 + 16);
  const dv = new DataView(header);
  // ICONDIR
  dv.setUint16(0, 0, true); // reserved
  dv.setUint16(2, 1, true); // type 1 = ICO
  dv.setUint16(4, 1, true); // 1 image
  // ICONDIRENTRY
  dv.setUint8(6, size >= 256 ? 0 : size); // width (0 = 256)
  dv.setUint8(7, size >= 256 ? 0 : size); // height
  dv.setUint8(8, 0); // palette
  dv.setUint8(9, 0); // reserved
  dv.setUint16(10, 1, true); // color planes
  dv.setUint16(12, 32, true); // bpp
  dv.setUint32(14, pngBytes.length, true); // image size
  dv.setUint32(18, 6 + 16, true); // offset
  return new Blob([header, pngBytes], { type: "image/x-icon" });
}

// ---------- ZIP ----------

export interface WcagParams {
  sampleText: string;
  fontSize: number;
  bold: boolean;
}

export interface BrandKitInput {
  brandName: string;
  domain: string;
  defaultEmail: string;
  primary: string;
  secondary: string;
  logoBlob: Blob | null;
  logoExt: string; // ".png" / ".svg" etc
  cssTokens: string;
  jsonTokens: string;
  signatureHtml: string;
  faviconPng32?: Blob | null;
  faviconIco?: Blob | null;
  appleTouchPng?: Blob | null;
  wcag?: WcagParams;
}

export async function buildBrandKitZip(input: BrandKitInput): Promise<Blob> {
  const zip = new JSZip();
  const slug = sanitizeSlug(input.brandName);

  zip.file("README.md", buildReadme(input));
  zip.file(`${slug}-tokens.css`, input.cssTokens);
  zip.file(`${slug}-brand.json`, input.jsonTokens);
  zip.file(`${slug}-signature.html`, input.signatureHtml);
  if (input.logoBlob) zip.file(`logo/${slug}-logo${input.logoExt || ".png"}`, input.logoBlob);
  if (input.faviconPng32) zip.file("favicon/favicon-32.png", input.faviconPng32);
  if (input.appleTouchPng) zip.file("favicon/apple-touch-icon-180.png", input.appleTouchPng);
  if (input.faviconIco) zip.file("favicon/favicon.ico", input.faviconIco);

  if (input.wcag) {
    const report = buildWcagReport(input);
    zip.file("accessibility/wcag-report.json", JSON.stringify(report.json, null, 2));
    zip.file("accessibility/wcag-report.html", report.html);
  }

  return await zip.generateAsync({ type: "blob" });
}

// ---------- WCAG report ----------

export interface WcagPairResult {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  level: "AAA" | "AA" | "AA Large only" | "Fail";
}

export function classifyWcag(ratio: number, isLarge: boolean): WcagPairResult["level"] {
  if (isLarge) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large only";
  return "Fail";
}

export function runWcagPairs(primary: string, secondary: string, isLarge: boolean): WcagPairResult[] {
  const pairs = [
    { label: "Texto branco sobre Primária", fg: "#ffffff", bg: primary },
    { label: "Texto preto sobre Primária", fg: "#0f172a", bg: primary },
    { label: "Texto branco sobre Secundária", fg: "#ffffff", bg: secondary },
    { label: "Texto preto sobre Secundária", fg: "#0f172a", bg: secondary },
    { label: "Primária sobre Secundária", fg: primary, bg: secondary },
  ];
  return pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    return { ...p, ratio, level: classifyWcag(ratio, isLarge) };
  });
}

function buildWcagReport(input: BrandKitInput) {
  const params = input.wcag!;
  const isLarge = params.bold ? params.fontSize >= 18.66 : params.fontSize >= 24;
  const results = runWcagPairs(input.primary, input.secondary, isLarge);
  const failing = results.filter((r) => r.level === "Fail");

  const json = {
    brand: input.brandName,
    generated_at: new Date().toISOString(),
    parameters: {
      sample_text: params.sampleText,
      font_size_px: params.fontSize,
      bold: params.bold,
      is_large_text: isLarge,
      thresholds: isLarge
        ? { AA: 3, AAA: 4.5, note: "Texto grande (≥18pt regular ou ≥14pt bold)" }
        : { AA: 4.5, AAA: 7, note: "Texto normal" },
    },
    summary: {
      total: results.length,
      passing_aaa: results.filter((r) => r.level === "AAA").length,
      passing_aa: results.filter((r) => r.level === "AA").length,
      large_only: results.filter((r) => r.level === "AA Large only").length,
      failing: failing.length,
    },
    pairs: results,
  };

  const rows = results
    .map(
      (r) => `<tr>
  <td>${escapeHtml(r.label)}</td>
  <td><code>${r.fg}</code></td>
  <td><code>${r.bg}</code></td>
  <td><div style="background:${r.bg};color:${r.fg};font-size:${params.fontSize}px;font-weight:${params.bold ? 700 : 400};padding:6px 10px;border-radius:4px;display:inline-block;">${escapeHtml(params.sampleText || "Aa")}</div></td>
  <td style="text-align:right;font-family:monospace;">${r.ratio.toFixed(2)}:1</td>
  <td><span class="badge badge-${r.level.replace(/[^a-z]/gi, "")}">${r.level}</span></td>
</tr>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório WCAG — ${escapeHtml(input.brandName)}</title>
  <style>
    body { font: 14px -apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#0f172a; max-width:900px; margin:32px auto; padding:0 16px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .muted { color:#64748b; }
    table { width:100%; border-collapse: collapse; margin-top:16px; }
    th, td { border-bottom:1px solid #e2e8f0; padding:10px 8px; text-align:left; vertical-align: middle; }
    th { background:#f8fafc; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:#475569; }
    .badge { display:inline-block; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; }
    .badge-AAA, .badge-AA { background:#16a34a; color:#fff; }
    .badge-AALargeonly { background:#f59e0b; color:#fff; }
    .badge-Fail { background:#dc2626; color:#fff; }
    .params { background:#f1f5f9; border-radius:8px; padding:12px; margin-top:12px; font-size:13px; }
    .params code { background:#fff; padding:1px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <h1>Relatório de contraste WCAG — ${escapeHtml(input.brandName)}</h1>
  <p class="muted">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <div class="params">
    <strong>Parâmetros do teste:</strong><br>
    Texto de teste: <code>${escapeHtml(params.sampleText || "Aa")}</code><br>
    Tamanho: <code>${params.fontSize}px</code> · Peso: <code>${params.bold ? "negrito" : "regular"}</code><br>
    Classificação: <code>${isLarge ? "texto grande (AA ≥ 3 / AAA ≥ 4.5)" : "texto normal (AA ≥ 4.5 / AAA ≥ 7)"}</code>
  </div>
  <table>
    <thead><tr><th>Combinação</th><th>Cor texto</th><th>Cor fundo</th><th>Amostra</th><th>Razão</th><th>Nível</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p class="muted" style="margin-top:24px;">Resumo: ${json.summary.passing_aaa} AAA · ${json.summary.passing_aa} AA · ${json.summary.large_only} apenas-large · ${json.summary.failing} falha(s).</p>
</body>
</html>`;

  return { json, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}


function buildReadme(input: BrandKitInput): string {
  const slug = sanitizeSlug(input.brandName);
  return `# Brand Kit — ${input.brandName}

> Gerado em ${new Date().toLocaleString("pt-BR")} pelo Core Impulsionando.

Este pacote contém tudo que você precisa pra aplicar a identidade visual de **${input.brandName}** em sites, e-mails, navegador e materiais do time.

---

## 📁 Conteúdo do ZIP

| Arquivo | Pra que serve | Onde usar |
|---|---|---|
| \`logo/${slug}-logo.*\` | Logo original (PNG/SVG/JPG) | Site, apresentações, papel timbrado |
| \`favicon/favicon.ico\` | Ícone do navegador (multi-resolução) | Raiz do site |
| \`favicon/favicon-32.png\` | Favicon 32×32 PNG | \`<link rel="icon">\` moderno |
| \`favicon/apple-touch-icon-180.png\` | Ícone iOS na tela inicial | \`<link rel="apple-touch-icon">\` |
| \`${slug}-tokens.css\` | Paleta como CSS custom properties | Importar no CSS global do site |
| \`${slug}-brand.json\` | Tokens estruturados | Design tools, Figma plugins, scripts |
| \`${slug}-signature.html\` | Assinatura de e-mail HTML | Gmail, Outlook, Apple Mail |

---

## 🎨 Identidade

- **Marca:** ${input.brandName}
- **Domínio:** ${input.domain || "—"}
- **E-mail principal:** ${input.defaultEmail || "—"}
- **Cor primária:** \`${input.primary}\`
- **Cor secundária:** \`${input.secondary}\`

---

## 🌐 Como aplicar no site

1. Copie \`${slug}-tokens.css\` para sua pasta de CSS.
2. Importe no topo do seu CSS global: \`@import "./${slug}-tokens.css";\`
3. Use as variáveis: \`background: var(--brand-primary);\`
4. Coloque os arquivos de \`favicon/\` na raiz do site público e adicione no \`<head>\`:

\`\`\`html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png">
\`\`\`

---

## ✉️ Como instalar a assinatura no Gmail

1. Abra o arquivo \`${slug}-signature.html\` em um navegador.
2. Selecione tudo (Ctrl/Cmd + A) e copie (Ctrl/Cmd + C).
3. No Gmail, vá em **Configurações → Ver todas as configurações → Geral → Assinatura**.
4. Crie uma nova assinatura, cole (Ctrl/Cmd + V) no editor.
5. Defina como padrão pra novos e-mails e respostas. Salve.

> ⚠️ Importante: o Gmail só aceita assinaturas com links públicos para a imagem do logo. Se a imagem não aparecer, hospede-a em um domínio público (ex.: o próprio site) e edite o \`src\` no HTML.

---

## ✉️ Como instalar a assinatura no Outlook

### Outlook desktop (Windows)
1. Abra \`${slug}-signature.html\` em um navegador, selecione tudo e copie.
2. No Outlook: **Arquivo → Opções → Email → Assinaturas → Novo**.
3. Cole no editor e salve.

### Outlook Web / Microsoft 365
1. Abra a engrenagem (⚙️) → **Exibir todas as configurações do Outlook → Email → Compor e responder**.
2. Em "Assinatura de email", cole o conteúdo copiado do HTML.
3. Escolha quando aplicar (novos e-mails / respostas). Salve.

---

## 🍎 Apple Mail

1. **Mail → Preferências → Assinaturas**.
2. Crie uma nova assinatura na conta desejada.
3. Cole o conteúdo de \`${slug}-signature.html\` (abra o HTML no Safari, selecione e copie primeiro).

---

## 🔄 Atualizar o kit

Sempre que mudar logo/cores em \`/admin/branding\`, gere um novo ZIP — os arquivos têm data de geração no topo deste README.

---

_Core Impulsionando · branding management_
`;
}

export function sanitizeSlug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "brand"
  );
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fetchAsBlob(url: string): Promise<{ blob: Blob; ext: string } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const m = url.match(/\.(svg|png|webp|jpe?g|gif)(?:\?|$)/i);
    const ext = m ? "." + m[1].toLowerCase().replace("jpeg", "jpg") : guessExtFromMime(blob.type);
    return { blob, ext };
  } catch {
    return null;
  }
}

function guessExtFromMime(mime: string): string {
  if (mime.includes("svg")) return ".svg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  return ".png";
}
