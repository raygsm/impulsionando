import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarketplaceB2BHealth } from "@/lib/marketplace-b2b-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, RefreshCw, Percent, TrendingUp, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketplace-b2b-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(2)}%`;

function Page() {
  const fn = useServerFn(getMarketplaceB2BHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","mp-b2b",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Store className="h-6 w-6 text-primary"/>Marketplace B2B Ops</h1>
          <p className="text-sm text-muted-foreground">GMV, Taxa de Intermediação Digital, fornecedores, compradores, catálogo.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4"/>GMV</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.gmv.gmv)}</div><p className="text-xs text-muted-foreground">{fmt(data.orders.total)} pedidos · ticket {brl(data.orders.avgTicket)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4"/>Taxa Intermediação</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{brl(data.gmv.intermediationFee)}</div><p className="text-xs text-muted-foreground">{pct(data.gmv.avgFeePct)} média</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Repasse Fornecedores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.gmv.supplierNet)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Completar</CardTitle></CardHeader><CardContent><Badge variant={data.orders.completionRate>=80?"default":data.orders.completionRate>=50?"secondary":"destructive"} className="text-base">{data.orders.completionRate.toFixed(1)}%</Badge><p className="text-xs text-muted-foreground mt-1">{fmt(data.orders.completed)} concluídos · {fmt(data.orders.rejected)} rejeitados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Fornecedores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.suppliers.active)}<span className="text-sm text-muted-foreground">/{fmt(data.suppliers.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Compradores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.buyers.active)}<span className="text-sm text-muted-foreground">/{fmt(data.buyers.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4"/>Catálogo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.catalog.active)}</div><p className={`text-xs ${data.catalog.outOfStock>0?"text-amber-600":"text-muted-foreground"}`}>{fmt(data.catalog.outOfStock)} sem estoque</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assinaturas Ativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.subscriptions.active)}</div><p className="text-xs text-muted-foreground">{fmt(data.subscriptions.canceled)} canceladas · {fmt(data.subscriptions.plans)} planos</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Top Fornecedores por GMV</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr>
          <th className="text-left py-2">Fornecedor</th><th className="text-left">Tipo</th><th className="text-right">Pedidos</th><th className="text-right">Taxa</th><th className="text-right">GMV</th>
        </tr></thead><tbody>
          {data.topSuppliers.map((s,i)=>(<tr key={i} className="border-b last:border-0">
            <td className="py-2 font-medium">{s.name}</td>
            <td className="text-xs capitalize">{s.type}</td>
            <td className="text-right">{fmt(s.orders)}</td>
            <td className="text-right text-emerald-600">{brl(s.fee)}</td>
            <td className="text-right font-medium">{brl(s.gmv)}</td>
          </tr>))}
        </tbody></table></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Políticas de Taxa Ativas</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><tbody>
          {data.fees.map((f,i)=>(<tr key={i} className="border-b last:border-0">
            <td className="py-2 capitalize">{f.scope}</td>
            <td className="text-xs">{f.niche_slug || "—"}</td>
            <td className="text-right font-medium">{pct(Number(f.fee_pct))}</td>
          </tr>))}
          {data.fees.length===0 && <tr><td className="py-2 text-muted-foreground text-center">Sem políticas ativas</td></tr>}
        </tbody></table>
      </CardContent></Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
