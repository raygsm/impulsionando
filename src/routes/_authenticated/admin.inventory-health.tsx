import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getInventoryHealth } from "@/lib/inventory-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, RefreshCw, AlertTriangle, TrendingDown, TrendingUp, Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inventory-health")({
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

function Page() {
  const fn = useServerFn(getInventoryHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "inventory-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Inventory & Stock Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">Rupturas, giro, valor parado e fornecedores.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Produtos Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.products.active)}<span className="text-sm text-muted-foreground">/{fmt(data.products.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.products.tracked)} com estoque controlado</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Rupturas</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.products.ruptured > 0 ? "text-destructive" : ""}`}>{fmt(data.products.ruptured)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.products.low)} abaixo do mínimo</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Valor em Estoque</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.products.stockValue)}</div>
            <p className="text-xs text-muted-foreground">Venda: {brl(data.products.salesValue)}</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Boxes className="h-4 w-4" />Margem Potencial</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{brl(data.products.potentialMargin)}</div>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Entradas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.movements.in)}</div>
            <p className="text-xs text-muted-foreground">Custo {brl(data.movements.inCost)}</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4" />Saídas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.movements.out)}</div>
            <p className="text-xs text-muted-foreground">Net {fmt(data.movements.net)}</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Categorias / Fornecedores</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.catalog.activeCategories)} / {fmt(data.catalog.activeSuppliers)}</div>
            <p className="text-xs text-muted-foreground">de {fmt(data.catalog.categories)} · {fmt(data.catalog.suppliers)}</p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Excesso de Estoque</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.products.over > 0 ? "text-amber-600" : ""}`}>{fmt(data.products.over)}</div>
            <p className="text-xs text-muted-foreground">acima do máximo</p>
          </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Movimentadores (Saídas)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b"><tr>
                  <th className="text-left py-2">Produto</th><th className="text-left">SKU</th>
                  <th className="text-right">Entradas</th><th className="text-right">Saídas</th><th className="text-right">Saldo</th>
                </tr></thead>
                <tbody>
                  {data.topMovers.map((m, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{m.name}</td>
                      <td className="text-xs">{m.sku}</td>
                      <td className="text-right text-emerald-600">+{fmt(m.in)}</td>
                      <td className="text-right text-destructive">−{fmt(m.out)}</td>
                      <td className="text-right font-medium">{m.net >= 0 ? "+" : ""}{fmt(m.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Produtos em Ruptura</CardTitle></CardHeader>
          <CardContent>
            {data.rupturedList.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ruptura ✓</p> : (
              <table className="w-full text-sm">
                <tbody>
                  {data.rupturedList.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="text-xs">{p.sku}</td>
                      <td className="text-right"><Badge variant="destructive">min {fmt(p.min)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
