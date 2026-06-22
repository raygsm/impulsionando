import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarocasHealth } from "@/lib/marocas-ops-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, RefreshCw, Wrench, Package, Receipt, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marocas-ops-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Page() {
  const fn = useServerFn(getMarocasHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","marocas-ops",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary"/>Marocas — Operações de Temporada</h1>
          <p className="text-sm text-muted-foreground">Apartamentos, proprietários, profissionais, serviços, manutenção, suprimentos, statements e relatórios.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Apartamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.apartments.active)}/{fmt(data.apartments.total)}</div><p className="text-xs text-muted-foreground">cap. {fmt(data.apartments.capacity)} · diária méd. {brl(data.apartments.avgDailyRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Comissão Média</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.apartments.avgCommissionPct.toFixed(1)}%</div><p className="text-xs text-muted-foreground">por apartamento</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Proprietários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.owners.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Profissionais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.professionals.active)}/{fmt(data.professionals.total)}</div><p className="text-xs text-muted-foreground">rating {data.professionals.avgRating.toFixed(1)}/5</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Serviços ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.services.done)}/{fmt(data.services.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.services.inProgress)} em andamento · duração {data.services.avgDurationHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Custo Serviços</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.services.cost)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4"/>Manutenção</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.maintenance.resolved)}/{fmt(data.maintenance.total)}</div><p className="text-xs text-muted-foreground">MTTR {data.maintenance.mttrHours.toFixed(1)}h · <span className="text-amber-600">{fmt(data.maintenance.open)} em aberto</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Orçamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.quotes.approved)}/{fmt(data.quotes.total)}</div><p className="text-xs text-muted-foreground">{brl(data.quotes.amount)} · <span className="text-red-600">{fmt(data.quotes.rejected)} rej.</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4"/>Suprimentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.supplies.total)}</div><p className="text-xs text-muted-foreground"><span className="text-red-600">{fmt(data.supplies.low)} abaixo do mín.</span> · estoque {brl(data.supplies.stockValue)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4"/>Statements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.statements.paid)}/{fmt(data.statements.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.statements.pending)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita Bruta · Net</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.statements.gross)}</div><p className="text-xs text-muted-foreground">fees {brl(data.statements.fees)} · desp. {brl(data.statements.expenses)} · net {brl(data.statements.net)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4"/>Relatórios</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.reports.schedulesEnabled)}/{fmt(data.reports.schedulesTotal)}</div><p className="text-xs text-muted-foreground">{fmt(data.reports.runs)} runs · {fmt(data.reports.runOk)} ok · <span className="text-red-600">{fmt(data.reports.runErrors)} erros</span> · {fmt(data.reports.runLate)} atrasos</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Apartamentos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.apartments.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Apartamentos — Cidade</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.apartments.byCity.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Profissionais — Função</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.professionals.byRole.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Serviços — Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.services.byType.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Serviços — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.services.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Serviços — Prioridade</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.services.byPriority.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Manutenção — Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.maintenance.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Manutenção — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.maintenance.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Orçamentos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.quotes.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Suprimentos — Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.supplies.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Statements — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.statements.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Relatórios — Periodicidade / Status</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm mb-2"><tbody>{data.reports.byPeriod.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table>
          <table className="w-full text-sm"><tbody>{data.reports.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
