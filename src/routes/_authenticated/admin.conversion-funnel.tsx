import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getConversionFunnel } from "@/lib/conversion-funnel.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Filter, Clock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/conversion-funnel")({
  head: () => ({
    meta: [
      { title: "Conversion Funnel — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ConversionFunnelPage,
});

function ConversionFunnelPage() {
  const fn = useServerFn(getConversionFunnel);
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["conversion-funnel", days],
    queryFn: () => fn({ data: { days } }),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );

  const maxStage = Math.max(...data.stages.map((s) => s.value), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="h-6 w-6" /> Conversion Funnel
          </h1>
          <p className="text-sm text-muted-foreground">
            Visitas → Leads → Trials → Convertidos → Retidos (últimos {data.days} dias).
          </p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs rounded border ${days === d ? "bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {data.kpis.bottleneck && (
        <div className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm bg-amber-500/15 text-amber-700 border-amber-500/30">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <b>Gargalo:</b> {data.kpis.bottleneck.stage} — taxa {data.kpis.bottleneck.rate}% vs
            benchmark {data.kpis.bottleneck.benchmark}% (gap −{data.kpis.bottleneck.gap}pp).
          </span>
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Funil principal</h2>
        <div className="space-y-3">
          {data.stages.map((s, i) => {
            const width = (s.value / maxStage) * 100;
            const trendKey = (["visitas", "leads", "trials", null, null] as const)[i];
            const trendVal = trendKey ? (data.trend as any)[trendKey] : null;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium">{s.label}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {s.rateFromPrev !== null && (
                      <Badge variant="outline" className="text-xs">
                        {s.rateFromPrev}% conv
                      </Badge>
                    )}
                    {trendVal !== null && trendVal !== undefined && (
                      <span className={`flex items-center gap-1 ${trendVal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {trendVal >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trendVal > 0 ? "+" : ""}{trendVal}%
                      </span>
                    )}
                    <span className="font-bold tabular-nums w-20 text-right">{s.value.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <div className="h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.max(2, width)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Lead → Trial"
            value={data.kpis.avgLeadToTrialDays === null ? "—" : `${data.kpis.avgLeadToTrialDays}d`}
          />
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Trial → Pago"
            value={data.kpis.avgTrialToPaidDays === null ? "—" : `${data.kpis.avgTrialToPaidDays}d`}
          />
          <Stat
            icon={<Filter className="h-4 w-4" />}
            label="Conversão total"
            value={`${data.kpis.overallConversion}%`}
          />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Por UTM source</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Source</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">Trials</th>
                <th className="text-right p-2">Conv.</th>
                <th className="text-right p-2">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {data.byUtm.map((u) => (
                <tr key={u.source} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs truncate max-w-[140px]">{u.source}</td>
                  <td className="p-2 text-right tabular-nums">{u.leads}</td>
                  <td className="p-2 text-right tabular-nums">{u.trials}</td>
                  <td className="p-2 text-right tabular-nums">{u.converted}</td>
                  <td className="p-2 text-right tabular-nums">
                    <span className={u.conversion >= 10 ? "text-emerald-600 font-medium" : ""}>{u.conversion}%</span>
                  </td>
                </tr>
              ))}
              {data.byUtm.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">Sem dados.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Por nicho</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Nicho</th>
                <th className="text-right p-2">Visitas</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">V→L</th>
              </tr>
            </thead>
            <tbody>
              {data.byNiche.map((n) => (
                <tr key={n.niche} className="border-b last:border-0">
                  <td className="p-2 font-medium">{n.niche}</td>
                  <td className="p-2 text-right tabular-nums">{n.visitas}</td>
                  <td className="p-2 text-right tabular-nums">{n.leads}</td>
                  <td className="p-2 text-right tabular-nums">{n.conversion}%</td>
                </tr>
              ))}
              {data.byNiche.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">Sem dados.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}. Benchmarks SaaS B2B:
        V→L 5% · L→T 15% · T→C 20% · C→R 70%. Lead→Trial usa <code>trial.lead_id</code>;
        Trial→Pago usa <code>converted_at − created_at</code>.
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
