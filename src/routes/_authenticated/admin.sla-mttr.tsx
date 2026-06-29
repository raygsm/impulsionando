import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchTenantSlaMttr, type TenantSlaRow } from "@/lib/tenant-sla-mttr.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertOctagon, Activity, BellRing, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sla-mttr")({
  head: () => ({ meta: [{ title: "SLA & MTTR por Tenant — Impulsionando" }] }),
  component: Page,
});

function fmtMin(m: number | null) {
  if (m === null || m === undefined) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function scoreBadge(s: number) {
  if (s >= 85) return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">{s}</Badge>;
  if (s >= 70) return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30" variant="outline">{s}</Badge>;
  return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">{s}</Badge>;
}

function Page() {
  const fn = useServerFn(fetchTenantSlaMttr);
  const { data, isLoading } = useQuery({ queryKey: ["tenant-sla-mttr"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA & MTTR por Tenant"
        description="Tempo médio de recuperação (MTTR), incidentes abertos e alertas de confiabilidade nos últimos 90 dias, agregados por cliente."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/reliability">Scorecard</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/reliability-alerts">Alertas</Link>
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Kpi icon={<ShieldCheck className="h-4 w-4" />} label="Tenants" value={data?.kpis.tenants ?? "—"} />
        <Kpi icon={<AlertOctagon className="h-4 w-4 text-destructive" />} label="Em risco (<70)" value={data?.kpis.at_risk ?? "—"} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Incidentes abertos" value={data?.kpis.open_incidents ?? "—"} />
        <Kpi icon={<AlertOctagon className="h-4 w-4 text-destructive" />} label="SEV1 abertos" value={data?.kpis.sev1_open ?? "—"} />
        <Kpi icon={<Clock className="h-4 w-4" />} label="MTTR médio" value={fmtMin(data?.kpis.avg_mttr_min ?? null)} />
        <Kpi icon={<BellRing className="h-4 w-4" />} label="Alertas abertos" value={data?.kpis.open_alerts ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking por saúde</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
          ) : !data?.rows.length ? (
            <div className="p-6 text-sm text-muted-foreground">Sem dados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2">Tenant</th>
                    <th className="text-right">Score</th>
                    <th className="text-right">Incidentes 90d</th>
                    <th className="text-right">Abertos</th>
                    <th className="text-right">SEV1</th>
                    <th className="text-right">MTTR</th>
                    <th className="text-right">Resolução</th>
                    <th className="text-right">Alertas (abertos/total)</th>
                    <th className="text-right">MTTR alerta</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r: TenantSlaRow) => (
                    <tr key={r.company_id} className="border-b last:border-0">
                      <td className="px-4 py-2 truncate max-w-[220px]">{r.company_name}</td>
                      <td className="text-right">{scoreBadge(r.score)}</td>
                      <td className="text-right tabular-nums">{r.incidents_90d}</td>
                      <td className="text-right tabular-nums">{r.incidents_open}</td>
                      <td className="text-right tabular-nums">
                        {r.sev1_open > 0 ? (
                          <span className="text-destructive font-medium">{r.sev1_open}</span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="text-right tabular-nums">{fmtMin(r.mttr_minutes)}</td>
                      <td className="text-right tabular-nums">{Math.round(r.resolution_rate * 100)}%</td>
                      <td className="text-right tabular-nums">
                        {r.alerts_open} / {r.alerts_total}
                      </td>
                      <td className="text-right tabular-nums">{fmtMin(r.alert_mttr_minutes)}</td>
                      <td className="text-right pr-4">
                        {r.public_slug && (
                          <Link
                            to="/admin/clientes/$slug"
                            params={{ slug: r.public_slug }}
                            className="text-xs text-primary hover:underline"
                          >
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
