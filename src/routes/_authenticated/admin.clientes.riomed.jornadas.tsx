import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJourneysOverview, upsertJourney, toggleJourney, deleteJourney, evaluateSegment,
} from "@/lib/riomed-journeys.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Workflow, Users, BarChart3, Play, Pause } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/jornadas")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='journeys' title='Jornadas RioMed'><Page /></TenantModuleShell>),
});

type Step = {
  kind: "wait" | "whatsapp" | "email" | "sms" | "tag" | "branch";
  delayMinutes?: number;
  template?: string;
  subject?: string;
  body?: string;
  tag?: string;
  conditionField?: string;
  conditionEquals?: string;
  abVariant?: "A" | "B";
  abWeight?: number;
};

function Page() {
  const fn = useServerFn(getJourneysOverview);
  const up = useServerFn(upsertJourney);
  const tg = useServerFn(toggleJourney);
  const del = useServerFn(deleteJourney);
  const seg = useServerFn(evaluateSegment);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["riomed-journeys"], queryFn: () => fn() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["riomed-journeys"] });

  const mUp = useMutation({ mutationFn: (a: any) => up({ data: a }), onSuccess: () => { invalidate(); toast.success("Jornada salva"); setOpen(false); }, onError: (e: any) => toast.error(e?.message) });
  const mTg = useMutation({ mutationFn: (a: any) => tg({ data: a }), onSuccess: () => invalidate() });
  const mDel = useMutation({ mutationFn: (a: any) => del({ data: a }), onSuccess: () => { invalidate(); toast.success("Removida"); } });
  const mSeg = useMutation({ mutationFn: (a: any) => seg({ data: a }), onSuccess: (r: any) => toast.success(`${r.count} registros em ${r.table}`) });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [stage, setStage] = useState<"captacao"|"conversao"|"relacionamento"|"retencao"|"expansao">("captacao");
  const [trigger, setTrigger] = useState("lead.created");
  const [priority, setPriority] = useState(100);
  const [steps, setSteps] = useState<Step[]>([{ kind: "whatsapp", body: "" }]);

  const addStep = () => setSteps([...steps, { kind: "wait", delayMinutes: 60 }]);
  const updateStep = (i: number, patch: Partial<Step>) => setSteps(steps.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));

  const save = () => mUp.mutate({
    name, description: desc, funnelStage: stage, triggerEvent: trigger,
    priority, isActive: true, conditions: {}, steps,
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  const auts = data?.automations ?? [];
  const stats = data?.runStats ?? {};
  const funnel = data?.funnel ?? { captacao:0,conversao:0,relacionamento:0,retencao:0,expansao:0,total:0,opportunities:0 };

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jornadas & Campanhas — Rio Med</h1>
          <p className="text-sm text-muted-foreground">Editor multicanal (WhatsApp/email/SMS), segmentação, A/B testing e métricas de funil.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nova jornada</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova jornada</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Prioridade</Label><Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} /></div>
              </div>
              <div><Label>Descrição</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Etapa do funil</Label>
                  <Select value={stage} onValueChange={(v: any) => setStage(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="captacao">Captação</SelectItem>
                      <SelectItem value="conversao">Conversão</SelectItem>
                      <SelectItem value="relacionamento">Relacionamento</SelectItem>
                      <SelectItem value="retencao">Retenção</SelectItem>
                      <SelectItem value="expansao">Expansão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gatilho (evento)</Label>
                  <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="lead.created, cart.abandoned, ..." />
                </div>
              </div>
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Passos da jornada</Label>
                  <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1" />Adicionar passo</Button>
                </div>
                {steps.map((s, i) => (
                  <div key={i} className="border rounded p-2 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge>#{i + 1}</Badge>
                      <Select value={s.kind} onValueChange={(v: any) => updateStep(i, { kind: v })}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wait">Aguardar</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="tag">Tag</SelectItem>
                          <SelectItem value="branch">Branch (cond.)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => removeStep(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    {s.kind === "wait" && (
                      <Input type="number" placeholder="Minutos" value={s.delayMinutes ?? ""} onChange={(e) => updateStep(i, { delayMinutes: Number(e.target.value) })} />
                    )}
                    {(s.kind === "whatsapp" || s.kind === "sms") && (
                      <Textarea placeholder="Mensagem" value={s.body ?? ""} onChange={(e) => updateStep(i, { body: e.target.value })} rows={2} />
                    )}
                    {s.kind === "email" && (
                      <>
                        <Input placeholder="Assunto" value={s.subject ?? ""} onChange={(e) => updateStep(i, { subject: e.target.value })} />
                        <Textarea placeholder="Corpo HTML/texto" value={s.body ?? ""} onChange={(e) => updateStep(i, { body: e.target.value })} rows={3} />
                      </>
                    )}
                    {s.kind === "tag" && (
                      <Input placeholder="Nome da tag" value={s.tag ?? ""} onChange={(e) => updateStep(i, { tag: e.target.value })} />
                    )}
                    {s.kind === "branch" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Campo" value={s.conditionField ?? ""} onChange={(e) => updateStep(i, { conditionField: e.target.value })} />
                        <Input placeholder="Igual a" value={s.conditionEquals ?? ""} onChange={(e) => updateStep(i, { conditionEquals: e.target.value })} />
                      </div>
                    )}
                    {(s.kind === "whatsapp" || s.kind === "email" || s.kind === "sms") && (
                      <div className="flex items-center gap-2 text-xs">
                        <Label className="text-xs">A/B:</Label>
                        <Select value={s.abVariant ?? "A"} onValueChange={(v: any) => updateStep(i, { abVariant: v })}>
                          <SelectTrigger className="w-20 h-7"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem></SelectContent>
                        </Select>
                        <Input type="number" className="w-20 h-7" placeholder="Peso %" value={s.abWeight ?? ""} onChange={(e) => updateStep(i, { abWeight: Number(e.target.value) })} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={mUp.isPending || !name}>Salvar jornada</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="jornadas">
        <TabsList>
          <TabsTrigger value="jornadas"><Workflow className="h-3 w-3 mr-1" />Jornadas</TabsTrigger>
          <TabsTrigger value="segmentos"><Users className="h-3 w-3 mr-1" />Segmentos</TabsTrigger>
          <TabsTrigger value="metricas"><BarChart3 className="h-3 w-3 mr-1" />Métricas funil</TabsTrigger>
        </TabsList>

        <TabsContent value="jornadas">
          <Card>
            <CardHeader><CardTitle>Jornadas configuradas ({auts.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nome</TableHead><TableHead>Etapa</TableHead><TableHead>Gatilho</TableHead>
                  <TableHead>Passos</TableHead><TableHead>Execuções</TableHead><TableHead>Ativa</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {auts.map((a: any) => {
                    const s = stats[a.id] ?? { total: 0, ok: 0, failed: 0 };
                    const stepCount = Array.isArray(a.actions?.steps) ? a.actions.steps.length : 0;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.name}</div>
                          {a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}
                        </TableCell>
                        <TableCell><Badge variant="outline">{a.funnel_stage}</Badge></TableCell>
                        <TableCell className="text-xs"><code>{a.trigger_event}</code></TableCell>
                        <TableCell>{stepCount}</TableCell>
                        <TableCell className="text-xs">{s.total} ({s.ok}✓ / {s.failed}✗)</TableCell>
                        <TableCell><Switch checked={a.is_active} onCheckedChange={(v) => mTg.mutate({ id: a.id, isActive: v })} /></TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => mDel.mutate({ id: a.id })}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {auts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma jornada. Crie a primeira.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segmentos">
          <Card>
            <CardHeader><CardTitle>Avaliar segmento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <SegmentForm onRun={(args) => mSeg.mutate(args)} pending={mSeg.isPending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metricas">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["captacao","conversao","relacionamento","retencao","expansao"] as const).map((k) => (
              <Card key={k}>
                <CardHeader className="pb-2"><CardTitle className="text-sm capitalize">{k}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{(funnel as any)[k]}</div></CardContent>
              </Card>
            ))}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads totais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{funnel.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Oportunidades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{funnel.opportunities}</div></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SegmentForm({ onRun, pending }: { onRun: (a: any) => void; pending: boolean }) {
  const [audience, setAudience] = useState<"leads"|"customers"|"opportunities">("leads");
  const [status, setStatus] = useState("");
  const [funnelStage, setFunnelStage] = useState("");
  const [nicheCode, setNicheCode] = useState("");
  return (
    <>
      <div>
        <Label>Público</Label>
        <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="leads">Leads</SelectItem>
            <SelectItem value="customers">Clientes</SelectItem>
            <SelectItem value="opportunities">Oportunidades</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: novo" /></div>
      <div><Label>Etapa funil</Label><Input value={funnelStage} onChange={(e) => setFunnelStage(e.target.value)} placeholder="captacao..." /></div>
      <div><Label>Niche code</Label><Input value={nicheCode} onChange={(e) => setNicheCode(e.target.value)} placeholder="riomed" /></div>
      <Button onClick={() => onRun({ audience, status: status || undefined, funnelStage: funnelStage || undefined, nicheCode: nicheCode || undefined })} disabled={pending}>
        Calcular tamanho
      </Button>
    </>
  );
}
