import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEBHOOK_REPLAY_WINDOW_SECONDS,
  WEBHOOK_PROVIDERS,
  WEBHOOK_SCHEMA_VERSION,
  WEBHOOK_SECRET_ENV_NAMES,
  WebhookEnvelopeSchema,
  buildWebhookSignedPayload,
  computeWebhookHmacHex,
  isKnownWebhookProvider,
  isTimestampWithinSkew,
  redactWebhookPayloadRecord,
  resolveWebhookSecretEnvName,
  sha256Hex,
  shouldRejectReplay,
  verifyWebhookIngress,
  webhookIdempotencyScopeKey,
} from "@impulsionando/contracts";

const SECRET = "phase5d-contract-test-secret-not-for-prod";
const PROVIDER = "reengineering.smoke";

function sign(rawBody: string, timestampSeconds: number, secret = SECRET) {
  const signedPayload = buildWebhookSignedPayload(timestampSeconds, rawBody);
  return computeWebhookHmacHex(secret, signedPayload);
}

describe("Phase 5D — webhook contract", () => {
  it("WH-01: validates WebhookEnvelope v1", () => {
    const rawBody = JSON.stringify({ event: "smoke" });
    const parsed = WebhookEnvelopeSchema.safeParse({
      provider: PROVIDER,
      schemaVersion: WEBHOOK_SCHEMA_VERSION,
      eventId: "evt-1",
      correlationId: "corr-1",
      idempotencyKey: "idem-1",
      receivedAt: new Date().toISOString(),
      timestampSeconds: Math.floor(Date.now() / 1000),
      payloadSha256: sha256Hex(rawBody),
      payloadRedacted: { event: "smoke" },
    });
    expect(parsed.success).toBe(true);
  });

  it("WH-02: valid signature allow", () => {
    const rawBody = JSON.stringify({ event: "smoke", token: "should-redact-elsewhere" });
    const ts = Math.floor(Date.now() / 1000);
    const result = verifyWebhookIngress({
      provider: PROVIDER,
      rawBody,
      signatureHeader: `sha256=${sign(rawBody, ts)}`,
      timestampHeader: String(ts),
      idempotencyKey: "idem-valid",
      secret: SECRET,
    });
    expect(result.ok).toBe(true);
  });

  it("WH-03: bad signature deny", () => {
    const rawBody = JSON.stringify({ event: "smoke" });
    const ts = Math.floor(Date.now() / 1000);
    const result = verifyWebhookIngress({
      provider: PROVIDER,
      rawBody,
      signatureHeader: "sha256=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      timestampHeader: String(ts),
      idempotencyKey: "idem-bad-sig",
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("SIGNATURE_MISMATCH");
  });

  it("WH-04: replay duplicate deny", () => {
    const seen = new Set<string>();
    const key = webhookIdempotencyScopeKey(PROVIDER, "idem-replay");
    expect(shouldRejectReplay(seen.has(key))).toBe(false);
    seen.add(key);
    expect(shouldRejectReplay(seen.has(key))).toBe(true);
  });

  it("WH-05: stale timestamp deny", () => {
    const rawBody = JSON.stringify({ event: "smoke" });
    const staleTs =
      Math.floor(Date.now() / 1000) - (DEFAULT_WEBHOOK_REPLAY_WINDOW_SECONDS + 60);
    const result = verifyWebhookIngress({
      provider: PROVIDER,
      rawBody,
      signatureHeader: `sha256=${sign(rawBody, staleTs)}`,
      timestampHeader: String(staleTs),
      idempotencyKey: "idem-stale",
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("STALE_TIMESTAMP");
    expect(
      isTimestampWithinSkew({
        timestampSeconds: staleTs,
        windowSeconds: DEFAULT_WEBHOOK_REPLAY_WINDOW_SECONDS,
      }),
    ).toBe(false);
  });

  it("WH-06: default-deny unknown provider", () => {
    const rawBody = "{}";
    const ts = Math.floor(Date.now() / 1000);
    const result = verifyWebhookIngress({
      provider: "unknown.provider",
      rawBody,
      signatureHeader: `sha256=${sign(rawBody, ts)}`,
      timestampHeader: String(ts),
      idempotencyKey: "idem-unknown",
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNKNOWN_PROVIDER");
    expect(isKnownWebhookProvider("unknown.provider")).toBe(false);
    expect(resolveWebhookSecretEnvName("unknown.provider")).toBeNull();
  });

  it("WH-07: env names only + redaction", () => {
    expect(WEBHOOK_PROVIDERS).toContain(PROVIDER);
    expect(WEBHOOK_SECRET_ENV_NAMES[PROVIDER]).toBe("WEBHOOK_SECRET_REENGINEERING_SMOKE");
    const redacted = redactWebhookPayloadRecord({
      event: "ok",
      token: "super-secret",
      nested: { api_key: "x", keep: 1 },
    });
    expect(redacted.token).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).api_key).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).keep).toBe(1);
  });
});
