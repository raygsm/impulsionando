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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Send, BarChart3, Megaphone } from "lucide-react";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader } from "@/components/app/PageElements";
import {
  previewRealestateBlast, dispatchRealestateBlast,
  listRealestateBlasts, fetchRealestateReturnReport, listProperties,
} from "@/lib/realestate.functions";

export const Route = createFileRoute("/_authenticated/imobiliaria/campanhas")({
  head: () => ({ meta: [{ title: "Campanhas & Disparo — Imobiliária" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const OPERATIONS = [
  { v: "venda", l: "Venda" },
  { v: "locacao", l: "Locação" },
  { v: "venda_ou_locacao", l: "Venda ou Locação" },
];

function Page() {
  const { companyId } = useActiveCompany();
  if (!companyId) {
    return <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>;
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Campanhas & Disparo" description="Envio segmentado para intenções de busca ativas — WhatsApp ou e-mail." />
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new"><Send className="w-4 h-4 mr-2" />Novo disparo</TabsTrigger>
          <TabsTrigger value="history"><Megaphone className="w-4 h-4 mr-2" />Histórico</TabsTrigger>
          <TabsTrigger value="roi"><BarChart3 className="w-4 h-4 mr-2" />Retorno</TabsTrigger>
        </TabsList>
        <TabsContent value="new"><NewBlast companyId={companyId} /></TabsContent>
        <TabsContent value="history"><BlastHistory companyId={companyId} /></TabsContent>
        <TabsContent value="roi"><BlastRoi companyId={companyId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function NewBlast({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [operation, setOperation] = useState<string>("");
  const [cities, setCities] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [bedroomsMin, setBedroomsMin] = useState("");
  const [propertyId, setPropertyId] = useState<string>("");

  const propsFn = useServerFn(listProperties);
  const propsQ = useQuery({ queryKey: ["re-props-blast", companyId], queryFn: () => propsFn({ data: { companyId } }) });
  const properties = propsQ.data?.properties ?? [];

  const filter = {
    operation: operation ? (operation as any) : undefined,
    cities: cities.split(",").map((s) => s.trim()).filter(Boolean),
    neighborhoods: [],
    property_types: [],
    price_max: priceMax ? Number(priceMax) : null,
    price_min: null,
    bedrooms_min: bedroomsMin ? Number(bedroomsMin) : 0,
  };

  const previewFn = useServerFn(previewRealestateBlast);
  const previewQ = useQuery({
    queryKey: ["re-blast-preview", companyId, channel, JSON.stringify(filter)],
    queryFn: () => previewFn({ data: { companyId, channel, filter } as any }),
  });

  const dispatchFn = useServerFn(dispatchRealestateBlast);
  const dispatchM = useMutation({
    mutationFn: () => dispatchFn({ data: { companyId, channel, filter, body, title, subject: subject || undefined, propertyId: propertyId || undefined } as any }),
    onSuccess: (r) => {
      toast.success(`Disparo enfileirado: ${r.enqueued}/${r.eligible} elegíveis`);
      qc.invalidateQueries({ queryKey: ["re-blasts"] });
      setBody(""); setTitle("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao disparar"),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Novo disparo segmentado</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Título interno</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lançamento Vila Mariana" />
          </div>
          <div>
            <Label>Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Operação</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                {OPERATIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cidades (vírgula)</Label>
            <Input value={cities} onChange={(e) => setCities(e.target.value)} placeholder="São Paulo, Santos" />
          </div>
          <div>
            <Label>Preço máx.</Label>
            <Input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>
          <div>
            <Label>Dormitórios mín.</Label>
            <Input type="number" value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Imóvel em destaque (opcional)</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {properties.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.reference_code ? `[${p.reference_code}] ` : ""}{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {channel === "email" && (
          <div>
            <Label>Assunto do e-mail</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        )}

        <div>
          <Label>Mensagem</Label>
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Olá! Temos uma novidade que combina com sua busca..." />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap p-3 bg-muted/30 rounded-md">
          <div className="text-sm">
            <div><strong>Pré-visualização do público:</strong></div>
            <div className="text-muted-foreground">
              {previewQ.isLoading ? "calculando…" : (
                <>Intenções ativas: <b>{previewQ.data?.total ?? 0}</b> · compatíveis: <b>{previewQ.data?.matched ?? 0}</b> · elegíveis ({channel}): <b>{previewQ.data?.eligible ?? 0}</b></>
              )}
            </div>
          </div>
          <Button
            onClick={() => dispatchM.mutate()}
            disabled={!title || !body || dispatchM.isPending || (previewQ.data?.eligible ?? 0) === 0}
          >
            <Send className="w-4 h-4 mr-2" />{dispatchM.isPending ? "Enviando…" : "Disparar agora"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BlastHistory({ companyId }: { companyId: string }) {
  const listFn = useServerFn(listRealestateBlasts);
  const q = useQuery({ queryKey: ["re-blasts", companyId], queryFn: () => listFn({ data: { companyId } }) });
  const blasts = q.data?.blasts ?? [];
  return (
    <Card>
      <CardHeader><CardTitle>Histórico de disparos</CardTitle></CardHeader>
      <CardContent>
        {blasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum disparo ainda.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Título</TableHead><TableHead>Canal</TableHead>
              <TableHead className="text-right">Público</TableHead><TableHead className="text-right">Enfileirados</TableHead>
              <TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {blasts.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{new Date(b.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{b.title}</TableCell>
                  <TableCell><Badge variant="outline">{b.channel}</Badge></TableCell>
                  <TableCell className="text-right">{b.audience_count}</TableCell>
                  <TableCell className="text-right">{b.enqueued_count}</TableCell>
                  <TableCell><Badge variant={b.status === "completed" ? "default" : b.status === "failed" ? "destructive" : "secondary"}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function BlastRoi({ companyId }: { companyId: string }) {
  const fn = useServerFn(fetchRealestateReturnReport);
  const q = useQuery({ queryKey: ["re-blast-roi", companyId], queryFn: () => fn({ data: { companyId } }) });
  const kpis = q.data?.kpis;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Disparos", kpis?.blasts ?? 0],
          ["Enfileirados", kpis?.enqueued ?? 0],
          ["Entregues", kpis?.delivered ?? 0],
          ["Falhas", kpis?.failed ?? 0],
          ["Conv. %", `${kpis?.conversionPct ?? 0}%`],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="text-2xl font-bold">{v}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Performance por disparo</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Título</TableHead>
              <TableHead className="text-right">Enfileirados</TableHead>
              <TableHead className="text-right">Entregues</TableHead>
              <TableHead className="text-right">Falhas</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(q.data?.blasts ?? []).map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{new Date(b.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{b.title}</TableCell>
                  <TableCell className="text-right">{b.enqueued_count}</TableCell>
                  <TableCell className="text-right">{b.delivered}</TableCell>
                  <TableCell className="text-right">{b.failedReal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
