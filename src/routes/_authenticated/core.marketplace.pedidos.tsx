import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMarketplaceOrders, updateMarketplaceOrderStatus } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/marketplace/pedidos")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Pedidos — Marketplace B2B" }] }),
});

const STATUSES = [
  { key: "pending_approval", label: "Aguardando aprovação" },
  { key: "approved", label: "Aprovados" },
  { key: "in_production", label: "Em produção" },
  { key: "in_delivery", label: "Em entrega" },
  { key: "completed", label: "Concluídos" },
];

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OrdersPage() {
  const fn = useServerFn(listMarketplaceOrders);
  const upd = useServerFn(updateMarketplaceOrderStatus);
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["mp-orders-all"],
    queryFn: () => fn({ data: { limit: 200 } }),
  });
  const mut = useMutation({
    mutationFn: (vars: { id: string; status: any }) =>
      upd({ data: { order_id: vars.id, status: vars.status } }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["mp-orders-all"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar"),
  });

  const groups = STATUSES.map((s) => ({
    ...s,
    items: (orders ?? []).filter((o: any) => o.status === s.key),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Receipt className="w-6 h-6 text-primary" /> Pedidos B2B
      </h1>
      <p className="text-sm text-muted-foreground">
        Acompanhe e movimente pedidos do marketplace por estágio.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {groups.map((g) => (
          <Card key={g.key} className="min-h-[280px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{g.label} <span className="text-muted-foreground">({g.items.length})</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.items.map((o: any) => (
                <div key={o.id} className="border rounded p-2 text-xs space-y-1">
                  <div className="font-medium">#{o.order_number}</div>
                  <div className="text-muted-foreground">{o.supplier?.display_name} → {o.buyer?.display_name}</div>
                  <div>{brl(o.subtotal_cents)} · taxa {brl(o.fee_cents)}</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {g.key === "pending_approval" && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => mut.mutate({ id: o.id, status: "approved" })}>Aprovar</Button>
                    )}
                    {g.key === "approved" && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => mut.mutate({ id: o.id, status: "in_production" })}>Produção</Button>
                    )}
                    {g.key === "in_production" && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => mut.mutate({ id: o.id, status: "in_delivery" })}>Entrega</Button>
                    )}
                    {g.key === "in_delivery" && (
                      <Button size="sm" className="h-6 text-[10px]" onClick={() => mut.mutate({ id: o.id, status: "completed" })}>Concluir</Button>
                    )}
                    {g.key !== "completed" && (
                      <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => mut.mutate({ id: o.id, status: "canceled" })}>Cancelar</Button>
                    )}
                  </div>
                </div>
              ))}
              {g.items.length === 0 && <p className="text-xs text-muted-foreground">Vazio</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
