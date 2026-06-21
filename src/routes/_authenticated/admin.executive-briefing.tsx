import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExecutiveBriefing } from "@/lib/executive-briefing.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/executive-briefing")({
  head: () => ({ meta: [{ title: "Executive Briefing — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ExecutiveBriefingPage,
});

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ExecutiveBriefingPage() {
  const fn = useServerFn(getExecutiveBriefing);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["executive-briefing"],
    queryFn: () => fn(),
    staleTime: 10 * 60_000,
  });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  if (!data) return <div className="p-6">Sem dados.</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> Executive Briefing</h1>
          <p className="text-sm text-muted-foreground">Narrativa diária gerada por IA a partir dos KPIs operacionais.</p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Regenerar
        </Button>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-muted-foreground text-xs">MRR ativo</div><div className="font-semibold">{fmtBRL(data.snapshot.mrr_brl)}</div></div>
          <div><div className="text-muted-foreground text-xs">Tenants ativos</div><div className="font-semibold">{data.snapshot.tenants_ativos}</div></div>
          <div><div className="text-muted-foreground text-xs">Leads 24h</div><div className="font-semibold">{data.snapshot.leads_24h}</div></div>
          <div><div className="text-muted-foreground text-xs">Leads 7d</div><div className="font-semibold">{data.snapshot.leads_7d} ({data.snapshot.leads_delta_pct_vs_7d_anteriores >= 0 ? "+" : ""}{data.snapshot.leads_delta_pct_vs_7d_anteriores}%)</div></div>
          <div><div className="text-muted-foreground text-xs">Demos 7d</div><div className="font-semibold">{data.snapshot.demos_7d}</div></div>
          <div><div className="text-muted-foreground text-xs">Orçamentos 7d</div><div className="font-semibold">{data.snapshot.orcamentos_7d}</div></div>
          <div><div className="text-muted-foreground text-xs">Tickets / urgentes</div><div className="font-semibold">{data.snapshot.tickets_abertos} / {data.snapshot.tickets_urgentes}</div></div>
          <div><div className="text-muted-foreground text-xs">N8N falhas 7d</div><div className="font-semibold">{data.snapshot.automacoes_falharam_7d}/{data.snapshot.automacoes_total_7d}</div></div>
        </div>
      </Card>

      <Card className="p-6">
        {data.error && (
          <p className="text-sm text-destructive mb-4">Não foi possível gerar a narrativa: {data.error}</p>
        )}
        {data.briefing ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{data.briefing}</div>
        ) : !data.error ? (
          <p className="text-sm text-muted-foreground">Sem briefing.</p>
        ) : null}
      </Card>
    </div>
  );
}
