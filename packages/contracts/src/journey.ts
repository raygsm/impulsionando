/**
 * Phase 5F — 90-day CRM invitation journey (synthetic/test recipients only).
 * Canonical CRM state lives in API/DB; n8n may react to events but must not own state.
 * Env var *names* only — never values. Default-deny allowlist.
 */
import { z } from "zod";

export const JOURNEY_SCHEMA_VERSION = 1 as const;
export const REENGINEERING_CRM_JOURNEY_TABLE = "reengineering_crm_journey" as const;
export const REENGINEERING_CRM_INVITE_TABLE = "reengineering_crm_invite" as const;

/**
 * Env var NAMES only — never values.
 * Operator sets these on staging; repo must not contain secrets or real recipients.
 */
export const JOURNEY_ENV_NAMES = {
  /** Comma-separated recipient allowlist; empty / unset = default deny. */
  RECIPIENT_ALLOWLIST: "JOURNEY_RECIPIENT_ALLOWLIST",
  /** When "true", journey dispatch uses sink/noop (no network send). */
  SINK: "JOURNEY_COMMUNICATION_SINK",
  /** Worker flag — default off so 5B job consumer behavior is unchanged. */
  WORKER_ENABLED: "WORKER_JOURNEY_ENABLED",
} as const;

/** Default reminder keys scheduled for the 90-day invite journey (synthetic). */
export const JOURNEY_DEFAULT_REMINDER_KEYS = [
  "invite.d0",
  "invite.d3",
  "invite.d7",
  "invite.d14",
  "invite.d30",
  "invite.d60",
  "invite.d90",
] as const;

export type JourneyReminderKey = (typeof JOURNEY_DEFAULT_REMINDER_KEYS)[number] | string;

/**
 * Reminder keys cancelled when first login / redeeming action occurs.
 * Remaining journey keys (e.g. nurture) may stay until a later gate.
 */
export const JOURNEY_INCOMPATIBLE_ON_FIRST_LOGIN = [
  "invite.d0",
  "invite.d3",
  "invite.d7",
  "invite.d14",
  "invite.d30",
  "invite.d60",
  "invite.d90",
] as const;

export const InviteStatusSchema = z.enum([
  "pending",
  "dispatched",
  "clicked",
  "redeemed",
  "revoked",
  "expired",
]);
export type InviteStatus = z.infer<typeof InviteStatusSchema>;

export const JourneyStatusSchema = z.enum([
  "selected",
  "invite_created",
  "dispatched",
  "link_clicked",
  "first_login",
  "completed",
  "revoked",
  "expired",
]);
export type JourneyStatus = z.infer<typeof JourneyStatusSchema>;

export const JourneySupportContextSchema = z.object({
  ticketId: z.string().uuid().optional(),
  correlationId: z.string().min(1),
  authorizedScopes: z.array(z.string().min(1)).default([]),
  handoffAt: z.string().datetime({ offset: true }).optional(),
});
export type JourneySupportContext = z.infer<typeof JourneySupportContextSchema>;

