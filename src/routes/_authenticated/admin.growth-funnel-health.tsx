import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGrowthFunnelHealth } from "@/lib/growth-funnel-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw, TrendingUp, Megaphone, Workflow, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/growth-funnel-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getGrowthFunnelHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","growth-funnel-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const f = data.funnel;
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Filter className="h-6 w-6 text-primary"/>Growth Funnel</h1>
          <p className="text-sm text-muted-foreground">Funil Impulsionando: captar → converter → relacionar → reter → expandir.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Funil Consolidado</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Captação</div><div className="text-xl font-bold">{fmt(f.captacaoTotal)}</div><div className="text-[10px] text-muted-foreground">marketing + demo</div></div>
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">CRM Leads</div><div className="text-xl font-bold">{fmt(f.crmLeads)}</div></div>
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Oportunidades</div><div className="text-xl font-bold">{fmt(f.opportunities)}</div></div>
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Ganhas</div><div className="text-xl font-bold text-green-600">{fmt(f.won)}</div></div>
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Perdidas</div><div className="text-xl font-bold text-red-600">{fmt(f.lost)}</div></div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
            <div className="p-2 rounded border"><div className="text-xs text-muted-foreground">Visit → Lead</div><div className="font-bold">{pct(f.convVisitToLead)}</div></div>
            <div className="p-2 rounded border"><div className="text-xs text-muted-foreground">Lead → Oportunidade</div><div className="font-bold">{pct(f.convLeadToOpp)}</div></div>
            <div className="p-2 rounded border"><div className="text-xs text-muted-foreground">Win Rate</div><div className="font-bold">{pct(f.winRate)}</div></div>
            <div className="p-2 rounded border"><div className="text-xs text-muted-foreground">GMV (won/aberto)</div><div className="font-bold">{brl(f.gmvWon)}<span className="text-xs text-muted-foreground"> · {brl(f.gmvOpen)}</span></div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4"/>Marketing Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.marketing.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.marketing.assigned)} atribuídos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CRM Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.crm.leads)}</div><p className="text-xs text-muted-foreground">score médio {data.crm.avgScore.toFixed(1)} · {fmt(data.crm.owned)} c/ owner</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pipelines</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.crm.activePipelines)}<span className="text-sm text-muted-foreground">/{fmt(data.crm.pipelines)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.crm.stages)} stages</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Atividades CRM</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.activities.done)}<span className="text-sm text-muted-foreground">/{fmt(data.activities.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.activities.pending)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4"/>Regras de Funil</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.funnelRules.active)}<span className="text-sm text-muted-foreground">/{fmt(data.funnelRules.total)}</span></div><p className="text-xs text-muted-foreground">ativas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dispatch Queue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.funnelQueue.sent)}<span className="text-sm text-muted-foreground">/{fmt(data.funnelQueue.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.funnelQueue.pending)} pendentes · {fmt(data.funnelQueue.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4"/>Demo Visits</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.demo.visits)}</div><p className="text-xs text-muted-foreground">{fmt(data.demo.converted)} convertidos · {fmt(data.demo.abandoned)} abandono</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Demo Sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.demo.sessions)}</div><p className="text-xs text-muted-foreground">score {data.demo.avgScore.toFixed(1)} · {Math.round(data.demo.avgSessionSec)}s</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Marketing Leads por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.marketing.statuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Origens (source / UTM source)</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-muted-foreground mb-1">Source</div><table className="w-full"><tbody>{data.marketing.sources.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
          <div><div className="text-xs text-muted-foreground mb-1">UTM source</div><table className="w-full"><tbody>{data.marketing.utmSources.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
        </div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">CRM — Status de Leads</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.crm.leadStatuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">CRM — Status de Oportunidades</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.crm.opportunityStatuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Motivos de Perda</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.crm.lostReasons.length===0 && <tr><td className="py-2 text-muted-foreground">—</td></tr>}
          {data.crm.lostReasons.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Regras de Funil por Stage</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.funnelRules.byStage.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Dispatch Queue por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.funnelQueue.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Demo Visits por Nicho</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.demo.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Demo Actions por Módulo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.demo.actionsByModule.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Survey — Interesse de Plano</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.demo.surveyByPlan.length===0 && <tr><td className="py-2 text-muted-foreground">—</td></tr>}
          {data.demo.surveyByPlan.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
