import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRiomedAgents, upsertRiomedAgent, deleteRiomedAgent, listRiomedAgentRuns } from "@/lib/riomed-ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Trash2, Plus, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/agentes")({
  component: () => (<TenantModuleShell tenantSlug="rio-med" moduleSlug="agents" title="Agentes Rio Med"><AgentesPage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
});

const STAGES = ["captar", "converter", "relacionar", "reter", "expandir"] as const;
const MODELS = ["core-managed", "openai/gpt-5-mini", "openai/gpt-5", "google/gemini-2.5-flash", "google/gemini-2.5-pro"];
type Form = { id?: string; agent_key: string; name: string; purpose: string; funnel_stage: (typeof STAGES)[number]; model: string; system_prompt: string; is_active: boolean };
const empty: Form = { agent_key: "", name: "", purpose: "", funnel_stage: "captar", model: "core-managed", system_prompt: "Você é uma instância especializada do Impulsionito para a operação Rio Med. Responda apenas dentro do escopo e das políticas cadastradas.", is_active: true };

function AgentesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRiomedAgents);
  const upsertFn = useServerFn(upsertRiomedAgent);
  const delFn = useServerFn(deleteRiomedAgent);
  const runsFn = useServerFn(listRiomedAgentRuns);
  const agents = useQuery({ queryKey: ["rm-agents"], queryFn: () => listFn() });
  const runs = useQuery({ queryKey: ["rm-agent-runs"], queryFn: () => runsFn({ data: {} }) });
  const [form, setForm] = useState<Form>(empty);

  const save = useMutation({
    mutationFn: (d: Form) => upsertFn({ data: d }),
    onSuccess: (r: any) => {
      toast.success(r.executionReady ? "Agente salvo e pronto para execução" : "Agente salvo no Core; execução aguarda homologação do canal");
      setForm(empty); qc.invalidateQueries({ queryKey: ["rm-agents"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Agente desativado com histórico preservado"); qc.invalidateQueries({ queryKey: ["rm-agents"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="flex items-center gap-3"><Bot className="h-7 w-7 text-primary" /><div><h1 className="text-2xl font-bold">Agentes — Rio Med</h1><p className="text-muted-foreground text-sm">Instâncias especializadas do Impulsionito, com configuração e isolamento no Core.</p></div></div>
    <Card className="border-primary/20"><CardContent className="pt-6 flex gap-3 text-sm"><ShieldCheck className="h-5 w-5 text-primary shrink-0" /><div><strong>Execução segura:</strong> esta tela configura as instâncias e suas políticas. O teste de resposta só será liberado após a rota universal de inferência e o respectivo canal estarem homologados. Nenhuma resposta é simulada e não há dependência do gateway Lovable.</div></CardContent></Card>

    <Card><CardHeader><CardTitle>{form.id ? "Editar instância" : "Nova instância"}</CardTitle></CardHeader><CardContent className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3"><div><Label>Chave da instância</Label><Input value={form.agent_key} onChange={e => setForm({ ...form, agent_key: e.target.value })} placeholder="qualificador-whatsapp" /></div><div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Defina o nome da instância" /></div></div>
      <div><Label>Propósito</Label><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Ex.: qualificar oportunidades e transferir para o vendedor" /></div>
      <div className="grid md:grid-cols-2 gap-3"><div><Label>Etapa</Label><Select value={form.funnel_stage} onValueChange={(v: any) => setForm({ ...form, funnel_stage: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><Label>Política de modelo</Label><Select value={form.model} onValueChange={v => setForm({ ...form, model: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div></div>
      <div><Label>Prompt especializado</Label><Textarea rows={7} value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })} /></div>
      <div className="flex gap-2"><Button onClick={() => save.mutate(form)} disabled={save.isPending}><Plus className="h-4 w-4 mr-1" />{form.id ? "Atualizar" : "Criar instância"}</Button>{form.id && <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button>}</div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Instâncias cadastradas</CardTitle></CardHeader><CardContent><div className="space-y-2">
      {(agents.data?.agents ?? []).map((a: any) => <div key={a.id} className="flex items-center justify-between gap-4 border rounded p-3"><div><div className="font-medium">{a.name} <Badge variant="outline" className="ml-2">{a.funnel_stage}</Badge> <Badge variant={a.execution_ready ? "default" : "secondary"}>{a.execution_ready ? "execução homologada" : "configurada"}</Badge> {!a.is_active && <Badge variant="secondary">inativa</Badge>}</div><div className="text-xs text-muted-foreground">{a.agent_key} · {a.model} · raiz Impulsionito</div><div className="text-xs">{a.purpose}</div></div><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setForm({ id: a.id, agent_key: String(a.agent_key).replace(/^riomed-/, ""), name: a.name, purpose: a.purpose, funnel_stage: a.funnel_stage, model: a.model, system_prompt: a.system_prompt, is_active: a.is_active })}>Editar</Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Desativar esta instância? O histórico será preservado.")) del.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button></div></div>)}
      {!agents.isLoading && (agents.data?.agents ?? []).length === 0 && <div className="text-sm text-muted-foreground">Nenhuma instância Rio Med foi cadastrada. O sistema não cria nomes ou agentes fictícios automaticamente.</div>}
    </div></CardContent></Card>

    <Card><CardHeader><CardTitle>Conversas / execuções registradas</CardTitle></CardHeader><CardContent><div className="space-y-1 text-sm">{(runs.data?.runs ?? []).slice(0, 20).map((r: any) => <div key={r.id} className="flex justify-between border-b py-1"><span><Badge variant="outline">{r.status}</Badge> {new Date(r.created_at).toLocaleString()}</span><span className="text-muted-foreground">{r.channel ?? "canal não informado"}</span></div>)}{!runs.isLoading && (runs.data?.runs ?? []).length === 0 && <div className="text-muted-foreground">Sem conversas registradas para instâncias Rio Med.</div>}</div></CardContent></Card>
  </div>;
}