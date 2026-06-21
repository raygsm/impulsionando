import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRevenueQuality } from "@/lib/revenue-quality.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge, AlertTriangle, DollarSign, Users, Layers, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/revenue-quality")({
  head: () => ({
    meta: [
      { title: "Revenue Quality — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RevenueQualityPage,
});

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

const severityClass: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  warn: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

function RevenueQualityPage() {
  const fn = useServerFn(getRevenueQuality);
  const { data, isLoading } = useQuery({
    queryKey: ["revenue-quality"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );

  const k = data.kpis;
  const concentrationColor =
    k.top10Share >= 70 ? "text-destructive" : k.top10Share >= 50 ? "text-amber-600" : "text-emerald-600";
  const recurringColor =
    k.recurringShare >= 80 ? "text-emerald-600" : k.recurringShare >= 60 ? "text-amber-600" : "text-destructive";
  const maxTop = Math.max(...data.top10.map((t) => t.mrr), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gauge className="h-6 w-6" /> Revenue Quality
        </h1>
        <p className="text-sm text-muted-foreground">
          Qualidade da receita — recorrência, concentração e diversificação.
        </p>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${severityClass[a.severity]}`}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="MRR Recorrente" value={brl(k.recurringMRR)} sub={`${k.activeContracts} contratos`} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Recorrência (90d)" value={`${k.recurringShare}%`} valueClass={recurringColor} sub={`${k.oneOffShare}% avulso`} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Clientes únicos" value={k.uniqueCustomers.toString()} sub={`Maior = ${k.top1Share}%`} />
        <Kpi icon={<Layers className="h-4 w-4" />} label="Top 10 share" value={`${k.top10Share}%`} valueClass={concentrationColor} sub={`HHI ${k.hhi}`} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="Receita paga 90d" value={brl(k.paid90)} />
        <Kpi icon={<Gauge className="h-4 w-4" />} label="Idade média contrato" value={`${k.avgContractAgeMonths}m`} sub={`${k.matureShare}% com 12m+`} />
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Top 10 clientes por MRR</h2>
        <div className="space-y-2">
          {data.top10.map((t, i) => (
            <div key={t.company_id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
              <div>
                <div className="font-medium truncate">{t.company_name}</div>
                <div className="h-1.5 bg-muted rounded mt-1 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(t.mrr / maxTop) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium tabular-nums">{brl(t.mrr)}</div>
                <div className="text-xs text-muted-foreground">
                  {k.recurringMRR > 0 ? ((t.mrr / k.recurringMRR) * 100).toFixed(1) : 0}% · {t.niche}
                </div>
              </div>
            </div>
          ))}
          {data.top10.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sem contratos ativos.</p>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Por nicho</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Nicho</th>
                <th className="text-right p-2">Tenants</th>
                <th className="text-right p-2">MRR</th>
                <th className="text-right p-2">%</th>
              </tr>
            </thead>
            <tbody>
              {data.byNiche.map((n) => (
                <tr key={n.niche} className="border-b last:border-0">
                  <td className="p-2 font-medium">{n.niche}</td>
                  <td className="p-2 text-right tabular-nums">{n.tenants}</td>
                  <td className="p-2 text-right tabular-nums">{brl(n.mrr)}</td>
                  <td className="p-2 text-right tabular-nums text-muted-foreground">
                    {k.recurringMRR > 0 ? ((n.mrr / k.recurringMRR) * 100).toFixed(0) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Por plano</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Plano</th>
                <th className="text-left p-2">Tier</th>
                <th className="text-right p-2">Contratos</th>
                <th className="text-right p-2">MRR</th>
              </tr>
            </thead>
            <tbody>
              {data.byPlan.map((p) => (
                <tr key={p.plan} className="border-b last:border-0">
                  <td className="p-2 font-medium">{p.plan}</td>
                  <td className="p-2"><Badge variant="outline" className="text-xs">{p.tier}</Badge></td>
                  <td className="p-2 text-right tabular-nums">{p.contratos}</td>
                  <td className="p-2 text-right tabular-nums">{brl(p.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}. HHI &gt; 2500 = altamente
        concentrado · &gt; 1500 = moderado · &lt; 1500 = saudável. Top-10 &gt; 70% indica
        dependência crítica de poucos clientes.
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
