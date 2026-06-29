import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchTenantReliability, type ReliabilityRow } from "@/lib/tenant-reliability.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, ShieldCheck, TrendingDown } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/reliability")({
  head: () => ({ meta: [{ title: "Reliability Scorecard — Impulsionando" }] }),
  component: Page,
});

function gradeColor(g: ReliabilityRow["grade"]) {
  switch (g) {
    case "A": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    case "B": return "bg-sky-500/15 text-sky-600 border-sky-500/30";
    case "C": return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    case "D": return "bg-orange-500/15 text-orange-600 border-orange-500/30";
    case "F": return "bg-destructive/15 text-destructive border-destructive/30";
  }
}

function pct(v: number) { return `${Math.round(v * 100)}%`; }

function Page() {
  const fn = useServerFn(fetchTenantReliability);
  const { data, isLoading } = useQuery({ queryKey: ["tenant-reliability"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reliability Scorecard"
        description="Score composto por tenant (N8N, webhooks, incidentes) nos últimos 7 dias."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Activity className="h-4 w-4" />} label="Score médio" value={data ? `${data.kpis.avg_score}/100` : "—"} />
        <Kpi icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} label="Tenants em risco (<70)" value={data?.kpis.at_risk_tenants ?? "—"} />
        <Kpi icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} label="Tenants monitorados" value={data?.kpis.total_tenants ?? "—"} />
        <Kpi icon={<TrendingDown className="h-4 w-4 text-destructive" />} label="Incidentes abertos" value={data?.kpis.total_open_incidents ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking (menor score primeiro)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
          ) : !data?.rows.length ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum tenant ativo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2">Tenant</th>
                    <th className="text-center">Grade</th>
                    <th className="text-right">Score</th>
                    <th className="text-right">N8N (ok/total)</th>
                    <th className="text-right">Webhooks (ok/total)</th>
                    <th className="text-right">Incidentes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.company_id} className="border-b last:border-0">
                      <td className="px-4 py-2 truncate max-w-[260px]">{r.company_name}</td>
                      <td className="text-center">
                        <Badge variant="outline" className={gradeColor(r.grade)}>{r.grade}</Badge>
                      </td>
                      <td className="text-right tabular-nums font-medium">{r.score}</td>
                      <td className="text-right tabular-nums text-xs">
                        {r.n8n_total === 0 ? <span className="text-muted-foreground">—</span> : (
                          <>{r.n8n_total - r.n8n_failed}/{r.n8n_total} <span className="text-muted-foreground">({pct(r.n8n_success_rate)})</span></>
                        )}
                      </td>
                      <td className="text-right tabular-nums text-xs">
                        {r.webhook_total === 0 ? <span className="text-muted-foreground">—</span> : (
                          <>{r.webhook_total - r.webhook_failed}/{r.webhook_total} <span className="text-muted-foreground">({pct(r.webhook_success_rate)})</span></>
                        )}
                      </td>
                      <td className="text-right tabular-nums text-xs">
                        {r.open_incidents === 0 ? <span className="text-muted-foreground">0</span> : (
                          <span className={r.critical_incidents > 0 ? "text-destructive font-medium" : ""}>
                            {r.open_incidents}{r.critical_incidents > 0 && <> ({r.critical_incidents} críticos)</>}
                          </span>
                        )}
                      </td>
                      <td className="text-right pr-4">
                        {r.public_slug && (
                          <Link to="/admin/clientes/$slug" params={{ slug: r.public_slug }} className="text-xs text-primary hover:underline">
                            Abrir 360
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
