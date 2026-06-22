import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCommsHealth } from "@/lib/comms-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, RefreshCw, MessageSquare, Mail, AlertTriangle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/comms-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function rateVariant(rate: number): "default" | "secondary" | "destructive" {
  if (rate >= 95) return "default";
  if (rate >= 85) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getCommsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "comms-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!data) return null;
  const k = data.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" />
            Comunicação Omnichannel Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde da entrega multicanal — outbox, WhatsApp, e-mail, supressão e tempos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taxa Global de Entrega</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pct(k.deliveryRate)}</div>
            <Badge variant={rateVariant(k.deliveryRate)} className="mt-2">{fmt(k.sent)} de {fmt(k.total)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Falhas</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.failed > 0 ? "text-destructive" : ""}`}>{fmt(k.failed)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.retriesHigh)} em loop de retry</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Pendentes</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.stalePending > 0 ? "text-amber-600" : ""}`}>{fmt(k.pending)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.stalePending)} &gt; 2h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tempo Médio de Entrega</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.avgDeliveryMinutes.toFixed(1)} min</div>
            <p className="text-xs text-muted-foreground">scheduled → sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-emerald-600" />WhatsApp</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.waDelivered)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.waFailed)} falhas · leitura {pct(k.waReadRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />E-mail</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(k.emDeliveryRate)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.emSent)}/{fmt(k.emTotal)} · {fmt(k.emFailed)} falhas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Supressões (período)</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.suppressedCount > 0 ? "text-amber-600" : ""}`}>{fmt(k.suppressedCount)}</div>
            <p className="text-xs text-muted-foreground">bounces/queixas/unsub</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Templates Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.templatesActive)}<span className="text-sm text-muted-foreground">/{fmt(k.templatesTotal)}</span></div>
            <p className="text-xs text-muted-foreground">multicanal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Performance por Canal</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Canal</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Enviadas</th>
                  <th className="text-right">Falhas</th>
                  <th className="text-right">Pend.</th>
                  <th className="text-right">Pend.&gt;2h</th>
                  <th className="text-right">Retry alto</th>
                  <th className="text-right">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((c) => (
                  <tr key={c.channel} className="border-b last:border-0">
                    <td className="py-2 capitalize font-medium">{c.channel}</td>
                    <td className="text-right">{fmt(c.total)}</td>
                    <td className="text-right text-emerald-600">{fmt(c.sent)}</td>
                    <td className="text-right text-destructive">{fmt(c.failed)}</td>
                    <td className="text-right">{fmt(c.pending)}</td>
                    <td className="text-right">{fmt(c.stalePending)}</td>
                    <td className="text-right">{fmt(c.retriesHigh)}</td>
                    <td className="text-right"><Badge variant={rateVariant(c.deliveryRate)}>{pct(c.deliveryRate)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />Top Erros WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.waTopErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem erros no período. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data.waTopErrors.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive" className="shrink-0">{e.count}×</Badge>
                    <span className="text-muted-foreground">{e.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Supressão de E-mails</CardTitle></CardHeader>
          <CardContent>
            {data.suppressionBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem supressões no período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr><th className="text-left py-2">Motivo</th><th className="text-right">Qtd</th></tr>
                </thead>
                <tbody>
                  {data.suppressionBreakdown.map((s) => (
                    <tr key={s.reason} className="border-b last:border-0">
                      <td className="py-2 capitalize">{s.reason}</td>
                      <td className="text-right">{fmt(s.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">E-mail por Template (Top 15)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Template</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Enviados</th>
                  <th className="text-right">Falhas</th>
                  <th className="text-right">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {data.emailByTemplate.map((t) => (
                  <tr key={t.template} className="border-b last:border-0">
                    <td className="py-2 font-medium">{t.template}</td>
                    <td className="text-right">{fmt(t.total)}</td>
                    <td className="text-right text-emerald-600">{fmt(t.sent)}</td>
                    <td className="text-right text-destructive">{fmt(t.failed)}</td>
                    <td className="text-right"><Badge variant={rateVariant(t.rate)}>{pct(t.rate)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tenants — Volume e Entrega (Top 25)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Tenant</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Enviadas</th>
                  <th className="text-right">Falhas</th>
                  <th className="text-right">Pend.</th>
                  <th className="text-right">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((t) => (
                  <tr key={t.companyId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{t.name}</td>
                    <td className="text-right">{fmt(t.total)}</td>
                    <td className="text-right text-emerald-600">{fmt(t.sent)}</td>
                    <td className="text-right text-destructive">{fmt(t.failed)}</td>
                    <td className="text-right">{fmt(t.pending)}</td>
                    <td className="text-right"><Badge variant={rateVariant(t.deliveryRate)}>{pct(t.deliveryRate)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
