import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Beer, Plus, Megaphone, Wine } from "lucide-react";
import {
  listMyBreweryBrands,
  listBreweryPdvs,
  listBreweryProducts,
  upsertBreweryProduct,
  toggleBreweryProductActive,
  listBreweryCampaigns,
  upsertBreweryCampaign,
} from "@/lib/brewery.functions";

export const Route = createFileRoute("/_authenticated/cervejaria/catalogo")({
  component: BreweryCatalogPage,
  head: () => ({ meta: [{ title: "Microcervejaria · Catálogo — Impulsionando" }, { name: "robots", content: "noindex" }] }),
});

const STYLES = ["IPA", "Pilsen", "Weiss", "Stout", "Porter", "Witbier", "Lager", "APA", "Sour", "Saison", "Outra"];

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function BreweryCatalogPage() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState<string | undefined>();
  const [tab, setTab] = useState<"products" | "campaigns">("products");

  const brandsFn = useServerFn(listMyBreweryBrands);
  const brandsQ = useQuery({ queryKey: ["brewery-brands"], queryFn: () => brandsFn() });
  const brands = brandsQ.data ?? [];
  const activeBrand = brandId ?? brands[0]?.id;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Beer className="w-6 h-6" /> Catálogo & Campanhas</h1>
          <p className="text-sm text-muted-foreground">Gerencie rótulos e ações coordenadas com seus PDVs.</p>
        </div>
        <Select value={activeBrand ?? ""} onValueChange={setBrandId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="products"><Wine className="w-4 h-4 mr-2" /> Rótulos</TabsTrigger>
          <TabsTrigger value="campaigns"><Megaphone className="w-4 h-4 mr-2" /> Campanhas</TabsTrigger>
        </TabsList>
        <TabsContent value="products">{activeBrand && <ProductsPanel brandId={activeBrand} qc={qc} />}</TabsContent>
        <TabsContent value="campaigns">{activeBrand && <CampaignsPanel brandId={activeBrand} qc={qc} />}</TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsPanel({ brandId, qc }: { brandId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listBreweryProducts);
  const upsertFn = useServerFn(upsertBreweryProduct);
  const toggleFn = useServerFn(toggleBreweryProductActive);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["brewery-products", brandId, includeInactive],
    queryFn: () => listFn({ data: { brandId, includeInactive } }),
  });

  const upsertMut = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => { toast.success("Rótulo salvo"); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["brewery-products"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const toggleMut = useMutation({
    mutationFn: (p: { id: string; isActive: boolean }) => toggleFn({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brewery-products"] }),
  });

  const rows = q.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Rótulos ({rows.length})</CardTitle>
        <div className="flex items-center gap-3">
          <label className="text-xs flex items-center gap-2"><Switch checked={includeInactive} onCheckedChange={setIncludeInactive} />Mostrar inativos</label>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Novo rótulo</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Estilo</TableHead>
              <TableHead>ABV</TableHead>
              <TableHead>IBU</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum rótulo cadastrado.</TableCell></TableRow>}
            {rows.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}{p.is_seasonal && <Badge variant="outline" className="ml-2 text-xs">Sazonal</Badge>}</TableCell>
                <TableCell>{p.style}</TableCell>
                <TableCell>{p.abv ? `${p.abv}%` : "—"}</TableCell>
                <TableCell>{p.ibu ?? "—"}</TableCell>
                <TableCell>{p.volume_ml ? `${p.volume_ml}ml` : "—"}{p.package_type ? ` · ${p.package_type}` : ""}</TableCell>
                <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                <TableCell><Switch checked={p.is_active} onCheckedChange={(v) => toggleMut.mutate({ id: p.id, isActive: v })} /></TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}>Editar</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <ProductDialog open={open} onOpenChange={setOpen} brandId={brandId} initial={editing} onSubmit={(v) => upsertMut.mutate(v)} pending={upsertMut.isPending} />
    </Card>
  );
}

