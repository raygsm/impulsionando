import { describe, it, expect } from "vitest";
import { validateMarketingLead, normalizePhone } from "@/lib/marketing-lead.schema";

describe("validateMarketingLead", () => {
  it("aceita lead com email válido", () => {
    const r = validateMarketingLead({ email: "joao@empresa.com.br", interest: "Tráfego pago" });
    expect(r.email).toBe("joao@empresa.com.br");
    expect(r.interest).toBe("Tráfego pago");
  });

  it("aceita lead apenas com telefone", () => {
    const r = validateMarketingLead({ phone: "(21) 99307-5000" });
    expect(r.phone).toBe("(21) 99307-5000");
  });

  it("aceita lead apenas com nome", () => {
    const r = validateMarketingLead({ name: "Maria" });
    expect(r.name).toBe("Maria");
  });

  it("normaliza email para lowercase", () => {
    const r = validateMarketingLead({ email: "JOAO@EMPRESA.COM" });
    expect(r.email).toBe("joao@empresa.com");
  });

  it("rejeita lead sem qualquer contato", () => {
    expect(() => validateMarketingLead({ message: "oi" })).toThrow(/nome, email ou telefone/i);
  });

  it("rejeita email inválido", () => {
    expect(() => validateMarketingLead({ email: "naoehemail" })).toThrow();
  });

  it("rejeita telefone com letras", () => {
    expect(() => validateMarketingLead({ phone: "ligue-aqui" })).toThrow();
  });

  it("rejeita message acima de 5000 chars", () => {
    expect(() => validateMarketingLead({ name: "x", message: "a".repeat(5001) })).toThrow();
  });

  it("rejeita name acima de 200 chars", () => {
    expect(() => validateMarketingLead({ name: "a".repeat(201) })).toThrow();
  });
});

describe("normalizePhone", () => {
  it("celular BR 11 dígitos -> +55", () => {
    expect(normalizePhone("(21) 99307-5000")).toBe("+5521993075000");
  });
  it("fixo BR 10 dígitos -> +55", () => {
    expect(normalizePhone("21 3333-4444")).toBe("+552133334444");
  });
  it("já com 55 -> mantém", () => {
    expect(normalizePhone("5521993075000")).toBe("+5521993075000");
  });
  it("null/empty -> null", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
});
