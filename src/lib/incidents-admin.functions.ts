import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureStaff(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const listIncidents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { source?: string; status?: string; severity?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    let q = context.supabase
      .from("core_incidents")
      .select("id, scope, runtime_scope, severity, status, title, description, detected_at, resolved_at, event_count, source, metadata")
      .order("detected_at", { ascending: false })
      .limit(Math.min(data.limit ?? 100, 500));
    if (data.source) q = q.eq("source", data.source);
    if (data.status) q = q.eq("status", data.status as any);
    if (data.severity) q = q.eq("severity", data.severity as any);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const open = (rows ?? []).filter((r: any) => r.status === "open").length;
    const bySource: Record<string, number> = {};
    for (const r of rows ?? []) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    return { incidents: rows ?? [], summary: { total: rows?.length ?? 0, open, bySource } };
  });

export const resolveIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; postmortem?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const patch: any = {
      status: "resolved",
      resolved_at: new Date().toISOString(),
    };
    if (data.postmortem) patch.postmortem = data.postmortem;
    const { error } = await context.supabase.from("core_incidents").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    title: string;
    description?: string;
    severity: "sev1" | "sev2" | "sev3" | "sev4";
    scope?: string;
    url?: string;
    source?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    if (!data.title || data.title.length < 3) throw new Error("Título obrigatório (min 3 caracteres)");
    const { data: row, error } = await context.supabase
      .from("core_incidents")
      .insert({
        title: data.title,
        description: data.description ?? null,
        severity: data.severity,
        scope: (data.scope ?? "global") as any,
        url: data.url ?? null,
        source: (data.source ?? "manual") as any,
        status: "open",
        detected_at: new Date().toISOString(),
        event_count: 1,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const listIncidentUpdates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { incident_id: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: rows, error } = await context.supabase
      .from("core_incident_updates")
      .select("id, status, body, created_at, posted_by")
      .eq("incident_id", data.incident_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { updates: rows ?? [] };
  });

export const addIncidentUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    incident_id: string;
    status: "investigating" | "identified" | "monitoring" | "resolved" | "update";
    body: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    if (!data.body || data.body.trim().length < 3) throw new Error("Mensagem obrigatória");
    const { error } = await context.supabase.from("core_incident_updates").insert({
      incident_id: data.incident_id,
      status: data.status,
      body: data.body.trim(),
      posted_by: context.userId,
    });
    if (error) throw new Error(error.message);
    if (data.status === "resolved") {
      await context.supabase
        .from("core_incidents")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", data.incident_id);
    } else if (data.status === "monitoring" || data.status === "identified") {
      await context.supabase
        .from("core_incidents")
        .update({ status: "monitoring" })
        .eq("id", data.incident_id)
        .eq("status", "open");
    }
    return { ok: true };
  });
