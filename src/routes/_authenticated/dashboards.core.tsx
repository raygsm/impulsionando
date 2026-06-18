import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/insights/KpiCard";
import { PercebidoSection } from "@/components/insights/PercebidoSection";
import { fetchCoreAudienceDashboard } from "@/lib/audience-dashboards.functions";
import { fetchMarketplaceKPIs } from "@/lib/marketplace.functions";
import { Loader2, TrendingUp, ArrowRight } from "lucide-react";

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const Route = createFileRoute("/_authenticated/dashboards/core")({
  head: () => ({ meta: [{ title: "Dashboard Core — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CoreDashboardPage,
});

function CoreDashboardPage() {
  const fn = useServerFn(fetchCoreAudienceDashboard);
  const mpFn = useServerFn(fetchMarketplaceKPIs);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboards", "core", 30],
    queryFn: () => fn({ data: { days: 30 } }),
    staleTime: 60_000,
  });
  const { data: mp } = useQuery({
    queryKey: ["dashboards", "core", "mp", 30],
    queryFn: () => mpFn({ data: { sinceDays: 30 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard — Core Impulsionando" description="Visão consolidada da plataforma: receita, leads, carteira e saúde operacional." />

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">
          {(error as Error).message ?? "Não foi possível carregar."}
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando KPIs do Core…</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Receita paga (30d)" value={data.kpis.revenue.value} delta={data.kpis.revenue.delta} deltaPct={data.kpis.revenue.deltaPct} format="currency" />
            <KpiCard label="Leads novos" value={data.kpis.leads.value} delta={data.kpis.leads.delta} deltaPct={data.kpis.leads.deltaPct} />
            <KpiCard label="Empresas ativas" value={data.kpis.companies.value} hint="Total na plataforma" />
            <KpiCard label="Falhas N8N" value={data.kpis.n8nFailures.value} inverse hint="Workflows com erro no período" />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Top nichos por carteira</h2>
              <Badge variant="secondary">{data.topNiches.length}</Badge>
            </div>
            {data.topNiches.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum nicho com empresas ativas.</div>
            ) : (
              <div className="space-y-2">
                {data.topNiches.map((n) => {
                  const max = data.topNiches[0]?.count || 1;
                  return (
                    <div key={n.id} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium truncate">{n.name}</div>
                      <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(n.count / max) * 100}%` }} />
                      </div>
                      <div className="w-12 text-right text-sm tabular-nums">{n.count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Marketplace B2B — GMV + receita de Taxa de Intermediação Digital */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Marketplace B2B (30 dias)
          </h2>
          <Link to="/core/marketplace" className="text-xs text-primary inline-flex items-center gap-1">
            Abrir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Volume transacionado (GMV)</div>
            <div className="text-xl font-bold">{brl(mp?.gmv_cents ?? 0)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Receita Marketplace</div>
            <div className="text-xl font-bold">{brl(mp?.fee_cents ?? 0)}</div>
            <div className="text-[10px] text-muted-foreground">Taxa de Intermediação Digital</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Pedidos concluídos</div>
            <div className="text-xl font-bold">{mp?.orders ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Líquido a fornecedores</div>
            <div className="text-xl font-bold">{brl(mp?.supplier_net_cents ?? 0)}</div>
          </div>
        </div>
      </Card>

      <PercebidoSection audience="core" days={30} />
    </div>
  );
}
