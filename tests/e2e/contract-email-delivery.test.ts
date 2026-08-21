/**
 * Core E2E — validação do pipeline compartilhado de e-mail contratual.
 *
 * O teste não depende de uma tabela legada de documentos. Ele exercita o
 * serviço compartilhado de comunicação, idempotência e `email_send_log` com
 * um identificador sintético de contrato.
 */
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { admin } from "../helpers";
import { sendContractEmail } from "@/lib/contracts-notify.server";

const RUN = Date.now();
const RECIPIENT = process.env.E2E_EMAIL_TO || `e2e-core-contract-${RUN}@mailinator.com`;
const docId = randomUUID();
const trackedMsgIds: string[] = [];

afterAll(async () => {
  if (trackedMsgIds.length) {
    await admin.from("email_send_log").delete().in("message_id", trackedMsgIds);
  }
});

async function waitForLog(messageId: string, ms = 8000): Promise<any | null> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const { data } = await admin
      .from("email_send_log")
      .select("id,status,message_id,error_message,template_name,recipient_email,metadata,created_at")
      .eq("message_id", messageId)
      .maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

describe("Core contract email delivery", () => {
  it("queues contract-generated and records email_send_log", async () => {
    const key = `contract-generated:${docId}:e2e:${RUN}`;
    const r = await sendContractEmail({
      templateName: "contract-generated",
      to: RECIPIENT,
      idempotencyKey: key,
      templateData: {
        signerName: "E2E Core",
        companyName: `E2E Core ${RUN}`,
        contractNumber: `E2E-${RUN}`,
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

  it("queues contract-signed and records email_send_log", async () => {
    const key = `contract-signed:${docId}:e2e:${RUN}`;
    const r = await sendContractEmail({
      templateName: "contract-signed",
      to: RECIPIENT,
      idempotencyKey: key,
      templateData: {
        signerName: "E2E Core",
        companyName: `E2E Core ${RUN}`,
        contractNumber: `E2E-${RUN}`,
        signedAt: new Date().toLocaleString("pt-BR"),
        signatureHash: "c".repeat(64),
        downloadUrl: `https://www.impulsionando.com.br/contrato/${docId}`,
      },
    });
    expect(["queued", "suppressed"]).toContain(r.status);
    expect(r.messageId).toBeTruthy();
    trackedMsgIds.push(r.messageId!);

    const row = await waitForLog(r.messageId!);
    expect(row).toBeTruthy();
    expect(row!.template_name).toBe("contract-signed");
  });

  it("resend uses a distinct idempotency key", async () => {
    const resendKey = `contract-generated:${docId}:resend:${Date.now()}`;
    const r = await sendContractEmail({
      templateName: "contract-generated",
      to: RECIPIENT,
      idempotencyKey: resendKey,
      templateData: {
        signerName: "E2E Core Resend",
        companyName: `E2E Core ${RUN}`,
        contractNumber: `E2E-${RUN}`,
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
    expect(row!.metadata?.idempotency_key).toBe(resendKey);
  });

  it("records at least three attempts for the synthetic contract", async () => {
    const { data, error } = await admin
      .from("email_send_log")
      .select("id,status,template_name,metadata")
      .eq("recipient_email", RECIPIENT.toLowerCase())
      .in("template_name", ["contract-generated", "contract-signed"])
      .order("created_at", { ascending: false })
      .limit(20);
    expect(error).toBeNull();
    const mine = (data ?? []).filter((r: any) =>
      String(r.metadata?.idempotency_key ?? "").includes(`:${docId}:`),
    );
    expect(mine.length).toBeGreaterThanOrEqual(3);
  });
});
