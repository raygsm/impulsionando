import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getVendorPerformance } from "@/lib/vendor-performance.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Handshake, Store, TrendingUp, Wallet, Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vendor-performance")({
  head: () => ({
    meta: [
      { title: "Vendor & Partner Performance — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VendorPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const BRLc = (cents: number) => BRL(cents / 100);

function VendorPage() {
  const fn = useServerFn(getVendorPerformance);
  const [days, setDays] = useState(90);
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-performance", days],
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

  const { kpis, topAffiliates, topManagers, topSuppliers } = data;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Handshake className="h-6 w-6" /> Vendor & Partner Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Afiliados, managers e fornecedores do marketplace B2B — GMV, conversão e Taxa de Intermediação Digital.
          </p>
        </div>
        <div className="flex gap-2">
          {[30, 90, 180, 365].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Users2} label="Afiliados" value={`${kpis.activeAffiliates}/${kpis.totalAffiliates}`} />
        <Kpi icon={TrendingUp} label="GMV afiliados" value={BRL(kpis.affGmv)} accent="ok" />
        <Kpi icon={Wallet} label="Carteira pendente" value={BRL(kpis.walletPendingTotal)} accent="warn" />
        <Kpi label="Carteira liberada" value={BRL(kpis.walletBalanceTotal)} />
        <Kpi icon={Store} label="Fornecedores" value={`${kpis.activeSuppliers}/${kpis.totalSuppliers}`} />
        <Kpi label="GMV marketplace" value={BRL(kpis.mpGmv)} accent="ok" />
        <Kpi label="Taxa Intermediação Digital" value={BRL(kpis.mpFeeCollected)} accent="ok" />
        <Kpi label="% efetivo" value={`${kpis.mpEffectiveFeePct}%`} />
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Top afiliados (por GMV)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-2 pr-3">Afiliado</th>
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Vendas</th>
                <th className="py-2 pr-3">Aprovadas</th>
                <th className="py-2 pr-3">Conversão</th>
                <th className="py-2 pr-3">Ticket</th>
                <th className="py-2 pr-3">GMV</th>
                <th className="py-2">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {topAffiliates.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {a.mainChannel}
                    {a.isLifetime && <Badge variant="default" className="ml-1 text-[10px]">lifetime</Badge>}
                  </td>
                  <td className="py-2 pr-3">{a.totalSales}</td>
                  <td className="py-2 pr-3">{a.approvedSales}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={a.conversionRate >= 70 ? "default" : a.conversionRate >= 40 ? "secondary" : "outline"}>
                      {a.conversionRate}%
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">{BRL(a.avgTicket)}</td>
                  <td className="py-2 pr-3 font-medium">{BRL(a.gmv)}</td>
                  <td className="py-2 text-xs">
                    {BRL(a.walletBalance)}
                    {a.walletPending > 0 && <span className="text-amber-600"> +{BRL(a.walletPending)} pend</span>}
                  </td>
                </tr>
              ))}
              {topAffiliates.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Top managers (afiliados sob gestão)</h2>
        {topManagers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum manager com atividade.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-1 pr-2">Manager</th>
                <th className="py-1 pr-2">Afiliados</th>
                <th className="py-1 pr-2">Ativos</th>
                <th className="py-1 pr-2">GMV gerado</th>
                <th className="py-1 pr-2">% comissão</th>
                <th className="py-1">Comissão mgr</th>
              </tr>
            </thead>
            <tbody>
              {topManagers.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="py-1 pr-2">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="py-1 pr-2">{m.affiliatesCount}</td>
                  <td className="py-1 pr-2">{m.activeAffiliates}</td>
                  <td className="py-1 pr-2 font-medium">{BRL(m.gmv)}</td>
                  <td className="py-1 pr-2">{m.commissionPct}%</td>
                  <td className="py-1">{BRL(m.managerCommission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Top fornecedores marketplace B2B</h2>
        {topSuppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem pedidos no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-3">Fornecedor</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Pedidos</th>
                  <th className="py-2 pr-3">Aprovação</th>
                  <th className="py-2 pr-3">Ticket médio</th>
                  <th className="py-2 pr-3">GMV</th>
                  <th className="py-2 pr-3">Taxa Interm.</th>
                  <th className="py-2">Net fornecedor</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliers.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{s.displayName}</td>
                    <td className="py-2 pr-3 text-xs">{s.supplierType}</td>
                    <td className="py-2 pr-3">{s.ordersApproved}/{s.ordersTotal}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={s.approvalRate >= 80 ? "default" : s.approvalRate >= 50 ? "secondary" : "outline"}>
                        {s.approvalRate}%
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{BRLc(s.avgTicketCents)}</td>
                    <td className="py-2 pr-3 font-medium">{BRLc(s.gmvCents)}</td>
                    <td className="py-2 pr-3">{BRLc(s.feeCents)}</td>
                    <td className="py-2">{BRLc(s.netCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
