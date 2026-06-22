import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEventsTicketingHealth } from "@/lib/events-ticketing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/events-ticketing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Page() {
  const fn = useServerFn(getEventsTicketingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","events-tk",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Ticket className="h-6 w-6 text-primary"/>Eventos & Ticketing</h1>
          <p className="text-sm text-muted-foreground">Eventos, tipos de ingresso, vendas, transfers e check-ins.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Eventos próximos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.events.upcoming)}<span className="text-sm text-muted-foreground">/{fmt(data.events.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.events.past)} passados · {fmt(data.events.draft)} rascunho</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ocupação</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.ticketTypes.occupancyPct}<span className="text-sm text-muted-foreground">%</span></div><p className="text-xs text-muted-foreground">{fmt(data.ticketTypes.sold)}/{fmt(data.ticketTypes.capacity)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ingressos pagos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tickets.paid)}<span className="text-sm text-muted-foreground">/{fmt(data.tickets.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.tickets.canceled)} cancelados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.tickets.revenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Transfers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.transfers.done)}<span className="text-sm text-muted-foreground">/{fmt(data.transfers.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.transfers.pending)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Check-ins</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.checkins.total)}</div><p className="text-xs text-muted-foreground">taxa {data.checkins.checkInRatePct}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tipos de ingresso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.ticketTypes.total)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Eventos por Cidade</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.events.byCity.map((r:any)=>(<tr key={r.city} className="border-t"><td className="py-1">{r.city}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Eventos · Check-ins</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.checkins.topEvents.map((r:any)=>(<tr key={r.eventId} className="border-t"><td className="py-1 font-mono text-xs">{String(r.eventId).slice(0,8)}…</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
