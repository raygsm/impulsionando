/**
 * /restaurante/mesas — Gestão de mesas do restaurante.
 *
 * Permite criar/editar/desativar mesas, abrir/fechar comandas e gerar QR Code
 * por mesa (URL pública /mesa/$token). Cada mesa recebe um token único.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  listRestaurantTables, createRestaurantTable, deleteRestaurantTable,
  openTableSession, closeTableSession,
} from "@/lib/restaurant.functions";
import { Plus, QrCode, Printer, Trash2, UtensilsCrossed, Play, Square, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/restaurante/mesas")({
  component: MesasPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    livre: "bg-green-500/15 text-green-700",
    ocupada: "bg-amber-500/15 text-amber-700",
    reservada: "bg-blue-500/15 text-blue-700",
    manutencao: "bg-zinc-500/15 text-zinc-700",
  };
  return <Badge variant="outline" className={map[s] ?? ""}>{s}</Badge>;
}

function MesasPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRestaurantTables);
  const createFn = useServerFn(createRestaurantTable);
  const deleteFn = useServerFn(deleteRestaurantTable);
  const openFn = useServerFn(openTableSession);
  const closeFn = useServerFn(closeTableSession);

  const tables = useQuery({ queryKey: ["restaurant-tables"], queryFn: () => listFn() });
  const [creating, setCreating] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const [newArea, setNewArea] = useState("");
  const [qrTable, setQrTable] = useState<any | null>(null);

  const create = useMutation({
    mutationFn: () => createFn({ data: { number: Number(newNumber), capacity: Number(newCapacity), area: newArea || undefined } }),
    onSuccess: () => { toast.success("Mesa criada."); setCreating(false); setNewNumber(""); setNewArea(""); qc.invalidateQueries({ queryKey: ["restaurant-tables"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar."),
  });

  const open = useMutation({
    mutationFn: (table_id: string) => openFn({ data: { table_id, party_size: 1 } }),
    onSuccess: () => { toast.success("Comanda aberta."); qc.invalidateQueries({ queryKey: ["restaurant-tables"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao abrir."),
  });

  const close = useMutation({
    mutationFn: (session_id: string) => closeFn({ data: { session_id } }),
    onSuccess: () => { toast.success("Comanda fechada."); qc.invalidateQueries({ queryKey: ["restaurant-tables"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao fechar."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Mesa removida."); qc.invalidateQueries({ queryKey: ["restaurant-tables"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover."),
  });

  const list = tables.data?.tables ?? [];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <Badge className="bg-gradient-primary mb-2"><UtensilsCrossed className="w-3 h-3 mr-1" /> PDV Restaurante</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Mesas e QR Code</h1>
          <p className="text-sm text-muted-foreground">
            Cada mesa tem um QR Code único — o cliente escaneia, faz check-in e acompanha a comanda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => tables.refetch()}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
          <Button size="sm" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Nova mesa</Button>
        </div>
      </header>

      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <UtensilsCrossed className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Nenhuma mesa cadastrada ainda.</p>
          <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Criar primeira mesa</Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((t: any) => {
            const sess = t.session;
            return (
              <Card key={t.id} className={`p-4 ${t.status === "ocupada" ? "border-amber-500/40" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Mesa</div>
                    <div className="text-2xl font-bold leading-tight">{t.number}{t.label ? <span className="text-sm text-muted-foreground ml-1">· {t.label}</span> : null}</div>
                    <div className="text-xs text-muted-foreground">{t.area ?? "—"} · {t.capacity} pessoas</div>
                  </div>
                  {statusBadge(t.status)}
                </div>
                {sess ? (
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-md p-2 text-xs mb-3 border border-amber-200/40">
                    <div className="font-semibold">{sess.customer_name ?? "Cliente"}</div>
                    <div className="text-muted-foreground">{sess.party_size} pessoa(s)</div>
                    <div className="font-bold text-base mt-1">R$ {Number(sess.total ?? 0).toFixed(2)}</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mb-3">Mesa livre</div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setQrTable(t)}><QrCode className="w-4 h-4 mr-1" /> QR</Button>
                  {sess ? (
                    <Button size="sm" variant="destructive" onClick={() => close.mutate(sess.id)}><Square className="w-4 h-4 mr-1" /> Fechar</Button>
                  ) : (
                    <Button size="sm" onClick={() => open.mutate(t.id)}><Play className="w-4 h-4 mr-1" /> Abrir</Button>
                  )}
                </div>
                {!sess && (
                  <Button size="sm" variant="ghost" className="w-full mt-2 text-destructive" onClick={() => { if (confirm(`Remover mesa ${t.number}?`)) remove.mutate(t.id); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Remover
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Criar mesa */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova mesa</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Número *</Label>
              <Input type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Ex.: 12" />
            </div>
            <div>
              <Label>Capacidade</Label>
              <Input type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} />
            </div>
            <div>
              <Label>Área (opcional)</Label>
              <Input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="Salão / Varanda / Mezanino" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={!newNumber || create.isPending}>
              {create.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code dialog */}
      <QrDialog table={qrTable} onClose={() => setQrTable(null)} />
    </div>
  );
}

function QrDialog({ table, onClose }: { table: any | null; onClose: () => void }) {
  const url = useMemo(() => {
    if (!table) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "https://impulsionando.com.br";
    return `${base}/mesa/${table.qr_token}`;
  }, [table]);
  const [dataUrl, setDataUrl] = useState<string>("");

  useMemo(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setDataUrl).catch(() => setDataUrl(""));
  }, [url]);

  function printQr() {
    if (!dataUrl) return;
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>Mesa ${table?.number}</title></head><body style="text-align:center;font-family:system-ui;padding:24px">
      <h1 style="margin:0 0 8px">Mesa ${table?.number}${table?.label ? ` · ${table.label}` : ""}</h1>
      <p style="color:#64748b;margin:0 0 16px">Escaneie para acessar a comanda</p>
      <img src="${dataUrl}" style="width:320px;height:320px;border:1px solid #e2e8f0;border-radius:12px" />
      <p style="font-size:11px;color:#94a3b8;margin-top:12px">${url}</p>
      <script>window.print();setTimeout(()=>window.close(),500)</script>
    </body></html>`);
    w.document.close();
  }

  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code · Mesa {table?.number}{table?.label ? ` · ${table.label}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {dataUrl ? (
            <img src={dataUrl} alt="QR" className="w-64 h-64 border rounded-lg" />
          ) : (
            <div className="w-64 h-64 bg-muted animate-pulse rounded-lg" />
          )}
          <code className="text-xs text-muted-foreground break-all text-center px-2">{url}</code>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={printQr}><Printer className="w-4 h-4 mr-1" /> Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
