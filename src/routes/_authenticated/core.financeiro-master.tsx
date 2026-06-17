import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { getFinancialMasterOverview } from "@/lib/governance.functions";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { TrendingUp, Users, AlertTriangle, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/financeiro-master")({
  head: () => ({ meta: [{ title: "Financeiro Master — Core" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: FinanceiroMasterPage,
});

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

function FinanceiroMasterPage() {
  const fetcher = useServerFn(getFinancialMasterOverview);
  const { data, isLoading } = useQuery({ queryKey: ["fin-master"], queryFn: () => fetcher() });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (!data) return <Card className="p-6">Sem dados.</Card>;

  const kpis = [
    { label: "MRR", value: brl(data.mrr), icon: TrendingUp, color: "text-emerald-600" },
    { label: "ARR", value: brl(data.arr), icon: DollarSign, color: "text-emerald-600" },
    { label: "Clientes ativos", value: String(data.activeClients), icon: Users, color: "text-primary" },
    { label: "Suspensos", value: String(data.suspendedClients), icon: AlertTriangle, color: "text-amber-600" },
    { label: "Inadimplência", value: brl(data.overdueAmount), icon: AlertTriangle, color: "text-destructive" },
    { label: "Receita 90d", value: brl(data.revenueLast90), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Churn (suspensos)", value: String(data.churnEstimate), icon: TrendingUp, color: "text-destructive" },
    { label: "LTV estimado", value: brl(data.ltvEstimate), icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h1 className="text-lg font-bold mb-1">Financeiro Master</h1>
        <p className="text-sm text-muted-foreground">Visão gerencial consolidada da plataforma.</p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-xl font-bold mt-1">{k.value}</div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Receita recorrente por segmento</h2>
        {data.revenueBySegment.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem contratos ativos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr><th className="text-left p-2">Segmento</th><th className="text-right p-2">MRR</th></tr>
            </thead>
            <tbody>
              {data.revenueBySegment.map((s: any) => (
                <tr key={s.segment} className="border-t">
                  <td className="p-2">{s.segment}</td>
                  <td className="p-2 text-right font-mono">{brl(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
