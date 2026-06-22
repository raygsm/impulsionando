import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getNotificationDeliverabilityHealth } from "@/lib/notification-deliverability-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, RefreshCw, Inbox, MessageSquare, Mail, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notification-deliverability-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getNotificationDeliverabilityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","notification-deliverability-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  const deliveryRate = data.attempts.total ? (data.attempts.sent / data.attempts.total) * 100 : 0;
  const readRate = data.notifications.total ? (data.notifications.read / data.notifications.total) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Bell className="h-6 w-6 text-primary"/>Notification Center & Deliverability</h1>
          <p className="text-sm text-muted-foreground">Notificações in-app, preferências, tentativas de despacho multicanal, throttle de e-mail, supressões e roteamento WhatsApp.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4"/>Notificações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.notifications.total)}</div><p className="text-xs text-muted-foreground">{readRate.toFixed(1)}% lidas · {fmt(data.notifications.uniqueUsers)} usuários</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tempo até Leitura</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.notifications.avgReadMinutes < 60 ? `${data.notifications.avgReadMinutes.toFixed(0)} min` : `${(data.notifications.avgReadMinutes/60).toFixed(1)}h`}</div><p className="text-xs text-muted-foreground">{fmt(data.notifications.unread)} não lidas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Tentativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.attempts.total)}</div><p className="text-xs text-muted-foreground"><span className="text-green-600">{deliveryRate.toFixed(1)}%</span> ok · <span className="text-red-600">{fmt(data.attempts.failed)} falhas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Idempotência</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.attempts.idempotencyKeys)}</div><p className="text-xs text-muted-foreground">chaves únicas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Preferências</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.preferences.enabled)}/{fmt(data.preferences.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.preferences.uniqueUsers)} usuários configurados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4"/>Email Throttle</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.email.throttled ? <span className="text-red-600">ativo</span> : <span className="text-green-600">livre</span>}</div><p className="text-xs text-muted-foreground">{fmt(data.email.suppressions)} supressões · {fmt(data.email.unsubscribes)} unsubs ({fmt(data.email.unsubscribesUsed)} usados)</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4"/>Support Inbox</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.supportInbox.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.supportInbox.processed)} ok · {fmt(data.supportInbox.withTicket)} viraram ticket · <span className="text-red-600">{fmt(data.supportInbox.errors)} erros</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">WhatsApp Creds</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.whatsapp.active)}/{fmt(data.whatsapp.credentials)}</div><p className="text-xs text-muted-foreground">{fmt(data.whatsapp.verified)} verificadas · <span className="text-red-600">{fmt(data.whatsapp.unhealthy)} unhealthy</span></p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Notificações — Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.notifications.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Notificações — Severidade</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.notifications.bySeverity.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Retenção — Últimas Mudanças</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.retention.changes)} mudanças no período</p>
          <ul className="text-sm space-y-2">
            {data.retention.latest.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {data.retention.latest.map((r) => (
              <li key={r.id} className="border-b pb-2 last:border-0">
                <div className="text-xs"><strong>{r.prev}d</strong> → <strong>{r.next}d</strong></div>
                <div className="text-xs text-muted-foreground">{r.by ?? "—"} · {new Date(r.at).toLocaleString("pt-BR")}</div>
                {r.reason && <div className="text-xs text-muted-foreground">{r.reason}</div>}
              </li>
            ))}
          </ul>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Tentativas — Canal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.attempts.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tentativas — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.attempts.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Tentativas — Top Eventos</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.attempts.byEvent.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tentativas — Top Nichos</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.attempts.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Preferências — Canal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.preferences.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Preferências — Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.preferences.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Email — Supressão</CardTitle></CardHeader><CardContent>
          {data.email.state && (
            <p className="text-xs text-muted-foreground mb-2">
              batch {fmt(data.email.state.batch_size ?? 0)} · delay {fmt(data.email.state.send_delay_ms ?? 0)}ms · auth TTL {fmt(data.email.state.auth_email_ttl_minutes ?? 0)}min · trans TTL {fmt(data.email.state.transactional_email_ttl_minutes ?? 0)}min
              {data.email.state.retry_after_until ? ` · retry após ${new Date(data.email.state.retry_after_until).toLocaleString("pt-BR")}` : ""}
            </p>
          )}
          <table className="w-full text-sm"><tbody>
            {data.email.suppressionByReason.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Support Inbox — Por Mailbox</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.supportInbox.byMailbox.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">WhatsApp — Por Propósito</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.whatsapp.routingActive)}/{fmt(data.whatsapp.routingRules)} regras ativas · {fmt(data.whatsapp.fallbackActive)}/{fmt(data.whatsapp.fallbackConfigs)} fallbacks ativos</p>
          <table className="w-full text-sm"><tbody>
            {data.whatsapp.byPurpose.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp — Credenciais</CardTitle></CardHeader>
        <CardContent>
          {data.whatsapp.list.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr className="border-b"><th className="text-left py-2">Label</th><th className="text-left">Provider</th><th className="text-left">Purpose</th><th className="text-right">Ativa</th><th className="text-right">Verificada</th><th className="text-left">Health</th><th className="text-right">Última checagem</th><th className="text-right">Cota dia/mês</th></tr></thead>
              <tbody>
              {data.whatsapp.list.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2">{r.label}</td><td className="text-xs">{r.provider}</td><td className="text-xs">{r.purpose ?? "—"}</td>
                  <td className="text-right">{r.active ? "✓" : "—"}</td>
                  <td className="text-right">{r.verified ? "✓" : "—"}</td>
                  <td className={`text-xs ${r.health && String(r.health).toLowerCase() !== "healthy" && String(r.health).toLowerCase() !== "ok" ? "text-red-600" : "text-green-600"}`}>{r.health ?? "—"}</td>
                  <td className="text-right text-xs">{r.lastCheck ? new Date(r.lastCheck).toLocaleString("pt-BR") : "—"}</td>
                  <td className="text-right text-xs">{fmt(r.daily ?? 0)} / {fmt(r.monthly ?? 0)}</td>
                </tr>
              ))}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
