import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getFinanceHealth } from "@/lib/finance-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, RefreshCw, ArrowLeftRight, FolderTree, CreditCard, TrendingUp, TrendingDown, AlertTriangle, Banknote, Percent, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/finance-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Tab({ title, rows, unit }: { title: string; rows: { k: string; count: number }[]; unit?: "brl" | "n" }) {
  const f = unit === "brl" ? brl : fmt;
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <table className="w-full text-sm"><tbody>
          {rows.map((s, i) => (<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{f(s.count)}</td></tr>))}
        </tbody></table>
      )}
    </CardContent></Card>
  );
}

function Page() {
  const fn = useServerFn(getFinanceHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","finance-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const a = data.accounts, c = data.categories, m = data.paymentMethods, t = data.transactions, p = data.payments, cm = data.commissions;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary"/>Financeiro — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Fluxo de caixa, recebíveis/pagáveis, contas, métodos, categorias e comissões.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4"/>Contas ativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.active)}/{fmt(a.total)}</div><p className="text-xs text-muted-foreground">saldo total {brl(a.totalBalanceBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Receitas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{brl(t.incomeBRL)}</div><p className="text-xs text-muted-foreground">no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4"/>Despesas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-rose-600">{brl(t.expenseBRL)}</div><p className="text-xs text-muted-foreground">no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowLeftRight className="h-4 w-4"/>Resultado líquido</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${t.netCashflowBRL>=0?"text-emerald-600":"text-rose-600"}`}>{brl(t.netCashflowBRL)}</div><p className="text-xs text-muted-foreground">{fmt(t.total)} lançamentos · {fmt(t.paid)} pagos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4"/>Recebíveis</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(t.receivablesBRL)}</div><p className="text-xs text-muted-foreground">{fmt(t.receivablesOpenCount)} em aberto</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4"/>Pagáveis</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(t.payablesBRL)}</div><p className="text-xs text-muted-foreground">{fmt(t.payablesOpenCount)} em aberto</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/>Vencidos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(t.overdueCount)}</div><p className="text-xs text-muted-foreground">{brl(t.overdueBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4"/>Pagamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(p.total)}</div><p className="text-xs text-muted-foreground">{brl(p.totalBRL)} · médio {brl(p.avgBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4"/>Métodos / Categorias</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(m.active)} / {fmt(c.active)}</div><p className="text-xs text-muted-foreground">métodos · categorias ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4"/>Comissões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(cm.grossBRL)}</div><p className="text-xs text-muted-foreground">{brl(cm.paidBRL)} pagas · {brl(cm.pendingBRL)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FolderTree className="h-4 w-4"/>Contas / Categorias</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.total)} / {fmt(c.total)}</div><p className="text-xs text-muted-foreground">cadastros totais</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tab title="Lançamentos por status" rows={t.byStatus} />
        <Tab title="Lançamentos por tipo" rows={t.byKind} />
        <Tab title="Valor por categoria" rows={t.byCategory} unit="brl" />
        <Tab title="Valor por conta" rows={t.byAccount} unit="brl" />
        <Tab title="Valor por método" rows={t.byMethod} unit="brl" />
        <Tab title="Contas por tipo" rows={a.byKind} />
        <Tab title="Categorias por tipo" rows={c.byKind} />
        <Tab title="Métodos por tipo" rows={m.byKind} />
        <Tab title="Pagamentos por método" rows={p.byMethod} unit="brl" />
        <Tab title="Comissões por status" rows={cm.byStatus} />
        <Tab title="Comissões por owner" rows={cm.byOwner} unit="brl" />
      </div>
    </div>
  );
}
