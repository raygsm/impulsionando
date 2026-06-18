import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const fmtBRL = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR") : "";

export function downloadOrdersPdf(payload: {
  rows: any[];
  totals: { gross: number; fee: number; net: number };
  count: number;
  generated_at: string;
  filtersLabel?: string;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text("Marketplace — Pedidos do Bar", 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Gerado em ${new Date(payload.generated_at).toLocaleString("pt-BR")} · ${payload.count} pedido(s)`,
    40,
    56,
  );
  if (payload.filtersLabel) {
    doc.text(`Filtros: ${payload.filtersLabel}`, 40, 70);
  }
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 84,
    head: [[
      "Pedido", "Status", "Fornecedor", "Comprador",
      "Bruto", "Taxa", "Líquido", "Enviado", "Aprovado", "Concluído",
    ]],
    body: payload.rows.map((o) => [
      `#${o.order_number}`,
      o.status,
      o.supplier?.display_name ?? "",
      o.buyer?.display_name ?? "",
      fmtBRL(o.subtotal_cents),
      fmtBRL(o.fee_cents),
      fmtBRL(o.supplier_net_cents),
      fmtDate(o.placed_at),
      fmtDate(o.approved_at),
      fmtDate(o.completed_at),
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    foot: [[
      { content: `Totais (${payload.count})`, colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
      { content: fmtBRL(payload.totals.gross), styles: { fontStyle: "bold" } },
      { content: fmtBRL(payload.totals.fee), styles: { fontStyle: "bold" } },
      { content: fmtBRL(payload.totals.net), styles: { fontStyle: "bold" } },
      "", "", "",
    ]],
    footStyles: { fillColor: [243, 244, 246], textColor: 0 },
  });

  doc.save(`pedidos-marketplace-${new Date().toISOString().slice(0, 10)}.pdf`);
}
