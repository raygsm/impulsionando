import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getJobsQueuesReliabilityHealth } from "@/lib/jobs-queues-reliability-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Workflow,
  RefreshCw,
  Clock,
  AlertTriangle,
  ClipboardList,
  Flag,
  Send,
  Activity,
} from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  ErrorState,
  KeyCountTable,
  type MetricTone,
} from "@/components/impulsionando";
import { formatInt, formatPct, formatDateTime } from "@/lib/format";

export const Route = createFileRoute(
  "/_authenticated/admin/jobs-queues-reliability-health",
)({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Jobs, Filas & Confiabilidade"
          description={error.message}
          action={
            <Button
              size="sm"
              onClick={() => {
                reset();
                router.invalidate();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function sec(n: number) {
  return n >= 60 ? `${(n / 60).toFixed(1)} min` : `${n.toFixed(1)}s`;
}

function Page() {
  const fn = useServerFn(getJobsQueuesReliabilityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "jobs-queues-reliability-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando jobs, filas e confiabilidade…" />
      </div>
    );
  }
  if (!data) return null;

  const queueTone: MetricTone =
    data.queue.failed > 0
      ? data.queue.failed >= 10
        ? "critical"
        : "warning"
      : "positive";
  const cronTone: MetricTone =
    data.cron.error > 0
      ? data.cron.error >= 5
        ? "critical"
        : "warning"
      : "positive";
  const reportsTone: MetricTone =
    data.reports.errors > 0 || data.reports.late > 0 ? "warning" : "positive";
  const tasksTone: MetricTone =
    data.tasks.overdue > 0
      ? data.tasks.overdue >= 10
        ? "critical"
        : "warning"
      : "positive";
  const incidentsTone: MetricTone =
    data.incidents.total - data.incidents.resolved > 0 ? "critical" : "positive";
  const retriesTone: MetricTone =
    data.queue.highAttempts > 0
      ? data.queue.highAttempts >= 5
        ? "critical"
        : "warning"
      : "default";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Jobs, Filas & Confiabilidade"
        description="Filas do funil, cron jobs, relatórios, tarefas operacionais, incidentes, SLOs e feature flags."
        actions={
          <>
            <Select
              value={String(days)}
              onValueChange={(v) => setDays(Number(v))}
            >
              <SelectTrigger className="w-32" aria-label="Janela de análise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Atualizar dados"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </>
        }
      />

      <CoreSection
        title="Indicadores do período"
        description={`Janela de ${data.window.days} dias.`}
      >
        <KpiGrid columns={4}>
          <MetricCard
            icon={<Send className="h-4 w-4" aria-hidden="true" />}
            label="Fila do funil"
            tone={queueTone}
            value={formatInt(data.queue.total)}
            hint={`${formatInt(data.queue.sent)} enviados · ${formatInt(data.queue.failed)} falhas · ${formatInt(data.queue.pending)} pendentes`}
          />
          <MetricCard
            icon={<Clock className="h-4 w-4" aria-hidden="true" />}
            label="Latência média"
            tone={retriesTone}
            value={sec(data.queue.avgLatencySeconds)}
            hint={`${formatInt(data.queue.highAttempts)} itens com 3+ tentativas`}
          />
          <MetricCard
            icon={<Activity className="h-4 w-4" aria-hidden="true" />}
            label="Cron jobs — execuções"
            tone={cronTone}
            value={formatInt(data.cron.runs)}
            hint={`${formatInt(data.cron.success)} ok · ${formatInt(data.cron.error)} com falha · ${sec(data.cron.avgDurationSec)} médio`}
          />
          <MetricCard
            label="Relatórios agendados"
            tone={reportsTone}
            value={formatInt(data.reports.runs)}
            hint={`${formatInt(data.reports.sent)} entregues · ${formatInt(data.reports.late)} atrasados · ${formatInt(data.reports.errors)} com falha`}
          />
          <MetricCard
            icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            label="Tarefas operacionais"
            tone={tasksTone}
            value={formatInt(data.tasks.total)}
            hint={`${formatInt(data.tasks.done)} concluídas · ${formatInt(data.tasks.overdue)} atrasadas`}
          />
          <MetricCard
            label="Exports"
            value={formatInt(data.exports.total)}
            hint={`${formatInt(data.exports.rows)} linhas exportadas`}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            label="Incidentes"
            tone={incidentsTone}
            value={formatInt(data.incidents.total)}
            hint={`${formatInt(data.incidents.resolved)} resolvidos · MTTR ${sec(data.incidents.mttrMinutes * 60)}`}
          />
          <MetricCard
            icon={<Flag className="h-4 w-4" aria-hidden="true" />}
            label="Feature flags"
            value={
              <>
                {formatInt(data.flags.active)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.flags.total)}
                </span>
              </>
            }
            hint={`${formatInt(data.flags.overrides)} overrides (${formatInt(data.flags.overridesEnabled)} on / ${formatInt(data.flags.overridesDisabled)} off)`}
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fila — por status</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Status"
              rows={data.queue.byStatus}
              emptyTitle="Não há jobs pendentes nesta fila."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fila — por estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Estágio"
              rows={data.queue.byStage}
              emptyTitle="Sem execuções por estágio nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Fila — principais nichos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Nicho"
              rows={data.queue.byNiche}
              emptyTitle="Sem execuções por nicho nesta janela."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Fila do funil — desempenho por automação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.queue.viewStats.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Não há automações com execução registrada nesta janela.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="text-left py-2 font-medium">
                      Estágio
                    </th>
                    <th scope="col" className="text-left font-medium">
                      Nicho
                    </th>
                    <th scope="col" className="text-left font-medium">
                      Automação
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Total
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Enviados
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Falhas
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Entrega
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Latência
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.queue.viewStats.map((r: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 break-words">{r.stage}</td>
                      <td className="break-words">{r.niche_slug ?? "—"}</td>
                      <td className="text-xs break-words">
                        {r.workflow_name ?? "—"}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatInt(r.total ?? 0)}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatInt(r.sent ?? 0)}
                      </td>
                      <td
                        className={`text-right tabular-nums ${
                          (r.failed ?? 0) > 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatInt(r.failed ?? 0)}
                      </td>
                      <td className="text-right tabular-nums">
                        {r.delivery_rate_pct != null
                          ? formatPct(Number(r.delivery_rate_pct), {
                              basis100: true,
                            })
                          : "—"}
                      </td>
                      <td className="text-right tabular-nums">
                        {r.avg_latency_seconds != null
                          ? sec(Number(r.avg_latency_seconds))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cron — jobs mais executados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2 tabular-nums">
              {formatInt(data.cron.enqueued)} itens enfileirados no total
            </p>
            <KeyCountTable
              keyLabel="Job"
              rows={data.cron.byJob}
              emptyTitle="Nenhum cron job executou nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cron — últimas execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.cron.latest.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma execução recente de cron.
              </p>
            ) : (
              <ul className="text-sm space-y-2">
                {data.cron.latest.map((r) => {
                  const hasError = (r.errors ?? 0) > 0;
                  return (
                    <li key={r.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between gap-2 flex-wrap">
                        <strong className="text-xs break-words">
                          {r.job}
                        </strong>
                        <Badge
                          variant={hasError ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {r.startedAt ? formatDateTime(r.startedAt) : "—"} ·{" "}
                        {formatInt(r.enqueued ?? 0)} itens ·{" "}
                        {formatInt(r.errors ?? 0)} falhas
                      </div>
                      {r.error && (
                        <div className="text-xs text-destructive break-words">
                          {r.error}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Relatórios — por status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2 tabular-nums">
              {formatInt(data.reports.schedulesEnabled)}/
              {formatInt(data.reports.schedules)} agendamentos ativos
            </p>
            <KeyCountTable
              keyLabel="Status"
              rows={data.reports.byStatus}
              emptyTitle="Nenhum relatório executado nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarefas — por status</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Status"
              rows={data.tasks.byStatus}
              emptyTitle="Sem tarefas registradas nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tarefas — por prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Prioridade"
              rows={data.tasks.byPriority}
              emptyTitle="Sem tarefas registradas nesta janela."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exports — por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Tipo"
              rows={data.exports.byKind}
              emptyTitle="Nenhum export gerado nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Feature flags — por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Categoria"
              rows={data.flags.byCategory}
              emptyTitle="Nenhuma flag cadastrada."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Incidentes — severidade e status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  Por severidade
                </h4>
                <KeyCountTable
                  keyLabel="Severidade"
                  rows={data.incidents.bySeverity}
                  emptyTitle="Sem incidentes nesta janela."
                />
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  Por status
                </h4>
                <KeyCountTable
                  keyLabel="Status"
                  rows={data.incidents.byStatus}
                  emptyTitle="Sem incidentes nesta janela."
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incidentes — últimos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.incidents.latest.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum incidente registrado nesta janela.
              </p>
            ) : (
              <ul className="text-sm space-y-2">
                {data.incidents.latest.map((r) => (
                  <li key={r.id} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between gap-2 flex-wrap">
                      <strong className="text-xs break-words">
                        {r.title ?? r.scope}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        {r.severity} · {r.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {r.detectedAt ? formatDateTime(r.detectedAt) : "—"}
                      {r.resolvedAt
                        ? ` → ${formatDateTime(r.resolvedAt)}`
                        : ""}{" "}
                      · {formatInt(r.events ?? 0)} eventos
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            SLO Targets ({formatInt(data.slo.active)}/{formatInt(data.slo.total)}{" "}
            ativos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.slo.targets.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum SLO configurado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="text-left py-2 font-medium">
                      Nome
                    </th>
                    <th scope="col" className="text-left font-medium">
                      Escopo
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Disponibilidade (bps)
                    </th>
                    <th scope="col" className="text-right font-medium">
                      p95 alvo (ms)
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Janela (d)
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Ativo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.slo.targets.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 break-words">{r.name}</td>
                      <td className="text-xs break-words">{r.scope}</td>
                      <td className="text-right tabular-nums">
                        {formatInt(r.availability_target_bps ?? 0)}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatInt(r.latency_p95_target_ms ?? 0)}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatInt(r.window_days ?? 0)}
                      </td>
                      <td className="text-right">
                        <span className="sr-only">
                          {r.active ? "Sim" : "Não"}
                        </span>
                        <span aria-hidden="true">{r.active ? "✓" : "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em{" "}
        {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
