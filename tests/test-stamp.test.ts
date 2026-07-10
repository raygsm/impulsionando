import { describe, it, expect } from "vitest";
import {
  applyTestStamp,
  isTestStampContext,
  TEST_STAMP,
  TEST_STAMP_LABEL,
} from "@/lib/test-stamp";

describe("test-stamp (P6.8-C)", () => {
  it("aplica selo em email de demo", () => {
    const { body, subject } = applyTestStamp("email", "Olá, seu teste começou.", {
      subject: "Bem-vindo",
    });
    expect(body).toContain(TEST_STAMP);
    expect(body).toContain("ambiente de TESTE IMPULSIONANDO");
    expect(subject).toContain(TEST_STAMP_LABEL);
  });

  it("é idempotente — aplicar 2x não duplica", () => {
    const once = applyTestStamp("whatsapp", "mensagem").body;
    const twice = applyTestStamp("whatsapp", once).body;
    expect(twice).toBe(once);
  });

  it("não estampar cliente pago", () => {
    expect(
      isTestStampContext({ channel: "email", isPaidClient: true, isDemo: true }),
    ).toBe(false);
  });

  it("bypass contas master", () => {
    expect(
      isTestStampContext({
        channel: "email",
        recipientEmail: "raygs@hotmail.com",
        isDemo: true,
      }),
    ).toBe(false);
    expect(
      isTestStampContext({
        channel: "email",
        recipientEmail: "RAYGSMONNERAT@gmail.com",
        isDemo: true,
      }),
    ).toBe(false);
  });

  it("estampar lead de demo comum", () => {
    expect(
      isTestStampContext({
        channel: "email",
        recipientEmail: "novo@lead.com",
        isDemo: true,
      }),
    ).toBe(true);
  });
});
