/**
 * Core E2E — validação da etapa compartilhada contrato -> message_outbox.
 *
 * A entrega externa é validada separadamente no go-live `communication_send`.
 * Este teste prova persistência, idempotência e payload transacional da fila Core.
 */
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { admin } from "../helpers";
import { sendContractEmail } from "@/lib/contracts-notify.server";

const RUN = Date.now();
const RECIPIENT = `e2e-core-contract-${RUN}@example.com`;
const docId = randomUUID();
const trackedIds: string[] = [];

async function readOutbox(id: string) {
  const { data, error } = await admin
    .from("message_outbox")
    .select("id,event_code,channel,recipient_email,subject,body,payload,status,idempotency_key,reference_type,reference_id")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

afterAll(async () => {
  if (trackedIds.length) await admin.from("message_outbox").delete().in("id", trackedIds);
});

describe("Core contract email queue", () => {
  it("queues contract-generated in canonical message_outbox", async () => {
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
    expect(r.status).toBe("queued");
    expect(r.messageId).toBeTruthy();
    trackedIds.push(r.messageId!);

    const row = await readOutbox(r.messageId!);
    expect(row.event_code).toBe("contracts.contract-generated");
    expect(row.channel).toBe("email");
    expect(row.recipient_email).toBe(RECIPIENT);
    expect(row.status).toBe("queued");
    expect(row.idempotency_key).toBe(key);
    expect(row.payload?.purpose).toBe("transactional");
    expect(row.payload?.template_name).toBe("contract-generated");
  });

  it("queues contract-signed in canonical message_outbox", async () => {
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
    expect(r.status).toBe("queued");
    expect(r.messageId).toBeTruthy();
    trackedIds.push(r.messageId!);

    const row = await readOutbox(r.messageId!);
    expect(row.event_code).toBe("contracts.contract-signed");
    expect(row.payload?.template_name).toBe("contract-signed");
  });

  it("repeated idempotency key returns the same outbox row", async () => {
    const key = `contract-generated:${docId}:idempotent:${RUN}`;
    const args = {
      templateName: "contract-generated" as const,
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
    };
    const first = await sendContractEmail(args);
    const second = await sendContractEmail(args);
    expect(first.status).toBe("queued");
    expect(second.status).toBe("queued");
    expect(second.messageId).toBe(first.messageId);
    trackedIds.push(first.messageId!);

    const { count, error } = await admin
      .from("message_outbox")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", key);
    expect(error).toBeNull();
    expect(count).toBe(1);
  });
});
