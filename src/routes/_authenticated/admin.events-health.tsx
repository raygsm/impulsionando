import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEventsHealth } from "@/lib/events-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, RefreshCw, Calendar, TrendingUp, Repeat, DoorOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/events-health")({
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

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function rateVariant(p: number): "default" | "secondary" | "destructive" {
  if (p >= 80) return "default";
  if (p >= 50) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getEventsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "events-health", days],
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Eventos & Ticketing Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Vendas, sell-through, check-in rate, transferências e receita por evento.
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Eventos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.events.total)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.events.published)} publicados · {fmt(data.events.upcoming)} futuros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">GMV Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.sales.gmv)}</div>
            <p className="text-xs text-muted-foreground">Janela: {brl(data.sales.gmvWindow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ingressos Válidos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.sales.ticketsValid)}<span className="text-sm text-muted-foreground">/{fmt(data.sales.ticketsTotal)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.sales.ticketsCancelled)} cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Médio</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.sales.avgTicket)}</div>
            <p className="text-xs text-muted-foreground">Reembolso: {brl(data.sales.refundedRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Sell-Through</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={rateVariant(data.sales.sellThrough)} className="text-base">{pct(data.sales.sellThrough)}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{fmt(data.sales.totalSold)}/{fmt(data.sales.totalOffered)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DoorOpen className="h-4 w-4" />Check-in Rate</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={rateVariant(data.sales.checkinRate)} className="text-base">{pct(data.sales.checkinRate)}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{fmt(data.sales.ticketsUsed)} usados · {fmt(data.sales.checkinsWindow)} na janela</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Repeat className="h-4 w-4" />Transferências</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.transfers.total)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.transfers.approved)} ok · {fmt(data.transfers.pending)} pendentes · {fmt(data.transfers.rejected)} negadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Transferências</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{brl(data.transfers.feeRevenue)}</div>
            <p className="text-xs text-muted-foreground">Taxas cobradas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking de Eventos (Top 20)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Evento</th>
                  <th className="text-left">Cidade/UF</th>
                  <th className="text-right">Capacidade</th>
                  <th className="text-right">Vendidos</th>
                  <th className="text-right">Ocupação</th>
                  <th className="text-right">Check-in</th>
                  <th className="text-right">Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.eventsRanking.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{e.title}</td>
                    <td className="text-xs">{e.city}</td>
                    <td className="text-right">{fmt(e.capacity)}</td>
                    <td className="text-right">{fmt(e.sold)}</td>
                    <td className="text-right">
                      {e.capacity > 0 ? <Badge variant={rateVariant(e.occupancy)}>{pct(e.occupancy)}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-right">
                      {e.sold > 0 ? <Badge variant={rateVariant(e.checkinRate)}>{pct(e.checkinRate)}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-right font-medium">{brl(e.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Tipos de Ingresso (Receita)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-right">Preço</th>
                    <th className="text-right">Vendidos</th>
                    <th className="text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTypes.map((t, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="text-right">{brl(t.price)}</td>
                      <td className="text-right">{fmt(t.sold)}<span className="text-xs text-muted-foreground">/{fmt(t.offered)}</span></td>
                      <td className="text-right font-medium">{brl(t.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Check-ins por Gate (janela)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.gates.map((g) => (
                  <tr key={g.gate} className="border-b last:border-0">
                    <td className="py-2">{g.gate}</td>
                    <td className="text-right">{fmt(g.count)}</td>
                  </tr>
                ))}
                {data.gates.length === 0 && <tr><td className="py-2 text-muted-foreground text-center">Sem check-ins na janela</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
