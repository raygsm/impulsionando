import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSlaCompliance } from "@/lib/sla-compliance.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, Activity, Clock, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sla-compliance")({
  head: () => ({
    meta: [
      { title: "SLA Compliance — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SlaCompliancePage,
});

const severityClass: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  warn: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

const healthClass: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  breach: "bg-destructive/15 text-destructive border-destructive/30",
  "no-data": "bg-muted text-muted-foreground border-muted",
};

function SlaCompliancePage() {
  const fn = useServerFn(getSlaCompliance);
  const { data, isLoading } = useQuery({
    queryKey: ["sla-compliance"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );

  const s = data.summary;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> SLA / SLO Compliance
        </h1>
        <p className="text-sm text-muted-foreground">
          Compliance de availability, error budget e incidentes (últimos 30d / 90d).
        </p>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.slice(0, 8).map((a, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${severityClass[a.severity]}`}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Activity className="h-4 w-4" />} label="Targets ativos" value={s.targets.toString()} />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Em breach" value={s.breach.toString()} valueClass={s.breach > 0 ? "text-destructive" : ""} />
        <Kpi icon={<Flame className="h-4 w-4" />} label="Em warning" value={s.warn.toString()} valueClass={s.warn > 0 ? "text-amber-600" : ""} />
        <Kpi icon={<Clock className="h-4 w-4" />} label="Sem dados" value={s.noData.toString()} sub="targets sem checks 30d" />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Incidentes 90d" value={s.incidents90d.toString()} sub={`${s.openIncidents} abertos`} />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="SEV1 abertos" value={s.sev1Open.toString()} valueClass={s.sev1Open > 0 ? "text-destructive" : ""} />
      </div>

      <Card className="p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Compliance por target (janela 30d)</h2>
        <table className="w-full text-sm min-w-[800px]">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="text-left p-2">Target</th>
              <th className="text-left p-2">Status</th>
              <th className="text-right p-2">Meta</th>
              <th className="text-right p-2">Real</th>
              <th className="text-right p-2">Budget usado</th>
              <th className="text-right p-2">Restante</th>
              <th className="text-right p-2">p95</th>
              <th className="text-right p-2">Checks</th>
            </tr>
          </thead>
          <tbody>
            {data.compliance.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">{c.scope} · {c.url}</div>
                </td>
                <td className="p-2">
                  <Badge variant="outline" className={`text-xs ${healthClass[c.healthStatus]}`}>{c.healthStatus}</Badge>
                </td>
                <td className="p-2 text-right tabular-nums">{c.targetPct}%</td>
                <td className="p-2 text-right tabular-nums font-medium">
                  {c.actualPct === null ? "—" : `${c.actualPct}%`}
                </td>
                <td className="p-2 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="h-1.5 w-20 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full ${c.budgetUsedPct >= 100 ? "bg-destructive" : c.budgetUsedPct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, c.budgetUsedPct)}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs w-10">{c.budgetUsedPct}%</span>
                  </div>
                </td>
                <td className="p-2 text-right tabular-nums text-xs text-muted-foreground">{c.budgetRemainingMin}m</td>
                <td className="p-2 text-right tabular-nums">
                  {c.latencyP95 === null ? "—" : (
                    <span className={c.latencyOk === false ? "text-destructive font-medium" : ""}>
                      {c.latencyP95}ms{c.latencyTarget ? ` / ${c.latencyTarget}` : ""}
                    </span>
                  )}
                </td>
                <td className="p-2 text-right tabular-nums text-muted-foreground">{c.checks}</td>
              </tr>
            ))}
            {data.compliance.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">Nenhum target SLO ativo.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">MTTR por severidade (90d)</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Severidade</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Abertos</th>
                <th className="text-right p-2">MTTR</th>
              </tr>
            </thead>
            <tbody>
              {data.mttr.map((m) => (
                <tr key={m.severity} className="border-b last:border-0">
                  <td className="p-2 font-medium uppercase text-xs">{m.severity}</td>
                  <td className="p-2 text-right tabular-nums">{m.incidents}</td>
                  <td className="p-2 text-right tabular-nums">
                    {m.open > 0 ? <span className="text-destructive font-medium">{m.open}</span> : m.open}
                  </td>
                  <td className="p-2 text-right tabular-nums">
                    {m.mttrMinutes === null ? "—" : `${m.mttrMinutes}m`}
                  </td>
                </tr>
              ))}
              {data.mttr.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">Sem incidentes no período.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Top 10 escopos por incidentes</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Escopo</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">SEV1</th>
                <th className="text-right p-2">Abertos</th>
              </tr>
            </thead>
            <tbody>
              {data.byScope.map((b) => (
                <tr key={b.scope} className="border-b last:border-0">
                  <td className="p-2 font-medium truncate max-w-[200px]">{b.scope}</td>
                  <td className="p-2 text-right tabular-nums">{b.total}</td>
                  <td className="p-2 text-right tabular-nums">
                    {b.sev1 > 0 ? <span className="text-destructive font-medium">{b.sev1}</span> : 0}
                  </td>
                  <td className="p-2 text-right tabular-nums">{b.open}</td>
                </tr>
              ))}
              {data.byScope.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">Sem dados.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}. Availability = checks UP ÷
        total na janela do target. Error budget = (1 − meta) × minutos da janela. Burn ≥ 75% =
        warning; consumo total = breach. MTTR = média(resolved_at − detected_at) por severidade.
      </p>
    </div>
  );
}

function Kpi({
  icon, label, value, sub, valueClass,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`text-2xl font-bold tabular-nums mt-2 ${valueClass ?? ""}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}
