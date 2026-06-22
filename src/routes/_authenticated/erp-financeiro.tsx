import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getFinancialErp } from "@/lib/financial-erp.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/erp-financeiro")({
  component: ErpFinanceiro,
});

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ErpFinanceiro() {
  const [months, setMonths] = useState(6);
  const fetchFn = useServerFn(getFinancialErp);
  const { data, isLoading, error } = useQuery({
    queryKey: ["erp-financeiro", months],
    queryFn: () => fetchFn({ data: { months } }),
  });

  if (isLoading) return <div className="p-6">Carregando ERP financeiro…</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ERP Financeiro</h1>
          <p className="text-muted-foreground text-sm">
            DRE, fluxo de caixa, conciliação de contas e gateways. Dados ao vivo da sua empresa.
          </p>
        </div>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[3, 6, 12, 18, 24].map((m) => <SelectItem key={m} value={String(m)}>{m} meses</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Receita do mês" value={fmt(data.kpis.revenue_month)} />
        <Kpi label="Crescimento" value={`${data.kpis.revenue_growth_pct}%`}
             tone={data.kpis.revenue_growth_pct >= 0 ? "ok" : "warn"} />
        <Kpi label="Resultado líquido" value={fmt(data.kpis.net_month)} />
        <Kpi label="A receber" value={fmt(data.kpis.pending_receivables)} />
        <Kpi label="MPago aprovado" value={fmt(data.kpis.gateway_approved)} />
        <Kpi label="MPago pendente" value={fmt(data.kpis.gateway_pending)} />
      </div>

      {/* DRE */}
      <Card>
        <CardHeader><CardTitle>DRE Mensal</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th>Mês</th><th className="text-right">Receita realizada</th>
                <th className="text-right">Receita provisionada</th>
                <th className="text-right">Despesa realizada</th>
                <th className="text-right">Despesa provisionada</th>
                <th className="text-right">Taxas</th>
                <th className="text-right">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {data.dre.map((r) => (
                <tr key={r.month} className="border-t">
                  <td>{r.month}</td>
                  <td className="text-right">{fmt(r.revenue_realized)}</td>
                  <td className="text-right text-muted-foreground">{fmt(r.revenue_pending)}</td>
                  <td className="text-right">{fmt(r.expense_realized)}</td>
                  <td className="text-right text-muted-foreground">{fmt(r.expense_pending)}</td>
                  <td className="text-right text-muted-foreground">{fmt(r.fees)}</td>
                  <td className={`text-right font-semibold ${r.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Conciliação de contas */}
      <Card>
        <CardHeader><CardTitle>Conciliação de Contas</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th>Conta</th><th>Tipo</th><th className="text-right">Abertura</th>
                <th className="text-right">Saldo calculado</th><th className="text-right">Saldo declarado</th>
                <th className="text-right">Diferença</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td>{a.name}</td>
                  <td className="text-muted-foreground">{a.type}</td>
                  <td className="text-right">{fmt(a.opening_balance)}</td>
                  <td className="text-right">{fmt(a.computed_balance)}</td>
                  <td className="text-right">{fmt(a.declared_balance)}</td>
                  <td className={`text-right ${Math.abs(a.diff) < 0.01 ? "text-green-600" : "text-amber-600"}`}>{fmt(a.diff)}</td>
                  <td>
                    {Math.abs(a.diff) < 0.01
                      ? <Badge>conciliado</Badge>
                      : <Badge variant="secondary">divergente</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Por categoria */}
      <Card>
        <CardHeader><CardTitle>Top categorias (realizadas)</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th>Categoria</th><th>Tipo</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {data.by_category.slice(0, 20).map((c) => (
                <tr key={c.category_id} className="border-t">
                  <td className="flex items-center gap-2">
                    {c.color && <span className="w-3 h-3 rounded" style={{ background: c.color }} />}
                    {c.name}
                  </td>
                  <td><Badge variant={c.kind === "income" ? "default" : "secondary"}>{c.kind}</Badge></td>
                  <td className="text-right">{fmt(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader><CardTitle>Faturas (período)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <Kpi label="Total" value={String(data.billing.total)} />
          <Kpi label="Pagas" value={String(data.billing.paid)} tone="ok" />
          <Kpi label="Pendentes" value={String(data.billing.pending)} />
          <Kpi label="Atrasadas" value={String(data.billing.overdue)} tone="warn" />
          <Kpi label="Recebido" value={fmt(data.billing.paid_amount)} />
          <Kpi label="A receber" value={fmt(data.billing.pending_amount)} />
        </CardContent>
      </Card>

      {/* Fluxo de caixa */}
      <Card>
        <CardHeader><CardTitle>Fluxo de Caixa (últimos 90 dias)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground sticky top-0 bg-background">
                <tr><th>Data</th><th className="text-right">Entradas</th><th className="text-right">Saídas</th><th className="text-right">Saldo</th></tr>
              </thead>
              <tbody>
                {data.cashflow.map((c) => (
                  <tr key={c.date} className="border-t">
                    <td>{c.date}</td>
                    <td className="text-right text-green-600">{fmt(c.inflow)}</td>
                    <td className="text-right text-red-600">{fmt(c.outflow)}</td>
                    <td className={`text-right font-medium ${c.balance >= 0 ? "" : "text-red-600"}`}>{fmt(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  const color = tone === "ok" ? "text-green-600" : tone === "warn" ? "text-amber-600" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
