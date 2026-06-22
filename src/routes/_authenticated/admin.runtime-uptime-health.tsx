import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRuntimeUptimeHealth } from "@/lib/runtime-uptime-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, RefreshCw, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/runtime-uptime-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getRuntimeUptimeHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","runtime",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Activity className="h-6 w-6 text-primary"/>Runtime, Webhooks & Uptime</h1>
          <p className="text-sm text-muted-foreground">Eventos de runtime, entregas de webhooks, uptime checks, incidentes e integrações.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Runtime Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.runtime.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Webhooks OK / Falha</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.success)}<span className="text-sm text-muted-foreground"> / {fmt(data.webhooks.failed)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.webhooks.retried)} retries · {fmt(data.webhooks.avgDurationMs)}ms média</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Eventos não processados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.unprocessedEvents)}<span className="text-sm text-muted-foreground">/{fmt(data.webhooks.eventsTotal)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4"/>Uptime médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.uptime.avgUptimePct}<span className="text-sm text-muted-foreground">%</span></div><p className="text-xs text-muted-foreground">{fmt(data.uptime.up)} up · {fmt(data.uptime.down)} down · {fmt(data.uptime.enabled)}/{fmt(data.uptime.checks)} ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Incidentes Abertos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.incidents.open)}<span className="text-sm text-muted-foreground">/{fmt(data.incidents.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.incidents.critical)} críticos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">MTTR</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.incidents.mttrHours}<span className="text-sm text-muted-foreground"> h</span></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Runtime por Severidade</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.runtime.bySeverity.map((r:any)=>(<tr key={r.severity} className="border-t"><td className="py-1">{r.severity}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Tipos de Evento</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.runtime.topTypes.map((r:any)=>(<tr key={r.type} className="border-t"><td className="py-1">{r.type}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Webhooks por Provider</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.webhooks.byProvider.map((r:any)=>(<tr key={r.provider} className="border-t"><td className="py-1">{r.provider}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Integrações (OK / Erro)</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><thead><tr><th className="text-left">Integração</th><th className="text-right">OK</th><th className="text-right">Erro</th></tr></thead><tbody>{data.integrations.map((r:any)=>(<tr key={r.integration} className="border-t"><td className="py-1">{r.integration}</td><td className="text-right text-emerald-600">{fmt(r.ok)}</td><td className="text-right text-destructive">{fmt(r.err)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
