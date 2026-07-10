import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getBillingHealth } from "@/lib/billing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  RefreshCw,
  FileText,
  AlertTriangle,
  Banknote,
  ShieldOff,
  Repeat,
  QrCode,
  BadgeDollarSign,
  Layers,
} from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/billing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Billing & Assinaturas"
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

function Tab({ title, rows, unit }: { title: string; rows: { k: string; count: number }[]; unit?: "brl" | "n" }) {
  const f = unit === "brl" ? (n: number) => formatBRL(n) : (n: number) => formatInt(n);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            variant="compact"
            title="Sem dados no período"
            description="Assim que houver registros correspondentes, esta visão será preenchida automaticamente."
          />
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((s, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{s.k}</td>
                  <td className="text-right tabular-nums">{f(s.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function Page() {
  const fn = useServerFn(getBillingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "billing-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando Billing & Assinaturas…" />
      </div>
    );
  }
  if (!data) return null;
  const pl = data.plans, ct = data.contracts, inv = data.invoices, px = data.pix, du = data.dunning, su = data.suspensions, sb = data.subscriptions, mp = data.mpago;

  const payRateTone: "positive" | "warning" | "critical" =
    inv.payRate >= 90 ? "positive" : inv.payRate >= 70 ? "warning" : "critical";
  const churnTone: "positive" | "warning" | "critical" =
    sb.churnRate <= 3 ? "positive" : sb.churnRate <= 7 ? "warning" : "critical";
  const mpApprovalTone: "positive" | "warning" | "critical" =
    mp.approvalRate >= 90 ? "positive" : mp.approvalRate >= 75 ? "warning" : "critical";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Billing & Assinaturas"
        description="Planos, contratos, faturas, PIX, dunning, suspensões, assinaturas e Mercado Pago do cliente conectado ao Core."
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
            icon={<Layers className="h-4 w-4" />}
            label="Planos ativos"
            value={<>{formatInt(pl.active)}<span className="text-sm text-muted-foreground">/{formatInt(pl.total)}</span></>}
            hint="cadastrados"
          />
          <MetricCard
            icon={<FileText className="h-4 w-4" />}
            label="Contratos"
            value={<>{formatInt(ct.active)}<span className="text-sm text-muted-foreground">/{formatInt(ct.total)}</span></>}
            hint={`${formatInt(ct.canceled)} cancelados`}
          />
          <MetricCard
            icon={<Repeat className="h-4 w-4" />}
            label="Assinaturas"
            tone={churnTone}
            value={<>{formatInt(sb.active)}<span className="text-sm text-muted-foreground">/{formatInt(sb.total)}</span></>}
            hint={`Churn ${formatPct(sb.churnRate, { basis100: true })}`}
          />
          <MetricCard
            icon={<Banknote className="h-4 w-4" />}
            label="Faturas pagas"
            tone={payRateTone}
            value={formatBRL(inv.paidBRL)}
            hint={`${formatInt(inv.paidCount)}/${formatInt(inv.total)} · ${formatPct(inv.payRate, { basis100: true })}`}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Em aberto"
            tone="warning"
            value={formatBRL(inv.openBRL)}
            hint={`${formatInt(inv.openCount)} faturas`}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Vencidas"
            tone="critical"
            value={formatBRL(inv.overdueBRL)}
            hint={`${formatInt(inv.overdueCount)} faturas`}
          />
          <MetricCard
            icon={<QrCode className="h-4 w-4" />}
            label="PIX"
            value={formatPct(px.payRate, { basis100: true })}
            hint={`${formatInt(px.paid)}/${formatInt(px.total)} · ${formatBRL(px.paidBRL)}`}
          />
          <MetricCard
            icon={<Repeat className="h-4 w-4" />}
            label="Dunning"
            value={formatInt(du.total)}
            hint="execuções no período"
          />
          <MetricCard
            icon={<ShieldOff className="h-4 w-4" />}
            label="Suspensões"
            tone={su.active > 0 ? "critical" : "default"}
            value={<>{formatInt(su.active)}<span className="text-sm text-muted-foreground">/{formatInt(su.total)}</span></>}
            hint="ativas / total"
          />
          <MetricCard
            icon={<BadgeDollarSign className="h-4 w-4" />}
            label="Mercado Pago"
            tone={mpApprovalTone}
            value={formatPct(mp.approvalRate, { basis100: true })}
            hint={`${formatInt(mp.approved)}/${formatInt(mp.total)} · ${formatBRL(mp.approvedBRL)}`}
          />
          <MetricCard
            icon={<Repeat className="h-4 w-4" />}
            label="Assinat. MP"
            value={<>{formatInt(mp.subActive)}<span className="text-sm text-muted-foreground">/{formatInt(mp.subTotal)}</span></>}
            hint="autorizadas / total"
          />
        </KpiGrid>
      </CoreSection>

      <CoreSection title="Detalhamento">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tab title="Planos por tier" rows={pl.byTier} />
          <Tab title="Planos por intervalo" rows={pl.byInterval} />
          <Tab title="Contratos por status" rows={ct.byStatus} />
          <Tab title="Contratos por plano" rows={ct.byPlan} />
          <Tab title="Faturas por status" rows={inv.byStatus} />
          <Tab title="PIX por status" rows={px.byStatus} />
          <Tab title="Dunning por status" rows={du.byStatus} />
          <Tab title="Dunning por tentativa" rows={du.byAttempt} />
          <Tab title="Suspensões por motivo" rows={su.byReason} />
          <Tab title="Suspensões por status" rows={su.byStatus} />
          <Tab title="Assinaturas por status" rows={sb.byStatus} />
          <Tab title="Assinaturas por plano" rows={sb.byPlan} />
          <Tab title="MP por status" rows={mp.byStatus} />
          <Tab title="MP por método" rows={mp.byMethod} unit="brl" />
          <Tab title="MP Assinaturas por status" rows={mp.subByStatus} />
        </div>
      </CoreSection>
    </div>
  );
}
