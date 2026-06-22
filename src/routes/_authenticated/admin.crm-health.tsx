import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCrmHealth } from "@/lib/crm-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanSquare, RefreshCw, Target, TrendingUp, Activity, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getCrmHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin", "crm-health", days], queryFn: () => fn({ data: { days } }) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const o = data.opportunities;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><KanbanSquare className="h-6 w-6 text-primary"/>CRM & Pipeline</h1>
          <p className="text-sm text-muted-foreground">Leads, oportunidades, funil, win rate e atividades.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Novos Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.leads.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.leads.qualified)} qualificados · score {data.leads.avgScore.toFixed(0)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4"/>Pipeline Aberto</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(o.pipelineValue)}</div><p className="text-xs text-muted-foreground">{fmt(o.open)} oportunidades</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600"/>Win Rate</CardTitle></CardHeader><CardContent><Badge variant={o.winRate>=40?"default":o.winRate>=25?"secondary":"destructive"} className="text-base">{pct(o.winRate)}</Badge><p className="text-xs text-muted-foreground mt-1">{fmt(o.won)} ganhas · {fmt(o.lost)} perdidas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(o.avgDealSize)}</div><p className="text-xs text-muted-foreground">Ciclo {o.avgCycleDays.toFixed(0)}d</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita Ganha</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{brl(o.wonValue)}</div><p className="text-xs text-muted-foreground">Perdida {brl(o.lostValue)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4"/>Atividades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.activities.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.activities.done)} done · {fmt(data.activities.overdue)} atrasadas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pipelines</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.pipelines.active)}<span className="text-sm text-muted-foreground">/{fmt(data.pipelines.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Novas no Período</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(o.inWindow)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Funil (Oportunidades Abertas)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.funnel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 font-medium">{s.name}</td><td className="text-right">{fmt(s.count)}</td><td className="text-right font-medium">{brl(s.value)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive"/>Motivos de Perda</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.lostReasons.map((r,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{r.reason}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right text-destructive">{brl(r.value)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Top Origens de Leads</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {data.leads.topSources.map((s)=>(<div key={s.source} className="p-3 rounded-md bg-muted/30"><div className="text-xs text-muted-foreground">{s.source}</div><div className="text-lg font-bold">{fmt(s.count)}</div></div>))}
      </div></CardContent></Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
