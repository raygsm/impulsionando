import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export type InboxEvent = {
  id: string;
  ts: string;
  source: "webhook" | "integration" | "n8n" | "runtime";
  severity: "info" | "warn" | "error" | "ok";
  label: string;
  detail: string;
  payload: any;
};

export const fetchUnifiedInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { hours?: number; sources?: string[]; severity?: string; q?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const hours = Math.min(Math.max(data.hours ?? 24, 1), 24 * 14);
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const wanted = new Set(data.sources && data.sources.length ? data.sources : ["webhook", "integration", "n8n", "runtime"]);

    const [whRes, intRes, n8nRes, rtRes] = await Promise.all([
      wanted.has("webhook")
        ? context.supabase.from("webhook_event_log" as any).select("id,source,event_id,target_kind,target_id,result,processed_at").gte("processed_at", since).order("processed_at", { ascending: false }).limit(300)
        : Promise.resolve({ data: [] as any[], error: null }),
      wanted.has("integration")
        ? context.supabase.from("core_integration_logs" as any).select("id,integration_slug,event_type,status,error,duration_ms,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(300)
        : Promise.resolve({ data: [] as any[], error: null }),
      wanted.has("n8n")
        ? context.supabase.from("n8n_workflow_runs" as any).select("id,workflow_name,step,status,http_status,latency_ms,error,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(300)
        : Promise.resolve({ data: [] as any[], error: null }),
      wanted.has("runtime")
        ? context.supabase.from("runtime_events" as any).select("id,level,scope,message,route,occurred_at,context").gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(300)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    const events: InboxEvent[] = [];

    for (const r of (whRes.data ?? []) as any[]) {
      const okFlag = (r.result?.ok ?? r.result?.success);
      events.push({
        id: `wh:${r.id}`, ts: r.processed_at, source: "webhook",
        severity: okFlag === false ? "error" : "info",
        label: `${r.source} ▸ ${r.event_id}`,
        detail: r.target_kind ? `${r.target_kind} ${r.target_id ?? ""}` : "",
        payload: { result: r.result },
      });
    }
    for (const r of (intRes.data ?? []) as any[]) {
      events.push({
        id: `int:${r.id}`, ts: r.created_at, source: "integration",
        severity: r.status === "error" ? "error" : r.status === "pending" ? "warn" : "ok",
        label: `${r.integration_slug} ▸ ${r.event_type}`,
        detail: r.error ?? `${r.duration_ms ?? "—"}ms`,
        payload: { status: r.status, error: r.error },
      });
    }
    for (const r of (n8nRes.data ?? []) as any[]) {
      events.push({
        id: `n8n:${r.id}`, ts: r.created_at, source: "n8n",
        severity: r.status === "failed" ? "error" : r.status === "retry" ? "warn" : r.status === "ok" ? "ok" : "info",
        label: `${r.workflow_name} ▸ ${r.step}`,
        detail: `${r.status}${r.http_status ? ` · HTTP ${r.http_status}` : ""}${r.latency_ms != null ? ` · ${r.latency_ms}ms` : ""}${r.error ? ` · ${r.error}` : ""}`,
        payload: { http_status: r.http_status, error: r.error },
      });
    }
    for (const r of (rtRes.data ?? []) as any[]) {
      events.push({
        id: `rt:${r.id}`, ts: r.occurred_at, source: "runtime",
        severity: r.level === "error" || r.level === "fatal" ? "error" : r.level === "warn" ? "warn" : "info",
        label: `${r.scope} ▸ ${r.level}`,
        detail: `${r.message}${r.route ? ` · ${r.route}` : ""}`,
        payload: r.context,
      });
    }

    let merged = events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    if (data.severity) merged = merged.filter((e) => e.severity === data.severity);
    if (data.q) {
      const q = data.q.toLowerCase();
      merged = merged.filter((e) => `${e.label} ${e.detail}`.toLowerCase().includes(q));
    }

    const counts = merged.reduce(
      (a, e) => ((a[e.severity] = (a[e.severity] ?? 0) + 1), (a[`src_${e.source}`] = (a[`src_${e.source}`] ?? 0) + 1), a),
      {} as Record<string, number>,
    );
    return { events: merged.slice(0, 500), counts, since, total: merged.length };
  });
