import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAffiliatesHealth } from "@/lib/affiliates-cockpit-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeDollarSign, RefreshCw, Link2, Wallet, Percent, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/affiliates-cockpit-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Page() {
  const fn = useServerFn(getAffiliatesHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","affiliates-cockpit",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><BadgeDollarSign className="h-6 w-6 text-primary"/>Afiliados, Produtos & Comissões</h1>
          <p className="text-sm text-muted-foreground">Afiliados, produtos/ofertas, links, vendas, comissões, payouts, cupons, CRM e alertas de carteira.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Afiliados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.affiliates.approved)}/{fmt(data.affiliates.total)}</div><p className="text-xs text-muted-foreground"><span className="text-amber-600">{fmt(data.affiliates.pending)} pend.</span> · {fmt(data.affiliates.lifetime)} lifetime</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4"/>Carteira</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.affiliates.walletBalance)}</div><p className="text-xs text-muted-foreground">pendente {brl(data.affiliates.walletPending)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Produtos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.products.active)}/{fmt(data.products.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.products.allowAffiliate)} aceitam afiliados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ofertas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.offers.active)}/{fmt(data.offers.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4"/>Links</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.links.active)}/{fmt(data.links.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.links.clicks)} cliques · click→sale {data.links.clickToSale.toFixed(2)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">GMV ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.sales.gmv)}</div><p className="text-xs text-muted-foreground">líquido {brl(data.sales.netRevenue)} · fees {brl(data.sales.gatewayFees)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4"/>Refund / CB</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.sales.refundRate.toFixed(1)}%/{data.sales.cbRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">{fmt(data.sales.refunded)} ref. · {fmt(data.sales.chargeback)} cb</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Comissões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.commissions.amountTotal)}</div><p className="text-xs text-muted-foreground">liberado {brl(data.commissions.released)} · pago {brl(data.commissions.paid)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Payouts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.payouts.paid)}/{brl(data.payouts.amountTotal)}</div><p className="text-xs text-muted-foreground">{fmt(data.payouts.pending)} pend. · ciclo {data.payouts.avgHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cupons</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.coupons.active)}/{fmt(data.coupons.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.coupons.used)} usos · {fmt(data.coupons.expired)} expirados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CRM — Conversão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.crm.convRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">{fmt(data.crm.converted)}/{fmt(data.crm.sent)} enviados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Alertas Carteira</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.walletAlerts.total)}</div><p className="text-xs text-muted-foreground"><span className="text-amber-600">{fmt(data.walletAlerts.unread)} não lidos</span></p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Afiliados — Canal Principal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.affiliates.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Afiliados — UF</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.affiliates.byState.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Afiliados — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.affiliates.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Produtos — Nicho</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.products.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Ofertas — Billing</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.offers.byBilling.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Links — Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.links.byKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Vendas — Método</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.sales.byMethod.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vendas — Gateway</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.sales.byProvider.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vendas — Recuperação</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.sales.byRecovery.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Top Afiliados por GMV ({data.days}d)</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Afiliado</th><th className="text-right">Vendas</th><th className="text-right">GMV</th><th className="text-right">Comissão</th></tr></thead>
          <tbody>
            {data.sales.topAffiliates.map((r)=>(<tr key={r.id} className="border-t"><td className="py-1 font-mono text-xs">{r.id}…</td><td className="text-right">{fmt(r.count)}</td><td className="text-right">{brl(r.gmv)}</td><td className="text-right">{brl(r.commission)}</td></tr>))}
          </tbody>
        </table>
      </CardContent></Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Comissões — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.commissions.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Comissões — Recipient</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.commissions.byRecipient.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Payouts — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.payouts.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">CRM — Canal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.crm.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">CRM — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.crm.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Alertas — Severidade / Tipo</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm mb-2"><tbody>{data.walletAlerts.bySeverity.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table>
          <table className="w-full text-sm"><tbody>{data.walletAlerts.byKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
