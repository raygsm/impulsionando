import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/insights/KpiCard";
import { PercebidoSection } from "@/components/insights/PercebidoSection";
import { fetchEmpresaDashboard } from "@/lib/audience-dashboards.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboards/empresa")({
  head: () => ({ meta: [{ title: "Dashboard Empresa — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: EmpresaDashboardPage,
});

function EmpresaDashboardPage() {
  const { companyId } = useActiveCompany();
  const fn = useServerFn(fetchEmpresaDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboards", "empresa", companyId, 30],
    enabled: !!companyId,
    queryFn: () => fn({ data: { companyId: companyId!, days: 30 } }),
    staleTime: 60_000,
  });

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard — Empresa" description="Selecione uma empresa para visualizar os KPIs." />
        <Card className="p-6 text-sm text-muted-foreground">Nenhuma empresa selecionada.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard — Empresa" description="Visão operacional da sua empresa: receita, leads, agenda e cobrança." />

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">
          {(error as Error).message ?? "Não foi possível carregar."}
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando seus KPIs…</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Receita (30d)" value={data.kpis.revenue.value} delta={data.kpis.revenue.delta} deltaPct={data.kpis.revenue.deltaPct} format="currency" />
            <KpiCard label="Leads novos" value={data.kpis.leads.value} delta={data.kpis.leads.delta} deltaPct={data.kpis.leads.deltaPct} />
            <KpiCard label="Clientes novos" value={data.kpis.newCustomers.value} hint={`Total: ${data.kpis.totalCustomers.value.toLocaleString("pt-BR")}`} />
            <KpiCard label="Faturas em atraso" value={data.kpis.overdueInvoices.value} inverse hint={`${data.kpis.pendingInvoices.value} pendentes`} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <KpiCard label="Agendamentos" value={data.kpis.appointments.value} />
            <KpiCard label="Concluídos" value={data.kpis.appointmentsDone.value} />
            <KpiCard label="No-show" value={data.kpis.noShow.value} inverse />
          </div>
        </>
      )}

      <PercebidoSection audience="empresa" companyId={companyId} days={30} />
    </div>
  );
}
