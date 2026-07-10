import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMercadoPagoBillingHealth } from "@/lib/mercadopago-billing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, RefreshCw, Banknote, Receipt } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/mercadopago-billing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Mercado Pago & Billing"
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

function Page() {
  const fn = useServerFn(getMercadoPagoBillingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "mp-bill", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando Mercado Pago & Billing…" />
      </div>
    );
  }
  if (!data) return null;

  const approvalTone: "positive" | "warning" | "critical" =
    data.payments.approvalRate >= 90 ? "positive" : data.payments.approvalRate >= 75 ? "warning" : "critical";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Mercado Pago & Billing"
        description="Credenciais, pagamentos, assinaturas, faturas, dunning, PIX e contratos do cliente conectado ao Core."
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
            label="Credenciais MP"
            value={<>{formatInt(data.credentials.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.credentials.total)}</span></>}
            hint={`${formatInt(data.credentials.production)} em produção`}
          />
          <MetricCard
            icon={<Banknote className="h-4 w-4" />}
            label="Pagamentos MP"
            tone={approvalTone}
            value={formatBRL(data.payments.amount)}
            hint={`${formatInt(data.payments.approved)}/${formatInt(data.payments.total)} aprovados (${formatPct(data.payments.approvalRate, { basis100: true })})`}
          />
          <MetricCard
            label="Refunds"
            value={formatBRL(data.refunds.amount)}
            hint={`${formatInt(data.refunds.total)} estornos`}
          />
          <MetricCard
            label="Assinaturas MP"
            value={<>{formatInt(data.subscriptions.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.subscriptions.total)}</span></>}
            hint={`${formatInt(data.subscriptions.cancelled)} canceladas`}
          />
          <MetricCard
            label="Webhooks MP"
            value={<>{formatInt(data.webhooks.processed)}<span className="text-sm text-muted-foreground">/{formatInt(data.webhooks.total)}</span></>}
            hint="processados / recebidos"
          />
          <MetricCard
            icon={<Receipt className="h-4 w-4" />}
            label="Faturas"
            value={formatBRL(data.invoices.revenue)}
            hint={`${formatInt(data.invoices.paid)} pagas · ${formatInt(data.invoices.open)} abertas · ${formatInt(data.invoices.overdue)} vencidas`}
          />
          <MetricCard
            label="Planos"
            value={<>{formatInt(data.plans.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.plans.total)}</span></>}
          />
          <MetricCard
            label="Dunning ativo"
            tone={data.dunning.failed > 0 ? "warning" : "default"}
            value={formatInt(data.dunning.active)}
            hint={`${formatInt(data.dunning.failed)} falhas · ${formatInt(data.dunning.total)} total`}
          />
          <MetricCard
            label="Suspensões"
            tone={data.suspensions.active > 0 ? "critical" : "default"}
            value={<>{formatInt(data.suspensions.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.suspensions.total)}</span></>}
          />
          <MetricCard
            label="Contratos"
            value={<>{formatInt(data.contracts.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.contracts.total)}</span></>}
          />
          <MetricCard
            icon={<CreditCard className="h-4 w-4" />}
            label="PIX"
            value={formatBRL(data.pix.amount)}
            hint={`${formatInt(data.pix.approved)} aprovados · ${formatInt(data.pix.pending)} pendentes`}
          />
        </KpiGrid>
      </CoreSection>

      <CoreSection title="Provedores de pagamento">
        <Card>
          <CardContent className="pt-6">
            {data.providers.length === 0 ? (
              <EmptyState
                variant="compact"
                title="Nenhum provedor com movimentação no período"
                description="Assim que houver transações, esta tabela será preenchida automaticamente."
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th scope="col" className="py-2 font-medium">Provider</th>
                    <th scope="col" className="text-right font-medium">Total</th>
                    <th scope="col" className="text-right font-medium">OK</th>
                    <th scope="col" className="text-right font-medium">Aprovação</th>
                    <th scope="col" className="text-right font-medium">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providers.map((r: { provider: string; total: number; ok: number; approvalRate: number; amount: number }) => (
                    <tr key={r.provider} className="border-b last:border-0">
                      <td className="py-2">{r.provider}</td>
                      <td className="text-right tabular-nums">{formatInt(r.total)}</td>
                      <td className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatInt(r.ok)}</td>
                      <td className="text-right tabular-nums">{formatPct(r.approvalRate, { basis100: true })}</td>
                      <td className="text-right tabular-nums">{formatBRL(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </CoreSection>

      <CoreSection title="Top eventos de webhook MP">
        <Card>
          <CardContent className="pt-6">
            {data.webhooks.topTypes.length === 0 ? (
              <EmptyState
                variant="compact"
                title="Sem webhooks no período"
                description="Assim que os eventos chegarem, o ranking será preenchido automaticamente."
              />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.webhooks.topTypes.map((r: { type: string; count: number }) => (
                    <tr key={r.type} className="border-b last:border-0">
                      <td className="py-2">{r.type}</td>
                      <td className="text-right tabular-nums">{formatInt(r.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </CoreSection>
    </div>
  );
}
