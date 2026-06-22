import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getNotificationDelivery } from "@/lib/notification-delivery.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Mail, MessageSquare, AlertTriangle, RefreshCw, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notification-delivery")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent></Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "";
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </CardContent></Card>
  );
}

function rateTone(rate: number, total: number): "ok" | "warn" | "bad" {
  if (total === 0) return "ok";
  if (rate >= 95) return "ok";
  if (rate >= 85) return "warn";
  return "bad";
}

function Page() {
  const [days, setDays] = useState(7);
  const fetchFn = useServerFn(getNotificationDelivery);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["notif-delivery", days],
    queryFn: () => fetchFn({ data: { days } }),
  });

  if (isLoading || !data) {
    return <div className="p-6 space-y-4"><Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
      <Skeleton className="h-64"/></div>;
  }

  const d = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Send className="h-6 w-6" /> Notification Delivery Health</h1>
          <p className="text-sm text-muted-foreground">Entrega multi-canal (e-mail, WhatsApp, push) — janela {d.windowDays}d.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">24 horas</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="14">14 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching?"animate-spin":""}`}/>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="E-mails (únicos)" value={fmt(d.email.total)} hint={`${pct(d.email.deliveryRate)} entregues`} tone={rateTone(d.email.deliveryRate, d.email.total)} />
        <Kpi label="WhatsApp eventos" value={fmt(d.whatsapp.total)} hint={`${pct(d.whatsapp.deliveryRate)} entregues`} tone={rateTone(d.whatsapp.deliveryRate, d.whatsapp.total)} />
        <Kpi label="Outbox total" value={fmt(d.outboxByChannel.reduce((s,c)=>s+c.total,0))} hint={`${d.outboxByChannel.reduce((s,c)=>s+c.stuck,0)} travados >30min`} tone={d.outboxByChannel.reduce((s,c)=>s+c.stuck,0)>0?"bad":"ok"} />
        <Kpi label="Suprimidos" value={fmt(d.suppressedTotal)} tone={d.suppressedTotal>0?"warn":"ok"} />
        <Kpi label="E-mails falhos" value={fmt(d.email.failed)} tone={d.email.failed>0?"bad":"ok"} />
        <Kpi label="WhatsApp falhos" value={fmt(d.whatsapp.failed)} tone={d.whatsapp.failed>0?"bad":"ok"} />
        <Kpi label="Tentativas (log)" value={fmt(d.attempts.total)} />
        <Kpi label="WA fallback ativos" value={`${d.whatsapp.fallbacksActive}/${d.whatsapp.fallbacksTotal}`} tone={d.whatsapp.fallbacksActive===0?"warn":"ok"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/> Outbox por canal</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr><th className="py-2">Canal</th><th className="text-right">Total</th><th className="text-right">Enviados</th><th className="text-right">Pendentes</th><th className="text-right">Travados</th><th className="text-right">Falhos</th><th className="text-right">Entrega</th></tr>
              </thead>
              <tbody>
                {d.outboxByChannel.map((c) => (
                  <tr key={c.channel} className="border-b last:border-0">
                    <td className="py-2 capitalize">{c.channel}</td>
                    <td className="text-right tabular-nums">{fmt(c.total)}</td>
                    <td className="text-right tabular-nums text-emerald-600">{fmt(c.sent)}</td>
                    <td className="text-right tabular-nums">{fmt(c.pending)}</td>
                    <td className="text-right tabular-nums text-amber-600">{fmt(c.stuck)}</td>
                    <td className="text-right tabular-nums text-destructive">{fmt(c.failed)}</td>
                    <td className="text-right tabular-nums font-medium">{c.total ? pct(c.deliveryRate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4"/> Top templates de e-mail</CardTitle></CardHeader>
          <CardContent>
            {d.email.topTemplates.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Template</th><th className="text-right">Sent</th><th className="text-right">Failed</th><th className="text-right">Total</th></tr>
                </thead>
                <tbody>
                  {d.email.topTemplates.map((t) => (
                    <tr key={t.template} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs truncate max-w-[260px]">{t.template}</td>
                      <td className="text-right tabular-nums text-emerald-600">{t.sent}</td>
                      <td className="text-right tabular-nums text-destructive">{t.failed}</td>
                      <td className="text-right tabular-nums font-medium">{t.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Top erros</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">E-mail</div>
              {d.email.topErrors.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum erro.</p> :
                d.email.topErrors.map((e, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 py-1 text-xs border-b last:border-0">
                    <span className="truncate">{e.msg}</span>
                    <Badge variant="destructive">{e.count}</Badge>
                  </div>
                ))}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">WhatsApp</div>
              {d.whatsapp.topErrors.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum erro.</p> :
                d.whatsapp.topErrors.map((e, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 py-1 text-xs border-b last:border-0">
                    <span className="truncate">{e.msg}</span>
                    <Badge variant="destructive">{e.count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4"/> WhatsApp — status breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(d.whatsapp.statusBreakdown).map(([s, c]) => (
                <div key={s} className="flex justify-between"><span className="text-muted-foreground">{s}</span><span className="tabular-nums">{fmt(c)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Razões de supressão</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(d.suppressedReasons).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum e-mail suprimido.</p> :
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(d.suppressedReasons).map(([r, c]) => (
                  <div key={r} className="flex justify-between"><span className="text-muted-foreground truncate">{r}</span><span className="tabular-nums">{fmt(c)}</span></div>
                ))}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
