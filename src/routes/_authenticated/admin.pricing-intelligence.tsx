import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPricingIntelligence } from "@/lib/pricing-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tag, Percent, TrendingDown, BadgeDollarSign, Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pricing-intelligence")({
  head: () => ({
    meta: [
      { title: "Pricing & Discount Intelligence — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PricingIntelligencePage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function PricingIntelligencePage() {
  const fn = useServerFn(getPricingIntelligence);
  const [days, setDays] = useState(90);
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-intel", days],
    queryFn: () => fn({ data: { days } }),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );

  const { kpis, planPerformance, leaks, couponStats, coproducers } = data;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BadgeDollarSign className="h-6 w-6" /> Pricing & Discount Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Performance de planos, intensidade de descontos, ROI de cupons e revenue leakage.
          </p>
        </div>
        <div className="flex gap-2">
          {[30, 90, 180, 365].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="MRR ativo" value={BRL(kpis.activeMrr)} accent="ok" />
        <Kpi label="Contratos ativos" value={kpis.activeContracts} />
        <Kpi icon={Percent} label="Desconto médio" value={`${kpis.avgDiscountPct}%`} accent={kpis.avgDiscountPct > 15 ? "warn" : undefined} />
        <Kpi label="Abaixo do tabelado" value={kpis.belowListContracts} />
        <Kpi icon={TrendingDown} label="Leakage / mês" value={BRL(kpis.leakageMonthlyEstimate)} accent="warn" />
        <Kpi icon={Tag} label="Cupons ativos" value={kpis.activeCoupons} />
        <Kpi label="Desconto concedido" value={BRL(kpis.totalDiscountGranted)} />
        <Kpi label="ROI cupons" value={`${kpis.couponRoi}x`} accent={kpis.couponRoi >= 5 ? "ok" : kpis.couponRoi < 2 ? "warn" : undefined} />
        <Kpi icon={Users2} label="Coproducers ativos" value={kpis.activeCoproducers} />
        <Kpi label="Custo coproducers/mês" value={BRL(kpis.coproducerCostMonthly)} />
        <Kpi label="% do MRR" value={`${kpis.coproducerCostPctOfMrr}%`} accent={kpis.coproducerCostPctOfMrr > 20 ? "warn" : undefined} />
        <Kpi label="Planos ativos" value={kpis.activePlans} />
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Performance por plano</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-2 pr-3">Plano</th>
                <th className="py-2 pr-3">Preço tabela</th>
                <th className="py-2 pr-3">Contratos</th>
                <th className="py-2 pr-3">MRR</th>
                <th className="py-2 pr-3">Ticket médio</th>
                <th className="py-2 pr-3">Δ vs tabela</th>
                <th className="py-2">Abaixo tabela</th>
              </tr>
            </thead>
            <tbody>
              {planPerformance.map((p) => (
                <tr key={p.planId} className="border-t">
                  <td className="py-2 pr-3 font-medium">{p.name}</td>
                  <td className="py-2 pr-3">{BRL(p.listPrice)}</td>
                  <td className="py-2 pr-3">{p.activeContracts}</td>
                  <td className="py-2 pr-3">{BRL(p.mrr)}</td>
                  <td className="py-2 pr-3">{BRL(p.avgTicket)}</td>
                  <td className={`py-2 pr-3 ${p.discountPct >= 15 ? "text-amber-600" : ""}`}>
                    {p.discountPct > 0 ? `-${p.discountPct}%` : "—"}
                  </td>
                  <td className="py-2">
                    {p.belowListCount > 0 ? <Badge variant="outline">{p.belowListCount}</Badge> : "—"}
                  </td>
                </tr>
              ))}
              {planPerformance.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-medium mb-3">Revenue Leakage (top contratos)</h2>
          {leaks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem leakage detectado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-1 pr-2">Plano</th>
                  <th className="py-1 pr-2">Contratado</th>
                  <th className="py-1 pr-2">Cobrado</th>
                  <th className="py-1">Δ mês</th>
                </tr>
              </thead>
              <tbody>
                {leaks.slice(0, 12).map((l) => (
                  <tr key={l.contractId} className="border-t">
                    <td className="py-1 pr-2">{l.planName}</td>
                    <td className="py-1 pr-2">{BRL(l.contractedPrice)}</td>
                    <td className="py-1 pr-2">{BRL(l.latestInvoiceAmount)}</td>
                    <td className="py-1 text-amber-600">-{BRL(l.leakageMonthly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-medium mb-3">Cupons — ROI e uso</h2>
          {couponStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-1 pr-2">Código</th>
                  <th className="py-1 pr-2">Uso</th>
                  <th className="py-1 pr-2">Receita</th>
                  <th className="py-1 pr-2">Desconto</th>
                  <th className="py-1">ROI</th>
                </tr>
              </thead>
              <tbody>
                {couponStats.slice(0, 12).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-1 pr-2 font-mono text-xs">{c.code}</td>
                    <td className="py-1 pr-2">{c.salesCount}{c.maxUses ? `/${c.maxUses}` : ""}</td>
                    <td className="py-1 pr-2">{BRL(c.grossRevenue)}</td>
                    <td className="py-1 pr-2">{BRL(c.discountGranted)}</td>
                    <td className="py-1">
                      <Badge variant={c.roi >= 5 ? "default" : c.roi < 2 ? "destructive" : "secondary"}>
                        {c.roi}x
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {coproducers.length > 0 && (
        <Card className="p-4">
          <h2 className="font-medium mb-3">Coproducers ativos</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-1 pr-2">Nome</th>
                <th className="py-1 pr-2">Escopo</th>
                <th className="py-1 pr-2">% participação</th>
                <th className="py-1">Valor fixo</th>
              </tr>
            </thead>
            <tbody>
              {coproducers.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-1 pr-2 font-medium">{c.name}</td>
                  <td className="py-1 pr-2">{c.scope}</td>
                  <td className="py-1 pr-2">{c.participationPct}%</td>
                  <td className="py-1">{BRL(c.fixedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, accent,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: "warn" | "ok";
}) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className={`text-xl font-semibold ${accent === "warn" ? "text-amber-600" : accent === "ok" ? "text-emerald-600" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
