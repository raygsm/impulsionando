import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRealEstateOpsHealth } from "@/lib/real-estate-ops-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, RefreshCw, Users2, Handshake, FileSearch, Megaphone, History as HistoryIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/real-estate-ops-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function Page() {
  const fn = useServerFn(getRealEstateOpsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","real-estate-ops-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Home className="h-6 w-6 text-primary"/>Real Estate Operations & Brokerage</h1>
          <p className="text-sm text-muted-foreground">Times comerciais, parceiros, distribuição de leads, proprietários, documentos, blasts, mensageria interna, matches e reviews.</p>
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
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users2 className="h-4 w-4"/>Times</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.teams.active)}/{fmt(data.teams.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.teams.membersTotal)} membros · média {data.teams.avgSize.toFixed(1)}/time · meta {brl(data.teams.goalMonthlySum)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Handshake className="h-4 w-4"/>Parceiros</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.partners.active)}/{fmt(data.partners.total)}</div><p className="text-xs text-muted-foreground">corretores parceiros</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.distribution.active)}/{fmt(data.distribution.total)}</div><p className="text-xs text-muted-foreground">regras de roteamento</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Proprietários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.owners.total)}</div><p className="text-xs text-muted-foreground">{data.owners.activationRate.toFixed(1)}% ativados · {fmt(data.owners.invited)} convidados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSearch className="h-4 w-4"/>Documentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.documents.total)}</div><p className="text-xs text-muted-foreground"><span className="text-amber-600">{fmt(data.documents.expiringSoon)} vencem 30d</span> · <span className="text-red-600">{fmt(data.documents.expired)} expirados</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4"/>Blasts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.blasts.total)}</div><p className="text-xs text-muted-foreground">{data.blasts.deliveryRate.toFixed(1)}% entrega · {fmt(data.blasts.sent)}/{fmt(data.blasts.audience)} · <span className="text-red-600">{fmt(data.blasts.failed)} falhas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Mensagens Internas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.messages.total)}</div><p className="text-xs text-muted-foreground"><span className="text-amber-600">{fmt(data.messages.open)} abertas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Matches Automáticos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.matches.total)}</div><p className="text-xs text-muted-foreground">score médio {data.matches.avgScore.toFixed(0)} · {fmt(data.matches.highScore)} ≥80 · {fmt(data.matches.notified)} notificados</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Times — Por Função</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.teams.byRole.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Parceiros — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.partners.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Distribuição — Estratégia</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.distribution.byStrategy.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Proprietários — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.owners.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Proprietários — Canal Preferido</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.owners.byContact.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Documentos — Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.documents.byType.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Documentos — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.documents.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Blasts — Canal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.blasts.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Blasts — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.blasts.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Mensagens — Canal</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.messages.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Mensagens — Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.messages.byKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Mensagens — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.messages.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><HistoryIcon className="h-4 w-4"/>Histórico — Top Eventos</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.history.total)} eventos no período</p>
          <table className="w-full text-sm"><tbody>
            {data.history.byEvent.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Reviews — Ações & Transições</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.reviews.total)} reviews no período</p>
          <div className="grid grid-cols-2 gap-3">
            <table className="w-full text-sm"><tbody>
              {data.reviews.byAction.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
            </tbody></table>
            <table className="w-full text-sm"><tbody>
              {data.reviews.transitions.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 text-xs">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
            </tbody></table>
          </div>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
