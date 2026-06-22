import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getChurnRadar } from "@/lib/churn-radar.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, TrendingDown, Building2, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/churn-radar")({
  head: () => ({
    meta: [
      { title: "Churn Prevention Radar — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ChurnRadarPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function ChurnRadarPage() {
  const fn = useServerFn(getChurnRadar);
  const [minScore, setMinScore] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["churn-radar", minScore],
    queryFn: () => fn({ data: { minScore } }),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );

  const { kpis, topReasons, risks } = data;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" /> Churn Prevention Radar
          </h1>
          <p className="text-sm text-muted-foreground">
            Tenants com sinais antecipados de cancelamento — atue antes da suspensão.
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 35, 60].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={minScore === s ? "default" : "outline"}
              onClick={() => setMinScore(s)}
            >
              {s === 0 ? "Todos" : s === 35 ? "Médio+" : "Alto"}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Building2} label="Tenants ativos" value={kpis.totalCompanies} />
        <Kpi icon={AlertTriangle} label="Em risco" value={kpis.atRisk} />
        <Kpi icon={Flame} label="Alto risco" value={kpis.highRisk} accent="warn" />
        <Kpi label="Médio risco" value={kpis.mediumRisk} />
        <Kpi label="Suspensos" value={kpis.suspended} accent="warn" />
        <Kpi icon={TrendingDown} label="Inativos 30d" value={kpis.inactive30d} />
        <Kpi label="Inadimplentes" value={kpis.overdueTenants} />
        <Kpi label="MRR em risco" value={BRL(kpis.mrrAtRiskEstimate)} accent="warn" />
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Top motivos de risco</h2>
        {topReasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum risco detectado no filtro atual.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topReasons.map((r) => (
              <Badge key={r.reason} variant="secondary" className="text-sm">
                {r.reason} · {r.count}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Tenants em risco</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-2 pr-3">Tenant</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Banda</th>
                <th className="py-2 pr-3">MRR</th>
                <th className="py-2 pr-3">Uso 30d</th>
                <th className="py-2 pr-3">Δ vs prev</th>
                <th className="py-2 pr-3">Vencidas</th>
                <th className="py-2 pr-3">Tickets</th>
                <th className="py-2 pr-3">Sinais</th>
                <th className="py-2">Ação sugerida</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.companyId} className="border-t align-top">
                  <td className="py-2 pr-3 font-medium">
                    {r.companyName}
                    {r.isSuspended && <Badge variant="destructive" className="ml-1 text-[10px]">suspenso</Badge>}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={r.band === "alto" ? "destructive" : r.band === "medio" ? "default" : "secondary"}>
                      {r.score}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 capitalize">{r.band}</td>
                  <td className="py-2 pr-3">{BRL(r.mrr)}</td>
                  <td className="py-2 pr-3">{r.events30d}</td>
                  <td className={`py-2 pr-3 ${r.activityDropPct >= 50 ? "text-red-600" : "text-muted-foreground"}`}>
                    {r.eventsPrev30d > 0 ? `-${r.activityDropPct}%` : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {r.overdueInvoices > 0 ? (
                      <span className="text-red-600">
                        {r.overdueInvoices} · {BRL(r.overdueAmount)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {r.openCriticalTickets > 0 && <Badge variant="destructive" className="text-[10px]">{r.openCriticalTickets} crít</Badge>}
                    {r.lowCsatTickets > 0 && <Badge variant="outline" className="ml-1 text-[10px]">CSAT{r.lowCsatTickets}</Badge>}
                    {r.openCriticalTickets === 0 && r.lowCsatTickets === 0 && "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {r.signals.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 font-medium">{r.suggestedAction}</td>
                </tr>
              ))}
              {risks.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Sem riscos no filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, accent,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: "warn" | "ok";
}) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className={`text-xl font-semibold ${accent === "warn" ? "text-amber-600" : accent === "ok" ? "text-emerald-600" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
