import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2, TrendingUp, TrendingDown, Banknote, AlertTriangle } from "lucide-react";
import { fetchFinancialDashboard } from "@/lib/financial-dashboard.functions";

export const Route = createFileRoute("/_authenticated/admin/financeiro-consolidado-v2")({
  head: () => ({ meta: [{ title: "Financeiro Consolidado — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: FinancialDashboardPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function FinancialDashboardPage() {
  const fn = useServerFn(fetchFinancialDashboard);
  const [days, setDays] = useState<number>(30);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["financial-dashboard", days],
    queryFn: () => fn({ data: { days } }),
    staleTime: 60_000,
  });

  const d = data as any;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Financeiro Consolidado"
        description="Receita, MRR/ARR, churn, ticket médio, faturas e repasses — visão unificada do ecossistema."
      />

      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90, 180, 365].map((n) => (
          <Button
            key={n}
            variant={days === n ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(n)}
          >
            {n}d
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}
      {error && (
        <Card className="p-4 text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {(error as Error).message}
        </Card>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Receita bruta"
              value={fmtBRL(d.kpis.grossBRL)}
              hint={`${d.windowDays}d`}
            />
            <KpiCard
              label="Receita líquida"
              value={fmtBRL(d.kpis.netBRL)}
              hint={
                d.kpis.netDeltaPct == null
                  ? "vs período anterior"
                  : `${d.kpis.netDeltaPct >= 0 ? "+" : ""}${d.kpis.netDeltaPct.toFixed(1)}% vs anterior`
              }
              icon={d.kpis.netDeltaPct != null && d.kpis.netDeltaPct < 0 ? TrendingDown : TrendingUp}
            />
            <KpiCard label="Taxa Impulsionando" value={fmtBRL(d.kpis.feeBRL)} hint="capturada na janela" />
            <KpiCard label="Taxa de gateway" value={fmtBRL(d.kpis.gatewayFeeBRL)} hint="custo de processamento" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="MRR" value={fmtBRL(d.kpis.mrrBRL)} hint={`${d.kpis.activeSubscribers} ativos`} />
            <KpiCard label="ARR" value={fmtBRL(d.kpis.arrBRL)} hint="MRR × 12" />
            <KpiCard
              label="Churn (janela)"
              value={`${d.kpis.churnPct.toFixed(2)}%`}
              hint={`${d.kpis.canceledInWindow} cancelados`}
            />
            <KpiCard label="Ticket médio" value={fmtBRL(d.kpis.ticketBRL)} hint="MRR / ativos" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Faturas (Billing)
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Pagas" value={fmtBRL(d.invoices.paidBRL)} tone="ok" />
                <Row label="Em aberto" value={fmtBRL(d.invoices.openBRL)} />
                <Row label="Vencidas" value={fmtBRL(d.invoices.overdueBRL)} tone={d.invoices.overdueBRL > 0 ? "warn" : undefined} />
                <Row label="Total emitido" value={fmtBRL(d.invoices.totalBRL)} />
                <div className="text-xs text-muted-foreground pt-1">{d.invoices.count} fatura(s) na janela</div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Repasses (Payouts)
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Pendentes" value={fmtBRL(d.payouts.pendingBRL)} tone={d.payouts.pendingBRL > 0 ? "warn" : undefined} />
                <Row label="Pagos" value={fmtBRL(d.payouts.paidBRL)} tone="ok" />
                <div className="text-xs text-muted-foreground pt-1">{d.payouts.count} ledger entries na janela</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Por método</h3>
              <BreakdownTable
                rows={d.byMethod.map((r: any) => ({ label: r.method, gross: r.grossBRL, net: r.netBRL, count: r.count }))}
              />
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Por fonte de receita</h3>
              <BreakdownTable
                rows={d.bySource.map((r: any) => ({ label: r.source, gross: r.grossBRL, net: r.netBRL, count: r.count }))}
              />
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top 10 tenants por receita líquida</h3>
            {d.topTenants.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem dados na janela.</div>
            ) : (
              <div className="space-y-1.5">
                {d.topTenants.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                    <span className="truncate">{t.name}</span>
                    <Badge variant="secondary">{fmtBRL(t.netBRL)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Série diária — receita líquida</h3>
            {d.series.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem capturas na janela.</div>
            ) : (
              <MiniBars data={d.series} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  const cls = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${cls}`}>{value}</span>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: Array<{ label: string; gross: number; net: number; count: number }> }) {
  if (rows.length === 0) return <div className="text-sm text-muted-foreground">Sem dados.</div>;
  const sorted = [...rows].sort((a, b) => b.net - a.net);
  return (
    <div className="space-y-1.5 text-sm">
      <div className="grid grid-cols-12 text-xs text-muted-foreground border-b border-border/40 pb-1">
        <div className="col-span-5">Item</div>
        <div className="col-span-2 text-right">Qtd</div>
        <div className="col-span-2 text-right">Bruto</div>
        <div className="col-span-3 text-right">Líquido</div>
      </div>
      {sorted.map((r) => (
        <div key={r.label} className="grid grid-cols-12 items-center">
          <div className="col-span-5 truncate">{r.label}</div>
          <div className="col-span-2 text-right text-muted-foreground">{r.count}</div>
          <div className="col-span-2 text-right">{fmtBRL(r.gross)}</div>
          <div className="col-span-3 text-right font-medium">{fmtBRL(r.net)}</div>
        </div>
      ))}
    </div>
  );
}

function MiniBars({ data }: { data: Array<{ date: string; netBRL: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.netBRL));
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${fmtBRL(d.netBRL)}`}>
          <div
            className="w-full bg-primary/70 rounded-t"
            style={{ height: `${Math.max(2, (d.netBRL / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
