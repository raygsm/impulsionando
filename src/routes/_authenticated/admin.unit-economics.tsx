import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getUnitEconomics } from "@/lib/unit-economics.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Activity, Clock, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/unit-economics")({
  head: () => ({
    meta: [
      { title: "Unit Economics — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UnitEconomicsPage,
});

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function UnitEconomicsPage() {
  const fn = useServerFn(getUnitEconomics);
  const [cac, setCac] = useState(300);
  const { data, isLoading } = useQuery({
    queryKey: ["unit-economics", cac],
    queryFn: () => fn({ data: { cacAssumption: cac } }),
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );

  const k = data.kpis;
  const ratioColor =
    k.ratio >= 3 ? "bg-emerald-500" : k.ratio >= 1.5 ? "bg-amber-500" : "bg-destructive";

  const maxMrr = Math.max(...data.monthly.map((m) => m.mrr), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" /> Unit Economics
          </h1>
          <p className="text-sm text-muted-foreground">
            ARPU, churn, LTV, CAC e payback consolidados da plataforma.
          </p>
        </div>
        <div className="w-48">
          <Label htmlFor="cac" className="text-xs">CAC assumido (R$)</Label>
          <Input
            id="cac"
            type="number"
            min={0}
            value={cac}
            onChange={(e) => setCac(Math.max(0, Number(e.target.value || 0)))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Users className="h-4 w-4" />} label="Tenants Ativos" value={k.activeTenants.toString()} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="MRR (30d)" value={brl(k.mrr)} />
        <Kpi icon={<Target className="h-4 w-4" />} label="ARPU" value={brl(k.arpu)} />
        <Kpi
          icon={<Activity className="h-4 w-4" />}
          label="Churn mensal"
          value={`${k.churnRate}%`}
          sub={`${k.churned30} desativados em 30d`}
        />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="LTV" value={brl(k.ltv)} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="CAC" value={brl(k.cac)} />
        <Kpi
          icon={<Target className="h-4 w-4" />}
          label="LTV : CAC"
          value={`${k.ratio}x`}
          badgeClass={ratioColor}
        />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          label="Payback"
          value={k.paybackMonths ? `${k.paybackMonths} meses` : "—"}
        />
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Série mensal (últimos 12 meses)</h2>
        <div className="space-y-2">
          {data.monthly.map((m) => (
            <div key={m.month} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 text-xs">
              <span className="font-mono text-muted-foreground">{m.month}</span>
              <div className="h-5 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(m.mrr / maxMrr) * 100}%` }}
                />
              </div>
              <div className="flex gap-3 tabular-nums">
                <span>{brl(m.mrr)}</span>
                <span className="text-muted-foreground w-16 text-right">
                  +{m.novos} / -{m.churn}
                </span>
                <span className="text-muted-foreground w-20 text-right">{m.ativos} ativos</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Por nicho</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="text-left p-2">Nicho</th>
              <th className="text-right p-2">Ativos</th>
              <th className="text-right p-2">MRR</th>
              <th className="text-right p-2">ARPU</th>
            </tr>
          </thead>
          <tbody>
            {data.niches.map((n) => (
              <tr key={n.niche} className="border-b last:border-0">
                <td className="p-2 font-medium">{n.niche}</td>
                <td className="p-2 text-right tabular-nums">{n.active}</td>
                <td className="p-2 text-right tabular-nums">{brl(n.mrr)}</td>
                <td className="p-2 text-right tabular-nums">{brl(n.arpu)}</td>
              </tr>
            ))}
            {data.niches.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground text-sm">
                  Sem nichos com receita no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}. Premissas: MRR = pagas
        últimos 30d · Churn = desativações últimos 30d ÷ (ativos + churned) · LTV = ARPU ÷ churn
        (cap 60m se churn &lt; 0,5%).
      </p>
    </div>
  );
}

function Kpi({
  icon, label, value, sub, badgeClass,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; badgeClass?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {badgeClass && <Badge className={`${badgeClass} text-white border-0`}>•</Badge>}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}
