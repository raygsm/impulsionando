import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, RefreshCw } from "lucide-react";
import { getRevenueForecast } from "@/lib/revenue-forecast.functions";

export const Route = createFileRoute("/_authenticated/admin/revenue-forecast")({
  head: () => ({ meta: [{ title: "Revenue Forecast — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: RevenueForecastPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function RevenueForecastPage() {
  const fn = useServerFn(getRevenueForecast);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-revenue-forecast"],
    queryFn: () => fn({ data: {} as never }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Revenue Forecast</h1>
          <p className="text-sm text-muted-foreground">
            Projeção MRR 30/60/90 dias — combina contratos ativos, risco de churn e velocidade de vendas.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Recalcular
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" /> {(error as Error).message}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">MRR atual</div>
              <div className="text-2xl font-bold mt-1 text-primary">{brl(data.currentMRR)}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.activeContracts} contratos ativos</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">Velocidade nova receita</div>
              <div className="text-2xl font-bold mt-1">{brl(data.newMRRPerDay)}/dia</div>
              <div className="text-xs text-muted-foreground mt-1">Média 60 dias</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">Churn rate diário</div>
              <div className="text-2xl font-bold mt-1">{data.baseChurnRatePct}%</div>
              <div className="text-xs text-muted-foreground mt-1">Histórico 60 dias</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">MRR em risco</div>
              <div className="text-2xl font-bold mt-1 text-destructive">{brl(data.mrrAtRiskHigh)}</div>
              <div className="text-xs text-muted-foreground mt-1">+ {brl(data.mrrAtRiskMid)} risco médio</div>
            </Card>
          </div>

          <section>
            <h2 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">
              Cenários projetados
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {data.projections.map((p) => {
                const delta = p.base - data.currentMRR;
                const pct = data.currentMRR > 0 ? (delta / data.currentMRR) * 100 : 0;
                return (
                  <Card key={p.days} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">{p.days} dias</h3>
                      <Badge variant={delta >= 0 ? "default" : "destructive"} className="gap-1">
                        {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Cenário base</div>
                        <div className="text-2xl font-bold text-primary">{brl(p.base)}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground">Pessimista</div>
                          <div className="font-semibold text-destructive">{brl(p.pessimista)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Otimista</div>
                          <div className="font-semibold text-emerald-600">{brl(p.otimista)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                        <div>
                          <div className="text-muted-foreground">Churn esperado</div>
                          <div className="font-semibold text-destructive">- {brl(p.churnExpected)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Nova receita</div>
                          <div className="font-semibold text-emerald-600">+ {brl(p.newExpected)}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <Card className="p-4 text-xs text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Última atualização: {new Date(data.generatedAt).toLocaleString("pt-BR")}. Modelo combina score
            de risco por tenant (atividade, suspensões, tickets) + taxa histórica de churn + velocidade média
            de novas contratações.
          </Card>
        </>
      ) : null}
    </div>
  );
}
