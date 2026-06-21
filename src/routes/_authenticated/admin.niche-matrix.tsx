import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, TrendingUp, Layers, Users, DollarSign } from "lucide-react";
import { getNichePerformanceMatrix } from "@/lib/niche-performance.functions";

export const Route = createFileRoute("/_authenticated/admin/niche-matrix")({
  head: () => ({ meta: [{ title: "Niche Performance Matrix — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: NicheMatrixPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type SortKey = "mrr" | "activeTenants" | "leads30d" | "conversionPct" | "health" | "ticketsOpen" | "eventsPerTenant";

function healthColor(h: number) {
  if (h >= 70) return "text-emerald-600";
  if (h >= 45) return "text-amber-600";
  return "text-destructive";
}

function NicheMatrixPage() {
  const fn = useServerFn(getNichePerformanceMatrix);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-niche-matrix"],
    queryFn: () => fn({ data: {} as never }),
    staleTime: 5 * 60 * 1000,
  });
  const [sort, setSort] = useState<SortKey>("mrr");

  const sorted = [...(data?.matrix ?? [])].sort((a, b) => (b[sort] as number) - (a[sort] as number));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Niche Performance Matrix</h1>
          <p className="text-sm text-muted-foreground">
            Compare desempenho de cada nicho do core Impulsionando — escalar, ajustar oferta ou congelar.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
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
        <div className="grid gap-3 sm:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Layers className="w-3 h-3" /> Nichos cobertos</div>
              <div className="text-2xl font-bold mt-1">{data.nichesCovered}</div>
              <div className="text-xs text-muted-foreground mt-1">com pelo menos 1 tenant ativo</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Users className="w-3 h-3" /> Tenants ativos</div>
              <div className="text-2xl font-bold mt-1">{data.totals.tenants}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><DollarSign className="w-3 h-3" /> MRR consolidado</div>
              <div className="text-2xl font-bold mt-1 text-primary">{brl(data.totals.mrr)}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><TrendingUp className="w-3 h-3" /> Leads 30d</div>
              <div className="text-2xl font-bold mt-1">{data.totals.leads}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.totals.tickets} tickets abertos</div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="text-sm font-semibold">Matriz por nicho</div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground mr-1">Ordenar:</span>
                {([
                  ["mrr", "MRR"],
                  ["activeTenants", "Tenants"],
                  ["leads30d", "Leads"],
                  ["conversionPct", "Conv%"],
                  ["health", "Saúde"],
                  ["ticketsOpen", "Tickets"],
                  ["eventsPerTenant", "Eventos/tenant"],
                ] as [SortKey, string][]).map(([k, label]) => (
                  <Button
                    key={k}
                    size="sm"
                    variant={sort === k ? "default" : "ghost"}
                    className="h-7 px-2"
                    onClick={() => setSort(k)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Nicho</th>
                    <th className="text-right p-3">Tenants</th>
                    <th className="text-right p-3">MRR</th>
                    <th className="text-right p-3">Ticket médio</th>
                    <th className="text-right p-3">Leads 30d</th>
                    <th className="text-right p-3">Conv %</th>
                    <th className="text-right p-3">Módulos/tenant</th>
                    <th className="text-right p-3">Eventos/tenant</th>
                    <th className="text-right p-3">Tickets</th>
                    <th className="text-right p-3">Saúde</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={row.nicheId} className="border-t hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium">{row.name}</div>
                        {row.slug && (
                          <Link to="/nichos/$slug" params={{ slug: row.slug }} className="text-xs text-muted-foreground hover:text-primary">
                            /nichos/{row.slug}
                          </Link>
                        )}
                      </td>
                      <td className="p-3 text-right">{row.activeTenants}<span className="text-xs text-muted-foreground">/{row.totalTenants}</span></td>
                      <td className="p-3 text-right font-semibold">{brl(row.mrr)}</td>
                      <td className="p-3 text-right">{brl(row.avgTicket)}</td>
                      <td className="p-3 text-right">{row.leads30d}</td>
                      <td className="p-3 text-right">{row.conversionPct}%</td>
                      <td className="p-3 text-right">{row.modulesPerTenant}</td>
                      <td className="p-3 text-right">{row.eventsPerTenant}</td>
                      <td className="p-3 text-right">
                        {row.ticketsOpen}
                        {row.ticketsUrgent > 0 && (
                          <Badge variant="destructive" className="ml-1 text-[10px] px-1">{row.ticketsUrgent} urg</Badge>
                        )}
                      </td>
                      <td className={`p-3 text-right font-bold ${healthColor(row.health)}`}>{row.health}</td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr><td colSpan={10} className="p-6 text-center text-sm text-muted-foreground">Sem dados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 text-xs text-muted-foreground">
            Última atualização: {new Date(data.generatedAt).toLocaleString("pt-BR")}. Score de saúde combina
            MRR (log), engajamento runtime, conversão de leads e pressão de suporte.
          </Card>
        </>
      ) : null}
    </div>
  );
}
