import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listRiomedN8nWorkflows, upsertRiomedN8nWorkflow, deleteRiomedN8nWorkflow,
  triggerRiomedN8nWorkflow, listRiomedN8nExecutions,
} from "@/lib/riomed-n8n.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Workflow, Play, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/n8n")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='n8n' title='n8n RioMed'><N8nPage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
});

const STAGES = ["captar", "converter", "relacionar", "reter", "expandir"] as const;
const EVENTS = ["lead.criado", "carrinho.abandonado", "cotacao.aprovada", "pedido.criado", "noshow.detectado", "recompra.devida", "manual"];

type Form = {
  id?: string;
  name: string;
  description: string;
  webhook_url: string;
  trigger_event: string;
  funnel_stage: (typeof STAGES)[number] | "";
  is_active: boolean;
};
const empty: Form = { name: "", description: "", webhook_url: "", trigger_event: "manual", funnel_stage: "", is_active: true };

function N8nPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRiomedN8nWorkflows);
  const upsertFn = useServerFn(upsertRiomedN8nWorkflow);
  const delFn = useServerFn(deleteRiomedN8nWorkflow);
  const trigFn = useServerFn(triggerRiomedN8nWorkflow);
  const execFn = useServerFn(listRiomedN8nExecutions);

  const wfs = useQuery({ queryKey: ["rm-wfs"], queryFn: () => listFn() });
  const execs = useQuery({ queryKey: ["rm-execs"], queryFn: () => execFn({ data: {} }), refetchInterval: 8000 });

  const [form, setForm] = useState<Form>(empty);
  const [triggerId, setTriggerId] = useState<string>("");
  const [payload, setPayload] = useState<string>('{\n  "test": true\n}');

  const save = useMutation({
    mutationFn: (d: Form) => upsertFn({ data: { ...d, funnel_stage: d.funnel_stage || undefined } as any }),
    onSuccess: () => { toast.success("Workflow salvo"); setForm(empty); qc.invalidateQueries({ queryKey: ["rm-wfs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["rm-wfs"] }); },
  });
  const trig = useMutation({
    mutationFn: () => {
      let p: any = {};
      try { p = JSON.parse(payload); } catch { throw new Error("Payload JSON inválido"); }
      return trigFn({ data: { workflowId: triggerId, payload: p } });
    },
    onSuccess: () => { toast.success("Workflow disparado"); qc.invalidateQueries({ queryKey: ["rm-execs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Workflow className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">N8N — Workflows RioMed</h1>
          <p className="text-muted-foreground text-sm">Webhooks externos para recuperação de carrinho, follow-up, no-show e recompra.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{form.id ? "Editar workflow" : "Novo workflow"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Webhook URL</Label><Input value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://n8n.suaempresa.com/webhook/..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Evento</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Etapa</Label>
                <Select value={form.funnel_stage || "none"} onValueChange={v => setForm({ ...form, funnel_stage: (v === "none" ? "" : v) as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Ativo</Label></div>
            <div className="flex gap-2">
              <Button onClick={() => save.mutate(form)} disabled={save.isPending}><Plus className="h-4 w-4 mr-1" />{form.id ? "Atualizar" : "Criar"}</Button>
              {form.id && <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Disparar manualmente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Workflow</Label>
              <Select value={triggerId} onValueChange={setTriggerId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(wfs.data?.workflows ?? []).map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Payload JSON</Label><Textarea rows={6} value={payload} onChange={e => setPayload(e.target.value)} className="font-mono text-xs" /></div>
            <Button onClick={() => trig.mutate()} disabled={!triggerId || trig.isPending}><Play className="h-4 w-4 mr-1" />Disparar</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Workflows</CardTitle></CardHeader>
        <CardContent>
          {wfs.isLoading ? "Carregando…" : (
            <div className="space-y-2">
              {(wfs.data?.workflows ?? []).map((w: any) => (
                <div key={w.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{w.name} <Badge variant="outline" className="ml-2">{w.trigger_event ?? "—"}</Badge>{w.funnel_stage && <Badge variant="outline" className="ml-1">{w.funnel_stage}</Badge>}{!w.is_active && <Badge variant="secondary" className="ml-1">inativo</Badge>}</div>
                    <div className="text-xs text-muted-foreground break-all">{w.webhook_url ?? "sem webhook"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setForm({ id: w.id, name: w.name, description: w.description ?? "", webhook_url: w.webhook_url ?? "", trigger_event: w.trigger_event ?? "manual", funnel_stage: w.funnel_stage ?? "", is_active: w.is_active })}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) del.mutate(w.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {(wfs.data?.workflows ?? []).length === 0 && <div className="text-sm text-muted-foreground">Nenhum workflow.</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Execuções recentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {(execs.data?.executions ?? []).slice(0, 30).map((e: any) => (
              <div key={e.id} className="flex justify-between border-b py-1">
                <span><Badge variant={e.status === "success" ? "default" : e.status === "error" ? "destructive" : "secondary"}>{e.status}</Badge> {new Date(e.created_at).toLocaleString()}</span>
                <span className="text-muted-foreground">{e.duration_ms ?? "—"}ms {e.error_message ? `· ${e.error_message}` : ""}</span>
              </div>
            ))}
            {(execs.data?.executions ?? []).length === 0 && <div className="text-muted-foreground">Sem execuções.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
