import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRealestateHealth } from "@/lib/realestate-cockpit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/realestate-cockpit")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Page() {
  const fn = useServerFn(getRealestateHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","realestate",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Home className="h-6 w-6 text-primary"/>Imobiliária — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Imóveis, interesses, visitas, contratos, financiamentos, blasts e parceiros.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Imóveis ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.properties.active)}<span className="text-sm text-muted-foreground">/{fmt(data.properties.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.properties.sold)} vendidos · {fmt(data.properties.rented)} alugados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Preço médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.properties.avgPrice)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Interesses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.interests.active)}<span className="text-sm text-muted-foreground">/{fmt(data.interests.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visitas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.visits.completed)}<span className="text-sm text-muted-foreground">/{fmt(data.visits.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.visits.canceled)} canceladas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contratos assinados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.signed)}<span className="text-sm text-muted-foreground">/{fmt(data.contracts.total)}</span></div><p className="text-xs text-muted-foreground">GMV {brl(data.contracts.totalGmv)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Financiamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.financings.approved)}<span className="text-sm text-muted-foreground">/{fmt(data.financings.total)}</span></div><p className="text-xs text-muted-foreground">{brl(data.financings.totalAmount)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Blasts enviados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.blasts.sent)}</div><p className="text-xs text-muted-foreground">{fmt(data.blasts.total)} campanhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Proprietários / Corretores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.owners.total)}<span className="text-sm text-muted-foreground"> · {fmt(data.brokers.active)}/{fmt(data.brokers.total)}</span></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Por Transação</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.properties.byTransaction.map((r:any)=>(<tr key={r.kind} className="border-t"><td className="py-1">{r.kind}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Tipos</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.properties.byType.map((r:any)=>(<tr key={r.type} className="border-t"><td className="py-1">{r.type}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Cidades</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.properties.byCity.map((r:any)=>(<tr key={r.city} className="border-t"><td className="py-1">{r.city}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Interesses por Origem</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.interests.bySource.map((r:any)=>(<tr key={r.source} className="border-t"><td className="py-1">{r.source}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Blasts por Canal</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.blasts.byChannel.map((r:any)=>(<tr key={r.channel} className="border-t"><td className="py-1">{r.channel}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
