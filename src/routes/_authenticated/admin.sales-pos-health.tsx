import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSalesPosHealth } from "@/lib/sales-pos-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sales-pos-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function Page() {
  const fn = useServerFn(getSalesPosHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "sales-pos", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-72 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Sales & POS — Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Pedidos, GMV, ticket médio, métodos de pagamento, top produtos e caixas.
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
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pedidos pagos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.orders.paid)}<span className="text-sm text-muted-foreground">/{fmt(data.orders.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.orders.pending)} pend. · {fmt(data.orders.canceled)} canc.</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">GMV</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.orders.gmv)}</div>
            <p className="text-xs text-muted-foreground">desc. {brl(data.orders.discount)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ticket médio</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.orders.avgTicket)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pagamentos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.payments.amount)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.payments.paid)}/{fmt(data.payments.total)} ok</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Caixas abertos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.cash.open)}<span className="text-sm text-muted-foreground">/{fmt(data.cash.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.cash.closed)} fechados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Diferença líquida</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.cash.differenceSum)}</div>
            <p className="text-xs text-muted-foreground">abs. {brl(data.cash.differenceAbs)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Canais</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.channels.length)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Métodos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.payments.byMethod.length)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Pedidos por Canal</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.channels.map((r: any) => (
                  <tr key={r.channel} className="border-t">
                    <td className="py-1">{r.channel}</td>
                    <td className="text-right">{fmt(r.count)}</td>
                    <td className="text-right text-muted-foreground">{brl(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pagamentos por Método</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.payments.byMethod.map((r: any) => (
                  <tr key={r.method} className="border-t">
                    <td className="py-1">{r.method}</td>
                    <td className="text-right">{fmt(r.count)}</td>
                    <td className="text-right text-muted-foreground">{brl(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Top Produtos</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th>Produto</th><th className="text-right">Qtd</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {data.topProducts.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{r.name}</td>
                  <td className="text-right">{fmt(r.qty)}</td>
                  <td className="text-right text-muted-foreground">{brl(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
    </div>
  );
}
