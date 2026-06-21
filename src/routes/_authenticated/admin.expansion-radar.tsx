import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExpansionOpportunities } from "@/lib/expansion-radar.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket, TrendingUp, Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/expansion-radar")({
  head: () => ({ meta: [{ title: "Expansion Radar — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ExpansionRadarPage,
});

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ExpansionRadarPage() {
  const fn = useServerFn(getExpansionOpportunities);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "expansion-radar"],
    queryFn: () => fn({}),
  });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (error) return <div className="p-6 text-destructive">Erro: {(error as Error).message}</div>;
  if (!data) return null;

  const { summary, opportunities } = data;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Rocket className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Expansion Radar</h1>
          <p className="text-sm text-muted-foreground">
            Recomendações de upsell por tenant via filtragem colaborativa dos peers do mesmo nicho.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Oportunidades</div>
          <div className="text-2xl font-bold">{summary.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Tenants com gaps</div>
          <div className="text-2xl font-bold">{summary.tenants_with_gaps}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Uplift potencial (MRR)</div>
          <div className="text-2xl font-bold text-emerald-600">{fmtBRL(summary.potential_uplift_mrr)}</div>
          <div className="text-[10px] text-muted-foreground">Top 100 a 15% de attach</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Top módulo recomendado</div>
          <div className="text-lg font-semibold truncate">{summary.top_modules[0]?.module_name ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">{summary.top_modules[0]?.count ?? 0} tenants</div>
        </Card>
      </div>

      {summary.top_modules.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4" /><h2 className="font-semibold">Top módulos com gap</h2></div>
          <div className="flex flex-wrap gap-2">
            {summary.top_modules.map((m) => (
              <Badge key={m.module_code} variant="secondary">{m.module_name} · {m.count}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4" /><h2 className="font-semibold">Oportunidades ranqueadas</h2></div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {opportunities.map((o, i) => (
            <div key={`${o.company_id}-${o.module_code}-${i}`} className="flex items-center justify-between p-3 rounded border hover:bg-muted/50">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{o.company_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{o.module_name}</span> · nicho {o.niche_code} · {o.peer_adoption_rate}% dos peers já usam
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {o.healthy && <Badge variant="outline" className="text-emerald-600 border-emerald-600/40"><TrendingUp className="w-3 h-3 mr-1" />saudável</Badge>}
                <Badge>{o.score}</Badge>
                <span className="text-xs text-muted-foreground w-20 text-right">{fmtBRL(o.current_mrr)}</span>
              </div>
            </div>
          ))}
          {opportunities.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">Nenhum gap relevante detectado.</div>}
        </div>
      </Card>
    </div>
  );
}
