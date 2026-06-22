import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getVitrineLegalHealth } from "@/lib/vitrine-legal-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, RefreshCw, FileCode, ScrollText, Star, FileSearch } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vitrine-legal-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

function Page() {
  const fn = useServerFn(getVitrineLegalHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","vitrine-legal-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Globe className="h-6 w-6 text-primary"/>Vitrine, Site Builder & Legal</h1>
          <p className="text-sm text-muted-foreground">Páginas geradas, templates, vitrine pública, exports, contratos faturáveis e aceites legais.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCode className="h-4 w-4"/>Páginas Geradas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.pages.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.pages.companies)} empresas · {fmt(data.pages.withTemplate)} c/ template</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Versões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.pages.versions)}</div><p className="text-xs text-muted-foreground">no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Site Templates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.templates.active)}/{fmt(data.templates.total)}</div><p className="text-xs text-muted-foreground">ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4"/>Vitrine Pública</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.vitrinePublic.total)}</div><p className="text-xs text-muted-foreground">avaliação média {data.vitrinePublic.avgRating.toFixed(2)} ({fmt(data.vitrinePublic.rated)} avaliadas)</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSearch className="h-4 w-4"/>Vitrine Exports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.vitrineExports.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.vitrineExports.rowsExported)} linhas · <span className="text-red-600">{fmt(data.vitrineExports.errors)} erros</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4"/>Contratos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.total)}</div><p className="text-xs text-muted-foreground"><span className="text-green-600">{fmt(data.contracts.signed)} assinados</span> · {fmt(data.contracts.awaitingSignature)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assinaturas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.signaturesCompleted)}/{fmt(data.contracts.signatures)}</div><p className="text-xs text-muted-foreground">{fmt(data.contracts.uniqueSigners)} signatários · ~{data.contracts.avgHoursToSign.toFixed(1)}h até assinar</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aceites Legais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.legal.acceptances)}</div><p className="text-xs text-muted-foreground">{fmt(data.legal.uniqueUsers)} usuários · {fmt(data.legal.current)}/{fmt(data.legal.documents)} docs vigentes</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Páginas — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.pages.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Versões — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.pages.versionsByStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Templates — Por Nicho</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.templates.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Vitrine — Por Segmento</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.vitrinePublic.bySegment.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vitrine — Por UF</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.vitrinePublic.byState.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Vitrine Exports — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.vitrineExports.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vitrine Exports — Dataset</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.vitrineExports.byDataset.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Contratos — Status</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{mb(data.contracts.totalSizeBytes)} de PDFs · {fmt(data.contracts.superseded)} substituídos</p>
          <table className="w-full text-sm"><tbody>
            {data.contracts.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Assinaturas — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.contracts.signaturesByStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Docs Legais — Por Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.legal.byKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Aceites — Por Tipo de Documento</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.legal.acceptancesByKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Documentos Legais Recentes</CardTitle></CardHeader><CardContent>
          <ul className="text-sm space-y-2">
            {data.legal.latestDocs.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {data.legal.latestDocs.map((r) => (
              <li key={r.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between"><strong className="text-xs">{r.title ?? r.kind}</strong>{r.isCurrent ? <span className="text-xs text-green-600">vigente</span> : <span className="text-xs text-muted-foreground">histórico</span>}</div>
                <div className="text-xs text-muted-foreground">{r.kind} · {r.audience ?? "—"} · v{r.version}{r.niche ? ` · ${r.niche}` : ""} · {r.effectiveAt ? new Date(r.effectiveAt).toLocaleDateString("pt-BR") : "—"}</div>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Governance — Por Tipo</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.governance.total)} aplicações · {fmt(data.governance.totalAffected)} registros afetados</p>
          <table className="w-full text-sm"><tbody>
            {data.governance.byKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Governance — Últimas Aplicações</CardTitle></CardHeader><CardContent>
          <ul className="text-sm space-y-2">
            {data.governance.latest.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {data.governance.latest.map((r) => (
              <li key={r.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between"><strong className="text-xs">{r.kind}</strong><span className="text-xs">{fmt(r.affected ?? 0)} afetados</span></div>
                <div className="text-xs text-muted-foreground">{r.scope} · {r.by ?? "—"} · {r.at ? new Date(r.at).toLocaleString("pt-BR") : "—"}</div>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
