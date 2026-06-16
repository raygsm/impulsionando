// Client-side export helpers: CSV + simple tabular PDF via jsPDF.
import jsPDF from "jspdf";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(filename: string, columns: string[], rows: Array<Record<string, unknown>>) {
  const head = columns.map(csvEscape).join(";");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + head + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTablePdf(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: { key: string; label: string; align?: "left" | "right"; width?: number }[];
  rows: Array<Record<string, unknown>>;
  footer?: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text(opts.title, margin, y); y += 18;
  if (opts.subtitle) {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(110,110,110);
    doc.text(opts.subtitle, margin, y); y += 14;
  }
  doc.setTextColor(0,0,0);

  const totalW = pageW - margin * 2;
  const defWidths = opts.columns.map((c) => c.width ?? 0);
  const fixed = defWidths.reduce((s, n) => s + n, 0);
  const flexCount = defWidths.filter((n) => !n).length;
  const flexW = flexCount > 0 ? (totalW - fixed) / flexCount : 0;
  const widths = defWidths.map((n) => (n || flexW));

  // header
  doc.setFillColor(240, 240, 240); doc.rect(margin, y, totalW, 18, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  let x = margin + 4;
  opts.columns.forEach((c, i) => {
    const w = widths[i];
    doc.text(String(c.label), c.align === "right" ? x + w - 8 : x, y + 12, {
      align: c.align === "right" ? "right" : "left",
    });
    x += w;
  });
  y += 18;

  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  for (const row of opts.rows) {
    if (y > pageH - margin - 20) {
      doc.addPage(); y = margin;
    }
    x = margin + 4;
    opts.columns.forEach((c, i) => {
      const w = widths[i];
      const txt = String(row[c.key] ?? "");
      const clipped = doc.splitTextToSize(txt, w - 8)[0] ?? "";
      doc.text(clipped, c.align === "right" ? x + w - 8 : x, y + 12, {
        align: c.align === "right" ? "right" : "left",
      });
      x += w;
    });
    y += 16;
    doc.setDrawColor(230,230,230); doc.line(margin, y, margin + totalW, y);
  }

  if (opts.footer) {
    doc.setFontSize(8); doc.setTextColor(120,120,120);
    doc.text(opts.footer, margin, pageH - 20);
  }
  doc.save(opts.filename);
}

export function fmtBRLCents(c: number | null | undefined): string {
  return ((Number(c ?? 0)) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
