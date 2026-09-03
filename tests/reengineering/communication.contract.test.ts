import { describe, expect, it } from "vitest";
import {
  COMMUNICATION_DISPATCH_JOB_TYPE,
  COMMUNICATION_ENV_NAMES,
  COMMUNICATION_SCHEMA_VERSION,
  CommunicationIntentSchema,
  DeliveryStatus,
  evaluateCommunicationPolicy,
  isRecipientAllowlisted,
  mapProviderFailure,
  parseRecipientAllowlist,
  runCommunicationDispatch,
  type CommunicationAdapter,
  type CommunicationIntent,
} from "@impulsionando/contracts";

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INTENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function baseIntent(overrides: Partial<CommunicationIntent> = {}): CommunicationIntent {
  return {
    intentId: INTENT_ID,
    schemaVersion: COMMUNICATION_SCHEMA_VERSION,
    tenantId: TENANT_ID,
    correlationId: "corr-comm-1",
    channel: "email",
    template: { templateId: "invite.day0", version: 1, brandKey: "impulsionando", locale: "pt-BR" },
    recipient: { address: "allowed@example.test" },
    consent: { granted: true, optedOut: false },
    idempotencyKey: "idem-comm-1",
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

const sinkAdapter: CommunicationAdapter = {
  channel: "email",
  async send({ deliveryId }) {
    return {
      ok: true,
      provider: "sink",
      providerMessageId: `sink:email:${deliveryId}`,
      status: DeliveryStatus.Delivered,
    };
  },
};

describe("Phase 5E — communication contract", () => {
  it("CM-01: validates CommunicationIntent v1", () => {
    const parsed = CommunicationIntentSchema.safeParse(baseIntent());
    expect(parsed.success).toBe(true);
    expect(COMMUNICATION_DISPATCH_JOB_TYPE).toBe("communication.dispatch");
    expect(COMMUNICATION_ENV_NAMES.SINK).toBe("COMMUNICATION_SINK");
  });

  it("CM-02: allowlist deny by default", () => {
    expect(isRecipientAllowlisted("anyone@example.test", undefined)).toBe(false);
    expect(isRecipientAllowlisted("anyone@example.test", [])).toBe(false);
    expect(parseRecipientAllowlist(undefined)).toEqual([]);
    expect(parseRecipientAllowlist("")).toEqual([]);

    const decision = evaluateCommunicationPolicy({
      intent: baseIntent(),
      allowlist: [],
    });
    expect(decision.allow).toBe(false);
    if (!decision.allow) {
      expect(decision.reason).toBe("ALLOWLIST_DENIED");
      expect(decision.status).toBe(DeliveryStatus.AllowlistDenied);
    }
  });

  it("CM-03: cooldown skip", () => {
    const nowMs = Date.parse("2026-09-02T12:00:00.000Z");
    const decision = evaluateCommunicationPolicy({
      intent: baseIntent({
        cooldown: {
          key: "invite.day0:allowed@example.test",
          windowSeconds: 3600,
          lastSentAt: "2026-09-02T11:30:00.000Z",
        },
      }),
      allowlist: ["allowed@example.test"],
      nowMs,
    });
    expect(decision.allow).toBe(false);
    if (!decision.allow) {
      expect(decision.reason).toBe("COOLDOWN");
      expect(decision.status).toBe(DeliveryStatus.CooldownSkipped);
    }
  });

  it("CM-04: dedup skip", () => {
    const decision = evaluateCommunicationPolicy({
      intent: baseIntent({ dedupKey: "invite:contact-1" }),
      allowlist: ["allowed@example.test"],
      recentDedupKeys: new Set(["invite:contact-1"]),
    });
    expect(decision.allow).toBe(false);
    if (!decision.allow) {
      expect(decision.reason).toBe("DEDUP");
      expect(decision.status).toBe(DeliveryStatus.DedupSkipped);
    }
  });

  it("CM-05: sink adapter success when allowlisted", async () => {
    const outcome = await runCommunicationDispatch({
      intent: baseIntent(),
      adapter: sinkAdapter,
      deliveryId: INTENT_ID,
      allowlist: ["allowed@example.test"],
    });
    expect(outcome.decision.allow).toBe(true);
    expect(outcome.result?.ok).toBe(true);
    expect(outcome.result?.provider).toBe("sink");
    expect(outcome.result?.status).toBe(DeliveryStatus.Delivered);
  });

  it("CM-06: opt-out and provider failure mapping", () => {
    const optedOut = evaluateCommunicationPolicy({
      intent: baseIntent({
        consent: { granted: true, optedOut: true },
      }),
      allowlist: ["allowed@example.test"],
    });
    expect(optedOut.allow).toBe(false);
    if (!optedOut.allow) expect(optedOut.reason).toBe("OPT_OUT");

    const mapped = mapProviderFailure(new Error("provider rate limit 429"));
    expect(mapped.errorCode).toBe("PROVIDER_RATE_LIMIT");
    expect(mapped.retryable).toBe(true);
  });
});
