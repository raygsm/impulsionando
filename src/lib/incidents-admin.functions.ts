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
