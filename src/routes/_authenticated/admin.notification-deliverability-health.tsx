import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getNotificationDeliverabilityHealth } from "@/lib/notification-deliverability-health.functions";
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
  Bell,
  RefreshCw,
  Inbox,
  MessageSquare,
  Mail,
  AlertTriangle,
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
  "/_authenticated/admin/notification-deliverability-health",
)({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Entregabilidade & Notificações"
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

function deliveryTone(rate: number, base: number): MetricTone {
  if (base <= 0) return "default";
  if (rate >= 95) return "positive";
  if (rate >= 80) return "warning";
  return "critical";
}

function healthTone(h?: string | null): MetricTone {
  if (!h) return "default";
  const v = String(h).toLowerCase();
  if (v === "healthy" || v === "ok") return "positive";
  return "critical";
}

function Page() {
  const fn = useServerFn(getNotificationDeliverabilityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "notification-deliverability-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando entregabilidade e notificações…" />
      </div>
    );
  }
  if (!data) return null;

  const deliveryRate = data.attempts.total
    ? (data.attempts.sent / data.attempts.total) * 100
    : 0;
  const readRate = data.notifications.total
    ? (data.notifications.read / data.notifications.total) * 100
    : 0;
  const throttleTone: MetricTone = data.email.throttled ? "critical" : "positive";
  const whatsappTone: MetricTone =
    data.whatsapp.unhealthy > 0 ? "critical" : "positive";
  const supportInboxTone: MetricTone =
    data.supportInbox.errors > 0 ? "warning" : "default";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Notificações & Entregabilidade"
        description="Notificações internas, preferências, tentativas multicanal, throttle de e-mail, supressões e roteamento WhatsApp."
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
            icon={<Bell className="h-4 w-4" aria-hidden="true" />}
            label="Notificações internas"
            value={formatInt(data.notifications.total)}
            hint={`${formatPct(readRate, { basis100: true })} lidas · ${formatInt(data.notifications.uniqueUsers)} pessoas`}
          />
          <MetricCard
            label="Tempo médio até leitura"
            value={
              data.notifications.avgReadMinutes < 60
                ? `${data.notifications.avgReadMinutes.toFixed(0)} min`
                : `${(data.notifications.avgReadMinutes / 60).toFixed(1)}h`
            }
            hint={`${formatInt(data.notifications.unread)} não lidas`}
          />
          <MetricCard
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            label="Tentativas de envio"
            tone={deliveryTone(deliveryRate, data.attempts.total)}
            value={formatInt(data.attempts.total)}
            hint={`${formatPct(deliveryRate, { basis100: true })} entregues · ${formatInt(data.attempts.failed)} falhas`}
          />
          <MetricCard
            label="Chaves de idempotência"
            value={formatInt(data.attempts.idempotencyKeys)}
            hint="Únicas no período"
          />
          <MetricCard
            label="Preferências configuradas"
            value={
              <>
                {formatInt(data.preferences.enabled)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.preferences.total)}
                </span>
              </>
            }
            hint={`${formatInt(data.preferences.uniqueUsers)} pessoas com preferências`}
          />
          <MetricCard
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            label="E-mail — throttle"
            tone={throttleTone}
            value={
              <Badge
                variant={data.email.throttled ? "destructive" : "default"}
                className="text-base tabular-nums"
              >
                {data.email.throttled ? "Ativo" : "Liberado"}
              </Badge>
            }
            hint={`${formatInt(data.email.suppressions)} supressões · ${formatInt(data.email.unsubscribes)} descadastros (${formatInt(data.email.unsubscribesUsed)} aplicados)`}
          />
          <MetricCard
            icon={<Inbox className="h-4 w-4" aria-hidden="true" />}
            label="Caixa de suporte"
            tone={supportInboxTone}
            value={formatInt(data.supportInbox.total)}
            hint={`${formatInt(data.supportInbox.processed)} processadas · ${formatInt(data.supportInbox.withTicket)} viraram ticket · ${formatInt(data.supportInbox.errors)} com falha`}
          />
          <MetricCard
            label="WhatsApp — credenciais"
            tone={whatsappTone}
            value={
              <>
                {formatInt(data.whatsapp.active)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.whatsapp.credentials)}
                </span>
              </>
            }
            hint={`${formatInt(data.whatsapp.verified)} verificadas · ${formatInt(data.whatsapp.unhealthy)} degradadas`}
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Notificações por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Categoria"
              rows={data.notifications.byCategory}
              emptyTitle="Sem notificações internas nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Notificações por severidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Severidade"
              rows={data.notifications.bySeverity}
              emptyTitle="Sem notificações internas nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Retenção — últimas mudanças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              {formatInt(data.retention.changes)} mudanças no período
            </p>
            {data.retention.latest.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma mudança de retenção nesta janela.
              </p>
            ) : (
              <ul className="text-sm space-y-2">
                {data.retention.latest.map((r) => (
                  <li key={r.id} className="border-b pb-2 last:border-0">
                    <div className="text-xs tabular-nums">
                      <strong>{r.prev}d</strong> → <strong>{r.next}d</strong>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.by ?? "—"} · {formatDateTime(r.at)}
                    </div>
                    {r.reason && (
                      <div className="text-xs text-muted-foreground break-words">
                        {r.reason}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tentativas por canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Canal"
              rows={data.attempts.byChannel}
              emptyTitle="Sem tentativas registradas nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tentativas por status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Status"
              rows={data.attempts.byStatus}
              emptyTitle="Sem tentativas registradas nesta janela."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tentativas — principais eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Evento"
              rows={data.attempts.byEvent}
              emptyTitle="Sem eventos registrados nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tentativas — principais nichos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Nicho"
              rows={data.attempts.byNiche}
              emptyTitle="Sem tentativas por nicho nesta janela."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferências por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Canal"
              rows={data.preferences.byChannel}
              emptyTitle="Nenhuma preferência configurada."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Preferências por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Categoria"
              rows={data.preferences.byCategory}
              emptyTitle="Nenhuma preferência configurada."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              E-mail — supressões por motivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.email.state && (
              <p className="text-xs text-muted-foreground mb-2 tabular-nums">
                Lote {formatInt(data.email.state.batch_size ?? 0)} · atraso{" "}
                {formatInt(data.email.state.send_delay_ms ?? 0)}ms · TTL auth{" "}
                {formatInt(data.email.state.auth_email_ttl_minutes ?? 0)}min ·
                TTL transacional{" "}
                {formatInt(
                  data.email.state.transactional_email_ttl_minutes ?? 0,
                )}
                min
                {data.email.state.retry_after_until
                  ? ` · retomar após ${formatDateTime(data.email.state.retry_after_until)}`
                  : ""}
              </p>
            )}
            <KeyCountTable
              keyLabel="Motivo"
              rows={data.email.suppressionByReason}
              emptyTitle="Nenhuma supressão registrada."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Caixa de suporte — por mailbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeyCountTable
              keyLabel="Mailbox"
              rows={data.supportInbox.byMailbox}
              emptyTitle="Sem mensagens de suporte nesta janela."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              WhatsApp — por propósito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2 tabular-nums">
              {formatInt(data.whatsapp.routingActive)}/
              {formatInt(data.whatsapp.routingRules)} regras ativas ·{" "}
              {formatInt(data.whatsapp.fallbackActive)}/
              {formatInt(data.whatsapp.fallbackConfigs)} fallbacks ativos
            </p>
            <KeyCountTable
              keyLabel="Propósito"
              rows={data.whatsapp.byPurpose}
              emptyTitle="Nenhum propósito configurado."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp — credenciais</CardTitle>
        </CardHeader>
        <CardContent>
          {data.whatsapp.list.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhuma credencial WhatsApp cadastrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="text-left py-2 font-medium">
                      Rótulo
                    </th>
                    <th scope="col" className="text-left font-medium">
                      Provedor
                    </th>
                    <th scope="col" className="text-left font-medium">
                      Propósito
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Ativa
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Verificada
                    </th>
                    <th scope="col" className="text-left font-medium">
                      Health
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Última checagem
                    </th>
                    <th scope="col" className="text-right font-medium">
                      Cota dia/mês
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.whatsapp.list.map((r: any) => {
                    const tone = healthTone(r.health);
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 break-words">{r.label}</td>
                        <td className="text-xs break-words">{r.provider}</td>
                        <td className="text-xs break-words">
                          {r.purpose ?? "—"}
                        </td>
                        <td className="text-right">
                          <span className="sr-only">
                            {r.active ? "Sim" : "Não"}
                          </span>
                          <span aria-hidden="true">{r.active ? "✓" : "—"}</span>
                        </td>
                        <td className="text-right">
                          <span className="sr-only">
                            {r.verified ? "Sim" : "Não"}
                          </span>
                          <span aria-hidden="true">
                            {r.verified ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="text-xs">
                          <Badge
                            variant={
                              tone === "critical"
                                ? "destructive"
                                : tone === "positive"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {r.health ?? "—"}
                          </Badge>
                        </td>
                        <td className="text-right text-xs tabular-nums">
                          {r.lastCheck ? formatDateTime(r.lastCheck) : "—"}
                        </td>
                        <td className="text-right text-xs tabular-nums">
                          {formatInt(r.daily ?? 0)} /{" "}
                          {formatInt(r.monthly ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
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
