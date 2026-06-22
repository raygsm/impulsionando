import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRiomedAgents, upsertRiomedAgent, deleteRiomedAgent, runRiomedAgent, listRiomedAgentRuns } from "@/lib/riomed-ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Play, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/agentes")({
  component: AgentesPage,
  errorComponent: ErrorComponent,
});

const STAGES = ["captar", "converter", "relacionar", "reter", "expandir"] as const;
const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

type Form = {
  id?: string;
  agent_key: string;
  name: string;
  purpose: string;
  funnel_stage: (typeof STAGES)[number];
  model: string;
  system_prompt: string;
  is_active: boolean;
};

const empty: Form = {
  agent_key: "", name: "", purpose: "",
  funnel_stage: "captar", model: MODELS[0],
  system_prompt: "Você é um agente RioMed. Responda com cordialidade em espanhol paraguaio.",
  is_active: true,
};

function AgentesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRiomedAgents);
  const upsertFn = useServerFn(upsertRiomedAgent);
  const delFn = useServerFn(deleteRiomedAgent);
  const runFn = useServerFn(runRiomedAgent);
  const runsFn = useServerFn(listRiomedAgentRuns);

  const agents = useQuery({ queryKey: ["rm-agents"], queryFn: () => listFn() });
  const runs = useQuery({ queryKey: ["rm-agent-runs"], queryFn: () => runsFn({ data: {} }) });

  const [form, setForm] = useState<Form>(empty);
  const [testMsg, setTestMsg] = useState("Olá, gostaria de cotizar um oxímetro.");
  const [testAgentId, setTestAgentId] = useState<string>("");
  const [reply, setReply] = useState<string>("");

  const save = useMutation({
    mutationFn: (d: Form) => upsertFn({ data: d }),
    onSuccess: () => { toast.success("Agente salvo"); setForm(empty); qc.invalidateQueries({ queryKey: ["rm-agents"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["rm-agents"] }); },
  });
  const run = useMutation({
    mutationFn: () => runFn({ data: { agentId: testAgentId, userMessage: testMsg } }),
    onSuccess: (r: any) => { setReply(r.reply ?? ""); toast.success("Resposta recebida"); qc.invalidateQueries({ queryKey: ["rm-agent-runs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Agentes IA — RioMed</h1>
          <p className="text-muted-foreground text-sm">Configure agentes por etapa do funil. Cada execução é registrada e auditada.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{form.id ? "Editar agente" : "Novo agente"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Chave</Label><Input value={form.agent_key} onChange={e => setForm({ ...form, agent_key: e.target.value })} placeholder="captacao_whatsapp" /></div>
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Qualificador WhatsApp" /></div>
            </div>
            <div><Label>Propósito</Label><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Qualificar lead e direcionar para vendedor" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Etapa</Label>
                <Select value={form.funnel_stage} onValueChange={(v: any) => setForm({ ...form, funnel_stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={form.model} onValueChange={v => setForm({ ...form, model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Prompt do sistema</Label><Textarea rows={6} value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button onClick={() => save.mutate(form)} disabled={save.isPending}><Plus className="h-4 w-4 mr-1" />{form.id ? "Atualizar" : "Criar"}</Button>
              {form.id && <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Testar agente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Agente</Label>
              <Select value={testAgentId} onValueChange={setTestAgentId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(agents.data?.agents ?? []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Mensagem</Label><Textarea rows={3} value={testMsg} onChange={e => setTestMsg(e.target.value)} /></div>
            <Button onClick={() => run.mutate()} disabled={!testAgentId || run.isPending}><Play className="h-4 w-4 mr-1" />Executar</Button>
            {reply && <div className="mt-3 p-3 rounded bg-muted text-sm whitespace-pre-wrap">{reply}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Agentes cadastrados</CardTitle></CardHeader>
        <CardContent>
          {agents.isLoading ? "Carregando…" : (
            <div className="space-y-2">
              {(agents.data?.agents ?? []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{a.name} <Badge variant="outline" className="ml-2">{a.funnel_stage}</Badge> {!a.is_active && <Badge variant="secondary">inativo</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{a.agent_key} · {a.model}</div>
                    <div className="text-xs">{a.purpose}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setForm({ id: a.id, agent_key: a.agent_key, name: a.name, purpose: a.purpose, funnel_stage: a.funnel_stage, model: a.model, system_prompt: a.system_prompt, is_active: a.is_active })}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) del.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {(agents.data?.agents ?? []).length === 0 && <div className="text-sm text-muted-foreground">Nenhum agente.</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimas execuções</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {(runs.data?.runs ?? []).slice(0, 20).map((r: any) => (
              <div key={r.id} className="flex justify-between border-b py-1">
                <span><Badge variant={r.status === "success" ? "default" : r.status === "error" ? "destructive" : "secondary"}>{r.status}</Badge> {new Date(r.created_at).toLocaleString()}</span>
                <span className="text-muted-foreground">{r.tokens_input ?? 0} in / {r.tokens_output ?? 0} out</span>
              </div>
            ))}
            {(runs.data?.runs ?? []).length === 0 && <div className="text-muted-foreground">Sem execuções.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
