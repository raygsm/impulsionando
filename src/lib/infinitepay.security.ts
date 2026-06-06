// Server-only security helpers for InfinitePay webhooks.
// Pure functions (no DB / no fetch) so they can be unit-tested.
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Header names commonly used by payment providers. We accept any of them so
 * the webhook keeps working if InfinitePay decides to standardize a name.
 */
export const INFINITEPAY_SIGNATURE_HEADERS = [
  "x-infinitepay-signature",
  "x-signature",
  "signature",
  "x-webhook-signature",
  "x-hub-signature-256",
] as const;

export type SignatureVerification =
  | { ok: true }
  | { ok: false; reason: "secret_not_configured" | "missing_signature" | "invalid_signature" };

function pickSignature(headers: Headers): string | null {
  for (const name of INFINITEPAY_SIGNATURE_HEADERS) {
    const v = headers.get(name);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Strip optional `sha256=` / `hmac-sha256=` prefixes from provider headers.
 */
function normalize(sig: string): string {
  return sig.replace(/^sha256=/i, "").replace(/^hmac-sha256=/i, "").trim().toLowerCase();
}

/**
 * Constant-time HMAC SHA-256 comparison. Returns a typed result so the
 * caller can distinguish misconfiguration (500) from rejection (401).
 *
 * SECURITY: Fails closed. If INFINITEPAY_WEBHOOK_SECRET is not set, NO
 * webhook is accepted — the worker must be misconfigured.
 */
export function verifyInfinitePayWebhookSignature(
  rawBody: string,
  headers: Headers,
  secret: string | undefined,
): SignatureVerification {
  if (!secret || secret.length < 8) {
    return { ok: false, reason: "secret_not_configured" };
  }
  const provided = pickSignature(headers);
  if (!provided) return { ok: false, reason: "missing_signature" };

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(normalize(provided), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return { ok: false, reason: "invalid_signature" };
  try {
    return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: "invalid_signature" };
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
}
