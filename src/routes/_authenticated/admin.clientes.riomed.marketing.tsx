import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getRiomedMarketingOverview,
  detectRiomedStaleStock,
  createRiomedCampaignFromStale,
  updateRiomedCampaignStatus,
  toggleShowcasePublish,
} from "@/lib/riomed-marketing.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Megaphone, Sparkles, Loader2, Send, PackageX, Eye, EyeOff, Play, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/marketing")({
  head: () => ({ meta: [{ title: "Rio Med · Marketing & Divulgação" }] }),
  component: Page,
});

function fmt(v: number) { return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v || 0); }

function Page() {
  const overviewFn = useServerFn(getRiomedMarketingOverview);
  const detectFn = useServerFn(detectRiomedStaleStock);
  const createFn = useServerFn(createRiomedCampaignFromStale);
  const updateStatusFn = useServerFn(updateRiomedCampaignStatus);
  const toggleShowcaseFn = useServerFn(toggleShowcasePublish);

  const overview = useQuery({ queryKey: ["riomed-mkt-overview"], queryFn: () => overviewFn() });

  const [days, setDays] = useState(90);
  const [minQty, setMinQty] = useState(1);
  const [staleItems, setStaleItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const [name, setName] = useState("Liquidação Estoque Parado");
  const [discount, setDiscount] = useState(20);
  const [channel, setChannel] = useState<"whatsapp"|"showcase"|"email"|"b2b"|"multi">("whatsapp");
  const [audience, setAudience] = useState<"all"|"public"|"b2b"|"hospital"|"rental"|"customer_segment">("all");
  const [tone, setTone] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const scan = async () => {
    setScanning(true);
    try {
      const r = await detectFn({ data: { days, minQty, limit: 50 } });
      setStaleItems(r.items);
      toast.success(`${r.items.length} produtos parados detectados`);
    } catch (e: any) { toast.error(e?.message ?? "Erro ao detectar"); }
    finally { setScanning(false); }
  };

  const create = async () => {
    setBusy(true); setPreview(null);
    try {
      const r = await createFn({ data: { name, goal: "destock", channel, audience, discountPct: discount, days, minQty, maxItems: 15, tone: tone || undefined } });
      setPreview(r);
      toast.success(`Campanha ${r.code} criada com ${r.itemsCount} itens`);
      overview.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  const launch = async (id: string) => {
    try {
      await updateStatusFn({ data: { campaignId: id, status: "running" } });
      toast.success("Campanha em execução");
      overview.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  const complete = async (id: string) => {
    try {
      await updateStatusFn({ data: { campaignId: id, status: "completed" } });
      toast.success("Concluída");
      overview.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  const toggleShowcase = async (id: string, pub: boolean) => {
    try {
      await toggleShowcaseFn({ data: { showcaseId: id, isPublished: pub } });
      toast.success(pub ? "Vitrine publicada" : "Vitrine despublicada");
      overview.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  const c = overview.data?.counters;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Marketing & Divulgação</h1>
          <p className="text-sm text-muted-foreground">Estoque parado vira campanha. Gemini gera a copy. WhatsApp / vitrine / e-mail.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Campanhas", value: c?.total ?? 0 },
          { label: "Em execução", value: c?.running ?? 0 },
          { label: "Concluídas", value: c?.completed ?? 0 },
          { label: "WhatsApp na fila", value: c?.whatsappQueued ?? 0 },
          { label: "WhatsApp enviados", value: c?.whatsappSent ?? 0 },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="generator">
        <TabsList>
          <TabsTrigger value="generator"><Sparkles className="h-4 w-4 mr-1" />Gerador IA</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="showcase">Vitrines</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PackageX className="h-4 w-4" />1. Detectar estoque parado</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3 items-end">
              <div><Label>Dias sem movimento</Label><Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
              <div><Label>Qtd mínima</Label><Input type="number" value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} /></div>
              <Button onClick={scan} disabled={scanning}>
                {scanning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PackageX className="h-4 w-4 mr-1" />}
                Detectar
              </Button>
              <div className="text-sm text-muted-foreground">{staleItems.length} itens encontrados</div>
            </CardContent>
          </Card>

          {staleItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Prévia ({staleItems.length})</CardTitle></CardHeader>
              <CardContent className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th>SKU</th><th>Produto</th><th className="text-right">Qtd</th><th className="text-right">Dias</th><th className="text-right">Preço</th></tr></thead>
                  <tbody>
                    {staleItems.slice(0, 20).map((it) => (
                      <tr key={it.variant_id} className="border-t">
                        <td className="py-1">{it.sku}</td>
                        <td className="truncate max-w-xs">{it.product_name}</td>
                        <td className="text-right">{Number(it.qty).toFixed(0)}</td>
                        <td className="text-right">{it.days_stale}</td>
                        <td className="text-right">{fmt(Number(it.unit_price || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" />2. Gerar campanha com IA</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Desconto sugerido (%)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
              <div>
                <Label>Canal</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="showcase">Vitrine pública</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="b2b">B2B (clientes pro)</SelectItem>
                    <SelectItem value="multi">Multi-canal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Público</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="public">Consumidor final</SelectItem>
                    <SelectItem value="b2b">B2B</SelectItem>
                    <SelectItem value="hospital">Hospitais</SelectItem>
                    <SelectItem value="rental">Locação</SelectItem>
                    <SelectItem value="customer_segment">Segmento custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Tom (opcional)</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="ex: profissional, urgente, amigável" /></div>
              <div className="md:col-span-2">
                <Button onClick={create} disabled={busy || staleItems.length === 0} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Gerar campanha com Gemini
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card className="border-primary">
              <CardHeader><CardTitle className="text-sm">Campanha gerada · {preview.code}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div><Label className="text-xs">Headline</Label><p className="font-semibold">{preview.headline}</p></div>
                <div><Label className="text-xs">Corpo</Label><Textarea readOnly value={preview.body} rows={4} /></div>
                <div><Label className="text-xs">CTA</Label><p>{preview.cta}</p></div>
                <p className="text-xs text-muted-foreground">{preview.itemsCount} produtos · pronto para envio</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader><CardTitle className="text-sm">Histórico</CardTitle></CardHeader>
            <CardContent>
              {overview.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <div className="space-y-2">
                  {(overview.data?.campaigns ?? []).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between border rounded p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.status}</Badge>
                          <Badge variant="secondary">{c.channel}</Badge>
                          <span className="text-xs text-muted-foreground">{c.goal}</span>
                        </div>
                        <p className="text-sm mt-1">{c.metrics?.items_count ?? 0} itens · est. {fmt(Number(c.metrics?.est_value ?? 0))}</p>
                      </div>
                      <div className="flex gap-1">
                        {c.status === "ready" && <Button size="sm" onClick={() => launch(c.id)}><Play className="h-3 w-3 mr-1" />Lançar</Button>}
                        {c.status === "running" && <Button size="sm" variant="outline" onClick={() => complete(c.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Concluir</Button>}
                      </div>
                    </div>
                  ))}
                  {!overview.data?.campaigns?.length && <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="showcase">
          <Card>
            <CardHeader><CardTitle className="text-sm">Vitrines públicas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(overview.data?.showcase ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">/{s.slug}</p>
                  </div>
                  <Button size="sm" variant={s.is_published ? "default" : "outline"} onClick={() => toggleShowcase(s.id, !s.is_published)}>
                    {s.is_published ? <><Eye className="h-3 w-3 mr-1" />Publicada</> : <><EyeOff className="h-3 w-3 mr-1" />Rascunho</>}
                  </Button>
                </div>
              ))}
              {!overview.data?.showcase?.length && <p className="text-sm text-muted-foreground">Nenhuma vitrine.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader><CardTitle className="text-sm">Regras de detecção</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-2">
            {(overview.data?.rules ?? []).map((r: any) => (
              <div key={r.id} className="border rounded p-3">
                <p className="font-medium text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground">≥ {r.days_threshold} dias · qtd ≥ {r.min_qty} · desconto sugerido {r.suggested_discount_pct}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
