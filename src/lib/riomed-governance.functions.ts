import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getCompanyId(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (!any2?.id) throw new Error("Nenhuma empresa disponível");
  return any2.id;
}

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; entityType?: string; actorEmail?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    let q = supabase
      .from("riomed_audit_log")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.entityType) q = q.eq("entity_type", data.entityType);
    if (data.actorEmail) q = q.ilike("actor_email", `%${data.actorEmail}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { items: rows ?? [] };
  });

export const getOperationalEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; level?: string; source?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    let q = supabase
      .from("riomed_operational_events")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.level) q = q.eq("level", data.level);
    if (data.source) q = q.eq("source", data.source);
    const { data: rows, error } = await q;
    if (error) throw error;
    const counts = { info: 0, warn: 0, error: 0, debug: 0 } as Record<string, number>;
    for (const r of rows ?? []) counts[r.level] = (counts[r.level] ?? 0) + 1;
    return { items: rows ?? [], counts };
  });

export const logOperationalEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { level?: string; source: string; eventCode: string; message?: string; payload?: any; correlationId?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: res, error } = await supabase.rpc("riomed_log_event", {
      _company_id: companyId,
      _level: data.level ?? "info",
      _source: data.source,
      _event_code: data.eventCode,
      _message: data.message ?? "",
      _payload: data.payload ?? {},
      _correlation_id: data.correlationId ?? "",
    });
    if (error) throw error;
    return { id: res };
  });

export const listUserScopes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data, error } = await supabase
      .from("riomed_user_scopes")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { items: data ?? [] };
  });

export const grantUserScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; scope: string; expiresAt?: string | null; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: row, error } = await supabase
      .from("riomed_user_scopes")
      .upsert({
        company_id: companyId,
        user_id: data.userId,
        scope: data.scope,
        granted_by: userId,
        expires_at: data.expiresAt ?? null,
        notes: data.notes ?? null,
      }, { onConflict: "company_id,user_id,scope" })
      .select()
      .single();
    if (error) throw error;
    await supabase.rpc("riomed_log_audit", {
      _company_id: companyId, _actor_id: userId, _actor_email: "",
      _action: "scope.grant", _entity_type: "user_scope", _entity_id: row.id,
      _before: null, _after: row, _metadata: {},
    });
    return { item: row };
  });

export const revokeUserScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scopeId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: before } = await supabase.from("riomed_user_scopes").select("*").eq("id", data.scopeId).maybeSingle();
    const { error } = await supabase.from("riomed_user_scopes").delete().eq("id", data.scopeId);
    if (error) throw error;
    await supabase.rpc("riomed_log_audit", {
      _company_id: companyId, _actor_id: userId, _actor_email: "",
      _action: "scope.revoke", _entity_type: "user_scope", _entity_id: data.scopeId,
      _before: before, _after: null, _metadata: {},
    });
    return { ok: true };
  });

export const listGovernancePolicies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data, error } = await supabase
      .from("riomed_governance_policies")
      .select("*")
      .eq("company_id", companyId)
      .order("policy_key");
    if (error) throw error;
    return { items: data ?? [] };
  });

export const upsertGovernancePolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { policyKey: string; policyName: string; description?: string; config: any; isActive?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const { data: row, error } = await supabase
      .from("riomed_governance_policies")
      .upsert({
        company_id: companyId,
        policy_key: data.policyKey,
        policy_name: data.policyName,
        description: data.description ?? null,
        config: data.config ?? {},
        is_active: data.isActive ?? true,
      }, { onConflict: "company_id,policy_key" })
      .select()
      .single();
    if (error) throw error;
    return { item: row };
  });

export const getGovernanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await getCompanyId(supabase, userId);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [a, e, s, p] = await Promise.all([
      supabase.from("riomed_audit_log").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", since),
      supabase.from("riomed_operational_events").select("id,level", { count: "exact" }).eq("company_id", companyId).gte("created_at", since),
      supabase.from("riomed_user_scopes").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("riomed_governance_policies").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
    ]);
    const events = e.data ?? [];
    return {
      auditCount7d: a.count ?? 0,
      eventsCount7d: e.count ?? 0,
      errorCount7d: events.filter((x: any) => x.level === "error").length,
      warnCount7d: events.filter((x: any) => x.level === "warn").length,
      scopesCount: s.count ?? 0,
      activePoliciesCount: p.count ?? 0,
    };
  });
