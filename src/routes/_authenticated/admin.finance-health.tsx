import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getFinanceHealth } from "@/lib/finance-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, RefreshCw, ArrowUpRight, ArrowDownRight, AlertTriangle, BadgeDollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/finance-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getFinanceHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "finance-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4" /><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" />Finance & Cashflow</h1>
          <p className="text-sm text-muted-foreground">Saldos, fluxo de caixa, recebíveis, pagáveis e comissões.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Saldo Total</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${data.balance.total>=0?"text-emerald-600":"text-destructive"}`}>{brl(data.balance.total)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.balance.accounts)} contas ativas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-600"/>Recebido</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.cashflow.received)}</div>
            <p className="text-xs text-muted-foreground">A receber {brl(data.cashflow.toReceive)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-destructive"/>Pago</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.cashflow.paid)}</div>
            <p className="text-xs text-muted-foreground">A pagar {brl(data.cashflow.toPay)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Resultado Líquido</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${data.cashflow.net>=0?"text-emerald-600":"text-destructive"}`}>{brl(data.cashflow.net)}</div>
            <p className="text-xs text-muted-foreground">Taxas {brl(data.cashflow.fees)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Atrasados (Receber)</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${data.cashflow.overdueIn>0?"text-amber-600":""}`}>{fmt(data.cashflow.overdueIn)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Atrasados (Pagar)</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${data.cashflow.overdueOut>0?"text-destructive":""}`}>{fmt(data.cashflow.overdueOut)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Vencem em 30d</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.cashflow.dueSoonIn)}</div>
            <p className="text-xs text-muted-foreground">vs {brl(data.cashflow.dueSoonOut)} a pagar</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BadgeDollarSign className="h-4 w-4"/>Comissões</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.commissions.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Pendente {brl(data.commissions.pendingAmount)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top Categorias</CardTitle></CardHeader>
          <CardContent><table className="w-full text-sm"><tbody>
            {data.topCategories.map((c,i)=>(<tr key={i} className="border-b last:border-0">
              <td className="py-2 font-medium">{c.name}</td>
              <td className="text-xs"><Badge variant={c.kind==="income"?"default":"secondary"}>{c.kind}</Badge></td>
              <td className="text-right">{fmt(c.count)}</td>
              <td className="text-right font-medium">{brl(c.amount)}</td>
            </tr>))}
          </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Provedores de Pagamento</CardTitle></CardHeader>
          <CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr>
            <th className="text-left py-2">Provedor</th><th className="text-right">Pagamentos</th><th className="text-right">Aprovação</th><th className="text-right">Valor</th>
          </tr></thead><tbody>
            {data.providers.map((p)=>(<tr key={p.provider} className="border-b last:border-0">
              <td className="py-2 font-medium capitalize">{p.provider}</td>
              <td className="text-right">{fmt(p.count)}</td>
              <td className="text-right"><Badge variant={p.approvalRate>=90?"default":p.approvalRate>=70?"secondary":"destructive"}>{pct(p.approvalRate)}</Badge></td>
              <td className="text-right font-medium">{brl(p.amount)}</td>
            </tr>))}
          </tbody></table></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
