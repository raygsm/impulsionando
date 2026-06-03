import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { Card } from "@/components/ui/card";
import { fmtBRL, fmtInt, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";
import { Wallet, ShoppingCart, Users, Calendar, Package, TrendingUp, TrendingDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/bi/company")({
  head: () => ({ meta: [{ title: "BI — Cliente" }] }),
  component: Page,
});

function prevMonthRange() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const last = new Date(d.getFullYear(), d.getMonth(), 0);
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

function delta(curr: number, prev: number) {
  if (!prev) return curr ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

async function loadPeriod(companyId: string, from: string, to: string) {
  const [orders, txIn, txOut, appts, leads] = await Promise.all([
    supabase.from("sales_orders").select("total, status").eq("company_id", companyId).eq("status", "confirmed").gte("confirmed_at", `${from}T00:00:00`).lte("confirmed_at", `${to}T23:59:59`),
    supabase.from("fin_transactions").select("net_amount").eq("company_id", companyId).eq("kind", "income").eq("status", "paid").gte("paid_at", `${from}T00:00:00`).lte("paid_at", `${to}T23:59:59`),
    supabase.from("fin_transactions").select("net_amount").eq("company_id", companyId).eq("kind", "expense").eq("status", "paid").gte("paid_at", `${from}T00:00:00`).lte("paid_at", `${to}T23:59:59`),
    supabase.from("agenda_appointments").select("id, status").eq("company_id", companyId).gte("starts_at", `${from}T00:00:00`).lte("starts_at", `${to}T23:59:59`),
    supabase.from("crm_leads").select("id, status").eq("company_id", companyId).gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`),
  ]);
  const sumOrders = (orders.data ?? []).reduce((a, b) => a + Number(b.total), 0);
  const ordersCount = orders.data?.length ?? 0;
  const revenue = (txIn.data ?? []).reduce((a, b) => a + Number(b.net_amount), 0);
  const expense = (txOut.data ?? []).reduce((a, b) => a + Number(b.net_amount), 0);
  const totalAppts = appts.data?.length ?? 0;
  const completed = (appts.data ?? []).filter((a) => a.status === "completed").length;
  const newLeads = leads.data?.length ?? 0;
  const wonLeads = (leads.data ?? []).filter((l) => l.status === "won").length;
  return {
    sumOrders, ordersCount, revenue, expense, profit: revenue - expense,
    totalAppts, completed, newLeads, wonLeads,
    ticket: ordersCount ? sumOrders / ordersCount : 0,
    conversion: newLeads ? (wonLeads / newLeads) * 100 : 0,
  };
}

function Page() {
  const { companyId } = useActiveCompany();
  const curr = { from: startOfMonthISO(), to: endOfMonthISO() };
  const prev = prevMonthRange();

  const { data } = useQuery({
    queryKey: ["bi-company", companyId, curr.from, prev.from],
    enabled: !!companyId,
    queryFn: async () => {
      const [c, p] = await Promise.all([
        loadPeriod(companyId!, curr.from, curr.to),
        loadPeriod(companyId!, prev.from, prev.to),
      ]);
      return { curr: c, prev: p };
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa para visualizar o BI." />;

  const c = data?.curr;
  const p = data?.prev;

  const exportCSV = () => {
    if (!c || !p) return;
    downloadCSV(`bi-cliente-${curr.from}.csv`, [
      { indicador: "Receita", atual: c.revenue, anterior: p.revenue, variacao_pct: delta(c.revenue, p.revenue).toFixed(2) },
      { indicador: "Despesas", atual: c.expense, anterior: p.expense, variacao_pct: delta(c.expense, p.expense).toFixed(2) },
      { indicador: "Resultado", atual: c.profit, anterior: p.profit, variacao_pct: delta(c.profit, p.profit).toFixed(2) },
      { indicador: "Vendas confirmadas", atual: c.ordersCount, anterior: p.ordersCount, variacao_pct: delta(c.ordersCount, p.ordersCount).toFixed(2) },
      { indicador: "Ticket médio", atual: c.ticket.toFixed(2), anterior: p.ticket.toFixed(2), variacao_pct: delta(c.ticket, p.ticket).toFixed(2) },
      { indicador: "Agendamentos", atual: c.totalAppts, anterior: p.totalAppts, variacao_pct: delta(c.totalAppts, p.totalAppts).toFixed(2) },
      { indicador: "Leads novos", atual: c.newLeads, anterior: p.newLeads, variacao_pct: delta(c.newLeads, p.newLeads).toFixed(2) },
      { indicador: "Conversão (%)", atual: c.conversion.toFixed(2), anterior: p.conversion.toFixed(2), variacao_pct: delta(c.conversion, p.conversion).toFixed(2) },
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Dashboard do Cliente"
        description={`Período atual: ${curr.from} a ${curr.to}. Comparativo: ${prev.from} a ${prev.to}.`}
        action={
          <div className="flex gap-2">
            <CompanyPicker />
            <Button variant="outline" onClick={exportCSV} disabled={!data}>
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita" value={fmtBRL(c?.revenue ?? 0)} hint={p ? variacaoLabel(delta(c?.revenue ?? 0, p.revenue)) : undefined} icon={TrendingUp} accent />
        <StatCard label="Despesas" value={fmtBRL(c?.expense ?? 0)} hint={p ? variacaoLabel(delta(c?.expense ?? 0, p.expense)) : undefined} icon={Wallet} />
        <StatCard label="Resultado" value={fmtBRL(c?.profit ?? 0)} hint={c && c.profit >= 0 ? "Superávit" : "Déficit"} icon={c && c.profit >= 0 ? TrendingUp : TrendingDown} />
        <StatCard label="Ticket médio" value={fmtBRL(c?.ticket ?? 0)} hint={p ? variacaoLabel(delta(c?.ticket ?? 0, p.ticket)) : undefined} icon={ShoppingCart} />
        <StatCard label="Vendas" value={fmtInt(c?.ordersCount ?? 0)} hint={fmtBRL(c?.sumOrders ?? 0)} icon={ShoppingCart} />
        <StatCard label="Agenda — concluídos" value={fmtInt(c?.completed ?? 0)} hint={`${c?.totalAppts ?? 0} no total`} icon={Calendar} />
        <StatCard label="Novos leads" value={fmtInt(c?.newLeads ?? 0)} hint={`${c?.wonLeads ?? 0} convertidos`} icon={Users} />
        <StatCard label="Conversão" value={`${(c?.conversion ?? 0).toFixed(1)}%`} icon={Package} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold mb-4">Comparativo mês a mês</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Indicador</th>
                <th className="py-2 text-right">Atual</th>
                <th className="py-2 text-right">Anterior</th>
                <th className="py-2 text-right">Variação</th>
              </tr>
            </thead>
            <tbody>
              {c && p && [
                ["Receita", fmtBRL(c.revenue), fmtBRL(p.revenue), delta(c.revenue, p.revenue)],
                ["Despesas", fmtBRL(c.expense), fmtBRL(p.expense), delta(c.expense, p.expense)],
                ["Resultado", fmtBRL(c.profit), fmtBRL(p.profit), delta(c.profit, p.profit)],
                ["Vendas (qtd)", fmtInt(c.ordersCount), fmtInt(p.ordersCount), delta(c.ordersCount, p.ordersCount)],
                ["Ticket médio", fmtBRL(c.ticket), fmtBRL(p.ticket), delta(c.ticket, p.ticket)],
                ["Agendamentos", fmtInt(c.totalAppts), fmtInt(p.totalAppts), delta(c.totalAppts, p.totalAppts)],
                ["Novos leads", fmtInt(c.newLeads), fmtInt(p.newLeads), delta(c.newLeads, p.newLeads)],
              ].map(([k, a, b, d]) => (
                <tr key={k as string} className="border-b last:border-0">
                  <td className="py-2">{k}</td>
                  <td className="py-2 text-right">{a}</td>
                  <td className="py-2 text-right text-muted-foreground">{b}</td>
                  <td className={`py-2 text-right font-medium ${Number(d) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{variacaoLabel(Number(d))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function variacaoLabel(v: number) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}
