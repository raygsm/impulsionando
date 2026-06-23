/**
 * /admin/clientes/riomed/logistica
 *
 * Tela da logística: para cada remessa, informa o prazo de garantia (dias)
 * por item antes da entrega e marca a remessa como entregue (o trigger no
 * banco gera as garantias do cliente automaticamente).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Truck, Package, ShieldCheck, CheckCircle2 } from "lucide-react";
import {
  listShipmentsForLogistics,
  setShipmentItemWarrantyDays,
  markShipmentDelivered,
} from "@/lib/riomed-warranties.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/logistica")({
  head: () => ({
    meta: [{ title: "Logística — Garantia & Entrega | Rio Med" }],
  }),
  component: LogisticaPage,
});

function fmtDate(s?: string | null) {
  return s ? new Date(s).toLocaleString("pt-BR") : "—";
}

function LogisticaPage() {
  const qc = useQueryClient();
  const fetcher = useServerFn(listShipmentsForLogistics);
  const setDays = useServerFn(setShipmentItemWarrantyDays);
  const deliverFn = useServerFn(markShipmentDelivered);

  const q = useQuery({ queryKey: ["riomed-logistics"], queryFn: () => fetcher() });
  const shipments = q.data?.shipments ?? [];
  const items = q.data?.items ?? [];

  const itemsByShipment = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const it of items) {
      const arr = m.get(it.shipment_id) ?? [];
      arr.push(it);
      m.set(it.shipment_id, arr);
    }
    return m;
  }, [items]);

  async function saveDays(itemId: string, days: number) {
    try {
      await setDays({ data: { shipment_item_id: itemId, warranty_days: days } });
      toast.success("Prazo de garantia salvo");
      qc.invalidateQueries({ queryKey: ["riomed-logistics"] });
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar prazo");
    }
  }

  async function deliver(id: string) {
    if (!confirm("Marcar esta remessa como entregue? As garantias serão geradas automaticamente.")) return;
    try {
      await deliverFn({ data: { shipment_id: id } });
      toast.success("Remessa entregue · garantias geradas");
      qc.invalidateQueries({ queryKey: ["riomed-logistics"] });
    } catch (e: any) {
      toast.error(e.message || "Falha ao marcar entrega");
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Logística · Garantia & Entrega</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Informe o prazo de garantia (em dias) por item da remessa. Ao marcar a remessa como
          entregue, as garantias são geradas no histórico permanente do cliente.
        </p>
      </header>

      {q.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando remessas…</Card>
      ) : shipments.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Nenhuma remessa cadastrada.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map((s: any) => {
            const list = itemsByShipment.get(s.id) ?? [];
            const delivered = s.status === "delivered";
            return (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono">{s.shipment_code}</span>
                      <Badge variant={delivered ? "default" : "secondary"}>
                        {delivered ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Entregue</> : s.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Previsto: {fmtDate(s.expected_at)} · Entregue: {fmtDate(s.delivered_at)}
                    </div>
                  </div>
                  {!delivered && (
                    <Button size="sm" onClick={() => deliver(s.id)} className="bg-emerald-600 hover:bg-emerald-700">
                      <ShieldCheck className="w-4 h-4 mr-1" /> Confirmar entrega
                    </Button>
                  )}
                </div>

                <div className="mt-4 border-t pt-3 space-y-2">
                  {list.length === 0
                    ? <p className="text-sm text-muted-foreground">Sem itens nesta remessa.</p>
                    : list.map((it: any) => (
                      <ItemRow key={it.id} item={it} onSave={saveDays} locked={delivered} />
                    ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onSave, locked }: {
  item: any;
  onSave: (id: string, days: number) => Promise<void>;
  locked: boolean;
}) {
  const [days, setDays] = useState<string>(String(item.warranty_days ?? 0));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end border rounded-lg p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{item.product_id ?? "Produto"}{item.serial_number ? ` · ${item.serial_number}` : ""}</div>
        <div className="text-xs text-muted-foreground">Qtd {item.quantity}</div>
        {item.warranty_ends_at && (
          <div className="text-xs text-emerald-700 mt-1">
            Garantia: {new Date(item.warranty_starts_at).toLocaleDateString("pt-BR")} → {new Date(item.warranty_ends_at).toLocaleDateString("pt-BR")}
          </div>
        )}
      </div>
      <div className="w-32">
        <Label className="text-xs">Garantia (dias)</Label>
        <Input
          type="number"
          min={0}
          max={3650}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          disabled={locked}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={locked}
        onClick={() => onSave(item.id, parseInt(days || "0", 10))}
      >
        Salvar
      </Button>
    </div>
  );
}
