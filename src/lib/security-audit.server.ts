/**
 * Server-side helper to record audit_logs entries for denied/sensitive
 * export/download attempts. Uses the user-scoped Supabase client from a
 * `createServerFn` handler context so `auth.uid()` resolves inside the
 * SECURITY DEFINER `log_security_event` RPC.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type DenialEvt = {
  entity: string;
  action?: string; // defaults to "security.access_denied"
  companyId?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logDenialServer(
  supabase: SupabaseClient,
  evt: DenialEvt,
): Promise<void> {
  try {
    await supabase.rpc("log_security_event", {
      _entity: evt.entity,
      _action: evt.action ?? "security.access_denied",
      _company: evt.companyId ?? undefined,
      _entity_id: evt.entityId ?? undefined,
      _metadata: (evt.metadata ?? {}) as never,
    });
  } catch (e) {
    // never bubble — denial logging is best-effort
    console.warn("[audit] logDenialServer failed:", e);
  }
}

/**
 * Guard helper: verifies the caller has the admin role and logs an
 * `security.access_denied` audit entry when the check fails before throwing.
 */
export async function requireAdminOrAudit(
  supabase: SupabaseClient,
  userId: string,
  evt: Omit<DenialEvt, "action">,
): Promise<void> {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    await logDenialServer(supabase, {
      ...evt,
      action: "security.access_denied",
      metadata: { ...(evt.metadata ?? {}), reason: "missing_admin_role" },
    });
    throw new Error("Acesso restrito");
  }
}
