import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * W42 — SLA & MTTR por tenant.
 * Cruza core_incidents (scope=public_slug) + core_reliability_alerts (company_id)
 * com a tabela companies para calcular, por tenant:
 *  - Incidentes (90d), sev1 abertos, taxa de resolução
 *  - MTTD (detected_at → created_at? usamos detected_at) e MTTR (detected→resolved)
 *  - Alertas de confiabilidade abertos/históricos e tempo médio para resolução do alerta
 */

export type TenantSlaRow = {
  company_id: string;
  company_name: string;
  public_slug: string | null;
  incidents_90d: number;
  incidents_open: number;
  sev1_open: number;
  mttr_minutes: number | null;
  resolution_rate: number; // 0..1
  alerts_open: number;
  alerts_total: number;
  alert_mttr_minutes: number | null;
  last_incident_at: string | null;
  score: number; // 0..100 (higher = healthier)
};

function mean(xs: number[]) {
  if (!xs.length) return null;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

export const fetchTenantSlaMttr = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supa = context.supabase as any;
    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: context.userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const d90 = new Date(Date.now() - 90 * 86400000).toISOString();

    const [coRes, incRes, alRes] = await Promise.all([
      supa.from("companies")
        .select("id,name,public_slug,is_active,status")
        .eq("is_active", true)
        .neq("status", "archived"),
      supa.from("core_incidents")
        .select("id,scope,severity,status,detected_at,resolved_at,title")
        .gte("detected_at", d90)
        .limit(5000),
      supa.from("core_reliability_alerts")
        .select("company_id,status,created_at,resolved_at,triggered_score,resolved_score")
        .gte("created_at", d90)
        .limit(5000),
    ]);

    if (coRes.error) throw new Error(coRes.error.message);

    const companies = coRes.data ?? [];
    const incidents = incRes.data ?? [];
    const alerts = alRes.data ?? [];

    const incByScope = new Map<string, any[]>();
    for (const i of incidents) {
      const k = (i.scope ?? "").toString();
      if (!k) continue;
      const arr = incByScope.get(k) ?? [];
      arr.push(i);
      incByScope.set(k, arr);
    }

    const alByCompany = new Map<string, any[]>();
    for (const a of alerts) {
      const arr = alByCompany.get(a.company_id) ?? [];
      arr.push(a);
      alByCompany.set(a.company_id, arr);
    }

    const rows: TenantSlaRow[] = companies.map((c: any) => {
      const inc = incByScope.get(c.public_slug ?? "") ?? [];
      const al = alByCompany.get(c.id) ?? [];
      const open = inc.filter((i) => i.status !== "resolved");
      const sev1Open = open.filter((i) => i.severity === "sev1" || i.severity === "critical").length;
      const resolved = inc.filter((i) => i.resolved_at && i.detected_at);
      const mttrMin = mean(
        resolved.map((i) => (new Date(i.resolved_at).getTime() - new Date(i.detected_at).getTime()) / 60000),
      );
      const alertsOpen = al.filter((a) => a.status === "open").length;
      const alertsResolved = al.filter((a) => a.status === "resolved" && a.resolved_at);
      const alertMttr = mean(
        alertsResolved.map(
          (a) => (new Date(a.resolved_at).getTime() - new Date(a.created_at).getTime()) / 60000,
        ),
      );
      const last = inc.reduce<string | null>((acc, i) => {
        if (!i.detected_at) return acc;
        return !acc || i.detected_at > acc ? i.detected_at : acc;
      }, null);
      const resolutionRate = inc.length ? resolved.length / inc.length : 1;

      // Score 0..100: penaliza incidentes abertos, sev1 e MTTR elevado
      const incPenalty = Math.min(40, open.length * 4 + sev1Open * 10);
      const mttrPenalty = mttrMin ? Math.min(30, Math.round(mttrMin / 60)) : 0;
      const alertPenalty = Math.min(20, alertsOpen * 8);
      const score = Math.max(0, 100 - incPenalty - mttrPenalty - alertPenalty);

      return {
        company_id: c.id,
        company_name: c.name,
        public_slug: c.public_slug,
        incidents_90d: inc.length,
        incidents_open: open.length,
        sev1_open: sev1Open,
        mttr_minutes: mttrMin,
        resolution_rate: resolutionRate,
        alerts_open: alertsOpen,
        alerts_total: al.length,
        alert_mttr_minutes: alertMttr,
        last_incident_at: last,
        score,
      };
    });

    rows.sort((a, b) => a.score - b.score);

    const kpis = {
      tenants: rows.length,
      at_risk: rows.filter((r) => r.score < 70).length,
      open_incidents: rows.reduce((s, r) => s + r.incidents_open, 0),
      sev1_open: rows.reduce((s, r) => s + r.sev1_open, 0),
      avg_mttr_min: mean(rows.map((r) => r.mttr_minutes).filter((x): x is number => x !== null)),
      open_alerts: rows.reduce((s, r) => s + r.alerts_open, 0),
    };

    return { rows, kpis, generatedAt: new Date().toISOString() };
  });
