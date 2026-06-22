import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAffiliatesHealth } from "@/lib/affiliates-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, RefreshCw, AlertTriangle, Wallet, TrendingUp, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/affiliates-health")({
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

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function rateVariant(r: number, good = 95, ok = 85): "default" | "secondary" | "destructive" {
  if (r >= good) return "default";
  if (r >= ok) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getAffiliatesHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "affiliates-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!data) return null;
  const k = data.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Handshake className="h-6 w-6 text-primary" />
            Affiliates & Co-producer Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde do programa de afiliados — vendas, comissões, payouts, carteiras e conversão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" />GMV Afiliados</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(k.gmv)}</div>
            <p className="text-xs text-muted-foreground">Receita líquida {brl(k.netRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Aprovação</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(k.approvalRate)}</div>
            <Badge variant={rateVariant(k.approvalRate, 90, 75)} className="mt-1">{fmt(k.approvedSales)}/{fmt(k.totalSales)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Chargebacks / Estornos</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.chargebackRate >= 2 ? "text-destructive" : ""}`}>{pct(k.chargebackRate)}</div>
            <p className="text-xs text-muted-foreground">{brl(k.chargebackAmount + k.refundedAmount)} perdidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />Saldo em Carteira</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(k.walletBalanceTotal)}</div>
            <p className="text-xs text-muted-foreground">+ {brl(k.walletPendingTotal)} a liberar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Afiliados Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.activeAffiliates)}<span className="text-sm text-muted-foreground">/{fmt(k.totalAffiliates)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(k.newAffiliates)} novos · {fmt(k.pendingAffiliates)} pend.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Afiliados Inativos</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.inactiveAffiliates > 0 ? "text-amber-600" : ""}`}>{fmt(k.inactiveAffiliates)}</div>
            <p className="text-xs text-muted-foreground">sem movimentação &gt; 7 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Co-producers</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.activeCoproducers)}<span className="text-sm text-muted-foreground">/{fmt(k.totalCoproducers)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(k.lifetimeAffiliates)} lifetime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Alertas Carteira</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.alertsHigh > 0 ? "text-destructive" : ""}`}>{fmt(k.alertsUnread)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.alertsHigh)} críticos · {fmt(k.alertsTotal)} no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Comissões</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr><th className="text-left py-2">Status</th><th className="text-right">Qtd</th><th className="text-right">Valor</th></tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2">Pendentes</td><td className="text-right">{fmt(k.comPending)}</td><td className="text-right">{brl(k.comPendingAmount)}</td></tr>
                <tr className="border-b"><td className="py-2 text-emerald-600">Liberadas</td><td className="text-right">{fmt(k.comReleased)}</td><td className="text-right">{brl(k.comReleasedAmount)}</td></tr>
                <tr className="border-b"><td className="py-2">Pagas</td><td className="text-right">{fmt(k.comPaid)}</td><td className="text-right">{brl(k.comPaidAmount)}</td></tr>
                <tr><td className="py-2 text-muted-foreground">Canceladas</td><td className="text-right">{fmt(k.comCancelled)}</td><td className="text-right">—</td></tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payouts (Saques)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr><th className="text-left py-2">Status</th><th className="text-right">Qtd</th><th className="text-right">Valor</th></tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2">Solicitados</td><td className="text-right">{fmt(k.payReq)}</td><td className="text-right">{brl(k.payReqAmount)}</td></tr>
                <tr className="border-b"><td className="py-2">Aprovados</td><td className="text-right">{fmt(k.payApp)}</td><td className="text-right">—</td></tr>
                <tr className="border-b"><td className="py-2 text-emerald-600">Pagos</td><td className="text-right">{fmt(k.payPaid)}</td><td className="text-right">{brl(k.payPaidAmount)}</td></tr>
                <tr><td className="py-2 text-destructive">Falhos</td><td className="text-right">{fmt(k.payFail)}</td><td className="text-right">—</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">SLA médio: {k.avgPayoutHours.toFixed(1)}h (requested → paid)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top 20 Afiliados por GMV</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Afiliado</th>
                  <th className="text-right">Vendas</th>
                  <th className="text-right">Aprovadas</th>
                  <th className="text-right">Conv.</th>
                  <th className="text-right">GMV</th>
                  <th className="text-right">Comissões</th>
                </tr>
              </thead>
              <tbody>
                {data.topAffiliates.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{a.name}</td>
                    <td className="text-right">{fmt(a.sales)}</td>
                    <td className="text-right text-emerald-600">{fmt(a.approved)}</td>
                    <td className="text-right">{pct(a.conversionRate)}</td>
                    <td className="text-right">{brl(a.gmv)}</td>
                    <td className="text-right">{brl(a.commissions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" />Top 15 Links por Receita</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Slug / Campanha</th>
                  <th className="text-left">Afiliado</th>
                  <th className="text-right">Cliques</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">Vendas</th>
                  <th className="text-right">Conv.</th>
                  <th className="text-right">Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.topLinks.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{l.slug}<div className="text-muted-foreground">{l.campaign ?? "—"}</div></td>
                    <td className="text-xs">{l.affiliate}</td>
                    <td className="text-right">{fmt(l.clicks)}</td>
                    <td className="text-right">{fmt(l.leads)}</td>
                    <td className="text-right">{fmt(l.sales)}</td>
                    <td className="text-right">{pct(l.convRate)}</td>
                    <td className="text-right">{brl(l.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Alertas de Carteira por Tipo</CardTitle></CardHeader>
        <CardContent>
          {data.alertsBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem alertas no período. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {data.alertsBreakdown.map((a) => (
                <li key={a.kind} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <span className="capitalize">{a.kind}</span>
                  <Badge variant="outline">{fmt(a.count)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
