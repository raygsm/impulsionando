import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getExecutiveOverview, exportCsv, getFiscalReport } from "@/lib/riomed-reports.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileSpreadsheet, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/relatorios")({
  component: Page,
});

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];

function Page() {
  const fn = useServerFn(getExecutiveOverview);
  const exp = useServerFn(exportCsv);
  const fiscal = useServerFn(getFiscalReport);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["riomed-exec", from, to],
    queryFn: () => fn({ data: { from, to } }),
  });

  const money = (v: number) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BOB" }).format(v ?? 0);
  const doExport = async (ds: any) => {
    try {
      const r = await exp({ data: { dataset: ds, from, to } });
      if (!r.count) return toast.info("Sem dados no período");
      download(r.filename, r.csv); toast.success(`${r.count} linhas exportadas`);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };
  const doFiscal = async () => {
    try {
      const r = await fiscal({ data: { month } });
      download(r.filename, r.csv);
      toast.success(`${r.summary.orders} pedidos · ${money(r.summary.gross)}`);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  if (isLoading) return <div className="p-6">Carregando…</div>;
  const d = data!;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Relatórios & Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada Rio Med — período {from} → {to}</p>
        </div>
        <div className="flex gap-2 items-end">
          <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" /></div>
          <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" /></div>
          <Button size="sm" onClick={() => refetch()}>Atualizar</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Kpi label="Receita" value={money(d.kpis.revenue)} />
        <Kpi label="Pedidos" value={String(d.kpis.orders)} />
        <Kpi label="Ticket médio" value={money(d.kpis.avgTicket)} />
        <Kpi label="Leads" value={String(d.kpis.leads)} />
        <Kpi label="Win rate" value={`${d.kpis.winRate.toFixed(1)}%`} />
        <Kpi label="A Receber" value={money(d.kpis.arOpen)} />
        <Kpi label="A Pagar" value={money(d.kpis.apOpen)} />
        <Kpi label="Comissões" value={money(d.kpis.commissionsAccrued)} />
        <Kpi label="Produtos" value={String(d.kpis.products)} />
        <Kpi label="Unidades em estoque" value={String(d.kpis.stockUnits)} />
        <Kpi label="Fornecedores ativos" value={String(d.kpis.suppliersApproved)} />
        <Kpi label="Hospitais ativos" value={String(d.kpis.hospitalsActive)} />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="exports">Exportações</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Receita diária</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer><AreaChart data={d.salesByDay}>
                  <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} />
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                </AreaChart></ResponsiveContainer>
              </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-base">Pedidos por status</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer><BarChart data={d.ordersByStatus}>
                  <XAxis dataKey="status" fontSize={11} /><YAxis fontSize={11} />
                  <Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart></ResponsiveContainer>
              </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-base">Leads por origem</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer><PieChart>
                  <Pie data={d.leadsBySource} dataKey="count" nameKey="source" outerRadius={90}>
                    {d.leadsBySource.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart></ResponsiveContainer>
              </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-base">Resumo operacional</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Campanhas ativas" v={String(d.kpis.campaignsRunning)} />
                <Row label="Pedidos no período" v={String(d.kpis.orders)} />
                <Row label="Conversão (Win rate)" v={`${d.kpis.winRate.toFixed(1)}%`} />
                <Row label="Saldo previsto (AR − AP)" v={money(d.kpis.arOpen - d.kpis.apOpen)} />
                <Row label="Comissões acumuladas" v={money(d.kpis.commissionsAccrued)} />
              </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="exports">
          <Card><CardHeader><CardTitle className="text-base">Exportar CSV ({from} → {to})</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                ["sales_orders","Pedidos"],
                ["riomed_quotes","Cotações"],
                ["riomed_ar_invoices","Contas a Receber"],
                ["riomed_ap_invoices","Contas a Pagar"],
                ["riomed_commissions","Comissões"],
                ["riomed_stock_levels","Estoque"],
                ["riomed_products","Produtos"],
                ["crm_leads","Leads"],
              ] as const).map(([k, lbl]) => (
                <Button key={k} variant="outline" size="sm" onClick={() => doExport(k)}>
                  <Download className="h-3 w-3 mr-2" />{lbl}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Relatório fiscal mensal</CardTitle></CardHeader>
            <CardContent className="flex items-end gap-2 flex-wrap">
              <div><Label className="text-xs">Mês (YYYY-MM)</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" /></div>
              <Button onClick={doFiscal}><Download className="h-4 w-4 mr-2" />Gerar CSV</Button>
              <p className="text-xs text-muted-foreground basis-full mt-2">Inclui todos os pedidos do mês com itens detalhados — pronto para conciliação contábil/fiscal.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-base font-bold mt-1">{value}</div>
  </CardContent></Card>;
}
function Row({ label, v }: { label: string; v: string }) {
  return <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">{label}</span><span className="font-medium">{v}</span></div>;
}
