import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSupportTicketingHealth } from "@/lib/support-ticketing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, RefreshCw, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/support-ticketing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getSupportTicketingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","support",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Headphones className="h-6 w-6 text-primary"/>Support & Ticketing</h1>
          <p className="text-sm text-muted-foreground">Tickets, mensagens, sessões, inbox de e-mail e SLOs.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tickets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tickets.open)}<span className="text-sm text-muted-foreground">/{fmt(data.tickets.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.tickets.resolved)} resolvidos · {fmt(data.tickets.high)} críticos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sem Atribuição</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tickets.unassigned)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">1ª Resposta (média)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tickets.avgFirstResponseMin)}<span className="text-sm text-muted-foreground"> min</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Resolução (média)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.tickets.avgResolutionHours}<span className="text-sm text-muted-foreground"> h</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Mensagens</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.messages.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sessões Suporte</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.sessions.ended)}<span className="text-sm text-muted-foreground">/{fmt(data.sessions.total)}</span></div><p className="text-xs text-muted-foreground">média {fmt(data.sessions.avgDurationMin)} min</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4"/>Inbox E-mail</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.inbox.new)}<span className="text-sm text-muted-foreground">/{fmt(data.inbox.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.inbox.processed)} processados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">SLO Targets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.slo.active)}<span className="text-sm text-muted-foreground">/{fmt(data.slo.total)}</span></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Top Categorias</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.tickets.topCategories.map((r:any)=>(<tr key={r.category} className="border-t"><td className="py-1">{r.category}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Mensagens por Origem</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.messages.bySender.map((r:any)=>(<tr key={r.sender} className="border-t"><td className="py-1">{r.sender}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
