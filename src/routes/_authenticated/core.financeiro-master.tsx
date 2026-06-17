import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinancialMasterOverview } from "@/lib/governance.functions";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { TrendingUp, Users, AlertTriangle, DollarSign, Receipt, CalendarClock, Sparkles } from "lucide-react";

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
function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("pt-BR");
}

function FinanceiroMasterPage() {
  const fetcher = useServerFn(getFinancialMasterOverview);
  const { data, isLoading } = useQuery({ queryKey: ["fin-master"], queryFn: () => fetcher() });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (!data) return <Card className="p-6">Sem dados.</Card>;

  const kpis = [
    { label: "MRR real", value: brl(data.mrr), icon: TrendingUp, color: "text-emerald-600" },
    { label: "ARR projetado", value: brl(data.arr), icon: DollarSign, color: "text-emerald-600" },
    { label: "Setup recebido", value: brl(data.setupReceived), icon: Receipt, color: "text-emerald-600" },
    { label: "Receita 90d", value: brl(data.revenueLast90), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Clientes reais", value: String(data.activeClients), icon: Users, color: "text-primary" },
    { label: "Inadimplência", value: brl(data.overdueAmount), icon: AlertTriangle, color: "text-destructive" },
    { label: "Suspensos", value: String(data.suspendedClients), icon: AlertTriangle, color: "text-amber-600" },
    { label: "MRR demo (vitrine)", value: brl(data.mrrDemo), icon: Sparkles, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h1 className="text-lg font-bold mb-1">Financeiro Master</h1>
        <p className="text-sm text-muted-foreground">
          Receita recorrente, setup, cobranças e inadimplência. Empresas demo aparecem em KPI separado e não entram no MRR real.
        </p>
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Aging de inadimplência
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">1–7 dias</div>
              <div className="font-bold">{brl(data.aging.d1_7)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">8–30 dias</div>
              <div className="font-bold">{brl(data.aging.d8_30)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">30+ dias</div>
              <div className="font-bold">{brl(data.aging.d30plus)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" /> Próximas cobranças (30 dias)
          </h2>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem cobranças no horizonte.</p>
          ) : (
            <ul className="text-sm divide-y">
              {data.upcoming.slice(0, 8).map((u: any) => (
                <li key={u.id} className="py-2 flex items-center justify-between">
                  <span className="truncate">{u.company}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{fmtDate(u.due_date)}</span>
                    <span className="font-mono">{brl(u.amount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Contratos ativos (clientes reais)</h2>
        {data.contractList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contrato ativo de cliente real.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Segmento</th>
                  <th className="text-right p-2">Setup</th>
                  <th className="text-right p-2">Mensalidade</th>
                  <th className="text-left p-2">Setup pago</th>
                  <th className="text-left p-2">Próx. vencto</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.contractList.map((c: any) => {
                  const overdue = c.next_due_date && new Date(c.next_due_date) < new Date();
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="p-2 font-medium">{c.company}</td>
                      <td className="p-2 text-muted-foreground">{c.segment}</td>
                      <td className="p-2 text-right font-mono">{brl(c.setup_amount)}</td>
                      <td className="p-2 text-right font-mono">{brl(c.recurring_amount)}</td>
                      <td className="p-2">
                        {c.setup_paid_at ? (
                          <Badge variant="default">Pago {fmtDate(c.setup_paid_at)}</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </td>
                      <td className="p-2">{fmtDate(c.next_due_date)}</td>
                      <td className="p-2">
                        {overdue ? <Badge variant="destructive">Atrasado</Badge> : <Badge variant="outline">A vencer</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Receita recorrente por segmento (real)</h2>
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
