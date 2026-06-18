import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listMarketplaceOrders } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bar/marketplace")({
  component: BarMarketplacePage,
  head: () => ({ meta: [{ title: "Marketplace — Bar & Restaurante" }] }),
});

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS: Record<string, { label: string; tone: string }> = {
  pending_approval: { label: "Enviado", tone: "bg-amber-100 text-amber-800" },
  approved: { label: "Aprovado", tone: "bg-blue-100 text-blue-800" },
  rejected: { label: "Recusado", tone: "bg-red-100 text-red-800" },
  in_production: { label: "Em produção", tone: "bg-indigo-100 text-indigo-800" },
  in_delivery: { label: "Em entrega", tone: "bg-violet-100 text-violet-800" },
  invoiced: { label: "Faturado", tone: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Concluído", tone: "bg-emerald-100 text-emerald-800" },
  canceled: { label: "Cancelado", tone: "bg-zinc-100 text-zinc-700" },
};

function BarMarketplacePage() {
  const qc = useQueryClient();
  const ordersFn = useServerFn(listMarketplaceOrders);

  const [period, setPeriod] = useState<string>("30");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders } = useQuery({
    queryKey: ["bar-mp-orders", period],
    queryFn: () => ordersFn({ data: { limit: 200, sinceDays: Number(period) } }),
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("bar-mp-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "mp_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["bar-mp-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const filtered = useMemo(
    () => (orders ?? []).filter((o: any) => statusFilter === "all" || o.status === statusFilter),
    [orders, statusFilter],
  );

  const summary = useMemo(() => {
    const s = { sent: 0, approved: 0, rejected: 0, invoiced: 0, completed: 0, total_cents: 0 };
    (orders ?? []).forEach((o: any) => {
      if (o.status === "pending_approval") s.sent++;
      if (o.status === "approved" || o.status === "in_production" || o.status === "in_delivery") s.approved++;
      if (o.status === "rejected") s.rejected++;
      if (o.status === "invoiced") s.invoiced++;
      if (o.status === "completed") s.completed++;
      s.total_cents += o.subtotal_cents;
    });
    return s;
  }, [orders]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Marketplace — Bar & Restaurante
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus pedidos em tempo real. Você é notificado a cada decisão do fornecedor.
          </p>
        </div>
        <Button asChild>
          <Link to="/bar/marketplace/novo-pedido"><Plus className="w-4 h-4 mr-1" /> Gerar novo pedido</Link>
        </Button>
      </header>

      <div className="grid md:grid-cols-5 gap-3">
        <Mini label="Enviados" value={String(summary.sent)} />
        <Mini label="Em andamento" value={String(summary.approved)} />
        <Mini label="Recusados" value={String(summary.rejected)} />
        <Mini label="Faturados" value={String(summary.invoiced + summary.completed)} />
        <Mini label="Total comprado" value={brl(summary.total_cents)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Meus pedidos</CardTitle>
            <CardDescription>Filtre por período e status.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum pedido no período/filtros selecionados.
            </p>
          )}
          {filtered.map((o: any) => {
            const meta = STATUS[o.status] ?? { label: o.status, tone: "" };
            return (
              <div key={o.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-medium">#{o.order_number} · {o.supplier?.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Enviado em {new Date(o.placed_at).toLocaleString("pt-BR")}
                      {o.approved_at && ` · Aprovado em ${new Date(o.approved_at).toLocaleString("pt-BR")}`}
                      {o.rejected_at && ` · Recusado em ${new Date(o.rejected_at).toLocaleString("pt-BR")}`}
                      {o.invoiced_at && ` · Faturado em ${new Date(o.invoiced_at).toLocaleString("pt-BR")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{brl(o.subtotal_cents)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${meta.tone}`}>{meta.label}</span>
                  </div>
                </div>
                {o.items?.length > 0 && (
                  <ul className="text-xs text-muted-foreground pl-3 border-l space-y-0.5">
                    {o.items.map((it: any) => (
                      <li key={it.id}>{it.qty} × {it.name_snapshot} = {brl(it.line_total_cents)}</li>
                    ))}
                  </ul>
                )}
                {o.decision_notes && (
                  <div className="text-xs bg-muted/50 rounded px-2 py-1">
                    <b>Fornecedor:</b> {o.decision_notes}
                  </div>
                )}
              </div>
            );
          })}
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
