import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import {
  dispatchN8nEvent,
  getN8nHealth,
  listN8nLogs,
  listN8nWorkflows,
  type N8nWorkflow,
} from "@/lib/n8n-workflows.functions";

export const Route = createFileRoute("/_authenticated/core/integracoes/n8n")({
  head: () => ({ meta: [{ title: "n8n — Operação real" }, { name: "robots", content: "noindex" }] }),
  component: N8nPage,
});

const categoryLabel: Record<string, string> = {
  captacao: "Captação",
  conversao: "Conversão",
  relacionamento: "Relacionamento",
  operational: "Operacional",
  events: "Eventos",
  payments: "Pagamentos",
};

function runtimeVariant(status?: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE" || status === "READY" || status === "SUCCESS") return "default";
  if (status === "ERROR" || status === "FAILED") return "destructive";
  if (!status) return "outline";
  return "secondary";
}

function N8nPage() {
  const list = useServerFn(listN8nWorkflows);
  const health = useServerFn(getN8nHealth);
  const logs = useServerFn(listN8nLogs);
  const dispatch = useServerFn(dispatchN8nEvent);

  const { data: healthData, refetch: refetchHealth, isFetching: healthLoading } = useQuery({
    queryKey: ["n8n-health-real"],
    queryFn: () => health(),
    refetchInterval: 30_000,
  });
  const { data: workflows = [], refetch: refetchWorkflows } = useQuery({
    queryKey: ["n8n-workflows-real"],
    queryFn: () => list(),
  });
  const { data: logRows = [], refetch: refetchLogs } = useQuery({
    queryKey: ["n8n-runs-real"],
    queryFn: () => logs({ data: { limit: 40 } }),
    refetchInterval: 15_000,
  });

  const runTest = useMutation({
    mutationFn: (workflow_slug: string) =>
      dispatch({ data: { workflow_slug, payload: { source: "core_integracoes_n8n" } } }),
    onSuccess: (result: any) => {
      if (result?.skipped) {
        toast.warning(
          result.reason === "no_verified_webhook_path"
            ? "Este workflow está ativo no n8n, mas o caminho de webhook ainda não foi homologado para teste pelo Core."
            : `Teste não executado: ${result.reason}`,
        );
      } else if (result?.ok) {
        toast.success(`Workflow respondeu HTTP ${result.status_code} em ${result.duration_ms} ms.`);
      } else {
        toast.error(`Falha no teste: ${result?.error ?? `HTTP ${result?.status_code ?? 0}`}`);
      }
      refetchLogs();
      refetchWorkflows();
    },
    onError: (error: any) => toast.error(error?.message ?? "Falha ao testar workflow"),
  });

  const grouped = (workflows as N8nWorkflow[]).reduce<Record<string, N8nWorkflow[]>>((acc, workflow) => {
    const category = workflow.category || "outros";
    (acc[category] ??= []).push(workflow);
    return acc;
  }, {});

  const activeCount = (workflows as N8nWorkflow[]).filter(
    (w) => w.registry_status === "ACTIVE" && w.tenant_status === "ACTIVE" && w.n8n_workflow_id,
  ).length;

  return (
    <>
      <PageHeader
        title="n8n — Automação operacional"
        description="Estado real dos workflows executados na VPS da Impulsionando. Nenhum status desta tela é apenas visual."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-5">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Runtime</div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={healthData?.ok ? "default" : "destructive"}>
              {healthData?.ok ? "Online" : "Indisponível"}
            </Badge>
            {healthData?.latency_ms != null && <span className="text-xs">{healthData.latency_ms} ms</span>}
          </div>
          <div className="mt-2 text-xs font-mono break-all">{healthData?.base_url ?? "—"}</div>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => refetchHealth()} disabled={healthLoading}>
            Verificar agora
          </Button>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Workflows registrados</div>
          <div className="text-3xl font-semibold mt-1">{(workflows as N8nWorkflow[]).length}</div>
          <div className="text-xs text-muted-foreground mt-1">Registry do Supabase</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Ativos e vinculados</div>
          <div className="text-3xl font-semibold mt-1">{activeCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Com ID real no n8n</div>
        </Card>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">{categoryLabel[category] ?? category}</div>
                <div className="text-xs text-muted-foreground">{items.length} workflow(s)</div>
              </div>
            </div>
            <div className="divide-y">
              {items.map((workflow) => {
                const webhookPath = typeof workflow.config?.webhook_path === "string" ? workflow.config.webhook_path : "";
                return (
                  <div key={workflow.id} className="py-3 grid gap-3 lg:grid-cols-[1fr_180px_160px_120px] lg:items-center">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{workflow.description || workflow.workflow_slug}</div>
                      <div className="text-xs font-mono text-muted-foreground break-all">{workflow.workflow_slug}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        ID n8n: <span className="font-mono">{workflow.n8n_workflow_id ?? "não vinculado"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={runtimeVariant(workflow.registry_status)}>{workflow.registry_status}</Badge>
                      <Badge variant={runtimeVariant(workflow.tenant_status)}>{workflow.tenant_status ?? "SEM ESTADO"}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.last_execution_at
                        ? `Última execução: ${new Date(workflow.last_execution_at).toLocaleString("pt-BR")}`
                        : "Sem execução registrada"}
                      {workflow.last_error ? <div className="text-destructive mt-1">Há erro registrado</div> : null}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!webhookPath || runTest.isPending || workflow.registry_status !== "ACTIVE"}
                      onClick={() => runTest.mutate(workflow.workflow_slug)}
                      title={!webhookPath ? "Teste será liberado quando o webhook deste fluxo estiver homologado." : undefined}
                    >
                      Testar
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 mt-5">
        <div className="font-semibold mb-3">Execuções registradas no Core</div>
        <div className="divide-y text-xs">
          {(logRows as any[]).map((run) => (
            <div key={run.id} className="py-2 grid gap-2 md:grid-cols-[110px_160px_1fr_110px] md:items-center">
              <Badge variant={runtimeVariant(String(run.status ?? "").toUpperCase())} className="w-fit">
                {run.status ?? "—"}
              </Badge>
              <span className="font-mono truncate">{run.n8n_execution_id ?? "sem execution id"}</span>
              <span className="text-muted-foreground truncate">{run.correlation_id ?? "sem correlation id"}</span>
              <span className="text-right text-muted-foreground">{run.duration_ms != null ? `${run.duration_ms} ms` : "—"}</span>
            </div>
          ))}
          {!(logRows as any[]).length && (
            <div className="py-4 text-muted-foreground">Nenhuma execução sincronizada com o Core ainda.</div>
          )}
        </div>
      </Card>
    </>
  );
}
