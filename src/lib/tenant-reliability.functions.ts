import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export type ReliabilityRow = {
  company_id: string;
  company_name: string;
  public_slug: string | null;
  n8n_total: number;
  n8n_failed: number;
  n8n_success_rate: number; // 0..1
  webhook_total: number;
  webhook_failed: number;
  webhook_success_rate: number; // 0..1
  open_incidents: number;
  critical_incidents: number;
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
};

function gradeFor(score: number): ReliabilityRow["grade"] {
  if (score >= 95) return "A";
  if (score >= 85) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

export const fetchTenantReliability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [coRes, n8nRes, whRes, incRes] = await Promise.all([
      supa.from("companies")
        .select("id,name,public_slug,is_active,status")
        .eq("is_active", true)
        .neq("status", "archived"),
      supa.from("n8n_workflow_runs")
        .select("tenant_id,status")
        .gte("created_at", sevenDaysAgo)
        .limit(10000),
      supa.from("webhook_runs")
        .select("company_id,status")
        .gte("created_at", sevenDaysAgo)
        .limit(10000),
      supa.from("core_incidents")
        .select("scope,severity,status")
        .neq("status", "resolved")
        .limit(2000),
    ]);

    if (coRes.error) throw new Error(coRes.error.message);

    const companies = coRes.data ?? [];
    const n8nRuns = n8nRes.data ?? [];
    const whRuns = whRes.data ?? [];
    const incidents = incRes.data ?? [];

    const n8nByCo = new Map<string, { total: number; failed: number }>();
    for (const r of n8nRuns) {
      if (!r.tenant_id) continue;
      const e = n8nByCo.get(r.tenant_id) ?? { total: 0, failed: 0 };
      e.total++;
      if (r.status === "error" || r.status === "failed") e.failed++;
      n8nByCo.set(r.tenant_id, e);
    }

    const whByCo = new Map<string, { total: number; failed: number }>();
    for (const r of whRuns) {
      if (!r.company_id) continue;
      const e = whByCo.get(r.company_id) ?? { total: 0, failed: 0 };
      e.total++;
      if (r.status === "error" || r.status === "failed" || r.status === "dead_letter") e.failed++;
      whByCo.set(r.company_id, e);
    }

    const incByScope = new Map<string, { total: number; critical: number }>();
    for (const i of incidents) {
      const key = (i.scope ?? "").toString();
      const e = incByScope.get(key) ?? { total: 0, critical: 0 };
      e.total++;
      if (i.severity === "critical" || i.severity === "high") e.critical++;
      incByScope.set(key, e);
    }

    const rows: ReliabilityRow[] = companies.map((c: any) => {
      const n8n = n8nByCo.get(c.id) ?? { total: 0, failed: 0 };
      const wh = whByCo.get(c.id) ?? { total: 0, failed: 0 };
      const inc = incByScope.get(c.public_slug ?? "") ?? { total: 0, critical: 0 };
      const n8nRate = n8n.total ? (n8n.total - n8n.failed) / n8n.total : 1;
      const whRate = wh.total ? (wh.total - wh.failed) / wh.total : 1;
      const incPenalty = Math.min(1, inc.total * 0.05 + inc.critical * 0.15);
      const composite = n8nRate * 0.45 + whRate * 0.45 + (1 - incPenalty) * 0.1;
      const score = Math.round(composite * 100);
      return {
        company_id: c.id,
        company_name: c.name,
        public_slug: c.public_slug,
        n8n_total: n8n.total,
        n8n_failed: n8n.failed,
        n8n_success_rate: n8nRate,
        webhook_total: wh.total,
        webhook_failed: wh.failed,
        webhook_success_rate: whRate,
        open_incidents: inc.total,
        critical_incidents: inc.critical,
        score,
        grade: gradeFor(score),
      };
    });

    rows.sort((a, b) => a.score - b.score);

    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
    const atRisk = rows.filter((r) => r.score < 70).length;
    const totalIncidents = rows.reduce((s, r) => s + r.open_incidents, 0);

    return {
      kpis: {
        avg_score: avg,
        at_risk_tenants: atRisk,
        total_tenants: rows.length,
        total_open_incidents: totalIncidents,
      },
      rows,
    };
  });
