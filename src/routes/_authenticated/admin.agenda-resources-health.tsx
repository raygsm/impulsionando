import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAgendaResourcesHealth } from "@/lib/agenda-resources-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCog, RefreshCw, MapPin, DoorOpen, ShieldAlert, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/agenda-resources-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

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
  const fn = useServerFn(getAgendaResourcesHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","agenda-resources",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CalendarCog className="h-6 w-6 text-primary"/>Agenda — Recursos & Configuração</h1>
          <p className="text-sm text-muted-foreground">Locais, salas, jornadas, turnos, plantões, regras, settings, bloqueios, disponibilidade/elegibilidade, termos e auditoria.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4"/>Locais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.locations.active)}/{fmt(data.locations.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DoorOpen className="h-4 w-4"/>Salas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.rooms.active)}/{fmt(data.rooms.total)}</div><p className="text-xs text-muted-foreground">capacidade total {fmt(data.rooms.totalCapacity)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Jornadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.schedules.active)}/{fmt(data.schedules.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.schedules.profsWithSchedule)} profs c/ jornada</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Turnos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.shifts.active)}/{fmt(data.shifts.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Plantões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.oncall.upcoming)}/{fmt(data.oncall.total)}</div><p className="text-xs text-muted-foreground"><span className="text-amber-600">{fmt(data.oncall.openAssignment)} sem prof</span> · hora {brl(data.oncall.hourlyAvg)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Plantões $ fixo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.oncall.flatTotal)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bloqueios</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.blocks.ativos)}/{fmt(data.blocks.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.blocks.novoNoPeriodo)} novos ({data.days}d)</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4"/>Regras</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.rules.active)}/{fmt(data.rules.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Disponibilidade</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.availability.total)}</div><p className="text-xs text-muted-foreground">raio médio {data.availability.avgRadiusKm.toFixed(0)} km</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Elegibilidade</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.eligibility.active)}/{fmt(data.eligibility.total)}</div><p className="text-xs text-muted-foreground">perf {data.eligibility.avgPerformance.toFixed(1)} · no-show {(data.eligibility.avgNoShowRate*100).toFixed(1)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Termos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.terms.accepted)}/{fmt(data.terms.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4"/>Auditoria ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.audit.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.audit.atores)} atores únicos</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Locais — UF" rows={data.locations.byState}/>
        <Tab title="Locais — Cidade" rows={data.locations.byCity}/>
        <Tab title="Locais — Timezone" rows={data.locations.byTz}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Salas — Tipo" rows={data.rooms.byKind}/>
        <Tab title="Jornadas — Dia da Semana" rows={data.schedules.byWeekday}/>
        <Tab title="Regras — Tipo" rows={data.rules.byKind}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Plantões — Status" rows={data.oncall.byStatus}/>
        <Tab title="Plantões — Especialidade" rows={data.oncall.bySpecialty}/>
        <Tab title="Bloqueios — Motivo" rows={data.blocks.byReason}/>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Disponibilidade — Modalidades aceitas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Walk-in</div><div className="text-lg font-semibold">{fmt(data.availability.walkin)}</div></div>
            <div><div className="text-xs text-muted-foreground">Plantão</div><div className="text-lg font-semibold">{fmt(data.availability.oncall)}</div></div>
            <div><div className="text-xs text-muted-foreground">Emergência</div><div className="text-lg font-semibold">{fmt(data.availability.emergency)}</div></div>
            <div><div className="text-xs text-muted-foreground">Substituição</div><div className="text-lg font-semibold">{fmt(data.availability.substitution)}</div></div>
            <div><div className="text-xs text-muted-foreground">Presencial</div><div className="text-lg font-semibold">{fmt(data.availability.inPerson)}</div></div>
            <div><div className="text-xs text-muted-foreground">Telesaúde</div><div className="text-lg font-semibold">{fmt(data.availability.telehealth)}</div></div>
            <div><div className="text-xs text-muted-foreground">Domiciliar</div><div className="text-lg font-semibold">{fmt(data.availability.home)}</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Settings — Chaves" rows={data.settings.byKey}/>
        <Tab title="Termos — Versão" rows={data.terms.byVersion}/>
        <Card><CardHeader><CardTitle className="text-base">Serviços por Profissional</CardTitle></CardHeader><CardContent>
          <div className="text-3xl font-bold">{data.services.avgServicesPerProfessional.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">{fmt(data.services.total)} vínculos profissional ↔ serviço</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tab title="Auditoria — Ação" rows={data.audit.byAction}/>
        <Tab title="Auditoria — Entidade" rows={data.audit.byEntity}/>
      </div>
    </div>
  );
}
