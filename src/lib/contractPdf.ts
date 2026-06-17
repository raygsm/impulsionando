// Geração de PDF de contrato (cliente) com upload para o bucket `contracts`
// e registro de metadados em contract_documents.
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export type ContractInput = {
  company_id: string;
  company_name: string;
  company_doc?: string;            // CNPJ
  white_label_id?: string | null;
  billing_contract_id?: string | null;
  contract_number: string;
  plan_name: string;
  modules: Array<{ name: string; included?: boolean; price_brl?: number }>;
  monthly_brl: number;
  setup_brl: number;
  cycle: "mensal" | "anual";
  minimum_term_days?: number;
  signer_name?: string;
  signer_email?: string;
  version?: number;
};

export type SignatureStamp = {
  signer_name: string;
  signer_email: string;
  signer_doc?: string;
  signed_at: string;          // ISO
  signature_hash: string;     // sha256 hex
  original_file_hash: string; // sha256 hex
  ip_address?: string;
  user_agent?: string;
};

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export function buildContractPdfBytes(c: ContractInput, stamp?: SignatureStamp): { bytes: Uint8Array; pageCount: number } {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.text("Contrato de Prestação de Serviços de Software (SaaS)", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90, 90, 90);
  doc.text(`Contrato nº ${c.contract_number} · Emitido em ${new Date().toLocaleDateString("pt-BR")}`, margin, y);
  y += 20;
  doc.setTextColor(0, 0, 0);

  const block = (title: string) => {
    doc.setFont("helvetica", "bold").setFontSize(11);
    doc.text(title, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal").setFontSize(10);
  };

  block("Contratante");
  doc.text(`Razão social: ${c.company_name}`, margin, y); y += 14;
  if (c.company_doc) { doc.text(`CNPJ: ${c.company_doc}`, margin, y); y += 14; }
  y += 6;

  block("Contratada");
  doc.text("Impulsionando Tecnologia Ltda.", margin, y); y += 14;
  doc.text("Plataforma SaaS multinicho — Núcleo Impulsionando", margin, y); y += 20;

  block("Objeto e Plano contratado");
  doc.text(`Plano: ${c.plan_name}`, margin, y); y += 14;
  doc.text(`Ciclo: ${c.cycle === "anual" ? "Anual (paga 10, usa 12)" : "Mensal"}`, margin, y); y += 14;
  doc.text(`Mensalidade: ${BRL(c.monthly_brl)}`, margin, y); y += 14;
  doc.text(`Setup / implantação (1ª parcela): ${BRL(c.setup_brl)}`, margin, y); y += 14;
  doc.text(`Prazo mínimo: ${c.minimum_term_days ?? 90} dias`, margin, y); y += 20;

  block("Módulos inclusos");
  c.modules.forEach((m) => {
    const label = `• ${m.name}${m.included === false ? " (extra · " + BRL(m.price_brl ?? 0) + "/mês)" : ""}`;
    const lines = doc.splitTextToSize(label, pageW - margin * 2);
    lines.forEach((ln: string) => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y); y += 14;
    });
  });
  y += 6;

  block("Cláusulas essenciais");
  const clauses = [
    "1. A Contratada concede licença não exclusiva de uso da plataforma SaaS pelo prazo deste contrato.",
    "2. Pagamentos via PIX, cartão de crédito ou boleto, conforme parametrização da Contratante.",
    "3. Reembolsos serão efetuados exclusivamente ao mesmo titular do pagamento original (mesmo CPF/CNPJ).",
    "4. Cancelamento após o prazo mínimo é livre, sem multa, mediante aviso prévio de 30 dias.",
    "5. Dados pessoais tratados conforme LGPD; titulares podem solicitar exportação ou exclusão.",
    "6. Foro: Comarca da sede da Contratada, salvo eleição diversa por aditivo.",
  ];
  clauses.forEach((cl) => {
    const lines = doc.splitTextToSize(cl, pageW - margin * 2);
    lines.forEach((ln: string) => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y); y += 13;
    });
    y += 4;
  });

  y += 10;
  block("Assinatura eletrônica");
  doc.text(
    "Este contrato é assinado eletronicamente. A confirmação registra responsável, data/hora, IP, navegador e hash de integridade do documento.",
    margin, y, { maxWidth: pageW - margin * 2 } as never,
  );
  y += 40;
  if (c.signer_name)  { doc.text(`Responsável: ${c.signer_name}`, margin, y); y += 14; }
  if (c.signer_email) { doc.text(`E-mail: ${c.signer_email}`, margin, y); y += 14; }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(140, 140, 140);
    doc.text(`Página ${i} de ${pageCount} · Impulsionando Tecnologia`, margin, 820);
  }

  const arrayBuf = doc.output("arraybuffer");
  return { bytes: new Uint8Array(arrayBuf), pageCount };
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}


/** Gera o PDF, faz upload no bucket "contracts" e retorna metadados para criar a linha em contract_documents. */
export async function generateAndUploadContract(c: ContractInput) {
  const { bytes } = buildContractPdfBytes(c);
  const file_hash = await sha256Hex(bytes);
  const storage_path = `${c.company_id}/${c.contract_number}-${file_hash.slice(0, 10)}.pdf`;
  const { error } = await supabase.storage.from("contracts").upload(storage_path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
  return {
    storage_path,
    file_hash,
    file_size_bytes: bytes.byteLength,
    snapshot: {
      company_name: c.company_name,
      company_doc: c.company_doc,
      plan: c.plan_name,
      cycle: c.cycle,
      monthly_brl: c.monthly_brl,
      setup_brl: c.setup_brl,
      modules: c.modules,
      minimum_term_days: c.minimum_term_days ?? 90,
    },
  };
}
