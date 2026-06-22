import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEcosystemMarketplaceHealth } from "@/lib/ecosystem-marketplace-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, RefreshCw, Star, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ecosystem-marketplace-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const fn = useServerFn(getEcosystemMarketplaceHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","eco-mp-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Handshake className="h-6 w-6 text-primary"/>Ecosystem Marketplace</h1>
          <p className="text-sm text-muted-foreground">Listings, requests, quotes, engagements (GMV + Taxa de Intermediação Digital), referrals, reviews e documentos legais.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Listings Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.listings.active)}<span className="text-sm text-muted-foreground">/{fmt(data.listings.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.listings.publicCount)} públicos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.requests.total)}</div><p className="text-xs text-muted-foreground">{brl(data.requests.budget)} em budget</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Quotes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.quotes.total)}</div><p className="text-xs text-muted-foreground">{data.quotes.avgPerRequest.toFixed(1)}/request · {Math.round(data.quotes.avgDeliveryDays)}d entrega</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">GMV (Engagements)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.engagements.gmv)}</div><p className="text-xs text-muted-foreground">{brl(data.engagements.completedGmv)} concluído</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Intermediação</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.engagements.intermediationFee)}</div><p className="text-xs text-muted-foreground">{(data.engagements.avgFeeBps / 100).toFixed(2)}% médio</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Engagements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.engagements.completed)}<span className="text-sm text-muted-foreground">/{fmt(data.engagements.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.engagements.inProgress)} em andamento</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Referrals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.referrals.converted)}<span className="text-sm text-muted-foreground">/{fmt(data.referrals.total)}</span></div><p className="text-xs text-muted-foreground">{brl(data.referrals.reward)} em rewards</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4"/>Rating Médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.reviews.ratingAvg.toFixed(1)}</div><p className="text-xs text-muted-foreground">{fmt(data.reviews.total)} reviews · eco {data.reviews.ecoStarsAvg.toFixed(1)} ({fmt(data.reviews.ecoReviews)})</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Listings por Nicho (top 12)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.listings.byNiche.map((l,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{l.niche}</td><td className="text-right">{fmt(l.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-3 text-xs text-muted-foreground">Pricing: {data.listings.pricingModels.map((p)=>`${p.model}: ${fmt(p.count)}`).join(" · ")}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Decomposição de Reviews</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Qualidade</div><div className="font-bold">{data.reviews.qualityAvg.toFixed(1)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Prazo</div><div className="font-bold">{data.reviews.deadlineAvg.toFixed(1)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Comunicação</div><div className="font-bold">{data.reviews.communicationAvg.toFixed(1)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Preço</div><div className="font-bold">{data.reviews.priceAvg.toFixed(1)}</div></div>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Requests por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.requests.statuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-2 text-xs text-muted-foreground">NDA: {fmt(data.requests.ndaRequired)} · Contrato: {fmt(data.requests.contractRequired)}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Quotes por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.quotes.statuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-2 text-xs text-muted-foreground">Total: {brl(data.quotes.amount)}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Engagements por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.engagements.statuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Referrals por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.referrals.statuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><ScrollText className="h-4 w-4"/>Documentos Legais</CardTitle></CardHeader><CardContent>
          <div className="text-xs text-muted-foreground mb-1">Documentos por tipo ({fmt(data.legal.current)}/{fmt(data.legal.documents)} vigentes)</div>
          <table className="w-full text-sm mb-3"><tbody>
            {data.legal.kinds.map((d,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{d.kind}</td><td className="text-right">{fmt(d.count)}</td></tr>))}
          </tbody></table>
          <div className="text-xs text-muted-foreground mb-1">Aceitações no período: {fmt(data.legal.acceptances)}</div>
          <table className="w-full text-sm"><tbody>
            {data.legal.acceptancesByKind.map((a,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{a.kind}</td><td className="text-right">{fmt(a.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
