import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getContabHealth } from "@/lib/contab-cockpit-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, RefreshCw, FileSearch, CalendarClock, ClipboardList, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/contab-cockpit-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Page() {
  const fn = useServerFn(getContabHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","contab-cockpit",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Calculator className="h-6 w-6 text-primary"/>Contabilidade — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Clientes, contratos, departamentos, documentos, calendário fiscal, obrigações, lembretes, tarefas, IRPF, finanças do escritório e onboarding.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Clientes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.clients.active)}/{fmt(data.clients.total)}</div><p className="text-xs text-muted-foreground">MRR potencial {brl(data.clients.mrr)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contratos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.active)}/{fmt(data.contracts.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.contracts.signed)} assinados · {brl(data.contracts.revenue)}/mês</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Departamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.departments.active)}/{fmt(data.departments.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSearch className="h-4 w-4"/>Docs ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.documents.total)}</div><p className="text-xs text-muted-foreground">{data.documents.reviewRate.toFixed(1)}% revisados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Obrigações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.obligations.total)}</div><p className="text-xs text-muted-foreground"><span className="text-amber-600">{fmt(data.obligations.dueSoon)} ≤30d</span> · <span className="text-red-600">{fmt(data.obligations.overdue)} vencidas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Obrigações $</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.obligations.amountPending)}</div><p className="text-xs text-muted-foreground">pendente · {brl(data.obligations.amountPaid)} pago</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lembretes ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.reminders.sent)}/{fmt(data.reminders.total)}</div><p className="text-xs text-muted-foreground"><span className="text-red-600">{fmt(data.reminders.failed)} falhas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Tarefas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tasks.done)}/{fmt(data.tasks.total)}</div><p className="text-xs text-muted-foreground">ciclo {data.tasks.avgCycleHours.toFixed(1)}h · <span className="text-red-600">{fmt(data.tasks.overdue)} vencidas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">IRPF</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.irpf.done)}/{fmt(data.irpf.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.irpf.restituir)} restituir · {fmt(data.irpf.pagar)} pagar</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">IRPF — Honorários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.irpf.feePaid)}/{brl(data.irpf.feeTotal)}</div><p className="text-xs text-muted-foreground">etapas {data.irpf.stepsCompletion.toFixed(1)}% concluídas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Escritório — Margem</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${data.officeFinance.margin>=0?"text-emerald-600":"text-red-600"}`}>{brl(data.officeFinance.margin)}</div><p className="text-xs text-muted-foreground">receita {brl(data.officeFinance.revenue)} · despesa {brl(data.officeFinance.expense)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Onboarding</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.onboarding.completionRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">{fmt(data.onboarding.total)} etapas no total</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Clientes — Regime Tributário</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.clients.byRegime.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Clientes — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.clients.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Contratos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.contracts.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Documentos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.documents.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Documentos — Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.documents.byType.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Documentos — Origem</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.documents.bySource.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Calendário Fiscal — Escopo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.fiscalCalendar.byScope.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Calendário Fiscal — Recorrência</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.fiscalCalendar.byRecurrence.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Obrigações — Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.obligations.byType.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Lembretes — Canal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.reminders.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tarefas — Prioridade</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tasks.byPriority.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tarefas — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tasks.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">IRPF — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.irpf.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">IRPF — Ano-Base</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.irpf.byYear.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Onboarding — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.onboarding.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Escritório — Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.officeFinance.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Escritório — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.officeFinance.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>
    </div>
  );
}
