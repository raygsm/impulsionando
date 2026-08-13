import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listN8nWorkflows, listN8nLogs, type N8nWorkflow } from "@/lib/n8n-workflows.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Workflow, RefreshCw, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/integracoes/n8n")({
  head: () => ({
    meta: [
      { title: "Integração n8n — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: N8nAdminPage,
});

const FUNIS = [
  { key: "captacao", label: "Captação" },
  { key: "conversao", label: "Conversão" },
  { key: "relacionamento", label: "Relacionamento" },
];

function N8nAdminPage() {
  const list = useServerFn(listN8nWorkflows);
  const logsFn = useServerFn(listN8nLogs);

  const { data: workflows = [], isLoading, refetch } = useQuery({
    queryKey: ["n8n-workflows-live"],
    queryFn: () => list(),
    refetchInterval: 15000,
  });

  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["n8n-runs-live"],
    queryFn: () => logsFn({ data: { limit: 50 } }),
    refetchInterval: 15000,
  });

  const grouped = FUNIS.map((f) => ({
    ...f,
    items: workflows.filter((w) => w.funil === f.key),
  }));

  const active = workflows.filter((w) => w.registry_status === "ACTIVE" && w.state_status === "ACTIVE").length;
  const verified = workflows.filter((w) => w.webhook_verified).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-7 w-7" /> n8n — Runtime real
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Painel operacional do n8n da Impulsionando. Os dados abaixo vêm do registry e do ledger de execuções do Supabase. Este painel não simula ativação nem aceita URL manual sem validação do runtime.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetch(); refetchLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button asChild variant="outline">
            <a href="https://n8n.impulsionando.com.br" target="_blank" rel="noreferrer">
              Abrir n8n <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric title="Workflows registrados" value={workflows.length} />
        <Metric title="Ativos no Core" value={active} />
        <Metric title="Webhook canônico verificado" value={verified} />
      </div>

      <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/10">
        <CardContent className="py-4 text-sm">
          Alterações de workflow, credencial, ativação e webhook são feitas no runtime n8n e sincronizadas ao backend. Isso evita o erro antigo de um botão alterar apenas o banco e aparentar que o n8n foi modificado.
        </CardContent>
      </Card>

      <Tabs defaultValue="captacao">
        <TabsList className="flex flex-wrap h-auto">
          {FUNIS.map((f) => <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>)}
          <TabsTrigger value="outros">Outros</TabsTrigger>
          <TabsTrigger value="logs">Execuções</TabsTrigger>
        </TabsList>

        {grouped.map((g) => (
          <TabsContent key={g.key} value={g.key} className="space-y-3">
            <WorkflowList items={g.items} isLoading={isLoading} />
          </TabsContent>
        ))}

        <TabsContent value="outros" className="space-y-3">
          <WorkflowList items={workflows.filter((w) => !FUNIS.some((f) => f.key === w.funil))} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ledger único de execuções</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => refetchLogs()}><RefreshCw className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
              ) : logs.map((l: any) => (
                <div key={l.id} className="grid gap-2 border-b py-3 text-sm md:grid-cols-[1fr_120px_170px]">
                  <div>
                    <div className="font-mono text-xs break-all">{l.event_code}</div>
                    <div className="text-xs text-muted-foreground">{l.n8n_execution_id ? `Execução n8n ${l.n8n_execution_id}` : l.correlation_id}</div>
                    {l.error ? <div className="text-xs text-destructive mt-1">{JSON.stringify(l.error).slice(0, 240)}</div> : null}
                  </div>
                  <Badge className="w-fit" variant={l.status === "FAILED" ? "destructive" : l.status === "SUCCEEDED" ? "default" : "secondary"}>{l.status}</Badge>
                  <span className="text-xs text-muted-foreground md:text-right">{new Date(l.finished_at ?? l.started_at ?? l.created_at).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        Diagnóstico geral de integrações: <Link to="/core/integracoes/diagnostico" className="underline">abrir diagnóstico</Link>.
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">{title}</div><div className="text-2xl font-semibold mt-1">{value}</div></CardContent></Card>;
}

function WorkflowList({ items, isLoading }: { items: N8nWorkflow[]; isLoading: boolean }) {
  if (isLoading) return <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando runtime…</CardContent></Card>;
  if (!items.length) return <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum workflow nesta categoria.</CardContent></Card>;
  return <>{items.map((wf) => <WorkflowRow key={wf.id} wf={wf} />)}</>;
}

function WorkflowRow({ wf }: { wf: N8nWorkflow }) {
  const active = wf.registry_status === "ACTIVE" && wf.state_status === "ACTIVE";
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="font-medium">{wf.label}</div>
            <div className="text-xs font-mono text-muted-foreground break-all">{wf.event_code}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant={active ? "default" : "secondary"}>{active ? "Ativo" : wf.state_status ?? wf.registry_status}</Badge>
              <Badge variant="outline">n8n ID: {wf.n8n_workflow_id ?? "não vinculado"}</Badge>
              <Badge variant={wf.webhook_verified ? "default" : "outline"}>{wf.webhook_verified ? "Webhook verificado" : "Webhook não sincronizado"}</Badge>
              {wf.last_run_status ? <Badge variant={wf.last_run_status === "FAILED" ? "destructive" : "outline"}>Última execução: {wf.last_run_status}</Badge> : null}
            </div>
          </div>
          <div className="text-xs text-muted-foreground md:text-right">
            <div>Gatilho: {wf.trigger_type ?? "não informado"}</div>
            <div>{wf.last_execution_at ? `Última atividade: ${new Date(wf.last_execution_at).toLocaleString("pt-BR")}` : "Sem execução registrada"}</div>
            {wf.last_error ? <div className="mt-1 max-w-md text-destructive">{JSON.stringify(wf.last_error).slice(0, 220)}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
