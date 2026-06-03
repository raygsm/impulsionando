import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtBRL, fmtInt, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";
import { Tags, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bi/niches")({
  head: () => ({ meta: [{ title: "BI — Por nicho" }] }),
  component: Page,
});

function Page() {
  const { data: me } = useCurrentUser();
  const from = startOfMonthISO();
  const to = endOfMonthISO();

  const { data } = useQuery({
    queryKey: ["bi-niches", from, to],
    enabled: !!me?.isSuperAdmin,
    queryFn: async () => {
      const [niches, companies, txIn, orders, leads, appts] = await Promise.all([
        supabase.from("niches").select("id, name"),
        supabase.from("companies").select("id, niche_id, is_master, is_active"),
        supabase.from("fin_transactions").select("company_id, net_amount").eq("kind", "income").eq("status", "paid").gte("paid_at", `${from}T00:00:00`).lte("paid_at", `${to}T23:59:59`),
        supabase.from("sales_orders").select("company_id, total").eq("status", "confirmed").gte("confirmed_at", `${from}T00:00:00`).lte("confirmed_at", `${to}T23:59:59`),
        supabase.from("crm_leads").select("company_id, status").gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`),
        supabase.from("agenda_appointments").select("company_id").gte("starts_at", `${from}T00:00:00`).lte("starts_at", `${to}T23:59:59`),
      ]);
      const cos = (companies.data ?? []).filter((c) => !c.is_master);
      const byNiche = (niches.data ?? []).map((n) => {
        const myCos = cos.filter((c) => c.niche_id === n.id);
        const ids = new Set(myCos.map((c) => c.id));
        const revenue = (txIn.data ?? []).filter((t) => ids.has(t.company_id)).reduce((a, b) => a + Number(b.net_amount), 0);
        const ords = (orders.data ?? []).filter((o) => ids.has(o.company_id));
        const sumOrders = ords.reduce((a, b) => a + Number(b.total), 0);
        const ldsAll = (leads.data ?? []).filter((l) => ids.has(l.company_id));
        const won = ldsAll.filter((l) => l.status === "won").length;
        const apptsCount = (appts.data ?? []).filter((a) => ids.has(a.company_id)).length;
        const companiesCount = myCos.length;
        return {
          id: n.id, name: n.name, companies: companiesCount, active: myCos.filter((c) => c.is_active).length,
          revenue, avgRevenue: companiesCount ? revenue / companiesCount : 0,
          ordersCount: ords.length, sumOrders, ticket: ords.length ? sumOrders / ords.length : 0,
          newLeads: ldsAll.length, wonLeads: won, conversion: ldsAll.length ? (won / ldsAll.length) * 100 : 0,
          appts: apptsCount,
        };
      }).sort((a, b) => b.revenue - a.revenue);
      return byNiche;
    },
  });

  if (!me?.isSuperAdmin)
    return <EmptyState title="Acesso restrito" description="Apenas Super Admin Impulsionando acessa o BI por nicho." />;

  const exportCSV = () => {
    if (!data) return;
    downloadCSV(`bi-nichos-${from}.csv`, data.map((n) => ({
      nicho: n.name, empresas: n.companies, ativas: n.active,
      receita_total: n.revenue.toFixed(2), receita_media: n.avgRevenue.toFixed(2),
      vendas: n.ordersCount, ticket_medio: n.ticket.toFixed(2),
      leads: n.newLeads, conversao_pct: n.conversion.toFixed(2), agendamentos: n.appts,
    })));
  };

  const total = data?.reduce((a, b) => a + b.revenue, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Inteligência por Nicho"
        description={`Benchmarking agregado entre nichos · ${from} a ${to}. Dados anonimizados — sem identificação de empresa.`}
        action={
          <Button variant="outline" onClick={exportCSV} disabled={!data}>
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Nichos ativos" value={fmtInt(data?.length ?? 0)} icon={Tags} accent />
        <StatCard label="Receita consolidada" value={fmtBRL(total)} />
        <StatCard label="Receita média / nicho" value={fmtBRL(data?.length ? total / data.length : 0)} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold mb-4">Comparativo por nicho</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Nicho</th>
                <th className="py-2 text-right">Empresas</th>
                <th className="py-2 text-right">Receita</th>
                <th className="py-2 text-right">Média/Empresa</th>
                <th className="py-2 text-right">Ticket médio</th>
                <th className="py-2 text-right">Conversão</th>
                <th className="py-2 text-right">Agenda</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{n.name}</td>
                  <td className="py-2 text-right">{n.active} <span className="text-muted-foreground">/ {n.companies}</span></td>
                  <td className="py-2 text-right">{fmtBRL(n.revenue)}</td>
                  <td className="py-2 text-right text-muted-foreground">{fmtBRL(n.avgRevenue)}</td>
                  <td className="py-2 text-right">{fmtBRL(n.ticket)}</td>
                  <td className="py-2 text-right">{n.conversion.toFixed(1)}%</td>
                  <td className="py-2 text-right">{fmtInt(n.appts)}</td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhum nicho cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
