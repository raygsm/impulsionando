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
}

export async function buildBrandKitZip(input: BrandKitInput): Promise<Blob> {
  const zip = new JSZip();
  const slug = sanitizeSlug(input.brandName);

  zip.file("README.txt", buildReadme(input));
  zip.file(`${slug}-tokens.css`, input.cssTokens);
  zip.file(`${slug}-brand.json`, input.jsonTokens);
  zip.file(`${slug}-signature.html`, input.signatureHtml);
  if (input.logoBlob) zip.file(`logo/${slug}-logo${input.logoExt || ".png"}`, input.logoBlob);
  if (input.faviconPng32) zip.file("favicon/favicon-32.png", input.faviconPng32);
  if (input.appleTouchPng) zip.file("favicon/apple-touch-icon-180.png", input.appleTouchPng);
  if (input.faviconIco) zip.file("favicon/favicon.ico", input.faviconIco);

  return await zip.generateAsync({ type: "blob" });
}

function buildReadme(input: BrandKitInput): string {
  return `Brand Kit — ${input.brandName}
Gerado em ${new Date().toISOString()}

Conteúdo:
  /logo/                        — logo original (quando disponível)
  /favicon/favicon.ico          — favicon multi-resolução (PNG embutido)
  /favicon/favicon-32.png       — favicon 32x32
  /favicon/apple-touch-icon-180.png — touch icon iOS
  ${sanitizeSlug(input.brandName)}-tokens.css      — paleta em CSS custom properties
  ${sanitizeSlug(input.brandName)}-brand.json      — tokens em JSON
  ${sanitizeSlug(input.brandName)}-signature.html  — assinatura de e-mail

Identidade:
  Marca:    ${input.brandName}
  Domínio:  ${input.domain || "—"}
  E-mail:   ${input.defaultEmail || "—"}
  Primária: ${input.primary}
  Secund.:  ${input.secondary}
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
