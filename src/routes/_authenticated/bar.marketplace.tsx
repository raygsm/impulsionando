import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  searchMarketplaceOrders,
  exportMarketplaceOrdersCsv,
  exportMarketplaceOrdersData,
  listMarketplaceBuyers,
  listExportPresets,
  saveExportPreset,
  deleteExportPreset,
  touchExportPreset,
  getReminderSettings,
} from "@/lib/marketplace.functions";
import { downloadOrdersPdf } from "@/lib/marketplace-pdf";
import { AuditTrail } from "@/components/marketplace/AuditTrail";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Plus, Download, FileText, Search, ChevronLeft, ChevronRight,
  History, Filter, Save, Bookmark, Bell, Trash2, RefreshCw,
} from "lucide-react";
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

type Filters = {
  period: string;
  status: string;
  query: string;
  supplierName: string;
  buyerId: string;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_FILTERS: Filters = {
  period: "30", status: "all", query: "", supplierName: "",
  buyerId: "all", dateFrom: "", dateTo: "",
};

function toServerFilters(f: Filters) {
  const useRange = !!(f.dateFrom || f.dateTo);
  return {
    sinceDays: useRange ? undefined : Number(f.period),
    status: f.status === "all" ? undefined : f.status,
    query: f.query || undefined,
    supplierName: f.supplierName || undefined,
    buyerId: f.buyerId === "all" ? undefined : f.buyerId,
    dateFrom: f.dateFrom || undefined,
    dateTo: f.dateTo || undefined,
  };
}

function filtersLabel(f: Filters): string {
  const parts: string[] = [];
  if (f.dateFrom || f.dateTo) parts.push(`período ${f.dateFrom || "…"} → ${f.dateTo || "…"}`);
  else parts.push(`últimos ${f.period} dias`);
  if (f.status !== "all") parts.push(`status ${STATUS[f.status]?.label ?? f.status}`);
  if (f.query) parts.push(`busca "${f.query}"`);
  if (f.supplierName) parts.push(`fornecedor ~ "${f.supplierName}"`);
  if (f.buyerId !== "all") parts.push(`comprador ${f.buyerId.slice(0, 6)}…`);
  return parts.join(" · ");
}

function BarMarketplacePage() {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchMarketplaceOrders);
  const exportCsvFn = useServerFn(exportMarketplaceOrdersCsv);
  const exportDataFn = useServerFn(exportMarketplaceOrdersData);
  const listBuyersFn = useServerFn(listMarketplaceBuyers);
  const listPresetsFn = useServerFn(listExportPresets);
  const savePresetFn = useServerFn(saveExportPreset);
  const deletePresetFn = useServerFn(deleteExportPreset);
  const touchPresetFn = useServerFn(touchExportPreset);
  const reminderFn = useServerFn(getReminderSettings);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debouncedSupplier, setDebouncedSupplier] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(filters.query); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [filters.query]);
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSupplier(filters.supplierName); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [filters.supplierName]);
  useEffect(() => { setPage(1); }, [
    filters.period, filters.status, filters.buyerId, filters.dateFrom, filters.dateTo,
  ]);

  const serverFilters = useMemo(
    () => toServerFilters({ ...filters, query: debouncedQuery, supplierName: debouncedSupplier }),
    [filters, debouncedQuery, debouncedSupplier],
  );

  const { data: result } = useQuery({
    queryKey: ["bar-mp-search", serverFilters, page],
    queryFn: () => searchFn({ data: { ...serverFilters, page, pageSize } }),
  });
  const { data: buyers = [] } = useQuery({
    queryKey: ["mp-buyers"], queryFn: () => listBuyersFn(),
  });
  const { data: presets = [], refetch: refetchPresets } = useQuery({
    queryKey: ["mp-presets"], queryFn: () => listPresetsFn(),
  });
  const { data: reminder } = useQuery({
    queryKey: ["mp-reminder"], queryFn: () => reminderFn(),
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

  async function runExportCsv(srvFilters = serverFilters, presetId?: string) {
    try {
      const res = await exportCsvFn({ data: srvFilters });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-marketplace-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`CSV gerado · ${res.count} registro(s) exportado(s).`);
      if (presetId) {
        await touchPresetFn({ data: { id: presetId, count: res.count } });
        refetchPresets();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao exportar CSV.");
    }
  }
  async function runExportPdf(srvFilters = serverFilters, label = filtersLabel(filters), presetId?: string) {
    try {
      const res = await exportDataFn({ data: srvFilters });
      downloadOrdersPdf({ ...res, filtersLabel: label });
      toast.success(`PDF gerado · ${res.count} registro(s) exportado(s).`);
      if (presetId) {
        await touchPresetFn({ data: { id: presetId, count: res.count } });
        refetchPresets();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar PDF.");
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
            Filtros avançados, exportação CSV/PDF e lembretes automáticos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PresetsDialog
            presets={presets}
            currentFilters={filters}
            currentServerFilters={serverFilters}
            onSave={async (name, format) => {
              await savePresetFn({ data: { name, format, filters: serverFilters as any } });
              await refetchPresets();
              toast.success("Preset salvo.");
            }}
            onDelete={async (id) => {
              await deletePresetFn({ data: { id } });
              await refetchPresets();
              toast.success("Preset removido.");
            }}
            onApply={(p) => {
              const f = p.filters || {};
              setFilters({
                period: String(f.sinceDays ?? "30"),
                status: f.status ?? "all",
                query: f.query ?? "",
                supplierName: f.supplierName ?? "",
                buyerId: f.buyerId ?? "all",
                dateFrom: f.dateFrom ?? "",
                dateTo: f.dateTo ?? "",
              });
              toast.info(`Preset "${p.name}" aplicado.`);
            }}
            onReprocess={(p) =>
              p.format === "pdf"
                ? runExportPdf(p.filters, p.name, p.id)
                : runExportCsv(p.filters, p.id)
            }
          />
          <Button variant="outline" onClick={() => runExportCsv()}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={() => runExportPdf()}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button asChild>
            <Link to="/bar/marketplace/novo-pedido"><Plus className="w-4 h-4 mr-1" /> Novo pedido</Link>
          </Button>
        </div>
      </header>

      {reminder?.active && (
        <div className="text-xs flex items-center gap-2 text-muted-foreground bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <Bell className="w-3 h-3 text-amber-600" />
          Lembretes automáticos ativos: pedidos pendentes acima de <b className="mx-1">{reminder.threshold_hours}h</b>
          em {(reminder.target_statuses ?? []).map((s: string) => STATUS[s]?.label ?? s).join(", ")} notificam ambas as partes.
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nº do pedido ou fornecedor..."
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              />
            </div>
            <Select value={filters.period} onValueChange={(v) => setFilters((f) => ({ ...f, period: v }))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <details className="rounded border bg-muted/30">
            <summary className="cursor-pointer text-sm flex items-center gap-2 px-3 py-2">
              <Filter className="w-4 h-4" /> Filtros avançados
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3">
              <div>
                <Label className="text-xs">Fornecedor (busca parcial)</Label>
                <Input
                  placeholder="ex.: cervejaria…"
                  value={filters.supplierName}
                  onChange={(e) => setFilters((f) => ({ ...f, supplierName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Comprador</Label>
                <Select value={filters.buyerId} onValueChange={(v) => setFilters((f) => ({ ...f, buyerId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(buyers as any[]).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" value={filters.dateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={filters.dateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Limpar filtros
                </Button>
              </div>
            </div>
          </details>

          <CardDescription>
            <b>{total}</b> pedido{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"} · página {page} de {totalPages}
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

function PresetsDialog({
  presets, currentFilters, currentServerFilters, onSave, onDelete, onApply, onReprocess,
}: {
  presets: any[];
  currentFilters: Filters;
  currentServerFilters: any;
  onSave: (name: string, format: "csv" | "pdf") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onApply: (p: any) => void;
  onReprocess: (p: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bookmark className="w-4 h-4 mr-1" /> Presets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Filtros salvos &amp; reprocesso</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded p-3 space-y-2 bg-muted/30">
            <div className="text-xs text-muted-foreground">Filtros atuais: {filtersLabel(currentFilters)}</div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Nome do preset</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Conciliação mensal" />
              </div>
              <div>
                <Label className="text-xs">Formato</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={!name.trim()}
                onClick={async () => {
                  await onSave(name.trim(), format);
                  setName("");
                }}
              >
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-auto">
            {presets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum preset salvo ainda.
              </p>
            )}
            {presets.map((p) => (
              <div key={p.id} className="border rounded p-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {p.name} <span className="text-xs uppercase text-muted-foreground">· {p.format}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.last_run_at
                      ? `Último: ${new Date(p.last_run_at).toLocaleString("pt-BR")} (${p.last_count ?? 0} reg.)`
                      : "Nunca executado"}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onApply(p)}>Aplicar</Button>
                <Button size="sm" variant="outline" onClick={() => onReprocess(p)}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Reprocessar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
