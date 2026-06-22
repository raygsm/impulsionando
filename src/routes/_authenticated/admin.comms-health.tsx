import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCommsHealth } from "@/lib/comms-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, RefreshCw, MessageSquare, Mail, Inbox, FileText, Bell, Webhook, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/comms-health")({
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
  const fn = useServerFn(getCommsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","comms-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const o = data.outbox, t = data.templates, na = data.notifAttempts, nn = data.notifications, wa = data.whatsapp, em = data.email, sp = data.suppressed, wo = data.webhooksOut, wi = data.webhooksIn;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Send className="h-6 w-6 text-primary"/>Comunicação & Mensageria — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Outbox, templates, WhatsApp, e-mail, supressões, notificações in-app e webhooks.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4"/>Outbox — entrega</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(o.deliveryRate)}</div><p className="text-xs text-muted-foreground">{fmt(o.sent)}/{fmt(o.total)} · {fmt(o.failed)} falhas · {fmt(o.pending)} pend.</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Templates ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(t.active)}/{fmt(t.total)}</div><p className="text-xs text-muted-foreground">multicanal</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4"/>Tentativas de envio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(na.successRate)}</div><p className="text-xs text-muted-foreground">{fmt(na.success)}/{fmt(na.total)} · {fmt(na.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4"/>In-app — leitura</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(nn.readRate)}</div><p className="text-xs text-muted-foreground">{fmt(nn.read)}/{fmt(nn.total)} lidas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-emerald-600"/>WhatsApp</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(wa.deliveryRate)}</div><p className="text-xs text-muted-foreground">{fmt(wa.delivered)}/{fmt(wa.total)} · {fmt(wa.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4"/>E-mail</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(em.sentRate)}</div><p className="text-xs text-muted-foreground">{fmt(em.sent)}/{fmt(em.total)} · {fmt(em.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600"/>Supressões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(sp.total)}</div><p className="text-xs text-muted-foreground">bounces / unsub</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Webhook className="h-4 w-4"/>Webhooks out</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(wo.okRate)}</div><p className="text-xs text-muted-foreground">{fmt(wo.ok)}/{fmt(wo.total)} · {fmt(wo.failed)} falhas</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tab title="Outbox por canal" rows={o.byChannel} />
        <Tab title="Outbox por status" rows={o.byStatus} />
        <Tab title="Outbox por evento (top 15)" rows={o.byEvent} />
        <Tab title="Templates por canal" rows={t.byChannel} />
        <Tab title="Tentativas por canal" rows={na.byChannel} />
        <Tab title="Tentativas por status" rows={na.byStatus} />
        <Tab title="Tentativas — top razões" rows={na.byReason} />
        <Tab title="Notificações por categoria" rows={nn.byCategory} />
        <Tab title="Notificações por severidade" rows={nn.bySeverity} />
        <Tab title="WhatsApp por status" rows={wa.byStatus} />
        <Tab title="WhatsApp — top erros" rows={wa.byError} />
        <Tab title="E-mail por status" rows={em.byStatus} />
        <Tab title="E-mail por template (top 15)" rows={em.byTemplate} />
        <Tab title="Supressões por motivo" rows={sp.byReason} />
        <Tab title="Webhooks out por status" rows={wo.byStatus} />
        <Tab title="Webhooks out por workflow" rows={wo.byWorkflow} />
        <Tab title="Webhooks in por fonte" rows={wi.bySource} />
        <Tab title="Webhooks in por status" rows={wi.byStatus} />
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.windowDays} dias</p>
    </div>
  );
}
