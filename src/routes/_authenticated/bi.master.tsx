import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtBRL, fmtInt, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";
import { Building2, TrendingUp, ShoppingCart, Users, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bi/master")({
  head: () => ({ meta: [{ title: "BI — Master" }] }),
  component: Page,
});

function Page() {
  const { data: me } = useCurrentUser();
  const from = startOfMonthISO();
  const to = endOfMonthISO();

  const { data } = useQuery({
    queryKey: ["bi-master", from, to],
    enabled: !!me?.isSuperAdmin,
    queryFn: async () => {
      const [companies, orders, txIn, leads, appts] = await Promise.all([
        supabase.from("companies").select("id, name, niche_id, is_master, is_active"),
        supabase.from("sales_orders").select("company_id, total").eq("status", "confirmed").gte("confirmed_at", `${from}T00:00:00`).lte("confirmed_at", `${to}T23:59:59`),
        supabase.from("fin_transactions").select("company_id, net_amount").eq("kind", "income").eq("status", "paid").gte("paid_at", `${from}T00:00:00`).lte("paid_at", `${to}T23:59:59`),
        supabase.from("crm_leads").select("company_id, status").gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`),
        supabase.from("agenda_appointments").select("company_id, status").gte("starts_at", `${from}T00:00:00`).lte("starts_at", `${to}T23:59:59`),
      ]);
      const cos = (companies.data ?? []).filter((c) => !c.is_master);
      const byCo = cos.map((c) => {
        const revenue = (txIn.data ?? []).filter((t) => t.company_id === c.id).reduce((a, b) => a + Number(b.net_amount), 0);
        const ords = (orders.data ?? []).filter((o) => o.company_id === c.id);
        const sumOrders = ords.reduce((a, b) => a + Number(b.total), 0);
        const ordersCount = ords.length;
        const ldsAll = (leads.data ?? []).filter((l) => l.company_id === c.id);
        const won = ldsAll.filter((l) => l.status === "won").length;
        const apptsCount = (appts.data ?? []).filter((a) => a.company_id === c.id).length;
        return {
          id: c.id, name: c.name, active: c.is_active, niche_id: c.niche_id,
          revenue, ordersCount, sumOrders, ticket: ordersCount ? sumOrders / ordersCount : 0,
          newLeads: ldsAll.length, wonLeads: won, appts: apptsCount,
        };
      });
      const totals = {
        companies: cos.length,
        active: cos.filter((c) => c.is_active).length,
        revenue: byCo.reduce((a, b) => a + b.revenue, 0),
        ordersCount: byCo.reduce((a, b) => a + b.ordersCount, 0),
        sumOrders: byCo.reduce((a, b) => a + b.sumOrders, 0),
        newLeads: byCo.reduce((a, b) => a + b.newLeads, 0),
        wonLeads: byCo.reduce((a, b) => a + b.wonLeads, 0),
        appts: byCo.reduce((a, b) => a + b.appts, 0),
      };
      const sorted = byCo.sort((a, b) => b.revenue - a.revenue);
      return { byCo: sorted, totals };
    },
  });

  if (!me?.isSuperAdmin)
    return <EmptyState title="Acesso restrito" description="Apenas usuários da Impulsionando (Super Admin) acessam o dashboard Master." />;

  const exportCSV = () => {
    if (!data) return;
    downloadCSV(`bi-master-${from}.csv`, data.byCo.map((r) => ({
      empresa: r.name, ativa: r.active ? "sim" : "nao",
      receita: r.revenue.toFixed(2), vendas: r.ordersCount, total_vendas: r.sumOrders.toFixed(2),
      ticket_medio: r.ticket.toFixed(2), leads: r.newLeads, leads_ganhos: r.wonLeads, agendamentos: r.appts,
    })));
  };

  const t = data?.totals;

  return (
    <div>
      <PageHeader
        title="Dashboard Master"
        description={`Visão consolidada da plataforma · ${from} a ${to}.`}
        action={
          <Button variant="outline" onClick={exportCSV} disabled={!data}>
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Empresas ativas" value={fmtInt(t?.active ?? 0)} hint={`${t?.companies ?? 0} totais`} icon={Building2} accent />
        <StatCard label="Receita total" value={fmtBRL(t?.revenue ?? 0)} icon={TrendingUp} />
        <StatCard label="Vendas" value={fmtInt(t?.ordersCount ?? 0)} hint={fmtBRL(t?.sumOrders ?? 0)} icon={ShoppingCart} />
        <StatCard label="Leads · Conversões" value={fmtInt(t?.newLeads ?? 0)} hint={`${t?.wonLeads ?? 0} ganhos · ${t?.appts ?? 0} agendamentos`} icon={Users} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold mb-4">Empresas por receita</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Empresa</th>
                <th className="py-2 text-right">Receita</th>
                <th className="py-2 text-right">Vendas</th>
                <th className="py-2 text-right">Ticket</th>
                <th className="py-2 text-right">Leads</th>
                <th className="py-2 text-right">Agenda</th>
              </tr>
            </thead>
            <tbody>
              {(data?.byCo ?? []).map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2">{r.name} {!r.active && <span className="text-xs text-muted-foreground ml-1">(inativa)</span>}</td>
                  <td className="py-2 text-right font-medium">{fmtBRL(r.revenue)}</td>
                  <td className="py-2 text-right">{fmtInt(r.ordersCount)}</td>
                  <td className="py-2 text-right text-muted-foreground">{fmtBRL(r.ticket)}</td>
                  <td className="py-2 text-right">{fmtInt(r.newLeads)} <span className="text-muted-foreground">/ {r.wonLeads}</span></td>
                  <td className="py-2 text-right">{fmtInt(r.appts)}</td>
                </tr>
              ))}
              {data && data.byCo.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhuma empresa cliente cadastrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
