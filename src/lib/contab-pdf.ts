import jsPDF from "jspdf";
import type { WhiteLabelConfig } from "@/hooks/use-contab-whitelabel";

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export interface ContabReportInput {
  periodLabel: string;
  generatedAt: string;
  whiteLabel: WhiteLabelConfig;
  mrr: number;
  active: number;
  avgTicket: number;
  contractsActive: number;
  byRegime: Record<string, { count: number; mrr: number }>;
  docsPending: number;
  oblOverdue: number;
  oblUpcoming30: number;
  oblValueUpcoming: number;
  tasksOpen: number;
  tasksUrgent: number;
  irpfInProgress: number;
  irpfDone: number;
  irpfFeesPending: number;
  finReceivable: number;
  finReceived: number;
  finPayable: number;
  finPaid: number;
  monthlyMrr: { month: string; mrr: number; clients: number }[];
  filters?: { regime?: string; clientName?: string };
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function buildContabReportPdf(input: ContabReportInput): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const [pr, pg, pb] = hexToRgb(input.whiteLabel.primaryColor);

  // Header
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(input.whiteLabel.brandName, M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(input.whiteLabel.tagline, M, 56);
  doc.text(`Gerado em ${new Date(input.generatedAt).toLocaleString("pt-BR")}`, W - M, 56, { align: "right" });

  let y = 110;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório Gerencial — BI Contábil", M, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Período: ${input.periodLabel}`, M, y);
  y += 14;
  if (input.filters?.regime && input.filters.regime !== "all") {
    doc.text(`Regime: ${input.filters.regime}`, M, y); y += 14;
  }
  if (input.filters?.clientName) {
    doc.text(`Cliente: ${input.filters.clientName}`, M, y); y += 14;
  }
  y += 6;

  // Section: Resumo executivo
  drawSection(doc, M, y, W - 2 * M, "Resumo Executivo", pr, pg, pb);
  y += 28;
  const summary: [string, string][] = [
    ["MRR (honorários recorrentes)", BRL(input.mrr)],
    ["Clientes ativos", String(input.active)],
    ["Ticket médio", BRL(input.avgTicket)],
    ["Contratos assinados", String(input.contractsActive)],
  ];
  y = drawTable(doc, M, y, W - 2 * M, summary);
  y += 12;

  // MRR section
  drawSection(doc, M, y, W - 2 * M, "Evolução de MRR & Carteira", pr, pg, pb);
  y += 28;
  if (input.monthlyMrr.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text("Sem histórico no período.", M, y);
    y += 18;
  } else {
    const tail = input.monthlyMrr.slice(-6);
    const rows: [string, string][] = tail.map((m) => [m.month, `${m.clients} clientes · ${BRL(m.mrr)}`]);
    y = drawTable(doc, M, y, W - 2 * M, rows);
  }
  y += 10;
  drawSubheader(doc, M, y, "Composição por regime tributário");
  y += 16;
  const regimeRows: [string, string][] = Object.entries(input.byRegime)
    .sort((a, b) => b[1].mrr - a[1].mrr)
    .map(([k, v]) => [k, `${v.count} clientes · ${BRL(v.mrr)}`]);
  if (regimeRows.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text("Sem clientes ativos.", M, y);
    y += 18;
  } else {
    y = drawTable(doc, M, y, W - 2 * M, regimeRows);
  }
  y += 12;

  if (y > H - 220) { doc.addPage(); y = 60; }

  // Obrigações
  drawSection(doc, M, y, W - 2 * M, "Obrigações Fiscais", pr, pg, pb);
  y += 28;
  y = drawTable(doc, M, y, W - 2 * M, [
    ["Atrasadas", String(input.oblOverdue)],
    ["Próximos 30 dias", `${input.oblUpcoming30} (${BRL(input.oblValueUpcoming)})`],
    ["Documentos pendentes", String(input.docsPending)],
    ["Tarefas em aberto", `${input.tasksOpen}${input.tasksUrgent ? ` (${input.tasksUrgent} urgentes)` : ""}`],
  ]);
  y += 12;

  // IRPF
  drawSection(doc, M, y, W - 2 * M, "IRPF — Jornadas", pr, pg, pb);
  y += 28;
  y = drawTable(doc, M, y, W - 2 * M, [
    ["Em andamento", String(input.irpfInProgress)],
    ["Concluídas", String(input.irpfDone)],
    ["Honorários pendentes", BRL(input.irpfFeesPending)],
  ]);
  y += 12;

  if (y > H - 180) { doc.addPage(); y = 60; }

  // Financeiro
  drawSection(doc, M, y, W - 2 * M, "Fluxo Financeiro do Escritório", pr, pg, pb);
  y += 28;
  const saldo = input.finReceivable - input.finPayable;
  y = drawTable(doc, M, y, W - 2 * M, [
    ["A receber", BRL(input.finReceivable)],
    ["Recebido", BRL(input.finReceived)],
    ["A pagar", BRL(input.finPayable)],
    ["Pago", BRL(input.finPaid)],
    ["Saldo projetado", BRL(saldo)],
  ]);

  // Footer
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`${input.whiteLabel.brandName} · BI Contábil`, M, H - 20);
    doc.text(`Página ${p} de ${total}`, W - M, H - 20, { align: "right" });
  }

  return doc.output("blob");
}

function drawSection(doc: jsPDF, x: number, y: number, w: number, title: string, r: number, g: number, b: number) {
  doc.setFillColor(r, g, b);
  doc.rect(x, y, 4, 18, "F");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, x + 12, y + 14);
}

function drawSubheader(doc: jsPDF, x: number, y: number, title: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(title, x, y);
}

function drawTable(doc: jsPDF, x: number, y: number, w: number, rows: [string, string][]): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  let cy = y;
  for (let i = 0; i < rows.length; i++) {
    if (i % 2 === 0) {
      doc.setFillColor(247, 247, 250);
      doc.rect(x, cy - 12, w, 20, "F");
    }
    doc.text(rows[i][0], x + 8, cy + 2);
    doc.text(rows[i][1], x + w - 8, cy + 2, { align: "right" });
    cy += 20;
  }
  return cy + 2;
}
