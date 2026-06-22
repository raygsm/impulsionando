import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAiAutomationHealth } from "@/lib/ai-automation-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, RefreshCw, Workflow, BookOpen, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-automation-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getAiAutomationHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","ai-auto",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Bot className="h-6 w-6 text-primary"/>AI & Automation</h1>
          <p className="text-sm text-muted-foreground">Agentes IA, gerações de projeto, biblioteca de prompts, N8N e webhooks.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4"/>Demandas Agentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.agents.demands)}</div><p className="text-xs text-muted-foreground">{fmt(data.agents.done)} done · {fmt(data.agents.inProgress)} em andamento</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outputs Gerados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.agents.outputs)}</div><p className="text-xs text-muted-foreground">{fmt(data.agents.finalOutputs)} finais</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Gerações de Projeto</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.generations.provisioned)}<span className="text-sm text-muted-foreground">/{fmt(data.generations.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.generations.failed)} falhas · {fmt(data.generations.approved)} aprovadas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4"/>Prompt Library</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.library.active)}<span className="text-sm text-muted-foreground">/{fmt(data.library.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.library.usageCount)} usos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4"/>N8N Runs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.n8n.runs)}</div><p className="text-xs text-muted-foreground">Latência {(data.n8n.avgLatencyMs/1000).toFixed(2)}s</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">N8N Success Rate</CardTitle></CardHeader><CardContent><Badge variant={data.n8n.successRate>=95?"default":data.n8n.successRate>=80?"secondary":"destructive"} className="text-base">{pct(data.n8n.successRate)}</Badge><p className="text-xs text-muted-foreground mt-1">{fmt(data.n8n.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4"/>Webhooks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.runs)}</div><p className="text-xs text-muted-foreground">{fmt(data.webhooks.events)} eventos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Webhooks Success</CardTitle></CardHeader><CardContent><Badge variant={data.webhooks.successRate>=95?"default":data.webhooks.successRate>=80?"secondary":"destructive"} className="text-base">{pct(data.webhooks.successRate)}</Badge><p className="text-xs text-muted-foreground mt-1">{fmt(data.webhooks.failed)} falhas</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top Workflows (N8N)</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr>
            <th className="text-left py-2">Workflow</th><th className="text-right">Runs</th><th className="text-right">Falhas</th><th className="text-right">Sucesso</th>
          </tr></thead><tbody>
            {data.n8n.topWorkflows.map((w,i)=>(<tr key={i} className="border-b last:border-0">
              <td className="py-2 font-medium text-xs">{w.workflow}</td>
              <td className="text-right">{fmt(w.total)}</td>
              <td className={`text-right ${w.failed>0?"text-destructive":""}`}>{fmt(w.failed)}</td>
              <td className="text-right"><Badge variant={w.successRate>=95?"default":w.successRate>=80?"secondary":"destructive"}>{pct(w.successRate)}</Badge></td>
            </tr>))}
          </tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top Réguas</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.n8n.topReguas.map((r,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{r.regua}</td><td className="text-right">{fmt(r.count)}</td></tr>))}
          {data.n8n.topReguas.length===0 && <tr><td className="py-2 text-muted-foreground text-center">Sem réguas no período</td></tr>}
        </tbody></table></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Modelos de IA Utilizados</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{data.generations.models.map((m)=>(<div key={m.model} className="p-3 rounded-md bg-muted/30"><div className="text-xs text-muted-foreground">{m.model}</div><div className="text-lg font-bold">{fmt(m.count)}</div></div>))}</div>
      </CardContent></Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
