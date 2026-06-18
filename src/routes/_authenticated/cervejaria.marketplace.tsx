import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listMarketplaceOrders,
  fetchMarketplaceKPIs,
  updateMarketplaceOrderStatus,
} from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Beer, Check, X, Truck, FileText, History } from "lucide-react";
import { AuditTrail } from "./bar.marketplace";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cervejaria/marketplace")({
  component: BreweryMarketplacePage,
  head: () => ({ meta: [{ title: "Marketplace — Microcervejaria" }] }),
});

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending_approval: { label: "Aguardando aprovação", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Recusado", variant: "destructive" },
  in_production: { label: "Em produção", variant: "default" },
  in_delivery: { label: "Em entrega", variant: "default" },
  invoiced: { label: "Faturado", variant: "default" },
  completed: { label: "Concluído", variant: "default" },
  canceled: { label: "Cancelado", variant: "outline" },
};

function BreweryMarketplacePage() {
  const qc = useQueryClient();
  const ordersFn = useServerFn(listMarketplaceOrders);
  const kpisFn = useServerFn(fetchMarketplaceKPIs);
  const updateFn = useServerFn(updateMarketplaceOrderStatus);

  const { data: orders } = useQuery({
    queryKey: ["brew-mp-orders"],
    queryFn: () => ordersFn({ data: { limit: 100 } }),
  });
  const { data: kpis } = useQuery({
    queryKey: ["brew-mp-kpis"],
    queryFn: () => kpisFn({ data: { sinceDays: 30 } }),
  });

  // Realtime: atualiza lista quando o pedido muda
  useEffect(() => {
    const ch = supabase
      .channel("brew-mp-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "mp_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["brew-mp-orders"] });
        qc.invalidateQueries({ queryKey: ["brew-mp-kpis"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const [decision, setDecision] = useState<{ order: any; type: "approved" | "rejected" } | null>(null);
  const [notes, setNotes] = useState("");

  const update = useMutation({
    mutationFn: (vars: { order_id: string; status: any; decision_notes?: string | null }) =>
      updateFn({ data: vars }),
    onSuccess: (_d, v) => {
      toast.success(`Pedido marcado como ${STATUS_LABEL[v.status]?.label ?? v.status}.`);
      setDecision(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["brew-mp-orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar pedido."),
  });

  const pending = (orders ?? []).filter((o: any) => o.status === "pending_approval");
  const active = (orders ?? []).filter((o: any) =>
    ["approved", "in_production", "in_delivery"].includes(o.status),
  );
  const finalized = (orders ?? []).filter((o: any) =>
    ["invoiced", "completed", "rejected", "canceled"].includes(o.status),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Beer className="w-6 h-6 text-primary" /> Marketplace — Microcervejaria
        </h1>
        <p className="text-sm text-muted-foreground">
          Aprove ou recuse pedidos com observação. Atualizações refletem em tempo real para o comprador.
        </p>
      </header>

      <div className="grid md:grid-cols-4 gap-3">
        <Mini label="GMV (30d)" value={brl(kpis?.gmv_cents ?? 0)} />
        <Mini label="Líquido a receber" value={brl(kpis?.supplier_net_cents ?? 0)} />
        <Mini label="Taxa retida" value={brl(kpis?.fee_cents ?? 0)} />
        <Mini label="Pedidos" value={String(kpis?.orders ?? 0)} />
      </div>

      <Section title="Aguardando sua aprovação" desc="Aceite ou recuse com observação ao comprador.">
        {pending.length === 0 && <Empty>Nenhum pedido pendente.</Empty>}
        {pending.map((o: any) => (
          <OrderRow key={o.id} o={o}>
            <Button size="sm" variant="default" onClick={() => { setDecision({ order: o, type: "approved" }); setNotes(""); }}>
              <Check className="w-4 h-4 mr-1" /> Aprovar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => { setDecision({ order: o, type: "rejected" }); setNotes(""); }}>
              <X className="w-4 h-4 mr-1" /> Recusar
            </Button>
          </OrderRow>
        ))}
      </Section>

      <Section title="Em andamento" desc="Mova para entrega ou marque como faturado.">
        {active.length === 0 && <Empty>Sem pedidos em andamento.</Empty>}
        {active.map((o: any) => (
          <OrderRow key={o.id} o={o}>
            {o.status === "approved" && (
              <Button size="sm" variant="outline" onClick={() => update.mutate({ order_id: o.id, status: "in_production" })}>
                Iniciar produção
              </Button>
            )}
            {o.status === "in_production" && (
              <Button size="sm" variant="outline" onClick={() => update.mutate({ order_id: o.id, status: "in_delivery" })}>
                <Truck className="w-4 h-4 mr-1" /> Em entrega
              </Button>
            )}
            <Button size="sm" variant="default" onClick={() => update.mutate({ order_id: o.id, status: "invoiced" })}>
              <FileText className="w-4 h-4 mr-1" /> Faturar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => update.mutate({ order_id: o.id, status: "completed" })}>
              Concluir
            </Button>
          </OrderRow>
        ))}
      </Section>

      <Section title="Finalizados / recusados">
        {finalized.length === 0 && <Empty>Nada por aqui.</Empty>}
        {finalized.map((o: any) => <OrderRow key={o.id} o={o} />)}
      </Section>

      <Dialog open={!!decision} onOpenChange={(v) => !v && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.type === "approved" ? "Aprovar pedido" : "Recusar pedido"} #{decision?.order.order_number}
            </DialogTitle>
          </DialogHeader>
          {decision && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Comprador</span><span>{decision.order.buyer?.display_name}</span></div>
              <div className="flex justify-between"><span>Bruto</span><span>{brl(decision.order.subtotal_cents)}</span></div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa Intermediação Digital ({(decision.order.fee_pct * 100).toFixed(2)}%)</span>
                <span>− {brl(decision.order.fee_cents)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Líquido a você</span><span>{brl(decision.order.supplier_net_cents)}</span>
              </div>
              <Textarea
                placeholder={
                  decision.type === "approved"
                    ? "Observações sobre prazo, lote, condições (opcional)"
                    : "Motivo da recusa (será enviado ao comprador)"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancelar</Button>
            <Button
              variant={decision?.type === "rejected" ? "destructive" : "default"}
              disabled={update.isPending || (decision?.type === "rejected" && !notes.trim())}
              onClick={() => decision && update.mutate({
                order_id: decision.order.id,
                status: decision.type,
                decision_notes: notes || null,
              })}
            >
              {decision?.type === "approved" ? "Confirmar aprovação" : "Confirmar recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function OrderRow({ o, children }: { o: any; children?: React.ReactNode }) {
  const meta = STATUS_LABEL[o.status] ?? { label: o.status, variant: "outline" };
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="font-medium">#{o.order_number} · {o.buyer?.display_name}</div>
          <div className="text-xs text-muted-foreground">{new Date(o.placed_at).toLocaleString("pt-BR")}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">{brl(o.subtotal_cents)}</span>
          <Badge variant="outline" className="text-xs">Líquido {brl(o.supplier_net_cents)}</Badge>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
      </div>
      {o.items?.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5 pl-3 border-l">
          {o.items.map((it: any) => (
            <li key={it.id}>{it.qty} × {it.name_snapshot} ({brl(it.unit_price_cents)}/{it.unit}) = {brl(it.line_total_cents)}</li>
          ))}
        </ul>
      )}
      {o.notes && <p className="text-xs"><b>Obs. comprador:</b> {o.notes}</p>}
      {o.decision_notes && <p className="text-xs"><b>Decisão:</b> {o.decision_notes}</p>}
      {children && <div className="flex gap-2 flex-wrap pt-1">{children}</div>}
    </div>
  );
}
