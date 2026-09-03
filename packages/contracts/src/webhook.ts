/**
 * Phase 5D — secure webhook boundary contracts (no Nest, no provider SDKs).
 * Secrets stay in env; this module only exports env var *names*.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const WEBHOOK_SCHEMA_VERSION = 1 as const;

/** Default replay / timestamp skew window (seconds). */
export const DEFAULT_WEBHOOK_REPLAY_WINDOW_SECONDS = 300;

/** Allowlisted providers — default-deny everything else. */
export const WEBHOOK_PROVIDERS = ["reengineering.smoke"] as const;
export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];

/**
 * Env var NAMES only — never values.
 * Operator sets these on staging/API; repo must not contain secrets.
 */
export const WEBHOOK_SECRET_ENV_NAMES = {
  "reengineering.smoke": "WEBHOOK_SECRET_REENGINEERING_SMOKE",
} as const satisfies Record<WebhookProvider, string>;

export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature" as const;
export const WEBHOOK_TIMESTAMP_HEADER = "x-webhook-timestamp" as const;
export const WEBHOOK_IDEMPOTENCY_HEADER = "x-webhook-idempotency-key" as const;

export const WebhookEnvelopeSchema = z.object({
  provider: z.string().min(1),
  schemaVersion: z.literal(WEBHOOK_SCHEMA_VERSION),
  eventId: z.string().min(1),
  correlationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  receivedAt: z.string().datetime(),
  /** Provider-issued unix timestamp (seconds) used for skew checks. */
  timestampSeconds: z.number().int().positive(),
  /** SHA-256 hex of raw body — never store secrets/raw PII blobs in logs. */
  payloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
  /** Redacted payload for durable audit (no raw secrets). */
  payloadRedacted: z.record(z.unknown()).optional(),
});
export type WebhookEnvelope = z.infer<typeof WebhookEnvelopeSchema>;

export type WebhookVerifyFailureReason =
  | "UNKNOWN_PROVIDER"
  | "MISSING_SIGNATURE"
  | "MISSING_TIMESTAMP"
  | "MISSING_IDEMPOTENCY_KEY"
  | "INVALID_TIMESTAMP"
  | "STALE_TIMESTAMP"
  | "SIGNATURE_MISMATCH"
  | "REPLAY_DUPLICATE"
  | "SCHEMA_INVALID";

export type WebhookVerifyResult =
  | { ok: true; provider: WebhookProvider; signedPayload: string }
  | { ok: false; reason: WebhookVerifyFailureReason };

const REDACT_KEY_RE =
  /^(authorization|password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|credential|webhook[_-]?secret)$/i;

export function isKnownWebhookProvider(provider: string): provider is WebhookProvider {
  return (WEBHOOK_PROVIDERS as readonly string[]).includes(provider);
}

/** Resolve env var *name* for a provider; null if default-deny. */
export function resolveWebhookSecretEnvName(provider: string): string | null {
  if (!isKnownWebhookProvider(provider)) return null;
  return WEBHOOK_SECRET_ENV_NAMES[provider];
}

export function webhookIdempotencyScopeKey(provider: string, idempotencyKey: string): string {
  return `${provider}:${idempotencyKey}`;
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Canonical signing string: `${timestampSeconds}.${rawBody}`. */
export function buildWebhookSignedPayload(timestampSeconds: number | string, rawBody: string): string {
  return `${timestampSeconds}.${rawBody}`;
}

/** HMAC-SHA256 hex digest (no prefix). */
export function computeWebhookHmacHex(secret: string, signedPayload: string): string {
  return createHmac("sha256", secret).update(signedPayload).digest("hex");
}

/**
 * Timing-safe compare of two hex digests (or equal-length utf8 strings).
 * Returns false on length mismatch without throwing.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Accept `sha256=<hex>` or bare hex. */
export function normalizeWebhookSignatureHeader(header: string): string {
  const trimmed = header.trim();
  const m = /^sha256=(.+)$/i.exec(trimmed);
  return (m ? m[1] : trimmed).toLowerCase();
}

export function isTimestampWithinSkew(input: {
  timestampSeconds: number;
  nowMs?: number;
  windowSeconds?: number;
}): boolean {
  const nowMs = input.nowMs ?? Date.now();
  const windowSeconds = input.windowSeconds ?? DEFAULT_WEBHOOK_REPLAY_WINDOW_SECONDS;
  if (!Number.isFinite(input.timestampSeconds) || input.timestampSeconds <= 0) return false;
  const skewMs = Math.abs(nowMs - input.timestampSeconds * 1000);
  return skewMs <= windowSeconds * 1000;
}

export function shouldRejectReplay(alreadySeen: boolean): boolean {
  return alreadySeen;
}

/**
 * Deep-redact common secret keys. Used before logs / durable audit payload.
 * Never log the raw body.
 */
export function redactWebhookPayload(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.map((v) => redactWebhookPayload(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEY_RE.test(k) ? "[REDACTED]" : redactWebhookPayload(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function redactWebhookPayloadRecord(value: unknown): Record<string, unknown> {
  const redacted = redactWebhookPayload(value);
  if (redacted && typeof redacted === "object" && !Array.isArray(redacted)) {
    return redacted as Record<string, unknown>;
  }
  return { value: redacted };
}

/**
 * Full ingress verification (signature + skew). Replay is a separate check
 * against durable store / in-memory set via `shouldRejectReplay`.
 */
export function verifyWebhookIngress(input: {
  provider: string;
  rawBody: string;
  signatureHeader: string | undefined;
  timestampHeader: string | undefined;
  idempotencyKey: string | undefined;
  /** Secret value resolved by caller from env — never hardcode. */
  secret: string | undefined;
  nowMs?: number;
  windowSeconds?: number;
}): WebhookVerifyResult {
  if (!isKnownWebhookProvider(input.provider)) {
    return { ok: false, reason: "UNKNOWN_PROVIDER" };
  }
  if (!input.idempotencyKey?.trim()) {
    return { ok: false, reason: "MISSING_IDEMPOTENCY_KEY" };
  }
  if (!input.signatureHeader?.trim()) {
    return { ok: false, reason: "MISSING_SIGNATURE" };
  }
  if (!input.timestampHeader?.trim()) {
    return { ok: false, reason: "MISSING_TIMESTAMP" };
  }

  const timestampSeconds = Number(input.timestampHeader);
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) {
    return { ok: false, reason: "INVALID_TIMESTAMP" };
  }

  if (
    !isTimestampWithinSkew({
      timestampSeconds,
      nowMs: input.nowMs,
      windowSeconds: input.windowSeconds,
    })
  ) {
    return { ok: false, reason: "STALE_TIMESTAMP" };
  }

  if (!input.secret) {
    // Treat missing configured secret as signature failure (default-deny).
    return { ok: false, reason: "SIGNATURE_MISMATCH" };
  }

  const signedPayload = buildWebhookSignedPayload(timestampSeconds, input.rawBody);
  const expected = computeWebhookHmacHex(input.secret, signedPayload);
  const provided = normalizeWebhookSignatureHeader(input.signatureHeader);

  if (!timingSafeEqualString(expected, provided)) {
    return { ok: false, reason: "SIGNATURE_MISMATCH" };
  }

  return { ok: true, provider: input.provider, signedPayload };
}