function ProductDialog({ open, onOpenChange, brandId, initial, onSubmit, pending }: { open: boolean; onOpenChange: (v: boolean) => void; brandId: string; initial: any; onSubmit: (v: any) => void; pending: boolean }) {
  const [f, setF] = useState<any>({
    id: initial?.id, brandId, name: initial?.name ?? "", style: initial?.style ?? "IPA",
    sku: initial?.sku ?? "", abv: initial?.abv ?? "", ibu: initial?.ibu ?? "", volumeMl: initial?.volume_ml ?? "",
    packageType: initial?.package_type ?? "", description: initial?.description ?? "",
    isActive: initial?.is_active ?? true, isSeasonal: initial?.is_seasonal ?? false,
  });

  // Reinit when dialog reopens with different initial
  if (open && initial && f.id !== initial.id) {
    setF({
      id: initial.id, brandId, name: initial.name, style: initial.style,
      sku: initial.sku ?? "", abv: initial.abv ?? "", ibu: initial.ibu ?? "", volumeMl: initial.volume_ml ?? "",
      packageType: initial.package_type ?? "", description: initial.description ?? "",
      isActive: initial.is_active, isSeasonal: initial.is_seasonal,
    });
  }
  if (open && !initial && f.id) {
    setF({ id: undefined, brandId, name: "", style: "IPA", sku: "", abv: "", ibu: "", volumeMl: "", packageType: "", description: "", isActive: true, isSeasonal: false });
  }

  function submit() {
    onSubmit({
      ...f,
      abv: f.abv === "" ? null : Number(f.abv),
      ibu: f.ibu === "" ? null : Number(f.ibu),
      volumeMl: f.volumeMl === "" ? null : Number(f.volumeMl),
      sku: f.sku || null, packageType: f.packageType || null, description: f.description || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Editar rótulo" : "Novo rótulo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Estilo *</Label>
              <Select value={f.style} onValueChange={(v) => setF({ ...f, style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>SKU</Label><Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>ABV %</Label><Input type="number" step="0.1" value={f.abv} onChange={(e) => setF({ ...f, abv: e.target.value })} /></div>
            <div><Label>IBU</Label><Input type="number" value={f.ibu} onChange={(e) => setF({ ...f, ibu: e.target.value })} /></div>
            <div><Label>Volume (ml)</Label><Input type="number" value={f.volumeMl} onChange={(e) => setF({ ...f, volumeMl: e.target.value })} /></div>
          </div>
          <div><Label>Embalagem</Label><Input placeholder="Garrafa 600ml, lata, chopp…" value={f.packageType} onChange={(e) => setF({ ...f, packageType: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v })} /> Ativo</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.isSeasonal} onCheckedChange={(v) => setF({ ...f, isSeasonal: v })} /> Sazonal</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!f.name || pending} onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Campanhas ============ */

const STATUS_LABEL: Record<string, string> = { draft: "Rascunho", scheduled: "Agendada", running: "Em andamento", completed: "Concluída", cancelled: "Cancelada" };

function CampaignsPanel({ brandId, qc }: { brandId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listBreweryCampaigns);
  const pdvsFn = useServerFn(listBreweryPdvs);
  const upsertFn = useServerFn(upsertBreweryCampaign);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const q = useQuery({ queryKey: ["brewery-campaigns", brandId], queryFn: () => listFn({ data: { brandId } }) });
  const pdvsQ = useQuery({ queryKey: ["brewery-pdvs", brandId, "all"], queryFn: () => pdvsFn({ data: { brandId, status: "all" } }) });

  const upsertMut = useMutation({
    mutationFn: (p: any) => upsertFn({ data: p }),
    onSuccess: () => { toast.success("Campanha salva"); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["brewery-campaigns"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const rows = q.data ?? [];
  const pdvs = pdvsQ.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Nova campanha</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma campanha criada.</CardContent></Card>}
        {rows.map((c: any) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <Badge variant="secondary">{STATUS_LABEL[c.status] ?? c.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(c.starts_at).toLocaleDateString("pt-BR")} → {new Date(c.ends_at).toLocaleDateString("pt-BR")} · {c.target_pdv_ids?.length || "todos"} PDV(s){c.voucher_code ? ` · cupom ${c.voucher_code}` : ""}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {c.goal && <p className="text-sm">{c.goal}</p>}
              {c.kpi_target_units != null && (
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Unidades</span><span>{c.progress.units} / {c.kpi_target_units}</span></div>
                  <Progress value={c.progress.unitsPct ?? 0} />
                </div>
              )}
              {c.kpi_target_leads != null && (
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Leads</span><span>{c.progress.leads} / {c.kpi_target_leads}</span></div>
                  <Progress value={c.progress.leadsPct ?? 0} />
                </div>
              )}
              <div className="text-xs text-muted-foreground">Receita período: <strong>{brl(c.progress.revenueCents)}</strong></div>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <CampaignDialog open={open} onOpenChange={setOpen} brandId={brandId} pdvs={pdvs} initial={editing} onSubmit={(v) => upsertMut.mutate(v)} pending={upsertMut.isPending} />
    </div>
  );
}

function CampaignDialog({ open, onOpenChange, brandId, pdvs, initial, onSubmit, pending }: { open: boolean; onOpenChange: (v: boolean) => void; brandId: string; pdvs: any[]; initial: any; onSubmit: (v: any) => void; pending: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const [f, setF] = useState<any>({
    id: initial?.id, brandId, name: initial?.name ?? "", goal: initial?.goal ?? "",
    status: initial?.status ?? "draft",
    startsAt: initial?.starts_at?.slice(0, 10) ?? today,
    endsAt: initial?.ends_at?.slice(0, 10) ?? in30,
    kpiTargetUnits: initial?.kpi_target_units ?? "",
    kpiTargetLeads: initial?.kpi_target_leads ?? "",
    targetPdvIds: initial?.target_pdv_ids ?? [],
    voucherCode: initial?.voucher_code ?? "",
  });

  if (open && initial && f.id !== initial.id) {
    setF({
      id: initial.id, brandId, name: initial.name, goal: initial.goal ?? "", status: initial.status,
      startsAt: initial.starts_at.slice(0, 10), endsAt: initial.ends_at.slice(0, 10),
      kpiTargetUnits: initial.kpi_target_units ?? "", kpiTargetLeads: initial.kpi_target_leads ?? "",
      targetPdvIds: initial.target_pdv_ids ?? [], voucherCode: initial.voucher_code ?? "",
    });
  }
  if (open && !initial && f.id) {
    setF({ id: undefined, brandId, name: "", goal: "", status: "draft", startsAt: today, endsAt: in30, kpiTargetUnits: "", kpiTargetLeads: "", targetPdvIds: [], voucherCode: "" });
  }

  function toggle(id: string) {
    const next = f.targetPdvIds.includes(id) ? f.targetPdvIds.filter((x: string) => x !== id) : [...f.targetPdvIds, id];
    setF({ ...f, targetPdvIds: next });
  }

  function submit() {
    onSubmit({
      ...f,
      startsAt: new Date(f.startsAt).toISOString(),
      endsAt: new Date(f.endsAt + "T23:59:59").toISOString(),
      kpiTargetUnits: f.kpiTargetUnits === "" ? null : Number(f.kpiTargetUnits),
      kpiTargetLeads: f.kpiTargetLeads === "" ? null : Number(f.kpiTargetLeads),
      goal: f.goal || null, voucherCode: f.voucherCode || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Editar campanha" : "Nova campanha"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Objetivo</Label><Textarea rows={2} value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} placeholder="Ex.: Empurrar IPA sazonal nos bares do Centro" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Início</Label><Input type="date" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></div>
            <div><Label>Fim</Label><Input type="date" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Meta unidades</Label><Input type="number" value={f.kpiTargetUnits} onChange={(e) => setF({ ...f, kpiTargetUnits: e.target.value })} /></div>
            <div><Label>Meta leads</Label><Input type="number" value={f.kpiTargetLeads} onChange={(e) => setF({ ...f, kpiTargetLeads: e.target.value })} /></div>
            <div><Label>Cupom</Label><Input value={f.voucherCode} onChange={(e) => setF({ ...f, voucherCode: e.target.value.toUpperCase() })} placeholder="IPA20" /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>PDVs alvo ({f.targetPdvIds.length || "todos"})</Label>
            <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
              {pdvs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum PDV cadastrado.</p>}
              {pdvs.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.targetPdvIds.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <span className="truncate">{p.pdv_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{p.pdv_city ?? ""}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vazio = todos os PDVs ativos contam para a meta.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!f.name || pending} onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
