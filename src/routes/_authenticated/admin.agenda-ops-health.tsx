import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAgendaOpsHealth } from "@/lib/agenda-ops-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/agenda-ops-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function Page() {
  const fn = useServerFn(getAgendaOpsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "agenda-ops", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-72 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Agenda Operations — Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Open-slots, ofertas, no-show, waitlist, penalidades e recursos da agenda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Open-slots</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.slots.claimed)}<span className="text-sm text-muted-foreground">/{fmt(data.slots.total)}</span></div>
            <p className="text-xs text-muted-foreground">fill {data.slots.fillRate}% · {data.slots.avgClaimMin}min</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Payout total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.slots.totalPayout)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ofertas aceitas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.offers.accepted)}<span className="text-sm text-muted-foreground">/{fmt(data.offers.total)}</span></div>
            <p className="text-xs text-muted-foreground">resp. {fmt(data.offers.responded)} · acc {data.offers.acceptanceRate}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ofertas vistas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.offers.seen)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">No-show</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.noShow.total)}</div>
            <p className="text-xs text-muted-foreground">cobrado {brl(data.noShow.charged)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Waitlist ativa</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.waitlist.active)}<span className="text-sm text-muted-foreground">/{fmt(data.waitlist.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.waitlist.fulfilled)} atendidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Penalidades ativas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.penalties.active)}<span className="text-sm text-muted-foreground">/{fmt(data.penalties.total)}</span></div>
            <p className="text-xs text-muted-foreground">{brl(data.penalties.amount)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recursos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.resources.activeProfessionals)}<span className="text-sm text-muted-foreground">/{fmt(data.resources.professionals)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.resources.activeServices)}/{fmt(data.resources.services)} serviços</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Open-slots por Status</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.slots.byStatus.map((r: any) => (
            <tr key={r.status} className="border-t"><td className="py-1">{r.status}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Ofertas por Canal</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.offers.byChannel.map((r: any) => (
            <tr key={r.channel} className="border-t"><td className="py-1">{r.channel}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">No-show por Tipo</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.noShow.byKind.map((r: any) => (
            <tr key={r.kind} className="border-t"><td className="py-1">{r.kind}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
