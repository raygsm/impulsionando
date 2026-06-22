import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAgendaHealth } from "@/lib/agenda-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, RefreshCw, UserX, Activity, Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/agenda-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent></Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok"|"warn"|"bad" }) {
  const color = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "";
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </CardContent></Card>
  );
}

function Page() {
  const [days, setDays] = useState(30);
  const fetchFn = useServerFn(getAgendaHealth);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["agenda-health", days],
    queryFn: () => fetchFn({ data: { days } }),
  });

  if (isLoading || !data) {
    return <div className="p-6 space-y-4"><Skeleton className="h-10 w-72"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
      <Skeleton className="h-64"/></div>;
  }
  const d = data;
  const k = d.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Calendar className="h-6 w-6"/> Agenda & Booking Health</h1>
          <p className="text-sm text-muted-foreground">No-show, ocupação, waitlist, slots e penalidades — janela {d.windowDays}d.</p>
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
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching?"animate-spin":""}`}/>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Agendamentos" value={fmt(k.totalAppts)} hint={`${fmt(k.upcoming7d)} próximos 7d`} />
        <Kpi label="Taxa de conclusão" value={pct(k.completionRate)} tone={k.completionRate>=80?"ok":k.completionRate>=60?"warn":"bad"} hint={`${fmt(k.completed)} concluídos`} />
        <Kpi label="Taxa de no-show" value={pct(k.noShowRate)} tone={k.noShowRate>=15?"bad":k.noShowRate>=8?"warn":"ok"} hint={`${fmt(k.noShowApp)} faltas`} />
        <Kpi label="Taxa de cancelamento" value={pct(k.cancelRate)} tone={k.cancelRate>=20?"bad":k.cancelRate>=10?"warn":"ok"} hint={`${fmt(k.cancelled)} cancelados`} />
        <Kpi label="Receita realizada" value={brl(k.revenueCompleted)} tone="ok" />
        <Kpi label="Receita perdida" value={brl(k.revenueLost)} tone={k.revenueLost>0?"bad":"ok"} hint={`${brl(k.noShowChargedAmount)} cobrados`} />
        <Kpi label="Slots abertos / fill" value={`${fmt(k.slotsOpen)} / ${pct(k.slotFillRate)}`} tone={k.slotsOpen>20?"warn":"ok"} hint={`${fmt(k.slotsExpired)} expirados`} />
        <Kpi label="Waitlist" value={fmt(k.waitlist)} hint={`${k.professionalsActive}/${k.professionalsTotal} profs ativos`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/> Status dos agendamentos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(d.statusCount).map(([s,c]) => (
                <div key={s} className="flex justify-between border-b last:border-0 py-1">
                  <Badge variant="outline">{s}</Badge>
                  <span className="tabular-nums">{fmt(c)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Slots por status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.keys(d.slotStatus).length === 0 ? <p className="text-sm text-muted-foreground">Sem slots no período.</p> :
                Object.entries(d.slotStatus).map(([s,c]) => (
                  <div key={s} className="flex justify-between border-b last:border-0 py-1">
                    <Badge variant="outline">{s}</Badge>
                    <span className="tabular-nums">{fmt(c)}</span>
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t text-sm flex justify-between">
              <span className="text-muted-foreground">Penalidades ativas</span>
              <span className="tabular-nums">{k.activePenalties} · {brl(k.penaltyAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserX className="h-4 w-4"/> Top profissionais por no-show</CardTitle></CardHeader>
          <CardContent>
            {d.topNoShow.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Profissional</th><th className="text-right">Agend.</th><th className="text-right">No-show</th><th className="text-right">Taxa</th></tr>
                </thead>
                <tbody>
                  {d.topNoShow.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 truncate max-w-[220px]">{p.name}</td>
                      <td className="text-right tabular-nums">{p.appts}</td>
                      <td className="text-right tabular-nums text-destructive">{p.noShows}</td>
                      <td className={`text-right tabular-nums font-medium ${p.noShowRate>=15?"text-destructive":p.noShowRate>=8?"text-amber-600":""}`}>{pct(p.noShowRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users2 className="h-4 w-4"/> Top profissionais por receita</CardTitle></CardHeader>
          <CardContent>
            {d.topRevenue.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Profissional</th><th className="text-right">Agend.</th><th className="text-right">Receita</th></tr>
                </thead>
                <tbody>
                  {d.topRevenue.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 truncate max-w-[220px]">{p.name}</td>
                      <td className="text-right tabular-nums">{p.appts}</td>
                      <td className="text-right tabular-nums font-medium">{brl(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
