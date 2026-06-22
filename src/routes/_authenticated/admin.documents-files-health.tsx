import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDocumentsFilesHealth } from "@/lib/documents-files-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/documents-files-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getDocumentsFilesHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","docs",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><FileText className="h-6 w-6 text-primary"/>Documents & Files</h1>
          <p className="text-sm text-muted-foreground">Contratos & assinaturas, documentos contábeis e imobiliários, exportações, arquivos IA e páginas geradas.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contratos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.signed)}<span className="text-sm text-muted-foreground">/{fmt(data.contracts.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.contracts.pending)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assinaturas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.signaturesDone)}<span className="text-sm text-muted-foreground">/{fmt(data.contracts.signatures)}</span></div><p className="text-xs text-muted-foreground">média {data.contracts.avgSignHours}h</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Docs Contábeis</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contab.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Docs Imobiliários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.realestate.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exportações OK / Falha</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.exports.ok)}<span className="text-sm text-muted-foreground"> / {fmt(data.exports.failed)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.exports.total)} total</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Arquivos IA</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.ai.files)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Páginas Geradas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.generatedPages.published)}<span className="text-sm text-muted-foreground">/{fmt(data.generatedPages.total)}</span></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Tipos · Contábil</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.contab.topTypes.map((r:any)=>(<tr key={r.type} className="border-t"><td className="py-1">{r.type}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Tipos · Imobiliário</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.realestate.topTypes.map((r:any)=>(<tr key={r.type} className="border-t"><td className="py-1">{r.type}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Exportações por Tipo</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.exports.byKind.map((r:any)=>(<tr key={r.kind} className="border-t"><td className="py-1">{r.kind}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
