import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCrmFunnelHealth } from "@/lib/crm-funnel-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanSquare, RefreshCw, Megaphone, UserPlus, GitBranch, Trophy, Activity, Banknote, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm-funnel-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Tab({ title, rows }: { title: string; rows: { k: string; count: number }[] }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <table className="w-full text-sm"><tbody>
          {rows.map((s, i) => (<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table>
      )}
    </CardContent></Card>
  );
}

function Page() {
  const fn = useServerFn(getCrmFunnelHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","crm-funnel",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const m = data.marketingLeads, l = data.crmLeads, p = data.pipelines, o = data.opportunities, a = data.activities;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><KanbanSquare className="h-6 w-6 text-primary"/>CRM & Funil de Conversão</h1>
          <p className="text-sm text-muted-foreground">Captação→Conversão do funil Impulsionando: leads de marketing, leads CRM, pipelines, oportunidades e atividades.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4"/>Marketing Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(m.total)}</div><p className="text-xs text-muted-foreground">conv. {pct(m.convRate)} ({fmt(m.converted)})</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4"/>CRM Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(l.total)}</div><p className="text-xs text-muted-foreground">conv. {pct(l.convRate)} · score {l.avgScore.toFixed(1)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><GitBranch className="h-4 w-4"/>Pipelines</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(p.active)}/{fmt(p.total)}</div><p className="text-xs text-muted-foreground">{fmt(p.stagesTotal)} estágios ({fmt(p.stagesWon)}W / {fmt(p.stagesLost)}L)</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><KanbanSquare className="h-4 w-4"/>Oportunidades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(o.total)}</div><p className="text-xs text-muted-foreground">{fmt(o.companies)} empresas · {fmt(o.open)} abertas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4"/>Win-rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(o.winRate)}</div><p className="text-xs text-muted-foreground">{fmt(o.won)}W / {fmt(o.lost)}L</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4"/>Valor ganho</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(o.wonValueBRL)}</div><p className="text-xs text-muted-foreground">ticket médio {brl(o.avgTicketBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4"/>Ciclo médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{o.avgCycleDays.toFixed(1)}d</div><p className="text-xs text-muted-foreground">pipeline ativo {brl(o.grossValueBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4"/>Atividades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.completed)}/{fmt(a.total)}</div><p className="text-xs text-muted-foreground">conclusão {pct(a.completionRate)} · {fmt(a.overdue)} atrasadas</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tab title="Marketing leads por fonte" rows={m.bySource} />
        <Tab title="Marketing leads por status" rows={m.byStatus} />
        <Tab title="Marketing leads por nicho" rows={m.byNiche} />
        <Tab title="Marketing — UTM source" rows={m.byUtmSource} />
        <Tab title="Marketing — UTM campaign" rows={m.byUtmCampaign} />
        <Tab title="CRM leads por status" rows={l.byStatus} />
        <Tab title="CRM leads por fonte" rows={l.bySource} />
        <Tab title="CRM leads por owner" rows={l.byOwner} />
        <Tab title="Oportunidades por estágio" rows={o.byStage} />
        <Tab title="Oportunidades por pipeline" rows={o.byPipeline} />
        <Tab title="Oportunidades por owner" rows={o.byOwner} />
        <Tab title="Oportunidades por status" rows={o.byStatus} />
        <Tab title="Atividades por tipo" rows={a.byKind} />
        <Tab title="Atividades por status" rows={a.byStatus} />
        <Tab title="Atividades por owner" rows={a.byOwner} />
      </div>
    </div>
  );
}
