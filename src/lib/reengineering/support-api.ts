/**
 * Phase 3 Support API client — shared mapper + server fetch (strangler).
 * Contracts: @impulsionando/contracts SupportTicketCreateBody shape.
 */
import { randomUUID } from "node:crypto";

export type PublicSupportTicketInput = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
  type?: string;
  priority?: string;
  niche?: string;
  page?: string;
};

export type PublicSupportTicketResult =
  | { ok: true; ticket_id: string; protocol: string }
  | { ok: false; error: string; detail?: string };

export function phase3ApiBase(): string | null {
  const raw =
    process.env.PHASE3_API_BASE ||
    process.env.VITE_PHASE3_API_BASE ||
    "";
  const base = raw.trim().replace(/\/$/, "");
  return base || null;
}

export function toNestCreateBody(input: PublicSupportTicketInput) {
  return {
    subject: input.subject,
    description: input.description,
    type: input.type ?? "question",
    priority: input.priority ?? "medium",
    requester: {
      name: input.name,
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
    },
    source: "tanstack.public_support_form",
    page: input.page,
  };
}

/** Server-side: POST create to Nest Support API v1. */
export async function createSupportTicketViaNest(
  input: PublicSupportTicketInput,
  opts?: { correlationId?: string; idempotencyKey?: string },
): Promise<PublicSupportTicketResult> {
  const base = phase3ApiBase();
  if (!base) {
    return { ok: false, error: "phase3_api_not_configured" };
  }

  const correlationId = opts?.correlationId ?? randomUUID();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    "x-correlation-id": correlationId,
  };
  if (opts?.idempotencyKey) {
    headers["idempotency-key"] = opts.idempotencyKey;
  }

  let res: Response;
  try {
    res = await fetch(`${base}/api/v1/support/tickets`, {
      method: "POST",
      headers,
      body: JSON.stringify(toNestCreateBody(input)),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "nest_unreachable", detail: msg };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "invalid_json", detail: `HTTP ${res.status}` };
  }

  if (!res.ok) {
    const err = body as { error?: { message?: string; code?: string } };
    return {
      ok: false,
      error: err?.error?.code || "nest_error",
      detail: err?.error?.message || `HTTP ${res.status}`,
    };
  }

  const data = (body as { data?: { id?: string; protocol?: string } }).data;
  if (!data?.id || !data?.protocol) {
    return { ok: false, error: "invalid_envelope" };
  }

  return { ok: true, ticket_id: data.id, protocol: data.protocol };
}
