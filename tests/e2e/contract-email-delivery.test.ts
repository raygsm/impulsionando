/**
 * E2E — Validação real do envio de e-mails de contrato:
 *  - Insere documento de contrato + assinatura via service role
 *  - Enfileira "contract-generated" (envio real)
 *  - Enfileira "contract-signed" (envio real)
 *  - Reenvia com nova idempotency-key
 *  - Verifica linhas correspondentes em email_send_log (status pending/sent/suppressed)
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { admin, createCompany, deleteCompany } from "../helpers";
import { sendContractEmail } from "@/lib/contracts-notify.server";

const RUN = Date.now();
const RECIPIENT = process.env.E2E_EMAIL_TO || `e2e-contract-${RUN}@mailinator.com`;

let companyId = "";
let docId = "";
const trackedMsgIds: string[] = [];

beforeAll(async () => {
  companyId = await createCompany(`E2E Email Co ${RUN}`);
  const { data: doc, error } = await admin
    .from("contract_documents")
    .insert({
      company_id: companyId,
      contract_number: `E2E-EMAIL-${RUN}`,
      version: 1,
      storage_path: `${companyId}/E2E-EMAIL-${RUN}.pdf`,
      file_hash: "b".repeat(64),
      file_size_bytes: 32,
      snapshot: { plan: "Integrado", company_name: `E2E Co ${RUN}` },
      status: "sent",
    })
    .select("id")
    .single();
  if (error) throw error;
  docId = doc!.id;
});

afterAll(async () => {
  if (trackedMsgIds.length) {
    await admin.from("email_send_log").delete().in("message_id", trackedMsgIds);
  }
  if (docId) await admin.from("contract_documents").delete().eq("id", docId);
  if (companyId) await deleteCompany(companyId);
});

async function waitForLog(messageId: string, ms = 8000): Promise<any | null> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const { data } = await admin
      .from("email_send_log")
      .select("id, status, message_id, error_message, template_name, recipient_email, metadata, created_at")
      .eq("message_id", messageId)
      .maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

describe("Contract email delivery (E2E real)", () => {
  it("envia contract-generated e registra entrada no email_send_log", async () => {
    const key = `contract-generated:${docId}:e2e:${RUN}`;
    const r = await sendContractEmail({
      templateName: "contract-generated",
      to: RECIPIENT,
      idempotencyKey: key,
      templateData: {
        signerName: "E2E Tester",
        companyName: `E2E Co ${RUN}`,
        contractNumber: `E2E-EMAIL-${RUN}`,
        planName: "Integrado",
        monthly: "R$ 0,00",
        signUrl: `https://www.impulsionando.com.br/contrato/${docId}`,
      },
    });
    expect(["queued", "suppressed"]).toContain(r.status);
    expect(r.messageId).toBeTruthy();
    trackedMsgIds.push(r.messageId!);

    const row = await waitForLog(r.messageId!);
    expect(row).toBeTruthy();
    expect(row!.template_name).toBe("contract-generated");
    expect(row!.recipient_email.toLowerCase()).toBe(RECIPIENT.toLowerCase());
    expect(["pending", "sent", "suppressed", "failed", "dlq"]).toContain(row!.status);
  });

  it("envia contract-signed e registra entrada no email_send_log", async () => {
    const key = `contract-signed:${docId}:e2e:${RUN}`;
    const r = await sendContractEmail({
      templateName: "contract-signed",
      to: RECIPIENT,
      idempotencyKey: key,
      templateData: {
        signerName: "E2E Tester",
        companyName: `E2E Co ${RUN}`,
        contractNumber: `E2E-EMAIL-${RUN}`,
        signedAt: new Date().toLocaleString("pt-BR"),
        signatureHash: "c".repeat(64),
        downloadUrl: `https://www.impulsionando.com.br/contrato/${docId}`,
      },
    });
    expect(["queued", "suppressed"]).toContain(r.status);
    trackedMsgIds.push(r.messageId!);
    const row = await waitForLog(r.messageId!);
    expect(row).toBeTruthy();
    expect(row!.template_name).toBe("contract-signed");
  });

  it("reenvio gera nova idempotency-key e nova entrada de log", async () => {
    const resendKey = `contract-generated:${docId}:resend:${Date.now()}`;
    const r = await sendContractEmail({
      templateName: "contract-generated",
      to: RECIPIENT,
      idempotencyKey: resendKey,
      templateData: {
        signerName: "E2E Tester Resend",
        companyName: `E2E Co ${RUN}`,
        contractNumber: `E2E-EMAIL-${RUN}`,
        planName: "Integrado",
        monthly: "R$ 0,00",
        signUrl: `https://www.impulsionando.com.br/contrato/${docId}`,
      },
    });
    expect(["queued", "suppressed"]).toContain(r.status);
    trackedMsgIds.push(r.messageId!);
    const row = await waitForLog(r.messageId!);
    expect(row).toBeTruthy();
    expect(row!.metadata?.idempotency_key).toBe(resendKey);
  });

  it("histórico do log contém pelo menos 3 tentativas (2 originais + 1 reenvio) para este destinatário", async () => {
    const { data } = await admin
      .from("email_send_log")
      .select("id, status, template_name, metadata")
      .eq("recipient_email", RECIPIENT.toLowerCase())
      .in("template_name", ["contract-generated", "contract-signed"])
      .order("created_at", { ascending: false })
      .limit(20);
    const mine = (data ?? []).filter((r: any) =>
      String(r.metadata?.idempotency_key ?? "").includes(`:${docId}:`),
    );
    expect(mine.length).toBeGreaterThanOrEqual(3);
  });
});
