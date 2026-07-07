#!/usr/bin/env node
/**
 * Gera playwright-report/contrast-report.pdf a partir do JSON.
 * Uso: node scripts/contrast-report-pdf.mjs [caminho.json]
 */
import { readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const jsonPath = path.resolve(process.argv[2] ?? "playwright-report/contrast-report.json");
const pdfPath = jsonPath.replace(/\.json$/, ".pdf");
const data = JSON.parse(await readFile(jsonPath, "utf8"));

const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: "Contrast Report — Impulsionando" } });
doc.pipe(createWriteStream(pdfPath));

const H1 = 20, H2 = 14, BODY = 10, MONO = 9;

// Capa
doc.fontSize(H1).fillColor("#111").text("Relatório de Contraste WCAG", { align: "left" });
doc.moveDown(0.2);
doc.fontSize(BODY).fillColor("#555")
  .text(`Base: ${data.base}`)
  .text(`Gerado: ${data.generatedAt}`)
  .text(`Rotas analisadas: ${data.scanned}`)
  .text(`Violações (strict): ${data.strictViolations} / ${data.totalViolations} total  ·  Warnings: ${data.totalWarnings}`);
doc.moveDown(0.5);

// Sumário por rota
doc.fontSize(H2).fillColor("#111").text("Resumo por rota");
doc.moveDown(0.3);
const tableY = doc.y;
doc.fontSize(BODY).fillColor("#111");
const headers = ["Rota", "Strict", "Nós", "Amostras", "Viol.", "Warn"];
const widths  = [180,     50,      50,     70,          50,      50];
let x = 40;
headers.forEach((h, i) => { doc.text(h, x, tableY, { width: widths[i] }); x += widths[i]; });
doc.moveTo(40, tableY + 14).lineTo(555, tableY + 14).stroke("#ccc");
let y = tableY + 18;
for (const r of data.results) {
  const row = [
    r.route,
    r.thresholds?.strict ? "sim" : "não",
    String(r.checked ?? 0),
    String(r.sampled ?? 0),
    String(r.violations?.length ?? 0),
    String(r.warnings?.length ?? 0),
  ];
  x = 40;
  row.forEach((v, i) => { doc.fillColor(i === 4 && Number(v) > 0 ? "#b91c1c" : "#111").text(v, x, y, { width: widths[i] }); x += widths[i]; });
  y += 14;
  if (y > 780) { doc.addPage(); y = 40; }
}

// Detalhe por rota
for (const r of data.results) {
  doc.addPage();
  doc.fontSize(H1).fillColor("#111").text(r.route);
  doc.fontSize(BODY).fillColor("#555")
    .text(`URL: ${r.url}`)
    .text(`Thresholds: normal ≥ ${r.thresholds?.normal} · large ≥ ${r.thresholds?.large} · strict=${!!r.thresholds?.strict}`)
    .text(r.ok ? `${r.violations.length} violações · ${r.warnings.length} warnings · ${r.checked} nós` : `ERRO: ${r.error}`);
  doc.moveDown(0.5);

  const dumpBucket = (title, items, tone) => {
    if (!items?.length) return;
    doc.fontSize(H2).fillColor(tone).text(title);
    doc.moveDown(0.2);
    for (const v of items.slice(0, 40)) {
      const yStart = doc.y;
      // swatches
      const fg = parseRgb(v.color), bg = parseRgb(v.bg);
      if (fg) { doc.rect(40, yStart, 12, 12).fill(rgbCss(fg)); }
      if (bg) { doc.rect(56, yStart, 12, 12).fill(rgbCss(bg)); }
      doc.fillColor("#111").fontSize(BODY).text(
        `${v.ratio.toFixed(2)} / ${v.required}${v.hasGradient ? " · gradiente" : ""}${v.hasImage ? " · imagem" : ""}${v.bold ? " · bold" : ""} · ${Math.round(v.fontSize)}px`,
        76, yStart, { width: 480 },
      );
      doc.fillColor("#555").fontSize(MONO).text(v.selector, 76, doc.y, { width: 480 });
      doc.fillColor("#333").fontSize(BODY).text(`"${v.text}"`, 76, doc.y, { width: 480 });
      if (v.reason) doc.fillColor("#a16207").fontSize(MONO).text(v.reason, 76, doc.y, { width: 480 });
      doc.moveDown(0.4);
      if (doc.y > 780) { doc.addPage(); }
    }
  };
  dumpBucket("Violações", r.violations, "#b91c1c");
  dumpBucket("Warnings (background-image)", r.warnings, "#a16207");
}

doc.end();
console.log("PDF:", pdfPath);

function parseRgb(str) {
  const m = /rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/.exec(str ?? "");
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
}
function rgbCss(c) { return `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`; }
