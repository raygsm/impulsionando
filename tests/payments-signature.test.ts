/**
 * Testes unitários do verificador de assinatura HMAC e da função
 * `computeEventId` usada para idempotência.
 */
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifySignature } from "../src/routes/api/public/payments/close-invoice";
import { computeEventId } from "../src/lib/webhook-idempotency.server";

const SECRET = "abc-123-test-secret";
const body = JSON.stringify({ kind: "consumer", invoice_id: "00000000-0000-0000-0000-000000000001", status: "paid" });
const validSig = createHmac("sha256", SECRET).update(body).digest("hex");

describe("verifySignature", () => {
  it("accepts a correct signature", () => {
    expect(verifySignature(body, validSig, SECRET)).toBe(true);
  });
  it("accepts the sha256= prefixed form", () => {
    expect(verifySignature(body, `sha256=${validSig}`, SECRET)).toBe(true);
  });
  it("rejects null/empty/wrong-length", () => {
    expect(verifySignature(body, null, SECRET)).toBe(false);
    expect(verifySignature(body, "", SECRET)).toBe(false);
    expect(verifySignature(body, "abc", SECRET)).toBe(false);
  });
  it("rejects a tampered body", () => {
    expect(verifySignature(body + "x", validSig, SECRET)).toBe(false);
  });
  it("rejects a wrong secret", () => {
    expect(verifySignature(body, validSig, "other-secret")).toBe(false);
  });
});

describe("computeEventId", () => {
  it("uses the header value when present", () => {
    expect(computeEventId(body, "evt-42")).toBe("evt-42");
  });
  it("falls back to a deterministic body hash", () => {
    const a = computeEventId(body, null);
    const b = computeEventId(body, undefined);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  it("ignores absurdly long header values", () => {
    const longHeader = "x".repeat(500);
    const id = computeEventId(body, longHeader);
    expect(id).not.toBe(longHeader);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });
});
