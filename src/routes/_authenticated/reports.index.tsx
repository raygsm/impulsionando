import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { fmtBRL, fmtInt, startOfMonthISO, endOfMonthISO } from "@/lib/reports";
import { Wallet, ShoppingCart, Users, Calendar, Package, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({ meta: [{ title: "Visão geral — Relatórios" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const from = startOfMonthISO();
  const to = endOfMonthISO();

  const { data: kpis } = useQuery({
    queryKey: ["report-overview", companyId, from, to], enabled: !!companyId,
    queryFn: async () => {
      const [orders, txIn, txOut, appts, leads, lowStock] = await Promise.all([
        supabase.from("sales_orders").select("total, status, confirmed_at").eq("company_id", companyId).eq("status", "confirmed").gte("confirmed_at", `${from}T00:00:00`).lte("confirmed_at", `${to}T23:59:59`),
        supabase.from("fin_transactions").select("net_amount").eq("company_id", companyId).eq("kind", "income").eq("status", "paid").gte("paid_at", `${from}T00:00:00`).lte("paid_at", `${to}T23:59:59`),
        supabase.from("fin_transactions").select("net_amount").eq("company_id", companyId).eq("kind", "expense").eq("status", "paid").gte("paid_at", `${from}T00:00:00`).lte("paid_at", `${to}T23:59:59`),
        supabase.from("agenda_appointments").select("id, status").eq("company_id", companyId).gte("starts_at", `${from}T00:00:00`).lte("starts_at", `${to}T23:59:59`),
        supabase.from("crm_leads").select("id, status").eq("company_id", companyId).gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`),
        supabase.from("inv_products").select("id, current_stock, min_stock").eq("company_id", companyId).eq("is_active", true),
      ]);
      const sumOrders = (orders.data ?? []).reduce((a, b) => a + Number(b.total), 0);
      const revenue = (txIn.data ?? []).reduce((a, b) => a + Number(b.net_amount), 0);
      const expense = (txOut.data ?? []).reduce((a, b) => a + Number(b.net_amount), 0);
      const totalAppts = appts.data?.length ?? 0;
      const completedAppts = (appts.data ?? []).filter((a) => a.status === "completed").length;
      const cancelledAppts = (appts.data ?? []).filter((a) => a.status === "cancelled" || a.status === "no_show").length;
      const newLeads = leads.data?.length ?? 0;
      const wonLeads = (leads.data ?? []).filter((l) => l.status === "won").length;
      const low = (lowStock.data ?? []).filter((p) => Number(p.current_stock) <= Number(p.min_stock ?? 0)).length;
      return { sumOrders, revenue, expense, profit: revenue - expense, totalAppts, completedAppts, cancelledAppts, newLeads, wonLeads, low, ordersCount: orders.data?.length ?? 0 };
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Visão geral" description={`Indicadores consolidados de ${from} a ${to}.`}
        action={<CompanyPicker />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita do mês" value={fmtBRL(kpis?.revenue ?? 0)} icon={TrendingUp} accent />
        <StatCard label="Despesas do mês" value={fmtBRL(kpis?.expense ?? 0)} icon={Wallet} />
        <StatCard label="Resultado" value={fmtBRL(kpis?.profit ?? 0)} hint={kpis && kpis.profit >= 0 ? "Superávit" : "Déficit"} icon={Wallet} />
        <StatCard label="Vendas confirmadas" value={fmtInt(kpis?.ordersCount ?? 0)} hint={fmtBRL(kpis?.sumOrders ?? 0)} icon={ShoppingCart} />
        <StatCard label="Agendamentos" value={fmtInt(kpis?.totalAppts ?? 0)} hint={`${kpis?.completedAppts ?? 0} concluídos · ${kpis?.cancelledAppts ?? 0} cancelados`} icon={Calendar} />
        <StatCard label="Novos leads" value={fmtInt(kpis?.newLeads ?? 0)} hint={`${kpis?.wonLeads ?? 0} ganhos`} icon={Users} />
        <StatCard label="Produtos em alerta" value={fmtInt(kpis?.low ?? 0)} hint="Abaixo do estoque mínimo" icon={Package} />
      </div>
      <Card className="mt-6 p-6 text-sm text-muted-foreground">
        Use as abas acima para detalhar cada área. Cada relatório permite exportar os dados em CSV.
      </Card>
    </div>
  );
}
