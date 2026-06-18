import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketplaceKPIs, listMarketplaceOrders } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Store, ShoppingCart, Banknote, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/marketplace")({
  component: MarketplaceCorePage,
  head: () => ({ meta: [{ title: "Marketplace B2B — Core" }] }),
});

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MarketplaceCorePage() {
  const kpisFn = useServerFn(fetchMarketplaceKPIs);
  const ordersFn = useServerFn(listMarketplaceOrders);
  const { data: kpis } = useQuery({
    queryKey: ["mp-kpis", 30],
    queryFn: () => kpisFn({ data: { sinceDays: 30 } }),
  });
  const { data: orders } = useQuery({
    queryKey: ["mp-orders-recent"],
    queryFn: () => ordersFn({ data: { limit: 10 } }),
  });

  const gmv = kpis?.gmv_cents ?? 0;
  const fee = kpis?.fee_cents ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Marketplace B2B
          </h1>
          <p className="text-sm text-muted-foreground">
            GMV, Taxa de Intermediação Digital e pedidos consolidados (últimos 30 dias).
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="GMV (30d)" value={brl(gmv)} hint="Volume transacionado" />
        <KpiCard icon={Banknote} label="Receita Marketplace" value={brl(fee)} hint="Taxa de Intermediação Digital" />
        <KpiCard icon={ShoppingCart} label="Pedidos" value={String(kpis?.orders ?? 0)} hint="Concluídos no período" />
        <KpiCard icon={Store} label="Receita líquida aos fornecedores" value={brl(kpis?.supplier_net_cents ?? 0)} hint="GMV - taxa" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <NavCard to="/core/marketplace/fornecedores" title="Fornecedores" desc="Microcervejarias, distribuidores, vinícolas, cafés, destilarias, alimentos." />
        <NavCard to="/core/marketplace/compradores" title="Compradores" desc="Bares, restaurantes, hotéis, eventos." />
        <NavCard to="/core/marketplace/pedidos" title="Pedidos" desc="Aguardando aprovação, em produção, em entrega, concluídos." />
        <NavCard to="/core/marketplace/financeiro" title="Financeiro B2B" desc="GMV, taxa, receita por fornecedor e por nicho." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recentes</CardTitle>
          <CardDescription>Últimos 10 pedidos do marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(orders ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sem pedidos ainda.</p>
          )}
          {(orders ?? []).map((o: any) => (
            <div key={o.id} className="flex items-center justify-between border-b last:border-0 py-2">
              <div className="text-sm">
                <div className="font-medium">
                  #{o.order_number} · {o.supplier?.display_name ?? "?"} → {o.buyer?.display_name ?? "?"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.placed_at).toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span>{brl(o.subtotal_cents)}</span>
                <Badge variant="outline">Taxa {brl(o.fee_cents)}</Badge>
                <Badge>{o.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, hint }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function NavCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="block">
      <Card className="hover:border-primary transition-colors">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{desc}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
