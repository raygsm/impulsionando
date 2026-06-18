import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/insights/KpiCard";
import { PercebidoSection } from "@/components/insights/PercebidoSection";
import { fetchConsumidorDashboard } from "@/lib/audience-dashboards.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboards/consumidor")({
  head: () => ({ meta: [{ title: "Dashboard Consumidor — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ConsumidorDashboardPage,
});

function ConsumidorDashboardPage() {
  const fn = useServerFn(fetchConsumidorDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboards", "consumidor", 30],
    queryFn: () => fn({ data: { days: 30 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Minha área — Consumidor" description="Suas assinaturas, visitas, favoritos e próximas cobranças." />

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">
          {(error as Error).message ?? "Não foi possível carregar."}
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando seus dados…</Card>
      ) : (
        <>
          {data.profile && (
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Bem-vindo(a)</div>
              <div className="text-lg font-semibold">{data.profile.display_name ?? data.profile.email}</div>
              {data.nextDue && (
                <Badge variant="secondary" className="mt-2">
                  Próximo vencimento: {new Date(data.nextDue).toLocaleDateString("pt-BR")}
                </Badge>
              )}
            </Card>
          )}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Assinaturas ativas" value={data.kpis.activeMemberships.value} />
            <KpiCard label="Gasto no período" value={data.kpis.totalSpent.value} format="currency" />
            <KpiCard label="Visitas (30d)" value={data.kpis.visits.value} />
            <KpiCard label="Favoritos" value={data.kpis.favorites.value} />
          </div>
        </>
      )}

      <PercebidoSection audience="consumidor" days={30} />
    </div>
  );
}
