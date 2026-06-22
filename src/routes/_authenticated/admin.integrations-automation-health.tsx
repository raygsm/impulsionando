import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getIntegrationsAutomationHealth } from "@/lib/integrations-automation-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workflow, RefreshCw, Zap, MessageSquare, AlertTriangle, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/integrations-automation-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getIntegrationsAutomationHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","integrations-auto-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Workflow className="h-6 w-6 text-primary"/>Webhooks, Integrations & Automation</h1>
          <p className="text-sm text-muted-foreground">Integrações cadastradas, webhooks, Mercado Pago, N8N, WhatsApp e runtime events.</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Integrações Ativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.integrations.active)}<span className="text-sm text-muted-foreground">/{fmt(data.integrations.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.integrations.withError)} c/ erro</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Webhooks (Runs)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.success)}<span className="text-sm text-muted-foreground">/{fmt(data.webhooks.runs)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.webhooks.failed)} falhas · {fmt(data.webhooks.retried)} retries</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4"/>Mercado Pago</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.mercadoPago.processed)}<span className="text-sm text-muted-foreground">/{fmt(data.mercadoPago.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.mercadoPago.invalidSignatures)} sig inválidas · {fmt(data.mercadoPago.errors)} erros</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4"/>N8N Runs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.n8n.success)}<span className="text-sm text-muted-foreground">/{fmt(data.n8n.runs)}</span></div><p className="text-xs text-muted-foreground">{Math.round(data.n8n.avgLatencyMs)}ms · {fmt(data.n8n.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Logs de Integração</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.integrationLogs.success)}<span className="text-sm text-muted-foreground">/{fmt(data.integrationLogs.total)}</span></div><p className="text-xs text-muted-foreground">{Math.round(data.integrationLogs.avgMs)}ms médio</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Event Log</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.eventsProcessed)}<span className="text-sm text-muted-foreground">/{fmt(data.webhooks.events)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.webhooks.eventsReplayed)} replays</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4"/>WhatsApp Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.whatsapp.events)}</div><p className="text-xs text-muted-foreground">{fmt(data.whatsapp.errors)} com erro</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Runtime Errors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{fmt(data.runtime.errors)}</div><p className="text-xs text-muted-foreground">de {fmt(data.runtime.events)} eventos</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top Integrações (chamadas)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Slug</th><th className="text-right">Total</th><th className="text-right">Falhas</th></tr></thead><tbody>
          {data.integrationLogs.topIntegrations.map((i,idx)=>(<tr key={idx} className="border-b last:border-0"><td className="py-2">{i.slug}</td><td className="text-right">{fmt(i.total)}</td><td className="text-right text-red-600">{fmt(i.failed)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top Webhook Workflows</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Workflow</th><th className="text-right">Total</th><th className="text-right">Falhas</th></tr></thead><tbody>
          {data.webhooks.topWorkflows.map((w,idx)=>(<tr key={idx} className="border-b last:border-0"><td className="py-2">{w.workflow}</td><td className="text-right">{fmt(w.total)}</td><td className="text-right text-red-600">{fmt(w.failed)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top Réguas N8N</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Régua</th><th className="text-right">Runs</th><th className="text-right">Falhas</th></tr></thead><tbody>
          {data.n8n.topReguas.map((r,idx)=>(<tr key={idx} className="border-b last:border-0"><td className="py-2">{r.regua}</td><td className="text-right">{fmt(r.total)}</td><td className="text-right text-red-600">{fmt(r.failed)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Canais N8N</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.n8n.channels.map((c,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{c.channel}</td><td className="text-right">{fmt(c.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Tipos de Evento MP</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.mercadoPago.eventTypes.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{m.type}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">WhatsApp por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.whatsapp.statuses.map((w,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{w.status}</td><td className="text-right">{fmt(w.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Runtime por Nível</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.runtime.levels.map((r,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{r.level}</td><td className="text-right">{fmt(r.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
