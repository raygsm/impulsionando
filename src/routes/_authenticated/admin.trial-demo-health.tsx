import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTrialDemoHealth } from "@/lib/trial-demo-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical, RefreshCw, ShieldCheck, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/trial-demo-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getTrialDemoHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","trial-demo",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const t = data.trials; const d = data.demo;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><FlaskConical className="h-6 w-6 text-primary"/>Trial & Demo Governance</h1>
          <p className="text-sm text-muted-foreground">Trials ativos, conversão, abuso e funil de demos.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5"/>Trials</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Trials Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(t.active)}<span className="text-sm text-muted-foreground">/{fmt(t.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(t.newInWindow)} novos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Conversão</CardTitle></CardHeader><CardContent><Badge variant={t.conversionRate>=20?"default":t.conversionRate>=10?"secondary":"destructive"} className="text-base">{pct(t.conversionRate)}</Badge><p className="text-xs text-muted-foreground mt-1">{fmt(t.converted)} convertidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Vencem em 7d</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${t.expiringSoon>0?"text-amber-600":""}`}>{fmt(t.expiringSoon)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Suspensos / Cancelados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{fmt(t.suspended)} / {fmt(t.cancelled)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Eventos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(t.events)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Abuso Detectado</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${t.abuseHits>0?"text-destructive":""}`}>{fmt(t.abuseHits)}</div><p className="text-xs text-muted-foreground">hashes na janela</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Distribuição por Plano</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{t.plans.map((p)=>(<div key={p.plan} className="p-3 rounded-md bg-muted/30"><div className="text-xs text-muted-foreground">{p.plan}</div><div className="text-lg font-bold">{fmt(p.count)}</div></div>))}</div>
      </CardContent></Card>

      <h2 className="text-lg font-semibold flex items-center gap-2 pt-4"><Sparkles className="h-5 w-5"/>Demo</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sessões Demo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(d.sessions)}</div><p className="text-xs text-muted-foreground">Score médio {d.avgScore.toFixed(1)} · {d.avgDurationMin.toFixed(1)}min</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ambientes Demo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(d.activeEnvironments)}<span className="text-sm text-muted-foreground">/{fmt(d.environments)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads Capturados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(d.leads)}</div><p className="text-xs text-muted-foreground">{fmt(d.surveys)} surveys</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conv. Visitas Demo</CardTitle></CardHeader><CardContent><Badge variant={d.visitConvRate>=15?"default":d.visitConvRate>=5?"secondary":"destructive"} className="text-base">{pct(d.visitConvRate)}</Badge><p className="text-xs text-muted-foreground mt-1">{fmt(d.visitsConverted)}/{fmt(d.visits)} · {fmt(d.visitsAbandoned)} abandono</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top Módulos Acessados</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {d.topModules.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{m.module}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top Nichos (Demo)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {d.topNiches.map((n,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{n.niche}</td><td className="text-right">{fmt(n.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
