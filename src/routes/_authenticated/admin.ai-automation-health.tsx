import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAiAutomationHealth } from "@/lib/ai-automation-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, RefreshCw, Workflow, BookOpen, Zap } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/impulsionando";
import { formatInt, formatPct, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/ai-automation-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar IA & Automação"
          description={error.message}
          action={
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function toneOfRate(rate: number): "positive" | "warning" | "critical" {
  return rate >= 95 ? "positive" : rate >= 80 ? "warning" : "critical";
}

function Page() {
  const fn = useServerFn(getAiAutomationHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "ai-auto", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando IA & Automação…" />
      </div>
    );
  }
  if (!data) return null;

  const n8nTone = toneOfRate(data.n8n.successRate);
  const whTone = toneOfRate(data.webhooks.successRate);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="IA & Automação"
        description="Agentes IA, gerações de projeto, biblioteca de prompts, N8N e webhooks do cliente conectado ao Core."
        actions={
          <>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
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
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </Button>
          </>
        }
      />

      <CoreSection title="Indicadores do período">
        <KpiGrid columns={4}>
          <MetricCard
            icon={<Bot className="h-4 w-4" />}
            label="Demandas de agentes"
            value={formatInt(data.agents.demands)}
            hint={`${formatInt(data.agents.done)} concluídas · ${formatInt(data.agents.inProgress)} em andamento`}
          />
          <MetricCard
            label="Outputs gerados"
            value={formatInt(data.agents.outputs)}
            hint={`${formatInt(data.agents.finalOutputs)} finais`}
          />
          <MetricCard
            label="Gerações de projeto"
            value={<>{formatInt(data.generations.provisioned)}<span className="text-sm text-muted-foreground">/{formatInt(data.generations.total)}</span></>}
            hint={`${formatInt(data.generations.failed)} falhas · ${formatInt(data.generations.approved)} aprovadas`}
          />
          <MetricCard
            icon={<BookOpen className="h-4 w-4" />}
            label="Prompt Library"
            value={<>{formatInt(data.library.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.library.total)}</span></>}
            hint={`${formatInt(data.library.usageCount)} usos`}
          />
          <MetricCard
            icon={<Workflow className="h-4 w-4" />}
            label="Execuções N8N"
            value={formatInt(data.n8n.runs)}
            hint={`Latência ${(data.n8n.avgLatencyMs / 1000).toFixed(2)}s`}
          />
          <MetricCard
            label="Sucesso N8N"
            tone={n8nTone}
            value={
              <Badge
                variant={n8nTone === "positive" ? "default" : n8nTone === "warning" ? "secondary" : "destructive"}
                className="text-base tabular-nums"
              >
                {formatPct(data.n8n.successRate, { basis100: true })}
              </Badge>
            }
            hint={`${formatInt(data.n8n.failed)} falhas`}
          />
          <MetricCard
            icon={<Zap className="h-4 w-4" />}
            label="Webhooks"
            value={formatInt(data.webhooks.runs)}
            hint={`${formatInt(data.webhooks.events)} eventos`}
          />
          <MetricCard
            label="Sucesso webhooks"
            tone={whTone}
            value={
              <Badge
                variant={whTone === "positive" ? "default" : whTone === "warning" ? "secondary" : "destructive"}
                className="text-base tabular-nums"
              >
                {formatPct(data.webhooks.successRate, { basis100: true })}
              </Badge>
            }
            hint={`${formatInt(data.webhooks.failed)} falhas`}
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Workflow className="h-4 w-4" aria-hidden="true" />
              Top workflows (N8N)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.n8n.topWorkflows.length === 0 ? (
              <EmptyState
                variant="compact"
                title="Nenhum workflow executado no período"
                description="Assim que o N8N registrar execuções, o ranking será preenchido automaticamente."
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">Workflow</th>
                    <th scope="col" className="text-right font-medium">Runs</th>
                    <th scope="col" className="text-right font-medium">Falhas</th>
                    <th scope="col" className="text-right font-medium">Sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {data.n8n.topWorkflows.map((w, i) => {
                    const t = toneOfRate(w.successRate);
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium text-xs">{w.workflow}</td>
                        <td className="text-right tabular-nums">{formatInt(w.total)}</td>
                        <td className={`text-right tabular-nums ${w.failed > 0 ? "text-destructive" : ""}`}>{formatInt(w.failed)}</td>
                        <td className="text-right">
                          <Badge
                            variant={t === "positive" ? "default" : t === "warning" ? "secondary" : "destructive"}
                            className="tabular-nums"
                          >
                            {formatPct(w.successRate, { basis100: true })}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top réguas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.n8n.topReguas.length === 0 ? (
              <EmptyState
                variant="compact"
                title="Sem réguas ativas no período"
                description="Assim que houver execuções de régua, esta lista será preenchida automaticamente."
              />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.n8n.topReguas.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{r.regua}</td>
                      <td className="text-right tabular-nums">{formatInt(r.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <CoreSection title="Modelos de IA utilizados">
        {data.generations.models.length === 0 ? (
          <EmptyState
            variant="compact"
            title="Nenhum modelo de IA utilizado no período"
            description="Assim que houver gerações, os modelos correspondentes serão listados automaticamente."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.generations.models.map((m) => (
              <div key={m.model} className="p-3 rounded-md bg-muted/30">
                <div className="text-xs text-muted-foreground">{m.model}</div>
                <div className="text-lg font-bold tabular-nums">{formatInt(m.count)}</div>
              </div>
            ))}
          </div>
        )}
      </CoreSection>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
