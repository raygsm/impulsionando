import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("billing and Mercado Pago guardrails", () => {
  it("keeps Mercado Pago as the official payment gateway with payout events", () => {
    const createPayment = readRepoFile("supabase/functions/mpago-create-payment/index.ts");
    const webhook = readRepoFile("supabase/functions/mpago-webhook/index.ts");
    const audit = readRepoFile("docs/CORE-AUDIT.md");

    expect(createPayment).toContain("Mercado Pago");
    expect(createPayment).toContain("application_fee");
    expect(createPayment).toContain("core_payout_events");
    expect(createPayment).toContain("provider: 'mercadopago'");
    expect(webhook).toContain("core_payout_events");
    expect(audit).toContain("Mercado Pago ja e o gateway oficial do Core");
    expect(audit).not.toContain("gateway ativo é InfinitePay");
  });

  it("keeps billing contracts and dunning policy as the recurring billing source of truth", () => {
    const billing = readRepoFile("src/lib/billing.functions.ts");

    expect(billing).toContain("billing_contracts");
    expect(billing).toContain("billing_invoices");
    expect(billing).toContain("billing_dunning_policy");
    expect(billing).toContain("sendInvoiceReminderNow");
  });

  it("does not hardcode the Pix fallback WhatsApp number in code", () => {
    const fallback = readRepoFile("src/lib/payment-fallback.ts");
    const dialog = readRepoFile("src/components/payments/PixFallbackDialog.tsx");
    const checkout = readRepoFile("src/components/payments/PixCheckoutCard.tsx");
    const quote = readRepoFile("src/routes/orcamento.tsx");
    const envExample = readRepoFile(".env.example");

    expect(fallback).toContain("VITE_IMPULSIONANDO_SUPPORT_WHATSAPP");
    expect(fallback).toContain("buildWhatsappUrl");
    expect(envExample).toContain("VITE_IMPULSIONANDO_SUPPORT_WHATSAPP=");
    expect(dialog).not.toContain("5521972554500");
    expect(checkout).not.toContain("5521972554500");
    expect(quote).not.toContain("5521972554500");
  });
});
