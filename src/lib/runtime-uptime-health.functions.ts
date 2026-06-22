import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Runtime, Webhooks, Uptime & Incidents Cockpit — Fase 66.
 */
export const getRuntimeUptimeHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [rtRes, whRunRes, whEvRes, upChkRes, upStRes, incRes, intLogRes] = await Promise.all([
      supabaseAdmin.from("runtime_events").select("id, event_type, severity, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("webhook_runs").select("id, provider, status, attempts, duration_ms, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("webhook_event_log").select("id, provider, event_type, processed, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("uptime_checks").select("id, name, url, enabled").limit(2000),
      supabaseAdmin.from("uptime_state").select("id, check_id, status, last_checked_at, last_status_change_at, uptime_pct").limit(2000),
      supabaseAdmin.from("core_incidents").select("id, severity, status, opened_at, resolved_at, title").gte("opened_at", sinceIso).limit(5000),
      supabaseAdmin.from("core_integration_logs").select("id, integration, status, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = rtRes.error || whRunRes.error || whEvRes.error || upChkRes.error || upStRes.error || incRes.error || intLogRes.error;
    if (err) throw new Error(err.message);

    const rt = (rtRes.data ?? []) as any[];
    const whR = (whRunRes.data ?? []) as any[];
    const whE = (whEvRes.data ?? []) as any[];
    const upC = (upChkRes.data ?? []) as any[];
    const upS = (upStRes.data ?? []) as any[];
    const inc = (incRes.data ?? []) as any[];
    const intL = (intLogRes.data ?? []) as any[];

    const sevMap = new Map<string, number>();
    for (const e of rt) { const k = e.severity || "info"; sevMap.set(k, (sevMap.get(k) ?? 0) + 1); }
    const rtBySeverity = Array.from(sevMap, ([severity, count]) => ({ severity, count })).sort((a, b) => b.count - a.count);

    const typeMap = new Map<string, number>();
    for (const e of rt) { const k = e.event_type || "—"; typeMap.set(k, (typeMap.get(k) ?? 0) + 1); }
    const rtTopTypes = Array.from(typeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 15);

    const whSuccess = whR.filter((w) => w.status === "success" || w.status === "ok" || w.status === "completed").length;
    const whFailed = whR.filter((w) => w.status === "failed" || w.status === "error").length;
    const whRetries = whR.filter((w) => (w.attempts ?? 1) > 1).length;
    const whDur = whR.filter((w) => typeof w.duration_ms === "number").map((w) => w.duration_ms);
    const whAvgMs = whDur.length ? Math.round(whDur.reduce((a, b) => a + b, 0) / whDur.length) : 0;
    const whProvMap = new Map<string, number>();
    for (const w of whR) { const k = w.provider || "—"; whProvMap.set(k, (whProvMap.get(k) ?? 0) + 1); }
    const whByProvider = Array.from(whProvMap, ([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count).slice(0, 12);

    const whEvUnprocessed = whE.filter((e) => !e.processed).length;

    const upEnabled = upC.filter((c) => c.enabled).length;
    const upUp = upS.filter((s) => s.status === "up" || s.status === "ok").length;
    const upDown = upS.filter((s) => s.status === "down" || s.status === "fail").length;
    const upPctVals = upS.map((s) => Number(s.uptime_pct)).filter((v) => Number.isFinite(v));
    const upAvgPct = upPctVals.length ? Math.round((upPctVals.reduce((a, b) => a + b, 0) / upPctVals.length) * 100) / 100 : 0;

    const incOpen = inc.filter((i) => !i.resolved_at).length;
    const incCritical = inc.filter((i) => i.severity === "critical" || i.severity === "high").length;
    const incMTTRh = (() => {
      const v = inc.filter((i) => i.opened_at && i.resolved_at).map((i) => (new Date(i.resolved_at).getTime() - new Date(i.opened_at).getTime()) / 3600000);
      return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0;
    })();

    const intMap = new Map<string, { ok: number; err: number }>();
    for (const l of intL) {
      const k = l.integration || "—";
      const entry = intMap.get(k) ?? { ok: 0, err: 0 };
      if (l.status === "ok" || l.status === "success") entry.ok++; else entry.err++;
      intMap.set(k, entry);
    }
    const integrations = Array.from(intMap, ([integration, v]) => ({ integration, ...v })).sort((a, b) => (b.ok + b.err) - (a.ok + a.err)).slice(0, 12);

    return {
      days: data.days,
      runtime: { total: rt.length, bySeverity: rtBySeverity, topTypes: rtTopTypes },
      webhooks: { total: whR.length, success: whSuccess, failed: whFailed, retried: whRetries, avgDurationMs: whAvgMs, byProvider: whByProvider, unprocessedEvents: whEvUnprocessed, eventsTotal: whE.length },
      uptime: { checks: upC.length, enabled: upEnabled, up: upUp, down: upDown, avgUptimePct: upAvgPct },
      incidents: { total: inc.length, open: incOpen, critical: incCritical, mttrHours: incMTTRh },
      integrations,
    };
  });
