/**
 * Phase 5E — communication intent, policy, delivery, and adapter interfaces.
 * Env var *names* only — never values. No provider SDKs; sink/noop at the edge.
 */
import { z } from "zod";

export const COMMUNICATION_SCHEMA_VERSION = 1 as const;
export const COMMUNICATION_DISPATCH_JOB_TYPE = "communication.dispatch" as const;
export const REENGINEERING_COMMUNICATION_DELIVERY_TABLE =
  "reengineering_communication_delivery" as const;

/**
 * Env var NAMES only — never values.
 * Operator sets these on staging/worker; repo must not contain secrets or real recipients.
 */
export const COMMUNICATION_ENV_NAMES = {
  /** When "true", adapters use sink/noop provider (no network send). */
  SINK: "COMMUNICATION_SINK",
  /** Comma-separated recipient allowlist; empty / unset = default deny. */
  RECIPIENT_ALLOWLIST: "COMMUNICATION_RECIPIENT_ALLOWLIST",
  /** Worker flag — default off so 5B job consumer behavior is unchanged. */
  WORKER_ENABLED: "WORKER_COMMUNICATION_ENABLED",
} as const;

export const CommunicationChannel = {
  Email: "email",
  WhatsApp: "whatsapp",
} as const;

export const CommunicationChannelSchema = z.enum(["email", "whatsapp"]);
export type CommunicationChannelName = z.infer<typeof CommunicationChannelSchema>;

export const DeliveryStatus = {
  Pending: "pending",
  Queued: "queued",
  Sending: "sending",
  Delivered: "delivered",
  Failed: "failed",
  OptedOut: "opted_out",
  NoConsent: "no_consent",
  CooldownSkipped: "cooldown_skipped",
  DedupSkipped: "dedup_skipped",
  AllowlistDenied: "allowlist_denied",
} as const;

export const DeliveryStatusSchema = z.enum([
  "pending",
  "queued",
  "sending",
  "delivered",
  "failed",
  "opted_out",
  "no_consent",
  "cooldown_skipped",
  "dedup_skipped",
  "allowlist_denied",
]);
export type DeliveryStatusName = z.infer<typeof DeliveryStatusSchema>;

/** Tenant-branded versioned template reference. */
export const CommunicationTemplateRefSchema = z.object({
  templateId: z.string().min(1),
  version: z.number().int().positive(),
  locale: z.string().min(2).optional(),
  /** Tenant brand key for template selection (e.g. subdomain / brand slug). */
  brandKey: z.string().min(1).optional(),
});
export type CommunicationTemplateRef = z.infer<typeof CommunicationTemplateRefSchema>;

export const CommunicationConsentSchema = z.object({
  granted: z.boolean(),
  optedOut: z.boolean().default(false),
  source: z.string().min(1).optional(),
  recordedAt: z.string().datetime().optional(),
});
export type CommunicationConsent = z.infer<typeof CommunicationConsentSchema>;

export const CommunicationCooldownSchema = z.object({
  key: z.string().min(1),
  windowSeconds: z.number().int().positive(),
  lastSentAt: z.string().datetime().nullable().optional(),
});
export type CommunicationCooldown = z.infer<typeof CommunicationCooldownSchema>;

export const CommunicationRecipientSchema = z.object({
  address: z.string().min(1),
  displayName: z.string().min(1).optional(),
});
export type CommunicationRecipient = z.infer<typeof CommunicationRecipientSchema>;

