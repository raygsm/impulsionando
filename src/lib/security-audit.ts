import { supabase } from "@/integrations/supabase/client";

export type SecurityEvent = {
  entity: string;
  action: "denied" | "create" | "update" | "delete" | "export" | "download" | string;
  companyId?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort audit logger. Writes to `audit_logs` via SECURITY DEFINER RPC.
 * Never throws — failures are only console-warned so they don't break UX.
 */
export async function logSecurityEvent(evt: SecurityEvent): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_security_event", {
      _entity: evt.entity,
      _action: evt.action,
      _company: evt.companyId ?? undefined,
      _entity_id: evt.entityId ?? undefined,
      _metadata: (evt.metadata ?? {}) as never,
    });
    if (error) console.warn("[audit] log_security_event failed:", error.message);
  } catch (e) {
    console.warn("[audit] log_security_event threw:", e);
  }
}

/** Wrap a Supabase mutation so RLS denials/empty-result blocks are logged. */
export async function withSecurityAudit<T>(
  evt: SecurityEvent,
  run: () => Promise<{ data: T | null; error: { message: string; code?: string } | null }>,
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const res = await run();
  const denied =
    !!res.error ||
    res.data == null ||
    (Array.isArray(res.data) && (res.data as unknown[]).length === 0);
  if (denied) {
    void logSecurityEvent({
      ...evt,
      action: "denied",
      metadata: { ...(evt.metadata ?? {}), reason: res.error?.message ?? "empty_result" },
    });
  }
  return res;
}