/** InviteV1 — expiring / revocable CRM invitation. */
export const InviteV1Schema = z.object({
  inviteId: z.string().uuid(),
  schemaVersion: z.literal(JOURNEY_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  journeyId: z.string().uuid(),
  correlationId: z.string().min(1),
  /** Synthetic/test recipient address only — never real campaign blasts. */
  recipientAddress: z.string().min(1),
  /** SHA-256 hex of opaque invite token — never store or log raw tokens. */
  tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
  status: InviteStatusSchema,
  // Supabase/PostgREST returns offset timestamps (+00:00); plain datetime() rejects them.
  expiresAt: z.string().datetime({ offset: true }),
  revokedAt: z.string().datetime({ offset: true }).nullable().optional(),
  clickedAt: z.string().datetime({ offset: true }).nullable().optional(),
  redeemedAt: z.string().datetime({ offset: true }).nullable().optional(),
  createdAt: z.string().datetime({ offset: true }),
  channel: z.enum(["email", "whatsapp", "sink"]).default("sink"),
});
export type InviteV1 = z.infer<typeof InviteV1Schema>;

/** JourneyStateV1 — canonical CRM journey state owned by API/DB. */
export const JourneyStateV1Schema = z.object({
  journeyId: z.string().uuid(),
  schemaVersion: z.literal(JOURNEY_SCHEMA_VERSION),
  tenantId: z.string().uuid(),
  correlationId: z.string().min(1),
  /** Synthetic contact reference (not a prod CRM id). */
  contactRef: z.string().min(1),
  status: JourneyStatusSchema,
  inviteId: z.string().uuid().nullable().optional(),
  activeReminderKeys: z.array(z.string().min(1)).default([]),
  cancelledReminderKeys: z.array(z.string().min(1)).default([]),
  supportContext: JourneySupportContextSchema.nullable().optional(),
  updatedAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
});
export type JourneyStateV1 = z.infer<typeof JourneyStateV1Schema>;

export const CreateInviteBodySchema = z.object({
  tenantId: z.string().uuid(),
  contactRef: z.string().min(1),
  recipientAddress: z.string().min(1),
  /** ISO expiry; defaults applied by service when omitted. */
  expiresAt: z.string().datetime({ offset: true }).optional(),
  channel: z.enum(["email", "whatsapp", "sink"]).default("sink"),
  reminderKeys: z.array(z.string().min(1)).optional(),
});
export type CreateInviteBody = z.infer<typeof CreateInviteBodySchema>;

export const RecordInviteClickBodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  /** Opaque token presented by the click; hashed before compare. */
  token: z.string().min(8),
});
export type RecordInviteClickBody = z.infer<typeof RecordInviteClickBodySchema>;

export const RecordFirstLoginBodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  token: z.string().min(8).optional(),
});
export type RecordFirstLoginBody = z.infer<typeof RecordFirstLoginBodySchema>;

export type InviteDenyReason = "EXPIRED" | "REVOKED" | "REDEEMED" | "NOT_FOUND" | "TOKEN_MISMATCH";

export type InviteActionDecision =
  | { allow: true }
  | { allow: false; reason: InviteDenyReason };

