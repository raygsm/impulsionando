import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRealestateHealth } from "@/lib/realestate-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, RefreshCw, Calendar, FileText, Users, Wrench, Banknote, Megaphone, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/realestate-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
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
  const fn = useServerFn(getRealestateHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","realestate-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const p = data.properties, i = data.interests, v = data.visits, c = data.contracts, o = data.owners;
  const m = data.matches, si = data.searchIntents, bl = data.blasts, fi = data.financings;
  const ap = data.marocasApartments, mn = data.marocasMaintenance, st = data.marocasStatements, rr = data.marocasReports;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Home className="h-6 w-6 text-primary"/>Imobiliário & Temporada — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Imóveis, interesses, visitas, contratos, matches, blasts, financiamentos e operação Marocas.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4"/>Imóveis publicados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(p.published)}</div><p className="text-xs text-muted-foreground">{fmt(p.pending)} pend · {fmt(p.total)} total</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4"/>Interesses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(i.respRate)}</div><p className="text-xs text-muted-foreground">{fmt(i.responded)}/{fmt(i.total)} respondidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4"/>Visitas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(v.doneRate)}</div><p className="text-xs text-muted-foreground">{fmt(v.done)}/{fmt(v.total)} · {fmt(v.noShow)} no-show</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Contratos assinados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(c.signed)}</div><p className="text-xs text-muted-foreground">{brl(c.value)} · {pct(c.signRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4"/>Blasts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(bl.sent)}</div><p className="text-xs text-muted-foreground">{fmt(bl.failed)} falhas · {fmt(bl.audience)} público</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4"/>Financiamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(fi.value)}</div><p className="text-xs text-muted-foreground">{fmt(fi.approved)}/{fmt(fi.total)} aprovados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Home className="h-4 w-4"/>Marocas apartos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(ap.active)}</div><p className="text-xs text-muted-foreground">{fmt(ap.total)} total · diária méd {brl(ap.avgDaily)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4"/>Manutenções</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(mn.open)}</div><p className="text-xs text-muted-foreground">{fmt(mn.resolved)} resolvidas · MTTR {mn.mttrHours.toFixed(1)}h</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Resumo financeiro Marocas</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground">Receita bruta</p><p className="font-semibold">{brl(st.gross)}</p></div>
          <div><p className="text-muted-foreground">Comissão Marocas</p><p className="font-semibold">{brl(st.fee)}</p></div>
          <div><p className="text-muted-foreground">Repasse líquido</p><p className="font-semibold">{brl(st.net)}</p></div>
          <div><p className="text-muted-foreground">Extratos pagos</p><p className="font-semibold">{fmt(st.paid)}/{fmt(st.total)}</p></div>
          <div><p className="text-muted-foreground">Orçamentos aprov.</p><p className="font-semibold">{brl(mn.quotesAmount)} ({fmt(mn.quotesApproved)})</p></div>
          <div><p className="text-muted-foreground">Match score méd</p><p className="font-semibold">{m.avgScore.toFixed(2)}</p></div>
          <div><p className="text-muted-foreground">Relatórios concluídos</p><p className="font-semibold">{fmt(rr.done)} · {fmt(rr.late)} late</p></div>
          <div><p className="text-muted-foreground">Erros relatórios</p><p className="font-semibold">{fmt(rr.errors)}</p></div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Tab title="Imóveis por operação" rows={p.byOperation}/>
        <Tab title="Imóveis por tipo" rows={p.byType}/>
        <Tab title="Imóveis por status" rows={p.byStatus}/>
        <Tab title="Imóveis por cidade" rows={p.byCity}/>
        <Tab title="Interesses por tipo" rows={i.byKind}/>
        <Tab title="Interesses por origem" rows={i.bySource}/>
        <Tab title="Visitas por status" rows={v.byStatus}/>
        <Tab title="Contratos por tipo" rows={c.byType}/>
        <Tab title="Search intents por operação" rows={si.byOperation}/>
        <Tab title="Blasts por canal" rows={bl.byChannel}/>
        <Tab title="Manutenções por prioridade" rows={mn.byPriority}/>
        <Tab title="Manutenções por categoria" rows={mn.byCategory}/>
        <Tab title="Extratos por status" rows={st.byStatus}/>
      </div>
    </div>
  );
}
