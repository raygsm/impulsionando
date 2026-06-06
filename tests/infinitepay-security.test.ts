import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyInfinitePayWebhookSignature } from "@/lib/infinitepay.security";

const SECRET = "test-secret-1234567890";
const body = JSON.stringify({ order_nsu: "IMP-TEST-1", paid: true });
const sig = createHmac("sha256", SECRET).update(body, "utf8").digest("hex");

function H(h: Record<string, string>): Headers {
  const x = new Headers();
  for (const [k, v] of Object.entries(h)) x.set(k, v);
  return x;
}

describe("InfinitePay webhook signature", () => {
  it("fails closed when secret is not configured", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({ "x-signature": sig }), undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("secret_not_configured");
  });

  it("rejects when no signature header is present", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({}), SECRET);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("missing_signature");
  });

  it("rejects an invalid signature", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({ "x-signature": "deadbeef".repeat(8) }), SECRET);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_signature");
  });

  it("accepts a valid raw hex signature", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({ "x-signature": sig }), SECRET);
    expect(r.ok).toBe(true);
  });

  it("accepts a sha256=-prefixed signature", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({ "x-signature": `sha256=${sig}` }), SECRET);
    expect(r.ok).toBe(true);
  });

  it("accepts the x-infinitepay-signature header", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({ "x-infinitepay-signature": sig }), SECRET);
    expect(r.ok).toBe(true);
  });

  it("rejects when the body is tampered after signing", () => {
    const tampered = body + " ";
    const r = verifyInfinitePayWebhookSignature(tampered, H({ "x-signature": sig }), SECRET);
    expect(r.ok).toBe(false);
  });

  it("rejects when the secret differs", () => {
    const r = verifyInfinitePayWebhookSignature(body, H({ "x-signature": sig }), "other-secret-XYZ");
    expect(r.ok).toBe(false);
  });
});
