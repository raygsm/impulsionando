import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMarketplaceOrders, fetchMarketplaceKPIs } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cervejaria/marketplace")({
  component: BreweryMarketplacePage,
  head: () => ({ meta: [{ title: "Marketplace — Microcervejaria" }] }),
});

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function BreweryMarketplacePage() {
  const ordersFn = useServerFn(listMarketplaceOrders);
  const kpisFn = useServerFn(fetchMarketplaceKPIs);
  const { data: orders } = useQuery({ queryKey: ["brew-mp-orders"], queryFn: () => ordersFn({ data: { limit: 50 } }) });
  const { data: kpis } = useQuery({ queryKey: ["brew-mp-kpis"], queryFn: () => kpisFn({ data: { sinceDays: 30 } }) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Beer className="w-6 h-6 text-primary" /> Marketplace — Microcervejaria
      </h1>
      <p className="text-sm text-muted-foreground">
        Pedidos recebidos via Marketplace Impulsionando. A Taxa de Intermediação Digital é deduzida do valor bruto;
        você recebe o líquido conforme política aplicável.
      </p>

      <div className="grid md:grid-cols-4 gap-3">
        <Mini label="GMV (30d)" value={brl(kpis?.gmv_cents ?? 0)} />
        <Mini label="Líquido a receber" value={brl(kpis?.supplier_net_cents ?? 0)} />
        <Mini label="Taxa retida" value={brl(kpis?.fee_cents ?? 0)} />
        <Mini label="Pedidos" value={String(kpis?.orders ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recentes</CardTitle>
          <CardDescription>Aprove, mova para produção e despache entregas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(orders ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
          {(orders ?? []).map((o: any) => (
            <div key={o.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
              <div>
                <div className="font-medium">#{o.order_number} · {o.buyer?.display_name}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.placed_at).toLocaleString("pt-BR")}</div>
              </div>
              <div className="flex items-center gap-2">
                <span>{brl(o.subtotal_cents)}</span>
                <Badge variant="outline">Líquido {brl(o.supplier_net_cents)}</Badge>
                <Badge>{o.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </CardContent></Card>
  );
}
