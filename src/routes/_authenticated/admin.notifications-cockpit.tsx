import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getNotificationsCockpit } from "@/lib/notifications-cockpit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, RefreshCw, MessageSquare, Send, Webhook } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notifications-cockpit")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getNotificationsCockpit);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","notif-cockpit",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Inbox className="h-6 w-6 text-primary"/>Notifications Cockpit</h1>
          <p className="text-sm text-muted-foreground">Notificações in-app, preferências, tentativas, e-mail, WhatsApp e webhooks.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Notificações In-App</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.notifications.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.notifications.read)} lidas · {fmt(data.notifications.unread)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Preferências Ativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.preferences.enabled)}<span className="text-sm text-muted-foreground">/{fmt(data.preferences.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tentativas de Envio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.attempts.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.attempts.ok)} ok · {fmt(data.attempts.fail)} falhas · {fmt(data.attempts.retries)} retries</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Retenção (Limpeza)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.retention.runs)}</div><p className="text-xs text-muted-foreground">{fmt(data.retention.totalDeleted)} excluídos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Templates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.templates.active)}<span className="text-sm text-muted-foreground">/{fmt(data.templates.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4"/>E-mails</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.email.sent)}<span className="text-sm text-muted-foreground">/{fmt(data.email.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.email.bounced)} bounces · {fmt(data.email.suppressed)} suprimidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4"/>WhatsApp</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.whatsapp.delivered)}<span className="text-sm text-muted-foreground">/{fmt(data.whatsapp.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.whatsapp.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Webhook className="h-4 w-4"/>Webhooks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.ok)}<span className="text-sm text-muted-foreground">/{fmt(data.webhooks.runs)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.webhooks.fail)} falhas</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Tentativas por Canal</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Canal</th><th>Total</th><th>OK</th><th>Falhas</th><th>Taxa</th></tr></thead>
        <tbody>{data.attempts.byChannel.map((r:any)=>(<tr key={r.channel} className="border-t"><td className="py-1">{r.channel}</td><td>{fmt(r.total)}</td><td className="text-green-600">{fmt(r.ok)}</td><td className="text-destructive">{fmt(r.fail)}</td><td>{pct(r.successRate)}</td></tr>))}</tbody></table>
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Top Tipos de Notificação</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.notifications.topTypes.map((r:any)=>(<tr key={r.type} className="border-t"><td className="py-1">{r.type}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Templates de E-mail</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.email.topTemplates.map((r:any)=>(<tr key={r.template} className="border-t"><td className="py-1">{r.template}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Eventos WhatsApp</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.whatsapp.topEvents.map((r:any)=>(<tr key={r.event} className="border-t"><td className="py-1">{r.event}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Fontes de Webhook</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.webhooks.topSources.map((r:any)=>(<tr key={r.source} className="border-t"><td className="py-1">{r.source}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
