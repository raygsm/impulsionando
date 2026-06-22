import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTreasuryForecast } from "@/lib/treasury-forecast.functions";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/treasury-forecast")({
  head: () => ({
    meta: [
      { title: "Cash Flow & Treasury Forecast — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TreasuryPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function TreasuryPage() {
  const fn = useServerFn(getTreasuryForecast);
  const { data, isLoading } = useQuery({
    queryKey: ["treasury-forecast"],
    queryFn: () => fn({ data: {} }),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );

  const { kpis, forecast, aging } = data;
  const maxNet = Math.max(...forecast.map((f) => Math.abs(f.net)), 1);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Banknote className="h-6 w-6" /> Cash Flow & Treasury Forecast
        </h1>
        <p className="text-sm text-muted-foreground">
          Projeção 30/60/90 dias de entradas, saídas e aging da inadimplência.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Wallet} label="MRR ativo" value={BRL(kpis.activeMrr)} accent="ok" />
        <Kpi label="Contratos ativos" value={kpis.activeContracts} />
        <Kpi icon={TrendingUp} label="Recebido 30d" value={BRL(kpis.received30d)} accent="ok" />
        <Kpi label="Faturas abertas" value={`${kpis.openInvoicesCount} · ${BRL(kpis.openInvoicesTotal)}`} />
        <Kpi icon={TrendingDown} label="Payouts pendentes" value={BRL(kpis.pendingPayoutsTotal)} accent="warn" />
        <Kpi label="Coproducers/mês" value={BRL(kpis.coproducerCostMonthly)} />
        <Kpi icon={AlertTriangle} label="Inadimplência total" value={BRL(kpis.totalOverdue)} accent="warn" />
        <Kpi label="Net 90d (projetado)" value={BRL(kpis.cumulativeNet90d)} accent={kpis.cumulativeNet90d >= 0 ? "ok" : "warn"} />
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Forecast por bucket</h2>
        <div className="space-y-3">
          {forecast.map((f) => {
            const inflows = f.inflowsScheduled + f.inflowsRecurring;
            const w = Math.round((Math.abs(f.net) / maxNet) * 100);
            return (
              <div key={f.bucket} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{f.label}</div>
                  <div className={`text-lg font-semibold ${f.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {f.net >= 0 ? "+" : ""}{BRL(f.net)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                  <div>Entradas previstas: <span className="text-foreground font-medium">{BRL(f.inflowsScheduled)}</span></div>
                  <div>Recorrência projetada: <span className="text-foreground font-medium">{BRL(f.inflowsRecurring)}</span></div>
                  <div>Saídas: <span className="text-foreground font-medium">-{BRL(f.outflows)}</span></div>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full ${f.net >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${w}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Total entradas: {BRL(inflows)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Aging de vencidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aging.buckets.map((b) => (
            <div key={b.label} className="border rounded p-3">
              <div className="text-xs text-muted-foreground">{b.label}</div>
              <div className="text-lg font-semibold">{BRL(b.amount)}</div>
              <div className="text-xs text-muted-foreground">{b.count} fatura(s)</div>
            </div>
          ))}
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