export function parseJourneyRecipientAllowlist(raw: string | undefined | null): string[] {
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
export function isJourneyRecipientAllowlisted(
  address: string,
  allowlist: readonly string[] | undefined | null,
): boolean {
  if (!allowlist || allowlist.length === 0) return false;
  const normalized = address.trim().toLowerCase();
  if (!normalized) return false;
  return allowlist.some((entry) => entry.trim().toLowerCase() === normalized);
}

export function isInviteExpired(invite: Pick<InviteV1, "expiresAt" | "status">, nowMs?: number): boolean {
  if (invite.status === "expired") return true;
  const expiresMs = Date.parse(invite.expiresAt);
  if (!Number.isFinite(expiresMs)) return true;
  const now = nowMs ?? Date.now();
  return now >= expiresMs;
}

export function isInviteRevoked(invite: Pick<InviteV1, "status" | "revokedAt">): boolean {
  if (invite.status === "revoked") return true;
  return Boolean(invite.revokedAt);
}

/** Pure gate for click / redeem paths. */
export function evaluateInviteAction(
  invite: InviteV1 | null | undefined,
  opts?: { nowMs?: number },
): InviteActionDecision {
  if (!invite) return { allow: false, reason: "NOT_FOUND" };
  if (isInviteRevoked(invite)) return { allow: false, reason: "REVOKED" };
  if (isInviteExpired(invite, opts?.nowMs)) return { allow: false, reason: "EXPIRED" };
  if (invite.status === "redeemed") return { allow: false, reason: "REDEEMED" };
  return { allow: true };
}

export type CancelRemindersInput = {
  activeReminderKeys: readonly string[];
  cancelledReminderKeys?: readonly string[];
  /** Event that triggers cancellation (first login / redeem). */
  trigger: "account.first_login" | "invite.redeemed";
  incompatibleKeys?: readonly string[];
};

export type CancelRemindersResult = {
  activeReminderKeys: string[];
  cancelledReminderKeys: string[];
  newlyCancelled: string[];
};

/**
 * Cancel incompatible reminders when first login / redeeming action occurs.
 * Pure — no I/O. Idempotent: already-cancelled keys are not re-listed in newlyCancelled.
 */
export function cancelIncompatibleReminders(input: CancelRemindersInput): CancelRemindersResult {
  const incompatible = new Set(
    (input.incompatibleKeys ?? JOURNEY_INCOMPATIBLE_ON_FIRST_LOGIN).map((k) => k.trim()),
  );
  const previouslyCancelled = new Set(
    (input.cancelledReminderKeys ?? []).map((k) => k.trim()).filter(Boolean),
  );
  const newlyCancelled: string[] = [];
  const remaining: string[] = [];

  for (const key of input.activeReminderKeys) {
    const k = key.trim();
    if (!k) continue;
    if (incompatible.has(k)) {
      if (!previouslyCancelled.has(k)) newlyCancelled.push(k);
      previouslyCancelled.add(k);
    } else {
      remaining.push(k);
    }
  }

  return {
    activeReminderKeys: remaining,
    cancelledReminderKeys: [...previouslyCancelled],
    newlyCancelled,
  };
}

export type JourneyTransitionEvent =
  | "invite.created"
  | "invite.dispatched"
  | "invite.link_clicked"
  | "account.first_login"
  | "invite.revoked"
  | "invite.expired"
  | "support.ticket.created";

/**
 * Pure happy-path state machine for the synthetic CRM invite journey.
 * Invalid transitions return the prior state unchanged (caller decides deny).
 */
export function applyJourneyTransition(
  state: JourneyStateV1,
  event: JourneyTransitionEvent,
  opts?: { nowIso?: string; supportContext?: JourneySupportContext | null },
): JourneyStateV1 {
  const updatedAt = opts?.nowIso ?? new Date().toISOString();
  const next = { ...state, updatedAt };

  switch (event) {
    case "invite.created":
      if (state.status === "selected" || state.status === "invite_created") {
        return { ...next, status: "invite_created" };
      }
      return state;
    case "invite.dispatched":
      if (state.status === "invite_created" || state.status === "dispatched") {
        return { ...next, status: "dispatched" };
      }
      return state;
    case "invite.link_clicked":
      if (
        state.status === "dispatched" ||
        state.status === "invite_created" ||
        state.status === "link_clicked"
      ) {
        return { ...next, status: "link_clicked" };
      }
      return state;
    case "account.first_login": {
      if (
        state.status === "link_clicked" ||
        state.status === "dispatched" ||
        state.status === "first_login"
      ) {
        const cancelled = cancelIncompatibleReminders({
          activeReminderKeys: state.activeReminderKeys,
          cancelledReminderKeys: state.cancelledReminderKeys,
          trigger: "account.first_login",
        });
        return {
          ...next,
          status: "first_login",
          activeReminderKeys: cancelled.activeReminderKeys,
          cancelledReminderKeys: cancelled.cancelledReminderKeys,
        };
      }
      return state;
    }
    case "invite.revoked":
      return { ...next, status: "revoked" };
    case "invite.expired":
      return { ...next, status: "expired" };
    case "support.ticket.created":
      return {
        ...next,
        supportContext: opts?.supportContext ?? state.supportContext ?? null,
      };
    default:
      return state;
  }
}

/** Duplicate click must be single-effect: already-clicked invites stay clicked. */
export function applyInviteClick(
  invite: InviteV1,
  opts?: { nowMs?: number; nowIso?: string },
): { invite: InviteV1; effect: "applied" | "noop" | "denied"; reason?: InviteDenyReason } {
  const decision = evaluateInviteAction(invite, { nowMs: opts?.nowMs });
  if (!decision.allow) {
    return { invite, effect: "denied", reason: decision.reason };
  }
  if (invite.status === "clicked") {
    return { invite, effect: "noop" };
  }
  const nowIso = opts?.nowIso ?? new Date().toISOString();
  return {
    invite: { ...invite, status: "clicked", clickedAt: nowIso },
    effect: "applied",
  };
}
