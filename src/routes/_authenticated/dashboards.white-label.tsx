import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/insights/KpiCard";
import { PercebidoSection } from "@/components/insights/PercebidoSection";
import { fetchWhiteLabelDashboard } from "@/lib/audience-dashboards.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboards/white-label")({
  head: () => ({ meta: [{ title: "Dashboard White Label — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: WlDashboardPage,
});

function WlDashboardPage() {
  const fn = useServerFn(fetchWhiteLabelDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboards", "white-label", 30],
    queryFn: () => fn({ data: { days: 30 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard — Parceiro White Label" description="Carteira de clientes WL, receita bruta, share do parceiro e suspensões." />
      <Badge variant="outline" className="text-[10px]">Visão preliminar — share do parceiro é estimativa até a flag is_white_label entrar (Fase 3).</Badge>

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">
          {(error as Error).message ?? "Não foi possível carregar."}
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando carteira WL…</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Carteira ativa" value={data.kpis.carteira.value} hint="Clientes ativos atribuídos" />
          <KpiCard label="Receita bruta (30d)" value={data.kpis.grossRevenue.value} delta={data.kpis.grossRevenue.delta} deltaPct={data.kpis.grossRevenue.deltaPct} format="currency" />
          <KpiCard label="Share do parceiro" value={data.kpis.partnerShare.value} delta={data.kpis.partnerShare.delta} deltaPct={data.kpis.partnerShare.deltaPct} format="currency" />
          <KpiCard label="Suspensões no período" value={data.kpis.suspensions.value} inverse />
        </div>
      )}

      <PercebidoSection audience="white-label" days={30} />
    </div>
  );
}