/** CommunicationIntent v1 — intent → consent/policy → outbox → worker → provider. */
export const CommunicationIntentSchema = z.object({
  intentId: z.string().uuid(),
  schemaVersion: z.literal(COMMUNICATION_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  correlationId: z.string().min(1),
  channel: CommunicationChannelSchema,
  template: CommunicationTemplateRefSchema,
  recipient: CommunicationRecipientSchema,
  consent: CommunicationConsentSchema,
  cooldown: CommunicationCooldownSchema.optional(),
  dedupKey: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  requestedAt: z.string().datetime(),
});
export type CommunicationIntent = z.infer<typeof CommunicationIntentSchema>;

export type CommunicationPolicyReason =
  | "OPT_OUT"
  | "NO_CONSENT"
  | "COOLDOWN"
  | "DEDUP"
  | "ALLOWLIST_DENIED";

export type CommunicationPolicyDecision =
  | { allow: true }
  | {
      allow: false;
      reason: CommunicationPolicyReason;
      status: DeliveryStatusName;
    };

export type CommunicationAdapterSendInput = {
  intent: CommunicationIntent;
  deliveryId: string;
};

export type CommunicationAdapterSendResult = {
  ok: boolean;
  provider: "sink" | "email" | "whatsapp";
  providerMessageId?: string;
  status: DeliveryStatusName;
  errorCode?: string;
  /** Safe operator message — never secrets / raw credentials. */
  errorMessage?: string;
};

export interface EmailCommunicationAdapter {
  readonly channel: "email";
  send(input: CommunicationAdapterSendInput): Promise<CommunicationAdapterSendResult>;
}

export interface WhatsAppCommunicationAdapter {
  readonly channel: "whatsapp";
  send(input: CommunicationAdapterSendInput): Promise<CommunicationAdapterSendResult>;
}

export type CommunicationAdapter = EmailCommunicationAdapter | WhatsAppCommunicationAdapter;

export type ProviderFailureMapping = {
  status: typeof DeliveryStatus.Failed;
  errorCode: string;
  retryable: boolean;
};

/** Normalize allowlist entries (trim, lowercase). Empty after normalize → deny-all. */
export function parseRecipientAllowlist(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Default-deny: recipient must appear on an explicit allowlist.
 * Empty / missing allowlist → deny.
 */
export function isRecipientAllowlisted(
  address: string,
  allowlist: readonly string[] | undefined | null,
): boolean {
  if (!allowlist || allowlist.length === 0) return false;
  const normalized = address.trim().toLowerCase();
  if (!normalized) return false;
  return allowlist.some((entry) => entry.trim().toLowerCase() === normalized);
}

export function isCooldownActive(input: {
  cooldown?: CommunicationCooldown | null;
  nowMs?: number;
}): boolean {
  const cooldown = input.cooldown;
  if (!cooldown?.lastSentAt) return false;
  const lastMs = Date.parse(cooldown.lastSentAt);
  if (!Number.isFinite(lastMs)) return false;
  const nowMs = input.nowMs ?? Date.now();
  return nowMs - lastMs < cooldown.windowSeconds * 1000;
}

export function shouldSkipDedup(
  dedupKey: string | undefined,
  recentDedupKeys: ReadonlySet<string> | undefined | null,
): boolean {
  if (!dedupKey) return false;
  if (!recentDedupKeys || recentDedupKeys.size === 0) return false;
  return recentDedupKeys.has(dedupKey);
}

/**
 * Intent → consent/policy gate before enqueue / provider send.
 * Order: opt-out → consent → cooldown → dedup → allowlist (default deny).
 */
export function evaluateCommunicationPolicy(input: {
  intent: CommunicationIntent;
  allowlist?: readonly string[] | null;
  recentDedupKeys?: ReadonlySet<string> | null;
  nowMs?: number;
}): CommunicationPolicyDecision {
  const { intent } = input;

  if (intent.consent.optedOut) {
    return { allow: false, reason: "OPT_OUT", status: DeliveryStatus.OptedOut };
  }
  if (!intent.consent.granted) {
    return { allow: false, reason: "NO_CONSENT", status: DeliveryStatus.NoConsent };
  }
  if (isCooldownActive({ cooldown: intent.cooldown, nowMs: input.nowMs })) {
    return { allow: false, reason: "COOLDOWN", status: DeliveryStatus.CooldownSkipped };
  }
  if (shouldSkipDedup(intent.dedupKey, input.recentDedupKeys)) {
    return { allow: false, reason: "DEDUP", status: DeliveryStatus.DedupSkipped };
  }
  if (!isRecipientAllowlisted(intent.recipient.address, input.allowlist)) {
    return {
      allow: false,
      reason: "ALLOWLIST_DENIED",
      status: DeliveryStatus.AllowlistDenied,
    };
  }

  return { allow: true };
}

/** Map provider/network failures to durable delivery codes (no secrets). */
export function mapProviderFailure(error: unknown): ProviderFailureMapping {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("etimedout")) {
    return { status: DeliveryStatus.Failed, errorCode: "PROVIDER_TIMEOUT", retryable: true };
  }
  if (lower.includes("rate") || lower.includes("429") || lower.includes("throttle")) {
    return { status: DeliveryStatus.Failed, errorCode: "PROVIDER_RATE_LIMIT", retryable: true };
  }
  if (lower.includes("auth") || lower.includes("unauthorized") || lower.includes("403")) {
    return { status: DeliveryStatus.Failed, errorCode: "PROVIDER_AUTH", retryable: false };
  }
  if (lower.includes("invalid") || lower.includes("rejected") || lower.includes("400")) {
    return { status: DeliveryStatus.Failed, errorCode: "PROVIDER_REJECTED", retryable: false };
  }

  return { status: DeliveryStatus.Failed, errorCode: "PROVIDER_ERROR", retryable: true };
}

export function communicationDedupScopeKey(input: {
  tenantId: string;
  channel: CommunicationChannelName;
  dedupKey: string;
}): string {
  return `${input.tenantId}:${input.channel}:${input.dedupKey}`;
}

export function communicationCooldownScopeKey(input: {
  tenantId: string;
  channel: CommunicationChannelName;
  cooldownKey: string;
}): string {
  return `${input.tenantId}:${input.channel}:${input.cooldownKey}`;
}

export type CommunicationDispatchOutcome = {
  decision: CommunicationPolicyDecision;
  result?: CommunicationAdapterSendResult;
};

/**
 * Pure dispatch orchestration for tests / worker: policy then adapter.
 * Does not touch network itself; adapter may be sink/noop.
 */
export async function runCommunicationDispatch(input: {
  intent: CommunicationIntent;
  adapter: CommunicationAdapter;
  deliveryId: string;
  allowlist?: readonly string[] | null;
  recentDedupKeys?: ReadonlySet<string> | null;
  nowMs?: number;
}): Promise<CommunicationDispatchOutcome> {
  const decision = evaluateCommunicationPolicy({
    intent: input.intent,
    allowlist: input.allowlist,
    recentDedupKeys: input.recentDedupKeys,
    nowMs: input.nowMs,
  });

  if (!decision.allow) {
    return {
      decision,
      result: {
        ok: false,
        provider: "sink",
        status: decision.status,
        errorCode: decision.reason,
      },
    };
  }

  if (input.adapter.channel !== input.intent.channel) {
    return {
      decision: { allow: true },
      result: {
        ok: false,
        provider: "sink",
        status: DeliveryStatus.Failed,
        errorCode: "ADAPTER_CHANNEL_MISMATCH",
        errorMessage: "adapter channel does not match intent",
      },
    };
  }

  try {
    const result = await input.adapter.send({
      intent: input.intent,
      deliveryId: input.deliveryId,
    });
    return { decision, result };
  } catch (err) {
    const mapped = mapProviderFailure(err);
    return {
      decision,
      result: {
        ok: false,
        provider: "sink",
        status: mapped.status,
        errorCode: mapped.errorCode,
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
