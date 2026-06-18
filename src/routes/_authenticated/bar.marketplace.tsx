import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMarketplaceOrders } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bar/marketplace")({
  component: BarMarketplacePage,
  head: () => ({ meta: [{ title: "Marketplace — Bar & Restaurante" }] }),
});

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function BarMarketplacePage() {
  const ordersFn = useServerFn(listMarketplaceOrders);
  const { data: orders } = useQuery({ queryKey: ["bar-mp-orders"], queryFn: () => ordersFn({ data: { limit: 50 } }) });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Marketplace — Bar & Restaurante
          </h1>
          <p className="text-sm text-muted-foreground">
            Compre direto de microcervejarias, distribuidores e fornecedores parceiros.
          </p>
        </div>
        <Button asChild>
          <Link to="/bar/marketplace/novo-pedido"><Plus className="w-4 h-4 mr-1" /> Gerar novo pedido</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Inteligência de recompra</CardTitle>
          <CardDescription>
            Em breve: alertas automáticos de estoque baixo e sugestões de recompra com base no consumo dos seus PDVs.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(orders ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum pedido ainda. Visite "Descobrir fornecedores" para fazer seu primeiro pedido.
            </p>
          )}
          {(orders ?? []).map((o: any) => (
            <div key={o.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
              <div>
                <div className="font-medium">#{o.order_number} · {o.supplier?.display_name}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.placed_at).toLocaleString("pt-BR")}</div>
              </div>
              <div className="flex items-center gap-2">
                <span>{brl(o.subtotal_cents)}</span>
                <Badge>{o.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
