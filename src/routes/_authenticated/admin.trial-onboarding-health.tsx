import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTrialOnboardingHealth } from "@/lib/trial-onboarding-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, RefreshCw, CheckCircle2, Clock, ShieldAlert, Globe, Mail, FlaskConical, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/trial-onboarding-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
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
  const fn = useServerFn(getTrialOnboardingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","trial-onboarding-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const t = data.trials, ev = data.events, ab = data.abuse, ch = data.checklist, dr = data.domainRequests, er = data.emailRequests, de = data.demoEnvs;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Rocket className="h-6 w-6 text-primary"/>Trial & Onboarding — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Trials, conversão, abuso, checklist, solicitações de domínio/e-mail e ambientes demo.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Rocket className="h-4 w-4"/>Trials ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(t.active)}</div><p className="text-xs text-muted-foreground">{fmt(t.total)} no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Conversão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(t.conversionRate)}</div><p className="text-xs text-muted-foreground">{fmt(t.converted)} convertidos · {fmt(t.cancelled)} cancelados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4"/>Expirando ≤3d</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(t.expiringSoon)}</div><p className="text-xs text-muted-foreground">{fmt(t.expired)} já expirados · {fmt(t.suspended)} suspensos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4"/>Sinais de abuso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(ab.total)}</div><p className="text-xs text-muted-foreground">registros no índice</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>Checklist</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(ch.completionRate)}</div><p className="text-xs text-muted-foreground">{fmt(ch.completed)}/{fmt(ch.total)} itens concluídos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4"/>Domínios pendentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(dr.pending)}</div><p className="text-xs text-muted-foreground">{fmt(dr.total)} solicitações</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4"/>E-mails pendentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(er.pending)}</div><p className="text-xs text-muted-foreground">{fmt(er.total)} solicitações</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4"/>Demos ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(de.active)}</div><p className="text-xs text-muted-foreground">{fmt(de.total)} ambientes cadastrados</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Tab title="Trials por status" rows={t.byStatus}/>
        <Tab title="Trials por plano" rows={t.byPlan}/>
        <Tab title="Trials por origem" rows={t.bySource}/>
        <Tab title="Eventos de trial" rows={ev.byType}/>
        <Tab title="Checklist por item" rows={ch.byItem}/>
        <Tab title="Checklist por status" rows={ch.byStatus}/>
        <Tab title="Domínios por status" rows={dr.byStatus}/>
        <Tab title="Domínios por modo" rows={dr.byMode}/>
        <Tab title="E-mails por status" rows={er.byStatus}/>
        <Tab title="Demos por nicho" rows={de.byNiche}/>
      </div>
    </div>
  );
}
