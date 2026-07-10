import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCommsHealth } from "@/lib/comms-health.functions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  RefreshCw,
  MessageSquare,
  Mail,
  Inbox,
  FileText,
  Bell,
  Webhook,
  ShieldAlert,
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
import { formatInt, formatPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/comms-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Comunicação & Mensageria"
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

function Page() {
  const fn = useServerFn(getCommsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "comms-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando comunicação e mensageria…" />
      </div>
    );
  }
  if (!data) return null;

  const o = data.outbox,
    t = data.templates,
    na = data.notifAttempts,
    nn = data.notifications,
    wa = data.whatsapp,
    em = data.email,
    sp = data.suppressed,
    wo = data.webhooksOut,
    wi = data.webhooksIn;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Comunicação & Mensageria"
        description="Outbox, templates, WhatsApp, e-mail, supressões, notificações internas e webhooks."
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
        description={`Janela de ${data.windowDays} dias.`}
      >
        <KpiGrid columns={4}>
          <MetricCard
            icon={<Inbox className="h-4 w-4" aria-hidden="true" />}
            label="Outbox — taxa de entrega"
            tone={deliveryTone(o.deliveryRate, o.total)}
            value={formatPct(o.deliveryRate, { basis100: true })}
            hint={`${formatInt(o.sent)}/${formatInt(o.total)} · ${formatInt(o.failed)} falhas · ${formatInt(o.pending)} pendentes`}
          />
          <MetricCard
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            label="Templates ativos"
            value={
              <>
                {formatInt(t.active)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(t.total)}
                </span>
              </>
            }
            hint="Multicanal"
          />
          <MetricCard
            icon={<Send className="h-4 w-4" aria-hidden="true" />}
            label="Tentativas de envio"
            tone={deliveryTone(na.successRate, na.total)}
            value={formatPct(na.successRate, { basis100: true })}
            hint={`${formatInt(na.success)}/${formatInt(na.total)} · ${formatInt(na.failed)} falhas`}
          />
          <MetricCard
            icon={<Bell className="h-4 w-4" aria-hidden="true" />}
            label="Notificações internas — leitura"
            value={formatPct(nn.readRate, { basis100: true })}
            hint={`${formatInt(nn.read)}/${formatInt(nn.total)} lidas`}
          />
          <MetricCard
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            label="WhatsApp — taxa de entrega"
            tone={deliveryTone(wa.deliveryRate, wa.total)}
            value={formatPct(wa.deliveryRate, { basis100: true })}
            hint={`${formatInt(wa.delivered)}/${formatInt(wa.total)} · ${formatInt(wa.failed)} falhas`}
          />
          <MetricCard
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            label="E-mail — taxa de envio"
            tone={deliveryTone(em.sentRate, em.total)}
            value={formatPct(em.sentRate, { basis100: true })}
            hint={`${formatInt(em.sent)}/${formatInt(em.total)} · ${formatInt(em.failed)} falhas`}
          />
          <MetricCard
            icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
            label="Supressões"
            tone={sp.total > 0 ? "warning" : "default"}
            value={formatInt(sp.total)}
            hint="Bounces e descadastros"
          />
          <MetricCard
            icon={<Webhook className="h-4 w-4" aria-hidden="true" />}
            label="Webhooks — saída"
            tone={deliveryTone(wo.okRate, wo.total)}
            value={formatPct(wo.okRate, { basis100: true })}
            hint={`${formatInt(wo.ok)}/${formatInt(wo.total)} · ${formatInt(wo.failed)} falhas`}
          />
        </KpiGrid>
      </CoreSection>

      <CoreSection title="Detalhamento por canal e categoria">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Outbox por canal</h3>
            <KeyCountTable
              keyLabel="Canal"
              rows={o.byChannel}
              emptyTitle="Nenhum envio pelo outbox nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Outbox por status</h3>
            <KeyCountTable
              keyLabel="Status"
              rows={o.byStatus}
              emptyTitle="Sem status registrados nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Outbox por evento (top 15)
            </h3>
            <KeyCountTable
              keyLabel="Evento"
              rows={o.byEvent}
              emptyTitle="Sem eventos disparados nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Templates por canal</h3>
            <KeyCountTable
              keyLabel="Canal"
              rows={t.byChannel}
              emptyTitle="Nenhum template cadastrado por canal."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Tentativas por canal
            </h3>
            <KeyCountTable
              keyLabel="Canal"
              rows={na.byChannel}
              emptyTitle="Sem tentativas de envio nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Tentativas por status
            </h3>
            <KeyCountTable
              keyLabel="Status"
              rows={na.byStatus}
              emptyTitle="Sem tentativas registradas nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Tentativas — principais causas de falha
            </h3>
            <KeyCountTable
              keyLabel="Causa"
              rows={na.byReason}
              emptyTitle="Nenhuma falha registrada nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Notificações por categoria
            </h3>
            <KeyCountTable
              keyLabel="Categoria"
              rows={nn.byCategory}
              emptyTitle="Sem notificações internas nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Notificações por severidade
            </h3>
            <KeyCountTable
              keyLabel="Severidade"
              rows={nn.bySeverity}
              emptyTitle="Sem notificações internas nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">WhatsApp por status</h3>
            <KeyCountTable
              keyLabel="Status"
              rows={wa.byStatus}
              emptyTitle="Sem mensagens WhatsApp nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              WhatsApp — principais erros
            </h3>
            <KeyCountTable
              keyLabel="Erro"
              rows={wa.byError}
              emptyTitle="Nenhum erro de WhatsApp nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">E-mail por status</h3>
            <KeyCountTable
              keyLabel="Status"
              rows={em.byStatus}
              emptyTitle="Sem envios de e-mail nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              E-mail por template (top 15)
            </h3>
            <KeyCountTable
              keyLabel="Template"
              rows={em.byTemplate}
              emptyTitle="Nenhum template de e-mail utilizado nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Supressões por motivo
            </h3>
            <KeyCountTable
              keyLabel="Motivo"
              rows={sp.byReason}
              emptyTitle="Nenhuma supressão registrada nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Webhooks — saída por status
            </h3>
            <KeyCountTable
              keyLabel="Status"
              rows={wo.byStatus}
              emptyTitle="Nenhum webhook de saída nesta janela."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Webhooks — saída por automação
            </h3>
            <KeyCountTable
              keyLabel="Automação"
              rows={wo.byWorkflow}
              emptyTitle="Nenhuma automação de saída acionada."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Webhooks — entrada por origem
            </h3>
            <KeyCountTable
              keyLabel="Origem"
              rows={wi.bySource}
              emptyTitle="Nenhum webhook de entrada recebido."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">
              Webhooks — entrada por status
            </h3>
            <KeyCountTable
              keyLabel="Status"
              rows={wi.byStatus}
              emptyTitle="Nenhum webhook de entrada nesta janela."
            />
          </div>
        </div>
      </CoreSection>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.windowDays} dias
      </p>
    </div>
  );
}
