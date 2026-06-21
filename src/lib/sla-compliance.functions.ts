import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * SLA Compliance — Fase 27.
 * Une core_slo_targets + uptime_checks (30d) + core_incidents para calcular:
 *  - Availability real por target (30d) vs meta (availability_target_bps em basis points)
 *  - Error budget restante (% e minutos)
 *  - Burn rate (consumo vs prazo da janela)
 *  - MTTD / MTTR por severidade
 *  - Ranking de incidentes por escopo
 *  - Alertas: budget esgotado, burn acelerado, sev1 aberto, target sem dados
 */
export const getSlaCompliance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const d30 = new Date(now - 30 * 86400000).toISOString();
    const d90 = new Date(now - 90 * 86400000).toISOString();

    const [targetsRes, checksRes, incidentsRes] = await Promise.all([
      supabaseAdmin
        .from("core_slo_targets")
        .select("id, scope, url, name, availability_target_bps, latency_p95_target_ms, window_days, active")
        .eq("active", true),
      supabaseAdmin
        .from("uptime_checks")
        .select("url, is_up, response_ms, checked_at")
        .gte("checked_at", d30)
        .limit(50000),
      supabaseAdmin
        .from("core_incidents")
        .select("id, scope, url, severity, status, title, detected_at, resolved_at, event_count")
        .gte("detected_at", d90)
        .limit(500),
    ]);

    const targets = targetsRes.data ?? [];
    const checks = checksRes.data ?? [];
    const incidents = incidentsRes.data ?? [];

    // Agrupar checks por url
    const byUrl = new Map<string, { total: number; up: number; latencies: number[] }>();
    for (const c of checks) {
      const k = c.url as string;
      const row = byUrl.get(k) ?? { total: 0, up: 0, latencies: [] };
      row.total += 1;
      if (c.is_up) row.up += 1;
      if (typeof c.response_ms === "number") row.latencies.push(c.response_ms);
      byUrl.set(k, row);
    }

    const p95 = (arr: number[]) => {
      if (arr.length === 0) return null;
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.floor(s.length * 0.95)] ?? s[s.length - 1];
    };

    // Compliance por target
    const compliance = targets.map((t: any) => {
      const stats = byUrl.get(t.url) ?? { total: 0, up: 0, latencies: [] };
      const actualPct = stats.total > 0 ? (stats.up / stats.total) * 100 : null;
      const targetPct = (t.availability_target_bps ?? 9900) / 100; // bps→%
      const windowDays = t.window_days ?? 30;
      const windowMinutes = windowDays * 24 * 60;
      const allowedDowntime = windowMinutes * (1 - targetPct / 100);
      const actualDowntime = stats.total > 0 ? windowMinutes * (1 - stats.up / stats.total) : 0;
      const budgetUsedPct = allowedDowntime > 0
        ? Math.min(999, (actualDowntime / allowedDowntime) * 100)
        : 0;
      const budgetRemainingMin = Math.max(0, allowedDowntime - actualDowntime);
      // burn rate: % budget gasto / % janela decorrida (assume janela cheia 30d)
      const burnRate = budgetUsedPct / 100;
      const latencyP95 = p95(stats.latencies);
      const latencyTarget = t.latency_p95_target_ms;
      const latencyOk = latencyTarget && latencyP95 ? latencyP95 <= latencyTarget : null;

      let healthStatus: "ok" | "warn" | "breach" | "no-data" = "ok";
      if (stats.total === 0) healthStatus = "no-data";
      else if (actualPct !== null && actualPct < targetPct) healthStatus = "breach";
      else if (budgetUsedPct >= 75) healthStatus = "warn";

      return {
        id: t.id,
        name: t.name,
        scope: t.scope,
        url: t.url,
        targetPct: Number(targetPct.toFixed(3)),
        actualPct: actualPct === null ? null : Number(actualPct.toFixed(3)),
        checks: stats.total,
        budgetUsedPct: Number(budgetUsedPct.toFixed(1)),
        budgetRemainingMin: Math.round(budgetRemainingMin),
        burnRate: Number(burnRate.toFixed(2)),
        latencyP95: latencyP95 ? Math.round(latencyP95) : null,
        latencyTarget,
        latencyOk,
        windowDays,
        healthStatus,
      };
    });

    // MTTD/MTTR por severidade
    const sevStats = new Map<string, { count: number; resolved: number; totalResolveMin: number }>();
    for (const i of incidents) {
      const sev = i.severity ?? "unknown";
      const row = sevStats.get(sev) ?? { count: 0, resolved: 0, totalResolveMin: 0 };
      row.count += 1;
      if (i.resolved_at && i.detected_at) {
        row.resolved += 1;
        const dur = (new Date(i.resolved_at).getTime() - new Date(i.detected_at).getTime()) / 60000;
        row.totalResolveMin += dur;
      }
      sevStats.set(sev, row);
    }
    const mttr = [...sevStats.entries()].map(([sev, r]) => ({
      severity: sev,
      incidents: r.count,
      resolved: r.resolved,
      open: r.count - r.resolved,
      mttrMinutes: r.resolved > 0 ? Math.round(r.totalResolveMin / r.resolved) : null,
    })).sort((a, b) => a.severity.localeCompare(b.severity));

    // Ranking por escopo
    const scopeMap = new Map<string, { scope: string; total: number; sev1: number; open: number; eventCount: number }>();
    for (const i of incidents) {
      const scope = i.scope ?? "—";
      const row = scopeMap.get(scope) ?? { scope, total: 0, sev1: 0, open: 0, eventCount: 0 };
      row.total += 1;
      if (i.severity === "sev1") row.sev1 += 1;
      if (i.status !== "resolved") row.open += 1;
      row.eventCount += Number(i.event_count ?? 0);
      scopeMap.set(scope, row);
    }
    const byScope = [...scopeMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);

    // Alertas
    const alerts: Array<{ severity: "info" | "warn" | "danger"; message: string }> = [];
    for (const c of compliance) {
      if (c.healthStatus === "breach")
        alerts.push({ severity: "danger", message: `${c.name}: availability ${c.actualPct}% < meta ${c.targetPct}%.` });
      else if (c.healthStatus === "warn")
        alerts.push({ severity: "warn", message: `${c.name}: ${c.budgetUsedPct}% do error budget consumido.` });
      else if (c.healthStatus === "no-data")
        alerts.push({ severity: "info", message: `${c.name}: sem checks nos últimos 30d.` });
      if (c.latencyOk === false)
        alerts.push({ severity: "warn", message: `${c.name}: p95 ${c.latencyP95}ms > meta ${c.latencyTarget}ms.` });
    }
    const sev1Open = incidents.filter((i: any) => i.severity === "sev1" && i.status !== "resolved").length;
    if (sev1Open > 0) alerts.push({ severity: "danger", message: `${sev1Open} incidente(s) SEV1 abertos.` });

    return {
      summary: {
        targets: compliance.length,
        breach: compliance.filter((c) => c.healthStatus === "breach").length,
        warn: compliance.filter((c) => c.healthStatus === "warn").length,
        noData: compliance.filter((c) => c.healthStatus === "no-data").length,
        incidents90d: incidents.length,
        openIncidents: incidents.filter((i: any) => i.status !== "resolved").length,
        sev1Open,
      },
      compliance,
      mttr,
      byScope,
      alerts,
      generatedAt: new Date().toISOString(),
    };
  });
