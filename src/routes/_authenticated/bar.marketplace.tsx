import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  searchMarketplaceOrders,
  exportMarketplaceOrdersCsv,
} from "@/lib/marketplace.functions";
import { AuditTrail } from "@/components/marketplace/AuditTrail";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Download, Search, ChevronLeft, ChevronRight, History } from "lucide-react";
import { toast } from "sonner";

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
  const searchFn = useServerFn(searchMarketplaceOrders);
  const exportFn = useServerFn(exportMarketplaceOrdersCsv);

  const [period, setPeriod] = useState<string>("30");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setPage(1); }, [period, statusFilter]);

  const filters = useMemo(() => ({
    sinceDays: Number(period),
    status: statusFilter === "all" ? undefined : statusFilter,
    query: debouncedQuery || undefined,
  }), [period, statusFilter, debouncedQuery]);

  const { data: result } = useQuery({
    queryKey: ["bar-mp-search", filters, page],
    queryFn: () => searchFn({ data: { ...filters, page, pageSize } }),
  });

  useEffect(() => {
    const ch = supabase
      .channel("bar-mp-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mp_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["bar-mp-search"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mp_order_events" }, () => {
        qc.invalidateQueries({ queryKey: ["bar-mp-events"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function handleExport() {
    try {
      const res = await exportFn({ data: filters });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-marketplace-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportados ${res.count} pedidos.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao exportar.");
    }
  }

  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Marketplace — Bar & Restaurante
          </h1>
          <p className="text-sm text-muted-foreground">
            Busque pedidos por número/fornecedor, filtre por período e status, exporte para conciliação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
          <Button asChild>
            <Link to="/bar/marketplace/novo-pedido"><Plus className="w-4 h-4 mr-1" /> Novo pedido</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nº do pedido ou fornecedor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
          <CardDescription>
            {total} pedido{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"} · página {page} de {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum pedido encontrado com os filtros atuais.
            </p>
          )}
          {rows.map((o: any) => <OrderCard key={o.id} order={o} />)}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderCard({ order: o }: { order: any }) {
  const meta = STATUS[o.status] ?? { label: o.status, tone: "" };
  const [showTrail, setShowTrail] = useState(false);
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="font-medium">#{o.order_number} · {o.supplier?.display_name}</div>
          <div className="text-xs text-muted-foreground">
            Enviado em {new Date(o.placed_at).toLocaleString("pt-BR")}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">{brl(o.subtotal_cents)}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${meta.tone}`}>{meta.label}</span>
          <Button variant="ghost" size="sm" onClick={() => setShowTrail((v) => !v)}>
            <History className="w-3 h-3 mr-1" /> Trilha
          </Button>
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
      {showTrail && <AuditTrail orderId={o.id} />}
    </div>
  );
}

const EVENT_LABEL: Record<string, string> = {
  placed: "Pedido enviado",
  approved: "Aprovado",
  rejected: "Recusado",
  in_production: "Em produção",
  in_delivery: "Em entrega",
  invoiced: "Faturado",
  completed: "Concluído",
  canceled: "Cancelado",
};

export function AuditTrail({ orderId }: { orderId: string }) {
  const eventsFn = useServerFn(getMarketplaceOrderEvents);
  const { data: events } = useQuery({
    queryKey: ["bar-mp-events", orderId],
    queryFn: () => eventsFn({ data: { order_id: orderId } }),
  });
  return (
    <div className="border-t pt-2 mt-2">
      <div className="text-xs font-semibold mb-2 flex items-center gap-1">
        <History className="w-3 h-3" /> Trilha de auditoria
      </div>
      {(!events || events.length === 0) && (
        <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
      )}
      <ol className="space-y-1.5 text-xs">
        {(events ?? []).map((e: any) => (
          <li key={e.id} className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <div className="flex-1">
              <div>
                <b>{EVENT_LABEL[e.event_type] ?? e.event_type}</b>
                {e.actor_display_name && (
                  <span className="text-muted-foreground"> · por {e.actor_display_name}
                    {e.actor_role && ` (${e.actor_role === "supplier" ? "fornecedor" : "comprador"})`}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground">
                {new Date(e.created_at).toLocaleString("pt-BR")}
              </div>
              {e.notes && <div className="text-muted-foreground italic">"{e.notes}"</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
