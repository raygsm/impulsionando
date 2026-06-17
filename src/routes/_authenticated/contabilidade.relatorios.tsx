import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatCard } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useContabMetrics, type ContabFilters } from "@/hooks/use-contab-metrics";
import { useContabWhiteLabel } from "@/hooks/use-contab-whitelabel";
import { buildContabReportPdf } from "@/lib/contab-pdf";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Users, TrendingUp, Wallet, FileSignature, FolderOpen, ClipboardList,
  AlertTriangle, ListChecks, FileText, BarChart3, Download, RotateCcw, Database,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contabilidade/relatorios")({
  head: () => ({ meta: [{ title: "BI Contábil — Impulsionando" }] }),
  component: ContabBI,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444", "#6366F1"];

function ContabBI() {
  const { companyId } = useActiveCompany();
  const { config: wl } = useContabWhiteLabel();

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const inFuture = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

  const [filters, setFilters] = useState<ContabFilters>({
    from: monthAgo, to: inFuture, regime: "all", clientId: "all",
  });

  const { data: clientsList } = useQuery({
    queryKey: ["contab-clients-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("contab_clients")
        .select("id, legal_name, trade_name, tax_regime").eq("company_id", companyId!).order("legal_name");
      return data ?? [];
    },
  });

  const { metrics, dataStatus, isLoading, isFetching, refetch } = useContabMetrics(companyId, filters);

  const regimes = useMemo(() => {
    if (!clientsList) return [];
    return Array.from(new Set(clientsList.map((c) => c.tax_regime).filter(Boolean))) as string[];
  }, [clientsList]);

  const periodLabel = useMemo(() => {
    const f = filters.from ? new Date(filters.from).toLocaleDateString("pt-BR") : "início";
    const t = filters.to ? new Date(filters.to).toLocaleDateString("pt-BR") : "hoje";
    return `${f} → ${t}`;
  }, [filters.from, filters.to]);

  const regimeData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.byRegime).map(([name, v]) => ({ name, value: v.count, mrr: v.mrr }));
  }, [metrics]);

  const oblStatusData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.oblByStatus).map(([name, value]) => ({ name, value }));
  }, [metrics]);

  const financialFlow = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Receitas", recebido: metrics.finReceived, pendente: metrics.finReceivable },
      { name: "Despesas", recebido: metrics.finPaid, pendente: metrics.finPayable },
    ];
  }, [metrics]);

  const exportPdf = () => {
    if (!metrics) return;
    const client = clientsList?.find((c) => c.id === filters.clientId);
    const pdf = buildContabReportPdf({
      periodLabel, generatedAt: new Date().toISOString(), whiteLabel: wl,
      mrr: metrics.mrr, active: metrics.active, avgTicket: metrics.avgTicket, contractsActive: metrics.contractsActive,
      byRegime: metrics.byRegime,
      docsPending: metrics.docsPending, oblOverdue: metrics.oblOverdue,
      oblUpcoming30: metrics.oblUpcoming30, oblValueUpcoming: metrics.oblValueUpcoming,
      tasksOpen: metrics.tasksOpen, tasksUrgent: metrics.tasksUrgent,
      irpfInProgress: metrics.irpfInProgress, irpfDone: metrics.irpfDone, irpfFeesPending: metrics.irpfFeesPending,
      finReceivable: metrics.finReceivable, finReceived: metrics.finReceived,
      finPayable: metrics.finPayable, finPaid: metrics.finPaid,
      monthlyMrr: metrics.monthlyMrr,
      filters: { regime: filters.regime, clientName: client ? (client.trade_name || client.legal_name) : undefined },
    });
    const url = URL.createObjectURL(pdf);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi-contabil-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório PDF gerado");
  };

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="BI Contábil"
        description={`${wl.enabled ? wl.brandName + " · " : ""}Indicadores gerenciais conectados às mesmas fontes do cockpit.`}
        action={
          <div className="flex gap-2 items-center flex-wrap">
            <CompanyPicker />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RotateCcw className={`w-3.5 h-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button size="sm" onClick={exportPdf} disabled={!metrics} className="bg-gradient-primary shadow-elegant">
              <Download className="w-3.5 h-3.5 mr-1" /> Exportar PDF
            </Button>
          </div>
        }
      />

      {/* Status de dados */}
      <Card className="p-3 mb-4 flex items-center gap-3 flex-wrap text-xs">
        <Badge variant="outline" className="gap-1">
          <Database className="w-3 h-3" /> Fonte única
        </Badge>
        {isLoading ? (
          <span className="text-muted-foreground">Carregando dados…</span>
        ) : (
          <>
            <span><strong>{dataStatus.counts?.clients ?? 0}</strong> clientes</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.docs ?? 0}</strong> docs</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.obls ?? 0}</strong> obrigações</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.tasks ?? 0}</strong> tarefas</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.finance ?? 0}</strong> financeiros</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.irpf ?? 0}</strong> IRPF</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.contracts ?? 0}</strong> contratos</span>
            <Badge variant={dataStatus.hasData ? "default" : "secondary"} className="ml-auto">
              {dataStatus.hasData ? "Dados disponíveis" : "Sem dados — use a seed na cockpit"}
            </Badge>
          </>
        )}
      </Card>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label className="text-xs">De</Label>
            <Input type="date" value={filters.from || ""}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div><Label className="text-xs">Até</Label>
            <Input type="date" value={filters.to || ""}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div><Label className="text-xs">Regime tributário</Label>
            <Select value={filters.regime} onValueChange={(v) => setFilters({ ...filters, regime: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {regimes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Cliente</Label>
            <Select value={filters.clientId} onValueChange={(v) => setFilters({ ...filters, clientId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientsList?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span>Período: {periodLabel}</span>
          <button className="underline" onClick={() => setFilters({ from: "", to: "", regime: "all", clientId: "all" })}>
            Limpar filtros
          </button>
        </div>
      </Card>

      {isLoading || !metrics ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Calculando indicadores…</div>
      ) : (
        <>
          <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Carteira & Receita Recorrente</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Clientes ativos" value={metrics.active} icon={Users} accent />
            <StatCard label="MRR" value={fmt(metrics.mrr)} icon={TrendingUp} />
            <StatCard label="Contratos assinados" value={metrics.contractsActive} icon={FileSignature} />
            <StatCard label="Ticket médio" value={fmt(metrics.avgTicket)} icon={Wallet} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Evolução de MRR</h3>
              {metrics.monthlyMrr.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Sem histórico no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={metrics.monthlyMrr}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="mrr" stroke={COLORS[0]} strokeWidth={2} name="MRR (R$)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3">Carteira por regime tributário</h3>
              {regimeData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Sem clientes ativos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={regimeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {regimeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Operação fiscal</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Docs pendentes" value={metrics.docsPending} icon={FolderOpen} />
            <StatCard label="Obrigações 30d" value={metrics.oblUpcoming30} icon={ClipboardList} hint={fmt(metrics.oblValueUpcoming)} />
            <StatCard label="Obrigações atrasadas" value={metrics.oblOverdue} icon={AlertTriangle} hint={metrics.oblOverdue ? "Requer ação" : "OK"} />
            <StatCard label="Tarefas abertas" value={metrics.tasksOpen} icon={ListChecks} hint={metrics.tasksUrgent ? `${metrics.tasksUrgent} urgentes` : undefined} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Obrigações por status</h3>
              {oblStatusData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Sem obrigações no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={oblStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3">Fluxo financeiro do escritório</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={financialFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="recebido" stackId="a" fill={COLORS[1]} name="Liquidado" />
                  <Bar dataKey="pendente" stackId="a" fill={COLORS[2]} name="Pendente" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-sm flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Saldo projetado</span>
                <span className={`font-bold ${metrics.finReceivable - metrics.finPayable >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {fmt(metrics.finReceivable - metrics.finPayable)}
                </span>
              </div>
            </Card>
          </div>

          <h2 className="font-semibold mb-3 text-sm text-muted-foreground">IRPF</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Em andamento" value={metrics.irpfInProgress} icon={FileText} />
            <StatCard label="Concluídas" value={metrics.irpfDone} icon={FileText} />
            <StatCard label="Honorários pendentes" value={fmt(metrics.irpfFeesPending)} icon={Wallet} accent />
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Métricas consolidadas a partir das tabelas <code>contab_*</code> — mesma fonte usada pelo cockpit e pelos módulos operacionais.
      </p>
    </div>
  );
}
