import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, Heart } from "lucide-react";
import { fetchHealthScore } from "@/lib/health-score.functions";

export const Route = createFileRoute("/_authenticated/admin/health-score")({
  head: () => ({ meta: [{ title: "Health Score Global — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: HealthScorePage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const TIER_COLOR: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-sky-500",
  C: "bg-amber-500",
  D: "bg-destructive",
};

function HealthScorePage() {
  const fn = useServerFn(fetchHealthScore);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["health-score"],
    queryFn: () => fn({ data: {} }),
    staleTime: 120_000,
  });
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<string>("all");

  const d = data as any;
  const tenants = useMemo(() => {
    if (!d) return [] as any[];
    let arr = d.tenants as any[];
    if (tier !== "all") arr = arr.filter((t) => t.tier === tier);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((t) => t.name.toLowerCase().includes(q));
    }
    return arr;
  }, [d, tier, search]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Health Score Global"
        description="Pontuação consolidada por tenant — combina integrações, estabilidade, financeiro, adoção e engajamento. Pesos: estabilidade 25% · integrações 20% · financeiro 20% · adoção 20% · engajamento 15%."
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}
      {error && <Card className="p-4 text-destructive">{(error as Error).message}</Card>}

      {d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Tenants avaliados" value={d.kpis.count} />
            <KpiCard label="Score médio" value={d.kpis.average} hint="0–100" />
            <KpiCard label="Em risco (C+D)" value={d.kpis.atRisk} />
            <KpiCard label="Com alertas" value={d.kpis.alerting} />
            <KpiCard label="Tier A" value={d.kpis.distribution.A} hint={`B:${d.kpis.distribution.B} C:${d.kpis.distribution.C} D:${d.kpis.distribution.D}`} />
          </div>

          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Buscar tenant…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex gap-1">
                {(["all", "A", "B", "C", "D"] as const).map((t) => (
                  <Button key={t} size="sm" variant={tier === t ? "default" : "outline"} onClick={() => setTier(t)}>
                    {t === "all" ? "Todos" : `Tier ${t}`}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="text-sm min-w-full">
                <thead>
                  <tr className="border-b border-border/40 text-xs text-muted-foreground">
                    <th className="text-left p-2">Tier</th>
                    <th className="text-left p-2">Tenant</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-center p-2">Integ</th>
                    <th className="text-center p-2">Estab</th>
                    <th className="text-center p-2">Fin</th>
                    <th className="text-center p-2">Adoção</th>
                    <th className="text-center p-2">Engaj</th>
                    <th className="text-right p-2">MRR</th>
                    <th className="text-center p-2">Trend</th>
                    <th className="text-left p-2">Alertas</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t: any) => (
                    <tr key={t.id} className="border-b border-border/20 hover:bg-muted/30">
                      <td className="p-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${TIER_COLOR[t.tier]}`}>
                          {t.tier}
                        </span>
                      </td>
                      <td className="p-2">
                        <Link to="/admin/tenant/$id" params={{ id: t.id }} className="font-medium hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="p-2 min-w-32">
                        <div className="flex items-center gap-2">
                          <Progress value={t.scores.overall} className="h-2 flex-1" />
                          <span className="font-mono text-xs w-8 text-right">{t.scores.overall}</span>
                        </div>
                      </td>
                      <SubCell v={t.scores.integrations} />
                      <SubCell v={t.scores.stability} />
                      <SubCell v={t.scores.financial} />
                      <SubCell v={t.scores.adoption} />
                      <SubCell v={t.scores.engagement} />
                      <td className="p-2 text-right">{fmtBRL(t.signals.mrrBRL)}</td>
                      <td className="p-2 text-center">
                        {t.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : t.trend === "down" ? (
                          <TrendingDown className="h-4 w-4 text-destructive mx-auto" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="p-2">
                        {t.alerts.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {t.alerts.map((a: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {a}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-6 text-center text-muted-foreground text-sm">
                        Nenhum tenant com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Heart className="h-4 w-4 text-pink-500" /> Como o score é calculado
            </div>
            <div><strong>Integrações (20%):</strong> 100 – 25 por integração quebrada.</div>
            <div><strong>Estabilidade (25%):</strong> 100 – 2 por erro/crítico nos últimos 7 dias.</div>
            <div><strong>Financeiro (20%):</strong> 100 – 30 por fatura vencida (–20 extra se &gt; R$ 1.000 em aberto).</div>
            <div><strong>Adoção (20%):</strong> +50 MRR &gt; 0, +30 tem clientes, +20 tem contrato.</div>
            <div><strong>Engajamento (15%):</strong> log₁₀(receita_30d_centavos/100 + clientes×10) × 25.</div>
            <div><strong>Tier:</strong> A ≥ 85 · B ≥ 70 · C ≥ 50 · D &lt; 50. Trend compara erros 7d vs. semana anterior.</div>
          </Card>
        </>
      )}
    </div>
  );
}

function SubCell({ v }: { v: number }) {
  const color = v >= 80 ? "text-emerald-600" : v >= 60 ? "text-sky-600" : v >= 40 ? "text-amber-600" : "text-destructive";
  return <td className={`p-2 text-center font-mono text-xs ${color}`}>{v}</td>;
}
