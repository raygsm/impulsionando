import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingDown, DollarSign, Activity, ArrowRight } from "lucide-react";
import { getChurnRiskRanking } from "@/lib/churn-risk.functions";

export const Route = createFileRoute("/_authenticated/admin/churn-risk")({
  head: () => ({ meta: [{ title: "Churn Risk — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ChurnRiskPage,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ChurnRiskPage() {
  const fn = useServerFn(getChurnRiskRanking);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-churn-risk"],
    queryFn: () => fn({ data: {} as never }),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="w-7 h-7 text-destructive" /> Churn Risk Ranking
          </h1>
          <p className="text-sm text-muted-foreground">Ranking de tenants por risco de churn — score 0-100.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : data && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">Tenants ativos</div>
              <div className="text-3xl font-bold mt-1">{data.summary.total}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risco alto</div>
              <div className="text-3xl font-bold mt-1 text-destructive">{data.summary.high}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.summary.medium} médio · {data.summary.low} baixo</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> MRR em risco</div>
              <div className="text-3xl font-bold mt-1 text-destructive">{brl(data.summary.mrr_at_risk)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" /> Cobertura</div>
              <div className="text-3xl font-bold mt-1">{data.summary.total > 0 ? Math.round((data.summary.high / data.summary.total) * 100) : 0}%</div>
              <div className="text-xs text-muted-foreground mt-1">tenants em alerta</div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/40 text-xs uppercase tracking-wide font-semibold">Top 50 — maior risco primeiro</div>
            <div className="divide-y">
              {data.ranking.slice(0, 50).map((t) => (
                <div key={t.company_id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30">
                  <div className="w-12 text-center">
                    <div className={`text-lg font-bold ${t.band === "alto" ? "text-destructive" : t.band === "médio" ? "text-amber-600" : "text-emerald-600"}`}>{t.score}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.reasons.join(" · ") || "sem sinais críticos"}</div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold">{brl(t.mrr)}</div>
                    <div className="text-xs text-muted-foreground">{t.age_days}d · {t.events_30d} eventos</div>
                  </div>
                  <Badge variant={t.band === "alto" ? "destructive" : t.band === "médio" ? "secondary" : "outline"} className="capitalize">{t.band}</Badge>
                  <Link to="/admin/tenant-360" search={{ companyId: t.company_id } as never} className="text-primary hover:opacity-80">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
              {data.ranking.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum tenant ativo encontrado.</div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
