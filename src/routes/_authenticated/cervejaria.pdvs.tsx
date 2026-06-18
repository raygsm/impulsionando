import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Beer, Copy, QrCode, Plus, Upload, FileDown } from "lucide-react";
import {
  listMyBreweryBrands,
  listBreweryPdvs,
  createBreweryPdv,
  updateBreweryPdvStatus,
  generateBreweryInviteLink,
  importBrewerySellouts,
} from "@/lib/brewery.functions";

export const Route = createFileRoute("/_authenticated/cervejaria/pdvs")({
  component: BreweryPdvsPage,
  head: () => ({
    meta: [
      { title: "Microcervejaria · PDVs — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  pending: "secondary",
  paused: "outline",
  ended: "destructive",
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function BreweryPdvsPage() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"all" | "active" | "pending" | "paused" | "ended">("all");
  const [openNew, setOpenNew] = useState(false);
  const [openInvite, setOpenInvite] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const listBrands = useServerFn(listMyBreweryBrands);
  const listPdvs = useServerFn(listBreweryPdvs);
  const createPdv = useServerFn(createBreweryPdv);
  const updateStatus = useServerFn(updateBreweryPdvStatus);
  const genInvite = useServerFn(generateBreweryInviteLink);
  const importSellouts = useServerFn(importBrewerySellouts);

  const brandsQ = useQuery({ queryKey: ["brewery-brands"], queryFn: () => listBrands() });
  const brands = brandsQ.data ?? [];
  const activeBrandId = brandId ?? brands[0]?.id;

  const pdvsQ = useQuery({
    queryKey: ["brewery-pdvs", activeBrandId, status],
    queryFn: () => listPdvs({ data: { brandId: activeBrandId, status } }),
    enabled: !!activeBrandId,
  });

  const createMut = useMutation({
    mutationFn: (payload: Parameters<typeof createPdv>[0]["data"]) => createPdv({ data: payload }),
    onSuccess: () => {
      toast.success("PDV cadastrado");
      qc.invalidateQueries({ queryKey: ["brewery-pdvs"] });
      setOpenNew(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao cadastrar"),
  });

  const statusMut = useMutation({
    mutationFn: (p: { pdvLinkId: string; contractStatus: "pending" | "active" | "paused" | "ended" }) =>
      updateStatus({ data: p }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["brewery-pdvs"] });
    },
  });

  const inviteMut = useMutation({
    mutationFn: () => genInvite({ data: { brandId: activeBrandId! } }),
  });

  const importMut = useMutation({
    mutationFn: (rows: any[]) => importSellouts({ data: { brandId: activeBrandId!, rows } }),
    onSuccess: (r) => {
      toast.success(`${r.inserted} linha(s) importadas`);
      if (r.skipped) toast.warning(`${r.skipped} linha(s) ignoradas`);
      qc.invalidateQueries({ queryKey: ["brewery-pdvs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no import"),
  });

  const pdvs = pdvsQ.data ?? [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Beer className="w-6 h-6" /> Relação com PDVs
          </h1>
          <p className="text-sm text-muted-foreground">Bares e restaurantes que vendem seus rótulos.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={activeBrandId ?? ""} onValueChange={(v) => setBrandId(v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="ended">Encerrados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setOpenInvite(true); inviteMut.mutate(); }} disabled={!activeBrandId}>
            <QrCode className="w-4 h-4 mr-2" /> Convidar PDV
          </Button>
          <Button variant="outline" onClick={() => setOpenImport(true)} disabled={!activeBrandId}>
            <Upload className="w-4 h-4 mr-2" /> Import CSV sell-out
          </Button>
          <Button onClick={() => setOpenNew(true)} disabled={!activeBrandId}>
            <Plus className="w-4 h-4 mr-2" /> Novo PDV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">PDVs ({pdvs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sell-out 90d</TableHead>
                <TableHead className="text-right">Receita 90d</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdvsQ.isLoading && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
              {!pdvsQ.isLoading && pdvs.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum PDV ainda. Use <strong>Convidar PDV</strong> ou <strong>Novo PDV</strong>.
                </TableCell></TableRow>
              )}
              {pdvs.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.pdv_name}</TableCell>
                  <TableCell className="text-sm">{[p.pdv_city, p.pdv_state].filter(Boolean).join("/") || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {p.contact_name ?? "—"}{p.contact_phone ? <div className="text-xs text-muted-foreground">{p.contact_phone}</div> : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.contract_status] ?? "secondary"}>{STATUS_LABEL[p.contract_status] ?? p.contract_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{p.sellout90d.units}</TableCell>
                  <TableCell className="text-right">{brl(p.sellout90d.revenueCents)}</TableCell>
                  <TableCell className="text-right">
                    <Select value={p.contract_status} onValueChange={(v: any) => statusMut.mutate({ pdvLinkId: p.id, contractStatus: v })}>
                      <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="ended">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewPdvDialog
        open={openNew}
        onOpenChange={setOpenNew}
        brandId={activeBrandId}
        onSubmit={(v) => createMut.mutate(v)}
        pending={createMut.isPending}
      />
      <InviteDialog
        open={openInvite}
        onOpenChange={setOpenInvite}
        data={inviteMut.data}
        loading={inviteMut.isPending}
      />
      <ImportSelloutDialog
        open={openImport}
        onOpenChange={setOpenImport}
        pdvs={pdvs}
        onImport={(rows) => importMut.mutate(rows)}
        pending={importMut.isPending}
        result={importMut.data}
      />
    </div>
  );
}

function NewPdvDialog({ open, onOpenChange, brandId, onSubmit, pending }: any) {
  const [form, setForm] = useState({ pdvName: "", pdvCity: "", pdvState: "", contactName: "", contactPhone: "", contractStatus: "pending", notes: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo PDV</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome do bar/restaurante *</Label><Input value={form.pdvName} onChange={(e) => setForm({ ...form, pdvName: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Cidade</Label><Input value={form.pdvCity} onChange={(e) => setForm({ ...form, pdvCity: e.target.value })} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={form.pdvState} onChange={(e) => setForm({ ...form, pdvState: e.target.value.toUpperCase() })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Contato</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
          </div>
          <div>
            <Label>Status do contrato</Label>
            <Select value={form.contractStatus} onValueChange={(v) => setForm({ ...form, contractStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!form.pdvName || !brandId || pending}
            onClick={() => onSubmit({ ...form, brandId })}
          >Cadastrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({ open, onOpenChange, data, loading }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Convidar PDV</DialogTitle></DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Gerando link…</p>}
        {data && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Envie este link/QR para o bar. Ao acessar, ele poderá solicitar vínculo com sua marca.</p>
            <div className="flex justify-center"><img src={data.qrUrl} alt="QR convite" className="border rounded" /></div>
            <div className="flex items-center gap-2">
              <Input readOnly value={data.url} />
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(data.url); toast.success("Link copiado"); }}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (l: string) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const headers = split(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cols = split(l);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
  return { headers, rows };
}

function ImportSelloutDialog({ open, onOpenChange, pdvs, onImport, pending, result }: any) {
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const template = "sku,pdv_link_id,period_start,period_end,units,gross_revenue_cents\nIPA-500,PDV-UUID,2026-06-01,2026-06-07,42,84000\n";

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows } = parseCsv(text);
      const errs: string[] = [];
      const parsed = rows.map((r, idx) => {
        const required = ["pdv_link_id", "period_start", "period_end", "units", "gross_revenue_cents"];
        for (const k of required) if (!r[k]) errs.push(`Linha ${idx + 2}: faltando ${k}`);
        return {
          sku: r.sku || undefined,
          productId: r.product_id || undefined,
          pdvLinkId: r.pdv_link_id,
          periodStart: r.period_start,
          periodEnd: r.period_end,
          units: Number(r.units || 0),
          grossRevenueCents: Number(r.gross_revenue_cents || 0),
          notes: r.notes || undefined,
        };
      });
      setPreview(parsed);
      setErrors(errs.slice(0, 5));
    };
    reader.readAsText(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Import CSV de sell-out</DialogTitle></DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList><TabsTrigger value="upload">Upload</TabsTrigger><TabsTrigger value="help">Modelo</TabsTrigger><TabsTrigger value="pdvs">Meus PDVs (IDs)</TabsTrigger></TabsList>
          <TabsContent value="upload" className="space-y-3">
            <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {errors.length > 0 && (
              <div className="text-xs text-destructive border border-destructive/30 rounded p-2 space-y-1">
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            {preview.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {preview.length} linha(s) prontas. Primeira: SKU <strong>{preview[0].sku ?? "—"}</strong>, PDV <code>{String(preview[0].pdvLinkId).slice(0, 8)}…</code>, {preview[0].units}un · {brl(preview[0].grossRevenueCents)}
              </div>
            )}
            {result && (
              <div className="text-xs border rounded p-2">
                <div>Importadas: <strong>{result.inserted}</strong></div>
                {result.skipped > 0 && <div>Ignoradas: {result.skipped}</div>}
                {result.errors?.slice(0, 3).map((e: any, i: number) => <div key={i} className="text-destructive">L{e.row}: {e.message}</div>)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="help" className="space-y-2">
            <p className="text-sm text-muted-foreground">Colunas obrigatórias: <code>pdv_link_id, period_start, period_end, units, gross_revenue_cents</code>. Use <code>sku</code> OU <code>product_id</code> para identificar o rótulo.</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{template}</pre>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([template], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "sellout-modelo.csv"; a.click();
            }}><FileDown className="w-4 h-4 mr-2" />Baixar modelo</Button>
          </TabsContent>
          <TabsContent value="pdvs">
            <div className="max-h-64 overflow-auto text-xs space-y-1">
              {pdvs.map((p: any) => (
                <div key={p.id} className="flex justify-between gap-2 border-b py-1">
                  <span className="truncate">{p.pdv_name}</span>
                  <code className="text-muted-foreground">{p.id}</code>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(p.id); toast.success("ID copiado"); }}><Copy className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button disabled={preview.length === 0 || pending} onClick={() => onImport(preview)}>Importar {preview.length || ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
