import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAgendaOperationsHealth } from "@/lib/agenda-operations-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, RefreshCw, CheckCircle2, XCircle, UserX, Clock, Inbox, Send, Banknote, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/agenda-operations-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
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
  const fn = useServerFn(getAgendaOperationsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","agenda-operations",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const a = data.appointments, s = data.openSlots, w = data.waitlist, o = data.slotOffers, p = data.penalties, n = data.noShow;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CalendarClock className="h-6 w-6 text-primary"/>Agenda — Operações</h1>
          <p className="text-sm text-muted-foreground">Atendimentos, vagas abertas, lista de espera, ofertas de horário, penalidades e no-show.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Atendimentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.total)}</div><p className="text-xs text-muted-foreground">{fmt(a.companies)} empresas · {fmt(a.upcoming)} futuros</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>Confirmados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.confirmed)}</div><p className="text-xs text-muted-foreground">ticket médio {brl(a.avgTicketBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><XCircle className="h-4 w-4"/>Cancelados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.cancelled)}</div><p className="text-xs text-muted-foreground">taxa {pct(a.cancelRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserX className="h-4 w-4"/>No-show</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(a.noShow)}</div><p className="text-xs text-muted-foreground">taxa {pct(a.noShowRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4"/>Receita bruta</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(a.grossBRL)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4"/>Vagas abertas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(s.filled)}/{fmt(s.total)}</div><p className="text-xs text-muted-foreground">preench. {pct(s.fillRate)} · {brl(s.avgPriceBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4"/>Lista de espera</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(w.open)}/{fmt(w.total)}</div><p className="text-xs text-muted-foreground">resolução média {w.avgResolutionHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4"/>Ofertas de horário</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(o.accepted)}/{fmt(o.total)}</div><p className="text-xs text-muted-foreground">aceite {pct(o.acceptRate)} · resp. {o.avgResponseMin.toFixed(0)}min</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Penalidades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(p.applied)}/{fmt(p.total)}</div><p className="text-xs text-muted-foreground">{brl(p.grossBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserX className="h-4 w-4"/>Eventos no-show</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(n.total)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tab title="Atendimentos por status" rows={a.byStatus} />
        <Tab title="Atendimentos por canal" rows={a.byChannel} />
        <Tab title="Top profissionais (volume)" rows={a.byProfessional} />
        <Tab title="Top serviços" rows={a.byService} />
        <Tab title="Top locais" rows={a.byLocation} />
        <Tab title="Vagas abertas por status" rows={s.byStatus} />
        <Tab title="Lista de espera por status" rows={w.byStatus} />
        <Tab title="Lista de espera por prioridade" rows={w.byPriority} />
        <Tab title="Ofertas por status" rows={o.byStatus} />
        <Tab title="Penalidades por status" rows={p.byStatus} />
        <Tab title="Penalidades por tipo" rows={p.byKind} />
        <Tab title="No-show por motivo" rows={n.byReason} />
        <Tab title="No-show por profissional" rows={n.byProfessional} />
        <Tab title="No-show por cliente" rows={n.byCustomer} />
      </div>
    </div>
  );
}
