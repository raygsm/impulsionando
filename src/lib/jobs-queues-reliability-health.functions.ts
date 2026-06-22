import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Jobs, Queues & Reliability Cockpit — Fase 85.
 * Filas de despacho do funil, cron do clube, runs de relatórios marocas,
 * tarefas operacionais (contábil), export logs, incidents/SLOs e feature flags.
 */
export const getJobsQueuesReliabilityHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [qRes, vRes, ccRes, mrRes, msRes, ctRes, exRes, inRes, slRes, ffRes, cfRes] = await Promise.all([
      supabaseAdmin.from("core_funnel_dispatch_queue").select("id, stage, workflow_name, niche_slug, status, attempts, scheduled_at, sent_at, last_error, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("v_funnel_dispatch_stats").select("stage, niche_slug, workflow_name, total, queued, sent, failed, skipped, cancelled, delivery_rate_pct, avg_latency_seconds, last_activity_at").limit(5000),
      supabaseAdmin.from("clube_cron_log").select("id, job, status, enqueued, skipped, error_count, error_message, started_at, finished_at").gte("started_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_report_runs").select("id, user_id, period, channels, status, total, done, late, error, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("marocas_report_schedules").select("id, user_id, period, hour, weekday, channels, enabled, updated_at").limit(20000),
      supabaseAdmin.from("contab_tasks").select("id, company_id, status, priority, due_date, done_at, assigned_to, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("core_export_logs").select("id, user_id, company_id, kind, scope, row_count, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_incidents").select("id, scope, runtime_scope, severity, status, title, detected_at, resolved_at, event_count").gte("detected_at", sinceIso).limit(5000),
      supabaseAdmin.from("core_slo_targets").select("id, scope, name, availability_target_bps, latency_p95_target_ms, window_days, active").limit(2000),
      supabaseAdmin.from("core_feature_flags").select("id, module_slug, key, label, category, default_value, is_active").limit(5000),
      supabaseAdmin.from("core_company_feature_values").select("id, company_id, flag_key, module_slug, value, updated_at").limit(50000),
    ]);

    const err = qRes.error || vRes.error || ccRes.error || mrRes.error || msRes.error || ctRes.error || exRes.error || inRes.error || slRes.error || ffRes.error || cfRes.error;
    if (err) throw new Error(err.message);

    const q = qRes.data ?? [];
    const v = vRes.data ?? [];
    const cc = ccRes.data ?? [];
    const mr = mrRes.data ?? [];
    const ms = msRes.data ?? [];
    const ct = ctRes.data ?? [];
    const ex = exRes.data ?? [];
    const inc = inRes.data ?? [];
    const sl = slRes.data ?? [];
    const ff = ffRes.data ?? [];
    const cf = cfRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Queue KPIs
    const qByStatus = countBy(q, (r: any) => r.status);
    const qFailed = q.filter((r: any) => String(r.status).toLowerCase() === "failed").length;
    const qSent = q.filter((r: any) => String(r.status).toLowerCase() === "sent").length;
    const qPending = q.filter((r: any) => ["queued", "pending", "scheduled"].includes(String(r.status).toLowerCase())).length;
    const qHighAttempts = q.filter((r: any) => (r.attempts ?? 0) >= 3).length;
    const qByStage = countBy(q, (r: any) => r.stage);
    const qByNiche = countBy(q, (r: any) => r.niche_slug).slice(0, 12);
    const qLatencies = q
      .filter((r: any) => r.sent_at && r.scheduled_at)
      .map((r: any) => (new Date(r.sent_at).getTime() - new Date(r.scheduled_at).getTime()) / 1000)
      .filter((n) => Number.isFinite(n) && n >= 0);
    const qAvgLatency = qLatencies.length ? qLatencies.reduce((a, b) => a + b, 0) / qLatencies.length : 0;

    // Cron KPIs
    const ccSuccess = cc.filter((r: any) => String(r.status).toLowerCase() === "success" || String(r.status).toLowerCase() === "ok").length;
    const ccError = cc.filter((r: any) => (r.error_count ?? 0) > 0 || String(r.status).toLowerCase() === "error").length;
    const ccEnqueued = cc.reduce((a: number, r: any) => a + (r.enqueued ?? 0), 0);
    const ccDurations = cc
      .filter((r: any) => r.started_at && r.finished_at)
      .map((r: any) => (new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000);
    const ccAvgDuration = ccDurations.length ? ccDurations.reduce((a, b) => a + b, 0) / ccDurations.length : 0;
    const ccByJob = countBy(cc, (r: any) => r.job).slice(0, 10);

    // Marocas reports
    const mrByStatus = countBy(mr, (r: any) => r.status);
    const mrLate = mr.reduce((a: number, r: any) => a + (r.late ?? 0), 0);
    const mrError = mr.reduce((a: number, r: any) => a + (r.error ?? 0), 0);
    const mrTotalSent = mr.reduce((a: number, r: any) => a + (r.done ?? 0), 0);
    const msEnabled = ms.filter((r: any) => r.enabled).length;

    // Contab tasks
    const ctByStatus = countBy(ct, (r: any) => r.status);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ctOverdue = ct.filter((r: any) => r.due_date && new Date(r.due_date) < today && !r.done_at).length;
    const ctDone = ct.filter((r: any) => r.done_at).length;
    const ctByPriority = countBy(ct, (r: any) => r.priority);

    // Exports
    const exByKind = countBy(ex, (r: any) => r.kind);
    const exRows = ex.reduce((a: number, r: any) => a + (r.row_count ?? 0), 0);

    // Incidents
    const incBySeverity = countBy(inc, (r: any) => r.severity);
    const incByStatus = countBy(inc, (r: any) => r.status);
    const incResolved = inc.filter((r: any) => r.resolved_at).length;
    const incMttrMin = (() => {
      const arr = inc
        .filter((r: any) => r.resolved_at && r.detected_at)
        .map((r: any) => (new Date(r.resolved_at).getTime() - new Date(r.detected_at).getTime()) / 60000);
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    })();

    // Feature flags
    const ffActive = ff.filter((r: any) => r.is_active).length;
    const ffByCategory = countBy(ff, (r: any) => r.category);
    const cfEnabled = cf.filter((r: any) => r.value).length;
    const cfDisabled = cf.filter((r: any) => !r.value).length;

    // SLO
    const sloActive = sl.filter((r: any) => r.active).length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      queue: {
        total: q.length,
        failed: qFailed,
        sent: qSent,
        pending: qPending,
        highAttempts: qHighAttempts,
        avgLatencySeconds: qAvgLatency,
        byStatus: qByStatus,
        byStage: qByStage,
        byNiche: qByNiche,
        viewStats: v.slice(0, 50),
      },
      cron: {
        runs: cc.length,
        success: ccSuccess,
        error: ccError,
        enqueued: ccEnqueued,
        avgDurationSec: ccAvgDuration,
        byJob: ccByJob,
        latest: cc
          .slice()
          .sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
          .slice(0, 10)
          .map((r: any) => ({ id: r.id, job: r.job, status: r.status, enqueued: r.enqueued, errors: r.error_count, startedAt: r.started_at, finishedAt: r.finished_at, error: r.error_message })),
      },
      reports: {
        runs: mr.length,
        sent: mrTotalSent,
        late: mrLate,
        errors: mrError,
        byStatus: mrByStatus,
        schedules: ms.length,
        schedulesEnabled: msEnabled,
      },
      tasks: {
        total: ct.length,
        done: ctDone,
        overdue: ctOverdue,
        byStatus: ctByStatus,
        byPriority: ctByPriority,
      },
      exports: { total: ex.length, rows: exRows, byKind: exByKind },
      incidents: {
        total: inc.length,
        resolved: incResolved,
        mttrMinutes: incMttrMin,
        bySeverity: incBySeverity,
        byStatus: incByStatus,
        latest: inc
          .slice()
          .sort((a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
          .slice(0, 8)
          .map((r: any) => ({ id: r.id, scope: r.scope, severity: r.severity, status: r.status, title: r.title, detectedAt: r.detected_at, resolvedAt: r.resolved_at, events: r.event_count })),
      },
      slo: { total: sl.length, active: sloActive, targets: sl.slice(0, 30) },
      flags: {
        total: ff.length,
        active: ffActive,
        byCategory: ffByCategory,
        overrides: cf.length,
        overridesEnabled: cfEnabled,
        overridesDisabled: cfDisabled,
      },
    };
  });
