import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGovernanceLgpdHealth } from "@/lib/governance-lgpd-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCw, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/governance-lgpd-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getGovernanceLgpdHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","gov-lgpd",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary"/>Governance & LGPD</h1>
          <p className="text-sm text-muted-foreground">Consentimentos, requisições de dados, aceites legais, audit logs e compliance.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Consentimentos LGPD</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.consents.granted)}<span className="text-sm text-muted-foreground">/{fmt(data.consents.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pedidos de Exclusão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.deletion.pending)}<span className="text-sm text-muted-foreground">/{fmt(data.deletion.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.deletion.done)} concluídos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pedidos de Exportação</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.export.pending)}<span className="text-sm text-muted-foreground">/{fmt(data.export.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.export.done)} concluídos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4"/>Aceites Legais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.legal.acceptances)}</div><p className="text-xs text-muted-foreground">{fmt(data.legal.activeDocuments)}/{fmt(data.legal.documents)} documentos ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Audit Logs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.audit.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Governance Apps</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.governance.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Compliance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.compliance.active)}<span className="text-sm text-muted-foreground">/{fmt(data.compliance.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.compliance.blocking)} bloqueantes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Incidentes Abertos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.incidents.open)}<span className="text-sm text-muted-foreground">/{fmt(data.incidents.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.incidents.high)} críticos</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Top Entidades Auditadas</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.audit.topEntities.map((r:any)=>(<tr key={r.entity} className="border-t"><td className="py-1">{r.entity}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top Ações Auditadas</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.audit.topActions.map((r:any)=>(<tr key={r.action} className="border-t"><td className="py-1">{r.action}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Consents por Finalidade</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.consents.topPurposes.map((r:any)=>(<tr key={r.purpose} className="border-t"><td className="py-1">{r.purpose}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
