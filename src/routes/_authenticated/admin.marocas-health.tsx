import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarocasHealth } from "@/lib/marocas-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, RefreshCw, Wrench, FileCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marocas-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function Page() {
  const fn = useServerFn(getMarocasHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","marocas",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary"/>Marocas Hospitality</h1>
          <p className="text-sm text-muted-foreground">Apartamentos, proprietários, manutenção, suprimentos, profissionais e relatórios.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Apartamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.apartments.available)}<span className="text-sm text-muted-foreground">/{fmt(data.apartments.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.apartments.maintenance)} em manutenção</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Proprietários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.owners.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4"/>Manutenção</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.maintenance.open)}<span className="text-sm text-muted-foreground">/{fmt(data.maintenance.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.maintenance.done)} concluídas · {fmt(data.maintenance.highPriority)} urgentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Orçamentos Aprovados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.maintenance.approvedAmount)}</div><p className="text-xs text-muted-foreground">{fmt(data.maintenance.approvedQuotes)}/{fmt(data.maintenance.quotes)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Extratos Proprietários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.statements.amount)}</div><p className="text-xs text-muted-foreground">{fmt(data.statements.paid)}/{fmt(data.statements.total)} pagos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Profissionais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.professionals.active)}<span className="text-sm text-muted-foreground">/{fmt(data.professionals.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Serviços (Receita)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.services.amount)}</div><p className="text-xs text-muted-foreground">{fmt(data.services.total)} serviços</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Suprimentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.supplies.totalValue)}</div><p className="text-xs text-muted-foreground">{fmt(data.supplies.lowStock)} abaixo do mínimo · {fmt(data.supplies.total)} itens</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCode className="h-4 w-4"/>Relatórios</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.reports.ok)}<span className="text-sm text-muted-foreground">/{fmt(data.reports.runs)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.reports.activeSchedules)}/{fmt(data.reports.schedules)} agendamentos · {fmt(data.reports.fail)} falhas</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Top Edifícios</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><tbody>{data.apartments.topBuildings.map((r:any)=>(<tr key={r.building} className="border-t"><td className="py-1">{r.building}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
      </CardContent></Card>
    </div>
  );
}
