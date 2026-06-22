import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRestaurantHealth } from "@/lib/restaurant-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, RefreshCw, Timer, ChefHat, CreditCard, Wallet, QrCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/restaurant-health")({
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

function Page() {
  const fn = useServerFn(getRestaurantHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "restaurant-health", days],
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
            <Utensils className="h-6 w-6 text-primary" />
            Restaurant & POS Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Giro de mesas, cozinha, top itens, caixas, pagamentos e Pix.
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
          <CardHeader className="pb-2"><CardTitle className="text-sm">Mesas Ativas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.tables.active)}<span className="text-sm text-muted-foreground">/{fmt(data.tables.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.tables.occupied)} ocupadas · cap. {fmt(data.tables.capacity)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Timer className="h-4 w-4" />Tempo Médio</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tables.avgTurnMin.toFixed(0)} min</div>
            <p className="text-xs text-muted-foreground">{data.tables.turnoverPerTable.toFixed(1)} giros/mesa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Comandas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.sessions.revenue)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.sessions.total)} sessões · {data.sessions.avgPartySize.toFixed(1)} pax/comanda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Médio</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.orders.avgTicket)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.orders.confirmed)} pedidos confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Pedidos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.orders.revenue)}</div>
            <p className="text-xs text-muted-foreground">Desconto: {brl(data.orders.discount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taxa Cancelamento</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={data.orders.cancelRate <= 3 ? "default" : data.orders.cancelRate <= 7 ? "secondary" : "destructive"} className="text-base">{pct(data.orders.cancelRate)}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{fmt(data.orders.cancelled)} cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ChefHat className="h-4 w-4" />Cozinha</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kitchen.avgPrepMin.toFixed(0)} min</div>
            <p className="text-xs text-muted-foreground">{fmt(data.kitchen.served)}/{fmt(data.kitchen.items)} itens servidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cardápio</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.menu.available)}<span className="text-sm text-muted-foreground">/{fmt(data.menu.active)}</span></div>
            <p className="text-xs text-muted-foreground">disponíveis agora</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Itens (Receita)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-right">Qtd</th>
                    <th className="text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topItems.map((it, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{it.name}</td>
                      <td className="text-right">{fmt(it.qty)}</td>
                      <td className="text-right font-medium">{brl(it.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Pagamentos por Método</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Total: <span className="font-medium text-foreground">{brl(data.payments.total)}</span> em {fmt(data.payments.count)} pagamentos</p>
            <table className="w-full text-sm">
              <tbody>
                {data.payments.breakdown.map((p) => (
                  <tr key={p.method} className="border-b last:border-0">
                    <td className="py-2 text-xs font-mono">{p.method.slice(0, 12)}</td>
                    <td className="text-right">{fmt(p.count)}</td>
                    <td className="text-right font-medium">{brl(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" />Sessões de Caixa</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{fmt(data.cash.sessions)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Em aberto</span><span className={`font-medium ${data.cash.open > 0 ? "text-amber-600" : ""}`}>{fmt(data.cash.open)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fechadas</span><span className="font-medium">{fmt(data.cash.closed)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Sessões com diferença</span><span className={`font-medium ${data.cash.withDiff > 0 ? "text-amber-600" : "text-emerald-600"}`}>{fmt(data.cash.withDiff)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Diferença líquida</span><span className={`font-medium ${Math.abs(data.cash.diffSum) > 1 ? "text-destructive" : ""}`}>{brl(data.cash.diffSum)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Diferença absoluta</span><span className="font-medium">{brl(data.cash.diffAbs)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" />Cobranças Pix</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{fmt(data.pix.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pagas</span><span className="font-medium text-emerald-600">{fmt(data.pix.paid)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pendentes</span><span className="font-medium">{fmt(data.pix.pending)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Falhas</span><span className={`font-medium ${data.pix.failed > 0 ? "text-destructive" : ""}`}>{fmt(data.pix.failed)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Receita Pix</span><span className="font-medium">{brl(data.pix.revenue)}</span></div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
