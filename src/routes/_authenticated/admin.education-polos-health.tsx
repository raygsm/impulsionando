import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEducationHealth } from "@/lib/education-polos-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, RefreshCw, MapPin, Users, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/education-polos-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);

function Page() {
  const fn = useServerFn(getEducationHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","education-polos",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><GraduationCap className="h-6 w-6 text-primary"/>Educação & Polos</h1>
          <p className="text-sm text-muted-foreground">Polos, captação de leads, matrículas, evasão, MRR, white-label e roles.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4"/>Polos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.polos.active)}/{fmt(data.polos.total)}</div><p className="text-xs text-muted-foreground">capac. {fmt(data.polos.capacity)} · meta/mês {fmt(data.polos.goalMonthly)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4"/>Leads ({data.days}d)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.leads.total)}</div><p className="text-xs text-muted-foreground">valor estimado {brl(data.leads.valueSum)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conversão Lead→Matrícula</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.leads.convRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">{fmt(data.leads.converted)}/{fmt(data.leads.total)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Matrículas Ativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.matriculas.active)}/{fmt(data.matriculas.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.matriculas.newInPeriod)} novas no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">MRR</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.matriculas.mrr)}</div><p className="text-xs text-muted-foreground">mensalidades ativas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4"/>Evasão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{data.matriculas.evasionRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">{fmt(data.matriculas.evaded)} total · {fmt(data.matriculas.evadedPeriod)} no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Roles atribuídos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.roles.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">White-label</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.whitelabel.active)}/{fmt(data.whitelabel.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.whitelabel.withDomain)} com domínio</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Polos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.polos.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Polos — Top UFs</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.polos.byState.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Roles</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.roles.byRole.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Leads — Stage</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.leads.byStage.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Leads — Origem</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.leads.byOrigem.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Leads — Campanha</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.leads.byCampanha.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Leads — Curso de Interesse</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.leads.byCurso.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Matrículas — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.matriculas.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Matrículas — Financeiro</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.matriculas.byFinanceiro.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Matrículas — Curso</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.matriculas.byCurso.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Top Polos por Matrículas no Período</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Polo</th><th className="text-right">Novas Matrículas</th><th className="text-right">MRR Adicionado</th></tr></thead>
          <tbody>
            {data.matriculas.topPolos.map((r)=>(<tr key={r.id} className="border-t"><td className="py-1">{r.label}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right">{brl(r.mrr)}</td></tr>))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
