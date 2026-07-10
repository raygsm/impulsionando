import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getIntegrationsAutomationHealth } from "@/lib/integrations-automation-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Zap,
  MessageSquare,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  ErrorState,
  KeyCountTable,
} from "@/components/impulsionando";
import { formatInt, formatDateTime } from "@/lib/format";

export const Route = createFileRoute(
  "/_authenticated/admin/integrations-automation-health",
)({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Integrações & Automação"
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

function Page() {
  const fn = useServerFn(getIntegrationsAutomationHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "integrations-auto-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando integrações e automações…" />
      </div>
    );
  }
  if (!data) return null;

  const integrationsErrorTone: "critical" | "warning" | "positive" =
    data.integrations.withError > 0
      ? data.integrations.withError >= 5
        ? "critical"
        : "warning"
      : "positive";
  const webhooksTone: "critical" | "warning" | "positive" =
    data.webhooks.failed > 0
      ? data.webhooks.failed >= 10
        ? "critical"
        : "warning"
      : "positive";
  const mpTone: "critical" | "warning" | "positive" =
    data.mercadoPago.invalidSignatures > 0 || data.mercadoPago.errors > 0
      ? "warning"
      : "positive";
  const runtimeTone: "critical" | "warning" | "positive" =
    data.runtime.errors > 0
      ? data.runtime.errors >= 20
        ? "critical"
        : "warning"
      : "positive";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Integrações, Webhooks & Automação"
        description="Integrações conectadas ao Core, webhooks recebidos, Mercado Pago, N8N e eventos de runtime."
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
            icon={<Workflow className="h-4 w-4" aria-hidden="true" />}
            label="Integrações ativas"
            tone={integrationsErrorTone}
            value={
              <>
                {formatInt(data.integrations.active)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.integrations.total)}
                </span>
              </>
            }
            hint={`${formatInt(data.integrations.withError)} com falha`}
          />
          <MetricCard
            label="Webhooks — execuções"
            tone={webhooksTone}
            value={
              <>
                {formatInt(data.webhooks.success)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.webhooks.runs)}
                </span>
              </>
            }
            hint={`${formatInt(data.webhooks.failed)} falhas · ${formatInt(data.webhooks.retried)} reprocessamentos`}
          />
          <MetricCard
            icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
            label="Mercado Pago"
            tone={mpTone}
            value={
              <>
                {formatInt(data.mercadoPago.processed)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.mercadoPago.total)}
                </span>
              </>
            }
            hint={`${formatInt(data.mercadoPago.invalidSignatures)} assinaturas inválidas · ${formatInt(data.mercadoPago.errors)} erros`}
          />
          <MetricCard
            icon={<Zap className="h-4 w-4" aria-hidden="true" />}
            label="N8N — execuções"
            value={
              <>
                {formatInt(data.n8n.success)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.n8n.runs)}
                </span>
              </>
            }
            hint={`${Math.round(data.n8n.avgLatencyMs)}ms médio · ${formatInt(data.n8n.failed)} falhas`}
          />
          <MetricCard
            label="Logs de integração"
            value={
              <>
                {formatInt(data.integrationLogs.success)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.integrationLogs.total)}
                </span>
              </>
            }
            hint={`${Math.round(data.integrationLogs.avgMs)}ms médio`}
          />
          <MetricCard
            label="Eventos processados"
            value={
              <>
                {formatInt(data.webhooks.eventsProcessed)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.webhooks.events)}
                </span>
              </>
            }
            hint={`${formatInt(data.webhooks.eventsReplayed)} reprocessamentos`}
          />
          <MetricCard
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            label="WhatsApp — eventos"
            tone={data.whatsapp.errors > 0 ? "warning" : "default"}
            value={formatInt(data.whatsapp.events)}
            hint={`${formatInt(data.whatsapp.errors)} com falha`}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            label="Erros de runtime"
            tone={runtimeTone}
            value={formatInt(data.runtime.errors)}
            hint={`de ${formatInt(data.runtime.events)} eventos`}
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Integrações — chamadas por origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">
                      Integração
                    </th>
                    <th scope="col" className="text-right py-2 font-medium">
                      Execuções
                    </th>
                    <th scope="col" className="text-right py-2 font-medium">
                      Falhas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.integrationLogs.topIntegrations.map((i, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 break-words">{i.slug}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatInt(i.total)}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums ${
                          i.failed > 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatInt(i.failed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Webhooks — automações mais executadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">
                      Automação
                    </th>
                    <th scope="col" className="text-right py-2 font-medium">
                      Execuções
                    </th>
                    <th scope="col" className="text-right py-2 font-medium">
                      Falhas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.webhooks.topWorkflows.map((w, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 break-words">{w.workflow}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatInt(w.total)}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums ${
                          w.failed > 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatInt(w.failed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              N8N — réguas mais acionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">
                      Régua
                    </th>
                    <th scope="col" className="text-right py-2 font-medium">
                      Execuções
                    </th>
                    <th scope="col" className="text-right py-2 font-medium">
                      Falhas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.n8n.topReguas.map((r, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 break-words">{r.regua}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatInt(r.total)}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums ${
                          r.failed > 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatInt(r.failed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">N8N — canais</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Canal"
              countLabel="Execuções"
              rows={data.n8n.channels.map((c) => ({
                k: c.channel,
                count: c.count,
              }))}
              ariaLabel="Distribuição de execuções N8N por canal"
              emptyTitle="Nenhum canal com execuções nesta janela."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Mercado Pago — tipos de evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Evento"
              countLabel="Total"
              rows={data.mercadoPago.eventTypes.map((m) => ({
                k: m.type,
                count: m.count,
              }))}
              ariaLabel="Distribuição de eventos Mercado Pago"
              emptyTitle="Sem eventos Mercado Pago nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              WhatsApp — status dos eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Status"
              countLabel="Total"
              rows={data.whatsapp.statuses.map((w) => ({
                k: w.status,
                count: w.count,
              }))}
              ariaLabel="Distribuição de status de eventos WhatsApp"
              emptyTitle="Sem eventos WhatsApp nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Runtime — eventos por nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Nível"
              countLabel="Total"
              rows={data.runtime.levels.map((r) => ({
                k: r.level,
                count: r.count,
              }))}
              ariaLabel="Distribuição de eventos de runtime por nível"
              emptyTitle="Sem eventos de runtime nesta janela."
            />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em{" "}
        {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
