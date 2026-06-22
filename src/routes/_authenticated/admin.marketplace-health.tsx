import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarketplaceHealth } from "@/lib/marketplace-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, RefreshCw, Users, BadgeDollarSign, Percent, Link2, ShoppingCart, Star, Handshake, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketplace-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const brlc = (cents: number) => brl(cents / 100);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Tab({ title, rows }: { title: string; rows: { k: string; count: number }[] }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <table className="w-full text-sm"><tbody>
          {rows.map((s, i) => (<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table>
      )}
    </CardContent></Card>
  );
}

function Page() {
  const fn = useServerFn(getMarketplaceHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","marketplace-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const a = data.affiliates, s = data.sales, c = data.commissions, p = data.payouts, l = data.links, pr = data.products;
  const el = data.ecoListings, er = data.ecoRequests, eq = data.ecoQuotes, en = data.ecoEngagements, rv = data.ecoReviews, rf = data.ecoReferrals;
  const mo = data.mpOrders, ms = data.mpSubs, mle = data.mpLedger;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Store className="h-6 w-6 text-primary"/>Marketplace & Afiliados — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Afiliados, vendas, comissões, payouts, marketplace ECO B2B e pedidos MP.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4"/>Afiliados ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.active)}</div><p className="text-xs text-muted-foreground">{fmt(a.pending)} pend · {fmt(a.lifetime)} lifetime</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BadgeDollarSign className="h-4 w-4"/>Vendas líquidas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(s.net)}</div><p className="text-xs text-muted-foreground">{fmt(s.approved)}/{fmt(s.total)} aprov · {pct(s.approvalRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4"/>Comissões pagas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(c.paidValue)}</div><p className="text-xs text-muted-foreground">{brl(c.pendingValue)} pend · {fmt(c.paid)} pgto</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4"/>Links</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(l.convRate)}</div><p className="text-xs text-muted-foreground">{fmt(l.clicks)} clk · {fmt(l.sales)} sales</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4"/>GMV Marketplace</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brlc(en.gmvCents)}</div><p className="text-xs text-muted-foreground">{brlc(en.feeCents)} taxa · {(en.avgFeeBps/100).toFixed(2)}% méd</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Handshake className="h-4 w-4"/>Cotações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(eq.acceptRate)}</div><p className="text-xs text-muted-foreground">{fmt(eq.accepted)}/{fmt(eq.total)} aceitas · {fmt(er.open)} reqs abertas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4"/>Avaliação média</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{rv.avgRating.toFixed(2)}</div><p className="text-xs text-muted-foreground">{fmt(rv.total)} reviews · {fmt(rf.converted)} indic. conv.</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShoppingCart className="h-4 w-4"/>Pedidos MP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brlc(mo.totalCents)}</div><p className="text-xs text-muted-foreground">{pct(mo.completionRate)} concl · {fmt(ms.active)} assin ativas</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Tab title="Afiliados por status" rows={a.byStatus}/>
        <Tab title="Vendas por status" rows={s.byStatus}/>
        <Tab title="Vendas por método" rows={s.byMethod}/>
        <Tab title="Vendas por gateway" rows={s.byProvider}/>
        <Tab title="Comissões por destinatário" rows={c.byKind}/>
        <Tab title="Comissões por status" rows={c.byStatus}/>
        <Tab title="Payouts por status" rows={p.byStatus}/>
        <Tab title="Produtos por nicho" rows={pr.byNiche}/>
        <Tab title="Listings por nicho" rows={el.byNiche}/>
        <Tab title="Requests por nicho" rows={er.byNiche}/>
        <Tab title="Engagements por status" rows={en.byStatus}/>
        <Tab title="MP Orders por status" rows={mo.byStatus}/>
        <Tab title="MP Assinaturas por status" rows={ms.byStatus}/>
      </div>

      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Resumo financeiro consolidado</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground">Wallet saldo</p><p className="font-semibold">{brl(a.walletBalance)}</p></div>
          <div><p className="text-muted-foreground">Wallet pendente</p><p className="font-semibold">{brl(a.walletPending)}</p></div>
          <div><p className="text-muted-foreground">Vendas brutas</p><p className="font-semibold">{brl(s.gross)}</p></div>
          <div><p className="text-muted-foreground">Payouts pagos</p><p className="font-semibold">{brl(p.paidValue)}</p></div>
          <div><p className="text-muted-foreground">MP fee total</p><p className="font-semibold">{brlc(mo.feeCents)}</p></div>
          <div><p className="text-muted-foreground">Ledger GMV</p><p className="font-semibold">{brlc(mle.gmvCents)}</p></div>
          <div><p className="text-muted-foreground">Ledger fees</p><p className="font-semibold">{brlc(mle.feeCents)}</p></div>
          <div><p className="text-muted-foreground">Links revenue</p><p className="font-semibold">{brl(l.revenue)}</p></div>
        </div>
      </CardContent></Card>
    </div>
  );
}
