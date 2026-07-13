import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listN8nWorkflows,
  updateN8nWorkflow,
  dispatchN8nEvent,
  listN8nLogs,
  type N8nWorkflow,
} from "@/lib/n8n-workflows.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Workflow, Play, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/integracoes/n8n")({
  head: () => ({
    meta: [
      { title: "Integração n8n — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: N8nAdminPage,
});

const FUNIS: Array<{ key: N8nWorkflow["funil"]; label: string }> = [
  { key: "captacao", label: "Captação" },
  { key: "conversao", label: "Conversão" },
  { key: "relacionamento", label: "Relacionamento" },
];

function N8nAdminPage() {
  const qc = useQueryClient();
  const list = useServerFn(listN8nWorkflows);
  const logsFn = useServerFn(listN8nLogs);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["n8n-workflows"],
    queryFn: () => list(),
  });

  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["n8n-logs"],
    queryFn: () => logsFn({ data: { limit: 30 } }),
  });

  const grouped = FUNIS.map((f) => ({
    ...f,
    items: workflows.filter((w) => w.funil === f.key),
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Workflow className="h-7 w-7" /> Integração n8n
        </h1>
        <p className="text-muted-foreground">
          Conecte cada fluxo do n8n a um evento da jornada Impulsionando. Cole a URL de webhook,
          ative e teste.
        </p>
      </div>

      <Tabs defaultValue="captacao">
        <TabsList>
          {FUNIS.map((f) => (
            <TabsTrigger key={f.key} value={f.key}>
              {f.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {grouped.map((g) => (
          <TabsContent key={g.key} value={g.key} className="space-y-3">
            {isLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Carregando…
                </CardContent>
              </Card>
            ) : (
              g.items.map((wf) => (
                <WorkflowRow
                  key={wf.id}
                  wf={wf}
                  onSaved={() => qc.invalidateQueries({ queryKey: ["n8n-workflows"] })}
                  onTested={() => refetchLogs()}
                />
              ))
            )}
          </TabsContent>
        ))}

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Últimos disparos</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => refetchLogs()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum disparo registrado ainda.</p>
              ) : (
                logs.map((l: any) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between border-b py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono">{l.event_code}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(l.dispatched_at).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant={statusVariant(l.status_code, l.error)}>
                      {l.error ? "erro" : l.status_code ?? "—"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function statusVariant(status: number | null, error: string | null): any {
  if (error) return "destructive";
  if (!status) return "secondary";
  if (status < 300) return "default";
  if (status < 500) return "outline";
  return "destructive";
}

function WorkflowRow({
  wf,
  onSaved,
  onTested,
}: {
  wf: N8nWorkflow;
  onSaved: () => void;
  onTested: () => void;
}) {
  const [url, setUrl] = useState(wf.webhook_url ?? "");
  const [active, setActive] = useState(wf.is_active);
  const update = useServerFn(updateN8nWorkflow);
  const dispatch = useServerFn(dispatchN8nEvent);

  const saveMut = useMutation({
    mutationFn: () =>
      update({ data: { id: wf.id, webhook_url: url, is_active: active } }),
    onSuccess: () => {
      toast.success("Fluxo salvo.");
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const testMut = useMutation({
    mutationFn: () =>
      dispatch({
        data: {
          event_code: wf.event_code,
          payload: { test: true, source: "admin.integracoes.n8n" },
        },
      }),
    onSuccess: (res: any) => {
      if (res?.skipped) toast.warning(`Não disparado: ${res.reason}`);
      else if (res?.error) toast.error(`Erro: ${res.error}`);
      else toast.success(`Disparado — HTTP ${res?.status_code}`);
      onTested();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro no disparo"),
  });

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">{wf.label}</div>
            <div className="text-xs font-mono text-muted-foreground">{wf.event_code}</div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${wf.id}`} className="text-sm">
              Ativo
            </Label>
            <Switch
              id={`active-${wf.id}`}
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL do webhook n8n</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://n8n.impulsionando.com.br/webhook/..."
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Último disparo:{" "}
            {wf.last_dispatched_at
              ? new Date(wf.last_dispatched_at).toLocaleString()
              : "nunca"}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending || !url}
            >
              <Play className="h-3.5 w-3.5 mr-1" /> Testar
            </Button>
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
