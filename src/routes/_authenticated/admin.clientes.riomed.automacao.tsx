import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getAutomationOverview, listN8nWorkflows, upsertN8nWorkflow, triggerN8nWorkflow, listN8nExecutions,
  listAiAgents, upsertAiAgent, runAiAgent, listAiRuns,
  listFunnelAutomations, upsertFunnelAutomation, listAutomationRuns,
} from "@/lib/riomed-automation.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Workflow, Zap, Play, Activity, GitBranch } from "lucide-react";
import { toast } from "sonner";

const STAGES = ["captar", "converter", "relacionar", "reter", "expandir"];

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/automacao")({
  component: AutomationPage,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

function AutomationPage() {
  const qc = useQueryClient();
  const fns = {
    overview: useServerFn(getAutomationOverview),
    wf: useServerFn(listN8nWorkflows),
    wfSave: useServerFn(upsertN8nWorkflow),
    wfRun: useServerFn(triggerN8nWorkflow),
    wfRuns: useServerFn(listN8nExecutions),
    ag: useServerFn(listAiAgents),
    agSave: useServerFn(upsertAiAgent),
    agRun: useServerFn(runAiAgent),
    agRuns: useServerFn(listAiRuns),
    aut: useServerFn(listFunnelAutomations),
    autSave: useServerFn(upsertFunnelAutomation),
    autRuns: useServerFn(listAutomationRuns),
  };

  const overview = useQuery({ queryKey: ["aut-overview"], queryFn: () => fns.overview() });
  const wf = useQuery({ queryKey: ["aut-wf"], queryFn: () => fns.wf() });
  const wfRuns = useQuery({ queryKey: ["aut-wfruns"], queryFn: () => fns.wfRuns({ data: {} }) });
  const ag = useQuery({ queryKey: ["aut-ag"], queryFn: () => fns.ag() });
  const agRuns = useQuery({ queryKey: ["aut-agruns"], queryFn: () => fns.agRuns({ data: {} }) });
  const aut = useQuery({ queryKey: ["aut-aut"], queryFn: () => fns.aut() });
  const autRuns = useQuery({ queryKey: ["aut-autruns"], queryFn: () => fns.autRuns({ data: {} }) });

  const mut = (key: string, fn: any) => useMutation({
    mutationFn: (v: any) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries(); toast.success("Operação concluída"); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const saveWf = mut("wf", fns.wfSave);
  const runWf = mut("wfrun", fns.wfRun);
  const saveAg = mut("ag", fns.agSave);
  const runAg = mut("agrun", fns.agRun);
  const saveAut = mut("aut", fns.autSave);

  const ov = overview.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Zap className="h-7 w-7" /> Automação RioMed</h1>
        <p className="text-muted-foreground">N8N + Agentes IA + Réguas do funil Impulsionando</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPI title="Workflows" value={`${ov?.workflowsActive ?? 0}/${ov?.workflowsTotal ?? 0}`} icon={<Workflow className="h-4 w-4" />} />
        <KPI title="Agentes IA" value={`${ov?.agentsActive ?? 0}/${ov?.agentsTotal ?? 0}`} icon={<Bot className="h-4 w-4" />} />
        <KPI title="Réguas funil" value={ov?.automationsTotal ?? 0} icon={<GitBranch className="h-4 w-4" />} />
        <KPI title="Execuções 7d" value={ov?.runs7d ?? 0} icon={<Activity className="h-4 w-4" />} />
        <KPI title="Erros 7d" value={ov?.runsError7d ?? 0} tone="danger" icon={<Activity className="h-4 w-4" />} />
        <KPI title="Créditos IA 7d" value={(ov?.aiCredits7d ?? 0).toFixed(2)} icon={<Bot className="h-4 w-4" />} />
      </div>

      {ov && (
        <Card>
          <CardHeader><CardTitle>Réguas por etapa do funil</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {STAGES.map(s => (
                <div key={s} className="p-3 rounded border text-center">
                  <div className="text-xs uppercase text-muted-foreground">{s}</div>
                  <div className="text-2xl font-bold">{ov.automationsByStage?.[s] ?? 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">N8N Workflows</TabsTrigger>
          <TabsTrigger value="agents">Agentes IA</TabsTrigger>
          <TabsTrigger value="funnel">Réguas do funil</TabsTrigger>
          <TabsTrigger value="runs">Execuções</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Workflows N8N</CardTitle>
              <WorkflowDialog onSubmit={(v) => saveWf.mutate(v)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nome</TableHead><TableHead>Etapa</TableHead><TableHead>Trigger</TableHead>
                  <TableHead>Webhook</TableHead><TableHead>Ativo</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {wf.data?.items.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell><Badge variant="outline">{w.funnel_stage}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{w.trigger_event ?? "—"}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{w.webhook_url ?? "—"}</TableCell>
                      <TableCell>{w.is_active ? <Badge>Ativo</Badge> : <Badge variant="outline">Off</Badge>}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => runWf.mutate({ workflowId: w.id, payload: { test: true } })}>
                          <Play className="h-3 w-3 mr-1" /> Disparar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!wf.data?.items.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum workflow</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Agentes IA</CardTitle>
              <AgentDialog onSubmit={(v) => saveAg.mutate(v)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Chave</TableHead><TableHead>Nome</TableHead><TableHead>Etapa</TableHead>
                  <TableHead>Modelo</TableHead><TableHead>Ativo</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ag.data?.items.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.agent_key}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell><Badge variant="outline">{a.funnel_stage}</Badge></TableCell>
                      <TableCell className="text-xs">{a.model}</TableCell>
                      <TableCell>{a.is_active ? <Badge>Ativo</Badge> : <Badge variant="outline">Off</Badge>}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => runAg.mutate({ agentId: a.id, input: "Teste de execução" })}>
                          <Play className="h-3 w-3 mr-1" /> Testar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!ag.data?.items.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum agente</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Réguas do funil</CardTitle>
              <FunnelDialog agents={ag.data?.items ?? []} workflows={wf.data?.items ?? []} onSubmit={(v) => saveAut.mutate(v)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nome</TableHead><TableHead>Etapa</TableHead><TableHead>Trigger</TableHead>
                  <TableHead>Agente</TableHead><TableHead>Workflow</TableHead><TableHead>Prio</TableHead><TableHead>Ativo</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {aut.data?.items.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="outline">{a.funnel_stage}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{a.trigger_event}</TableCell>
                      <TableCell className="text-xs">{a.riomed_ai_agents?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.riomed_n8n_workflows?.name ?? "—"}</TableCell>
                      <TableCell>{a.priority}</TableCell>
                      <TableCell>{a.is_active ? <Badge>On</Badge> : <Badge variant="outline">Off</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {!aut.data?.items.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma régua</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Execuções N8N</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>WF</TableHead><TableHead>Status</TableHead><TableHead>ms</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {wfRuns.data?.items.slice(0, 50).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-xs">{r.riomed_n8n_workflows?.name ?? "—"}</TableCell>
                        <TableCell><StatusBadge s={r.status} /></TableCell>
                        <TableCell className="text-xs">{r.duration_ms ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Execuções IA</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Agente</TableHead><TableHead>Status</TableHead><TableHead>Tokens</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {agRuns.data?.items.slice(0, 50).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-xs">{r.riomed_ai_agents?.name ?? "—"}</TableCell>
                        <TableCell><StatusBadge s={r.status} /></TableCell>
                        <TableCell className="text-xs">{r.tokens_input}/{r.tokens_output}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Execuções de réguas do funil</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Régua</TableHead><TableHead>Etapa</TableHead><TableHead>Trigger</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {autRuns.data?.items.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{r.riomed_funnel_automations?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{r.riomed_funnel_automations?.funnel_stage}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{r.trigger_event}</TableCell>
                      <TableCell><StatusBadge s={r.status} /></TableCell>
                    </TableRow>
                  ))}
                  {!autRuns.data?.items.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem execuções</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ title, value, icon, tone }: { title: string; value: any; icon: React.ReactNode; tone?: "danger" }) {
  const c = tone === "danger" ? "text-destructive" : "";
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        <span className={c}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${c}`}>{value}</div>
    </CardContent></Card>
  );
}

function StatusBadge({ s }: { s: string }) {
  const v = s === "success" ? "default" : s === "error" ? "destructive" : "outline";
  return <Badge variant={v as any}>{s}</Badge>;
}

function WorkflowDialog({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", description: "", webhookUrl: "", triggerEvent: "lead.created", funnelStage: "captar", isActive: true });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Novo workflow</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Workflow N8N</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Webhook URL</Label><Input value={f.webhookUrl} onChange={e => setF({ ...f, webhookUrl: e.target.value })} placeholder="https://n8n.../webhook/..." /></div>
          <div><Label>Trigger event</Label><Input value={f.triggerEvent} onChange={e => setF({ ...f, triggerEvent: e.target.value })} /></div>
          <div><Label>Etapa do funil</Label>
            <Select value={f.funnelStage} onValueChange={v => setF({ ...f, funnelStage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2"><Switch checked={f.isActive} onCheckedChange={v => setF({ ...f, isActive: v })} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter><Button onClick={() => { onSubmit(f); setOpen(false); }}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgentDialog({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ agentKey: "qualifica_lead", name: "Qualificador de Lead", purpose: "Qualificar lead inbound", funnelStage: "captar", model: "google/gemini-3-flash-preview", systemPrompt: "Você é um SDR especialista em qualificar leads do mercado médico-hospitalar.", isActive: true });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Novo agente</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Agente IA RioMed</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Chave</Label><Input value={f.agentKey} onChange={e => setF({ ...f, agentKey: e.target.value })} /></div>
            <div><Label>Nome</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          </div>
          <div><Label>Propósito</Label><Input value={f.purpose} onChange={e => setF({ ...f, purpose: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Etapa do funil</Label>
              <Select value={f.funnelStage} onValueChange={v => setF({ ...f, funnelStage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Modelo</Label><Input value={f.model} onChange={e => setF({ ...f, model: e.target.value })} /></div>
          </div>
          <div><Label>System Prompt</Label><Textarea rows={6} value={f.systemPrompt} onChange={e => setF({ ...f, systemPrompt: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={f.isActive} onCheckedChange={v => setF({ ...f, isActive: v })} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter><Button onClick={() => { onSubmit(f); setOpen(false); }}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FunnelDialog({ onSubmit, agents, workflows }: { onSubmit: (v: any) => void; agents: any[]; workflows: any[] }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", description: "", funnelStage: "captar", triggerEvent: "lead.created", agentId: "", workflowId: "", priority: 100, isActive: true });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Nova régua</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Régua do funil</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Etapa</Label>
              <Select value={f.funnelStage} onValueChange={v => setF({ ...f, funnelStage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Trigger event</Label><Input value={f.triggerEvent} onChange={e => setF({ ...f, triggerEvent: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Agente IA</Label>
              <Select value={f.agentId} onValueChange={v => setF({ ...f, agentId: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Workflow N8N</Label>
              <Select value={f.workflowId} onValueChange={v => setF({ ...f, workflowId: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{workflows.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prioridade</Label><Input type="number" value={f.priority} onChange={e => setF({ ...f, priority: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={f.isActive} onCheckedChange={v => setF({ ...f, isActive: v })} /><Label>Ativa</Label></div>
          </div>
        </div>
        <DialogFooter><Button onClick={() => { onSubmit({ ...f, agentId: f.agentId || null, workflowId: f.workflowId || null }); setOpen(false); }}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
