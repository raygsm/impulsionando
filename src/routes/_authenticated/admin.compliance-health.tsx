import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getComplianceHealth } from "@/lib/compliance-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCw, FileText, Trash2, Download, ScrollText, AlertTriangle, ClipboardList, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/compliance-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
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
  const fn = useServerFn(getComplianceHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","compliance-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const c = data.consents, dd = data.deletions, de = data.exports, au = data.audit, rq = data.requirements, ic = data.incidents, da = data.dedupeAudit;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary"/>LGPD, Compliance & Auditoria — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Consentimentos, solicitações de dados, auditoria, requisitos, incidentes e retenção.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Consentimentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(c.acceptRate)}</div><p className="text-xs text-muted-foreground">{fmt(c.accepted)}/{fmt(c.total)} aceitos · {fmt(c.revoked)} revogados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trash2 className="h-4 w-4"/>Exclusões LGPD</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(dd.pending)}</div><p className="text-xs text-muted-foreground">{fmt(dd.processed)} processadas · {fmt(dd.overdue)} atrasadas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4"/>Exportações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(de.pending)}</div><p className="text-xs text-muted-foreground">{fmt(de.processed)} prontas · {fmt(de.expired)} expiradas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4"/>Auditoria</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(au.total)}</div><p className="text-xs text-muted-foreground">registros no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Requisitos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(rq.active)}</div><p className="text-xs text-muted-foreground">{fmt(rq.blocking)} bloqueantes · {fmt(rq.total)} cadastrados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Incidentes abertos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(ic.open)}</div><p className="text-xs text-muted-foreground">{fmt(ic.high)} alta sev · {fmt(ic.resolved)} resolvidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4"/>MTTR incidentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{ic.mttrHours.toFixed(1)}h</div><p className="text-xs text-muted-foreground">média de resolução</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Dedupe / Retenção</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(da.events)}</div><p className="text-xs text-muted-foreground">{fmt(da.total)} ajustes admin · retenção: {fmt(data.retention.total)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Tab title="Consentimentos por tipo" rows={c.byType}/>
        <Tab title="Versões de termos" rows={c.byVersion}/>
        <Tab title="Exclusões por status" rows={dd.byStatus}/>
        <Tab title="Exportações por status" rows={de.byStatus}/>
        <Tab title="Auditoria por ação" rows={au.byAction}/>
        <Tab title="Auditoria por entidade" rows={au.byEntity}/>
        <Tab title="Top usuários auditoria" rows={au.topUsers}/>
        <Tab title="Requisitos por escopo" rows={rq.byScope}/>
        <Tab title="Requisitos por tipo de doc." rows={rq.byKind}/>
        <Tab title="Incidentes por severidade" rows={ic.bySeverity}/>
        <Tab title="Incidentes por status" rows={ic.byStatus}/>
        <Tab title="Incidentes por fonte" rows={ic.bySource}/>
        <Tab title="Eventos dedupe por estado" rows={da.byState}/>
      </div>
    </div>
  );
}
