import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchNicheRadar } from "@/lib/audience-dashboards.functions";
import { Loader2, Radar, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/_authenticated/radar")({
  head: () => ({ meta: [{ title: "Radar do Nicho — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: RadarPage,
});

function RadarPage() {
  const fn = useServerFn(fetchNicheRadar);
  const { data, isLoading, error } = useQuery({
    queryKey: ["radar", "all", 30],
    queryFn: () => fn({ data: { days: 30 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Radar do Nicho" description="Métricas por subcategoria com recomendações de ações para cada nicho." />

      <Card className="p-3 text-xs text-muted-foreground flex items-center gap-2">
        <Radar className="h-3.5 w-3.5" />
        Anonimização aplicada quando o nicho tem menos que <strong>{data?.nMin ?? 10}</strong> empresas ativas (N mínimo).
      </Card>

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">
          {(error as Error).message ?? "Não foi possível carregar."}
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calculando o radar…</Card>
      ) : (
        <div className="space-y-3">
          {data.rows.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{r.name}</h3>
                    {r.anonymized && <Badge variant="outline" className="text-[10px]">anonimizado (N&lt;{data.nMin})</Badge>}
                  </div>
                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Empresas ativas</div>
                      <div className="font-semibold text-sm">{r.activeCompanies}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Receita 30d</div>
                      <div className="font-semibold text-sm">
                        {r.anonymized ? "—" : r.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Ticket médio</div>
                      <div className="font-semibold text-sm">
                        {r.anonymized ? "—" : r.avgRevenuePerCompany.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Leads</div>
                      <div className="font-semibold text-sm">{r.leads}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Recomendações
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                  {r.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            </Card>
          ))}
          {data.rows.length === 0 && <Card className="p-6 text-sm text-muted-foreground">Sem nichos ativos no período.</Card>}
        </div>
      )}
    </div>
  );
}
