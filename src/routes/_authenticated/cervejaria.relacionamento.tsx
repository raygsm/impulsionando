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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Sparkles, Send, Plus, CalendarClock } from "lucide-react";
import {
  listMyBreweryBrands, listBreweryPdvs,
  listBreweryTastings, upsertBreweryTasting,
  captureBreweryLead, listBreweryLeads, previewBreweryBlast,
  listBreweryCampaigns,
} from "@/lib/brewery.functions";

export const Route = createFileRoute("/_authenticated/cervejaria/relacionamento")({
  component: Page,
  head: () => ({ meta: [{ title: "Microcervejaria · Relacionamento — Impulsionando" }, { name: "robots", content: "noindex" }] }),
});

const STYLES = ["IPA", "Pilsen", "Weiss", "Stout", "Porter", "Witbier", "Lager", "APA", "Sour", "Saison"];
const INTERESTS = ["Lançamentos", "Eventos/Degustações", "Cupons", "Receitas/Harmonização", "Visita à fábrica"];
const FREQS: Record<string, string> = { weekly: "Semanal", biweekly: "Quinzenal", monthly: "Mensal", rarely: "Raramente" };

function Page() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState<string | undefined>();
  const brandsFn = useServerFn(listMyBreweryBrands);
  const brandsQ = useQuery({ queryKey: ["brewery-brands"], queryFn: () => brandsFn() });
  const brands = brandsQ.data ?? [];
  const active = brandId ?? brands[0]?.id;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Relacionamento com Consumidor</h1>
          <p className="text-sm text-muted-foreground">Degustações, leads coletados e disparo segmentado por estilo/interesse.</p>
        </div>
        <Select value={active ?? ""} onValueChange={setBrandId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {active && (
        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads"><Users className="w-4 h-4 mr-2" />Leads</TabsTrigger>
            <TabsTrigger value="tastings"><CalendarClock className="w-4 h-4 mr-2" />Degustações</TabsTrigger>
            <TabsTrigger value="blast"><Send className="w-4 h-4 mr-2" />Disparo</TabsTrigger>
          </TabsList>
          <TabsContent value="leads"><LeadsPanel brandId={active} qc={qc} /></TabsContent>
          <TabsContent value="tastings"><TastingsPanel brandId={active} qc={qc} /></TabsContent>
          <TabsContent value="blast"><BlastPanel brandId={active} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ============ LEADS ============ */
function LeadsPanel({ brandId, qc }: { brandId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listBreweryLeads);
  const captureFn = useServerFn(captureBreweryLead);
  const [style, setStyle] = useState<string>("");
  const [interest, setInterest] = useState<string>("");
  const [consentOnly, setConsentOnly] = useState(false);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["brewery-leads", brandId, style, interest, consentOnly],
    queryFn: () => listFn({ data: { brandId, style: style || undefined, interest: interest || undefined, consentOnly } }),
  });

  const captureMut = useMutation({
    mutationFn: (p: any) => captureFn({ data: p }),
    onSuccess: () => { toast.success("Lead capturado (com mascaramento LGPD)"); setOpen(false); qc.invalidateQueries({ queryKey: ["brewery-leads"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const d = q.data;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Leads no período</div><div className="text-2xl font-bold">{d?.total ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Com consentimento</div><div className="text-2xl font-bold">{d?.consented ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Top estilo</div><div className="text-2xl font-bold">{d?.stats.styles[0]?.key ?? "—"}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Leads ({d?.leads.length ?? 0})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={style || "all"} onValueChange={(v) => setStyle(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estilo" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos estilos</SelectItem>{STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={interest || "all"} onValueChange={(v) => setInterest(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Interesse" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos interesses</SelectItem>{INTERESTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <label className="text-xs flex items-center gap-2"><Switch checked={consentOnly} onCheckedChange={setConsentOnly} />Só com consentimento</label>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Capturar lead</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>WhatsApp</TableHead><TableHead>Estilos</TableHead><TableHead>Interesses</TableHead><TableHead>Freq.</TableHead><TableHead>Consent.</TableHead><TableHead>Origem</TableHead><TableHead>Data</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(d?.leads ?? []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum lead encontrado.</TableCell></TableRow>}
              {(d?.leads ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.masked_name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{l.masked_whatsapp ?? "—"}</TableCell>
                  <TableCell className="text-xs">{(l.favorite_styles ?? []).map((s: string) => <Badge key={s} variant="secondary" className="mr-1">{s}</Badge>)}</TableCell>
                  <TableCell className="text-xs">{(l.interests ?? []).map((s: string) => <Badge key={s} variant="outline" className="mr-1">{s}</Badge>)}</TableCell>
                  <TableCell className="text-xs">{l.frequency ? FREQS[l.frequency] : "—"}</TableCell>
                  <TableCell>{l.consent_marketing ? <Badge>Sim</Badge> : <Badge variant="outline">Não</Badge>}</TableCell>
                  <TableCell className="text-xs">{l.source ?? "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CaptureLeadDialog open={open} onOpenChange={setOpen} brandId={brandId} onSubmit={(v) => captureMut.mutate(v)} pending={captureMut.isPending} />
    </div>
  );
}

function CaptureLeadDialog({ open, onOpenChange, brandId, onSubmit, pending }: { open: boolean; onOpenChange: (v: boolean) => void; brandId: string; onSubmit: (v: any) => void; pending: boolean }) {
  const [f, setF] = useState<any>({ brandId, name: "", whatsapp: "", favoriteStyles: [], interests: [], frequency: "", consentMarketing: false, source: "tasting" });

  function toggleArr(key: "favoriteStyles" | "interests", v: string) {
    setF({ ...f, [key]: f[key].includes(v) ? f[key].filter((x: string) => x !== v) : [...f[key], v] });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Capturar lead (degustação/QR)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Nome *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label>WhatsApp *</Label><Input placeholder="11 98765-4321" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
          </div>
          <div>
            <Label>Estilos preferidos</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STYLES.map((s) => (
                <label key={s} className={`text-xs px-2 py-1 rounded border cursor-pointer ${f.favoriteStyles.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                  <input type="checkbox" className="hidden" checked={f.favoriteStyles.includes(s)} onChange={() => toggleArr("favoriteStyles", s)} />{s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Interesses</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERESTS.map((s) => (
                <label key={s} className={`text-xs px-2 py-1 rounded border cursor-pointer ${f.interests.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                  <input type="checkbox" className="hidden" checked={f.interests.includes(s)} onChange={() => toggleArr("interests", s)} />{s}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Frequência</Label>
              <Select value={f.frequency || "none"} onValueChange={(v) => setF({ ...f, frequency: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {Object.entries(FREQS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Origem</Label>
              <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasting">Degustação</SelectItem>
                  <SelectItem value="qr_pdv">QR no PDV</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={f.consentMarketing} onCheckedChange={(v) => setF({ ...f, consentMarketing: !!v })} />
            Aceita receber comunicação da marca (LGPD)
          </label>
          <p className="text-xs text-muted-foreground">Nome e telefone são <strong>mascarados</strong> antes de salvar — o dono da marca não vê os dados completos.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!f.name || !f.whatsapp || pending} onClick={() => onSubmit(f)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ TASTINGS ============ */
function TastingsPanel({ brandId, qc }: { brandId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listBreweryTastings);
  const pdvsFn = useServerFn(listBreweryPdvs);
  const upsertFn = useServerFn(upsertBreweryTasting);
  const [open, setOpen] = useState(false);

  const q = useQuery({ queryKey: ["brewery-tastings", brandId], queryFn: () => listFn({ data: { brandId, sinceDays: 180 } }) });
  const pdvsQ = useQuery({ queryKey: ["brewery-pdvs", brandId, "all"], queryFn: () => pdvsFn({ data: { brandId, status: "all" } }) });

  const upsertMut = useMutation({
    mutationFn: (p: any) => upsertFn({ data: p }),
    onSuccess: () => { toast.success("Degustação registrada"); setOpen(false); qc.invalidateQueries({ queryKey: ["brewery-tastings"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const rows = q.data ?? [];
  const pdvs = pdvsQ.data ?? [];
  const pdvMap = new Map(pdvs.map((p: any) => [p.id, p.pdv_name]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Degustações (últimos 180 dias)</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova degustação</Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>PDV</TableHead><TableHead className="text-right">Participantes</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Unidades</TableHead><TableHead>Conversão</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhuma degustação registrada.</TableCell></TableRow>}
            {rows.map((t: any) => {
              const conv = t.participants > 0 ? Math.round((t.leads_captured / t.participants) * 100) : 0;
              return (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.event_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{t.pdv_link_id ? pdvMap.get(t.pdv_link_id) ?? "—" : "—"}</TableCell>
                  <TableCell className="text-right">{t.participants}</TableCell>
                  <TableCell className="text-right">{t.leads_captured}</TableCell>
                  <TableCell className="text-right">{t.units_sold}</TableCell>
                  <TableCell><Badge variant={conv >= 40 ? "default" : "secondary"}>{conv}%</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <TastingDialog open={open} onOpenChange={setOpen} brandId={brandId} pdvs={pdvs} onSubmit={(v) => upsertMut.mutate(v)} pending={upsertMut.isPending} />
    </Card>
  );
}

function TastingDialog({ open, onOpenChange, brandId, pdvs, onSubmit, pending }: { open: boolean; onOpenChange: (v: boolean) => void; brandId: string; pdvs: any[]; onSubmit: (v: any) => void; pending: boolean }) {
  const now = new Date().toISOString().slice(0, 16);
  const [f, setF] = useState<any>({ brandId, pdvLinkId: "", eventAt: now, durationMinutes: 90, participants: 0, leadsCaptured: 0, unitsSold: 0, productsShowcased: [], notes: "" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova degustação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Data/hora *</Label><Input type="datetime-local" value={f.eventAt} onChange={(e) => setF({ ...f, eventAt: e.target.value })} /></div>
            <div><Label>Duração (min)</Label><Input type="number" value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: Number(e.target.value || 0) })} /></div>
          </div>
          <div><Label>PDV</Label>
            <Select value={f.pdvLinkId || "none"} onValueChange={(v) => setF({ ...f, pdvLinkId: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {pdvs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.pdv_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Participantes</Label><Input type="number" value={f.participants} onChange={(e) => setF({ ...f, participants: Number(e.target.value || 0) })} /></div>
            <div><Label>Leads capturados</Label><Input type="number" value={f.leadsCaptured} onChange={(e) => setF({ ...f, leadsCaptured: Number(e.target.value || 0) })} /></div>
            <div><Label>Unidades vendidas</Label><Input type="number" value={f.unitsSold} onChange={(e) => setF({ ...f, unitsSold: Number(e.target.value || 0) })} /></div>
          </div>
          <div><Label>Observações</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={pending} onClick={() => onSubmit({ ...f, pdvLinkId: f.pdvLinkId || null, eventAt: new Date(f.eventAt).toISOString() })}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ BLAST ============ */
function BlastPanel({ brandId }: { brandId: string }) {
  const previewFn = useServerFn(previewBreweryBlast);
  const campaignsFn = useServerFn(listBreweryCampaigns);
  const [styles, setStyles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [campaignId, setCampaignId] = useState<string>("");
  const [message, setMessage] = useState("Olá! Lançamos uma nova IPA sazonal — passe no bar parceiro e use cupom IPA20.");

  const campaignsQ = useQuery({ queryKey: ["brewery-campaigns", brandId], queryFn: () => campaignsFn({ data: { brandId } }) });
  const previewMut = useMutation({
    mutationFn: () => previewFn({ data: { brandId, styles, interests, campaignId: campaignId || undefined } }),
  });

  function toggle(arr: string[], setArr: (v: string[]) => void, v: string) {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" />Segmentação</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Estilos preferidos (OR)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STYLES.map((s) => (
                <label key={s} className={`text-xs px-2 py-1 rounded border cursor-pointer ${styles.includes(s) ? "bg-primary text-primary-foreground border-primary" : ""}`}>
                  <input type="checkbox" className="hidden" checked={styles.includes(s)} onChange={() => toggle(styles, setStyles, s)} />{s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Interesses (OR)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERESTS.map((s) => (
                <label key={s} className={`text-xs px-2 py-1 rounded border cursor-pointer ${interests.includes(s) ? "bg-primary text-primary-foreground border-primary" : ""}`}>
                  <input type="checkbox" className="hidden" checked={interests.includes(s)} onChange={() => toggle(interests, setInterests, s)} />{s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Atrelar a campanha (opcional)</Label>
            <Select value={campaignId || "none"} onValueChange={(v) => setCampaignId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem campanha</SelectItem>
                {(campaignsQ.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => previewMut.mutate()} disabled={previewMut.isPending}><Send className="w-4 h-4 mr-2" />Calcular público elegível</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Mensagem & preview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="text-xs text-muted-foreground">{message.length}/500 caracteres</p>
          {previewMut.data && (
            <div className="border rounded p-3 space-y-2 text-sm">
              <div><strong>{previewMut.data.eligible}</strong> de {previewMut.data.totalConsented} leads com consentimento atendem aos filtros.</div>
              {previewMut.data.sample.length > 0 && (
                <div className="text-xs text-muted-foreground">Amostra: {previewMut.data.sample.join(", ")}</div>
              )}
              <p className="text-xs text-muted-foreground">O disparo real será feito quando a integração de mensageria for ativada (Fase 6).</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
