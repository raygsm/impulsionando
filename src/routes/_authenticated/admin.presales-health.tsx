import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPresalesHealth } from "@/lib/presales-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, RefreshCw, FileText, ScrollText, UserPlus, MousePointerClick, Star, Inbox, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/presales-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Tab({ title, rows, unit }: { title: string; rows: { k: string; count: number }[]; unit?: "brl" | "n" }) {
  const f = unit === "brl" ? brl : fmt;
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <table className="w-full text-sm"><tbody>
          {rows.map((s, i) => (<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{f(s.count)}</td></tr>))}
        </tbody></table>
      )}
    </CardContent></Card>
  );
}

function Page() {
  const fn = useServerFn(getPresalesHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","presales-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const q = data.quotes, cd = data.contracts, cs = data.signatures, dl = data.demoLeads, ds = data.demoSessions, dv = data.visitSessions, sv = data.survey, da = data.demoActions, ci = data.catalogIntents;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Handshake className="h-6 w-6 text-primary"/>Pré-Vendas & Conversão — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Orçamentos, contratos, assinaturas, demos, leads, surveys e intents de catálogo.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Orçamentos aceitos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(q.acceptRate)}</div><p className="text-xs text-muted-foreground">{fmt(q.accepted)}/{fmt(q.total)} · {brl(q.acceptedBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4"/>Contratos assinados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(cd.signRate)}</div><p className="text-xs text-muted-foreground">{fmt(cd.signed)}/{fmt(cd.total)} · {brl(cd.signedBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4"/>Assinaturas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(cs.signed)}/{fmt(cs.total)}</div><p className="text-xs text-muted-foreground">assinadas / total</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4"/>Demo leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(dl.converted)}/{fmt(dl.total)}</div><p className="text-xs text-muted-foreground">conv {pct(dl.convRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4"/>Demo sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(ds.completeRate)}</div><p className="text-xs text-muted-foreground">{fmt(ds.completed)}/{fmt(ds.total)} completas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MousePointerClick className="h-4 w-4"/>Visitas demo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(dv.total)}</div><p className="text-xs text-muted-foreground">sessões de visita</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-amber-500"/>Survey NPS médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sv.avgScore.toFixed(1)}</div><p className="text-xs text-muted-foreground">{fmt(sv.total)} respostas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4"/>Catalog intents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(ci.processRate)}</div><p className="text-xs text-muted-foreground">{fmt(ci.processed)}/{fmt(ci.total)} processados</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tab title="Orçamentos por status" rows={q.byStatus} />
        <Tab title="Contratos por status" rows={cd.byStatus} />
        <Tab title="Assinaturas por status" rows={cs.byStatus} />
        <Tab title="Assinaturas por papel" rows={cs.byRole} />
        <Tab title="Demo leads por status" rows={dl.byStatus} />
        <Tab title="Demo leads por nicho" rows={dl.byNiche} />
        <Tab title="Demo leads por fonte" rows={dl.bySource} />
        <Tab title="Demo sessions por nicho" rows={ds.byNiche} />
        <Tab title="Visitas por status" rows={dv.byStatus} />
        <Tab title="Visitas por nicho" rows={dv.byNiche} />
        <Tab title="Ações na demo" rows={da.byAction} />
        <Tab title="Ações por nicho" rows={da.byNiche} />
        <Tab title="Intents por status" rows={ci.byStatus} />
        <Tab title="Intents por tipo" rows={ci.byType} />
        <Tab title="Intents por fonte" rows={ci.bySource} />
      </div>
    </div>
  );
}
