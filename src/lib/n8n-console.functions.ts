import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const fetchN8nConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workflow?: string; status?: string; days?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const days = Math.min(Math.max(data.days ?? 7, 1), 90);
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    let q = context.supabase.from("n8n_workflow_runs" as any).select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(200);
    if (data.workflow) q = q.ilike("workflow_name", `%${data.workflow}%`);
    if (data.status) q = q.eq("status", data.status);

    const [runsRes, summaryRes, failedRes] = await Promise.all([
      q,
      context.supabase.from("n8n_workflow_runs" as any).select("workflow_name,status,latency_ms,created_at").gte("created_at", since).limit(5000),
      context.supabase.from("core_funnel_dispatch_queue" as any).select("id,workflow_name,stage,niche_slug,attempts,last_error,scheduled_at,updated_at").eq("status", "failed").order("updated_at", { ascending: false }).limit(50),
    ]);
    if (runsRes.error) throw new Error(runsRes.error.message);

    // aggregate by workflow
    const byWf: Record<string, { workflow: string; total: number; ok: number; failed: number; retry: number; skipped: number; avgLatency: number; lastSeen: string }> = {};
    for (const r of (summaryRes.data ?? []) as any[]) {
      const k = r.workflow_name;
      const row = (byWf[k] ??= { workflow: k, total: 0, ok: 0, failed: 0, retry: 0, skipped: 0, avgLatency: 0, lastSeen: r.created_at });
      row.total++;
      if (r.status === "ok") row.ok++;
      else if (r.status === "failed") row.failed++;
      else if (r.status === "retry") row.retry++;
      else if (r.status === "skipped" || r.status === "suppressed") row.skipped++;
      row.avgLatency += r.latency_ms ?? 0;
      if (r.created_at > row.lastSeen) row.lastSeen = r.created_at;
    }
    const summary = Object.values(byWf).map((r) => ({ ...r, avgLatency: r.total ? Math.round(r.avgLatency / r.total) : 0 }))
      .sort((a, b) => b.total - a.total);

    return {
      runs: (runsRes.data ?? []) as any[],
      summary,
      failedDispatches: (failedRes.data ?? []) as any[],
      since,
    };
  });

export const requeueFailedDispatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("core_funnel_dispatch_queue" as any)
      .update({ status: "queued", attempts: 0, last_error: null, scheduled_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("status", "failed");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
