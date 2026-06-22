import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEventsTicketingHealth } from "@/lib/events-ticketing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, RefreshCw, CalendarClock, ScanLine, ArrowLeftRight } from "lucide-react";

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
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Ticket className="h-6 w-6 text-primary"/>Eventos & Ticketing</h1>
          <p className="text-sm text-muted-foreground">Eventos, tipos de ingresso, vendas, transfers e check-ins de portaria.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Eventos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.events.published)}/{fmt(data.events.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.events.upcoming30d)} nos próximos 30d · {fmt(data.events.live)} ao vivo · {fmt(data.events.past)} passados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tipos de Ingresso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.ticketTypes.active)}/{fmt(data.ticketTypes.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.ticketTypes.soldOut)} esgotados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sell-through</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.ticketTypes.sellThroughPct.toFixed(1)}%</div><p className="text-xs text-muted-foreground">{fmt(data.ticketTypes.sold)}/{fmt(data.ticketTypes.capacity)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.tickets.revenue)}</div><p className="text-xs text-muted-foreground">ticket médio {brl(data.tickets.avgPrice)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ingressos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tickets.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.tickets.valid)} válidos · <span className="text-emerald-600">{fmt(data.tickets.used)} utilizados</span> · <span className="text-red-600">{fmt(data.tickets.cancelled)} cancelados</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScanLine className="h-4 w-4"/>Check-ins</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.checkins.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.checkins.uniqueTickets)} ingressos únicos · <span className="text-amber-600">{fmt(data.checkins.duplicates)} duplicados</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowLeftRight className="h-4 w-4"/>Transferências</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.transfers.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.transfers.approved)} ok · <span className="text-amber-600">{fmt(data.transfers.pending)} pend.</span> · <span className="text-red-600">{fmt(data.transfers.rejected)} rej.</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Decisão Transfer</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.transfers.avgDecisionHours.toFixed(1)}h</div><p className="text-xs text-muted-foreground">taxas: {brl(data.transfers.feeCents/100)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Eventos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.events.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Eventos — Top UFs</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.events.byState.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Eventos — Top Cidades</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.events.byCity.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Ingressos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tickets.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Transferências — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.transfers.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Top Eventos por Receita ({data.days}d)</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Evento</th><th className="text-right">Ingressos</th><th className="text-right">Utilizados</th><th className="text-right">Comparecimento</th><th className="text-right">Receita</th></tr></thead>
          <tbody>
            {data.tickets.topEvents.map((r)=>(<tr key={r.id} className="border-t"><td className="py-1">{r.title}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right">{fmt(r.used)}</td><td className="text-right">{r.attendance.toFixed(1)}%</td><td className="text-right">{brl(r.revenue)}</td></tr>))}
          </tbody>
        </table>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Check-ins — Top Portões</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
        {data.checkins.byGate.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
      </tbody></table></CardContent></Card>
    </div>
  );
}
