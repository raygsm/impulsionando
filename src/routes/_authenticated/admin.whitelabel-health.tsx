import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getWhitelabelHealth } from "@/lib/whitelabel-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, RefreshCw, FileCode, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/whitelabel-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getWhitelabelHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","wl-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Globe className="h-6 w-6 text-primary"/>White-Label & Vitrine</h1>
          <p className="text-sm text-muted-foreground">Planos WL, empresas vinculadas, páginas geradas, vitrine pública e exports.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Planos WL</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.wl.plans)}</div><p className="text-xs text-muted-foreground">{fmt(data.wl.subscriptions)} assinaturas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Empresas Vinculadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.wl.activeLinks)}<span className="text-sm text-muted-foreground">/{fmt(data.wl.links)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.wl.consumedPoints)} pontos consumidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCode className="h-4 w-4"/>Páginas Geradas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.pages.published)}<span className="text-sm text-muted-foreground">/{fmt(data.pages.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.pages.versions)} versões</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Templates de Site</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.pages.activeTemplates)}<span className="text-sm text-muted-foreground">/{fmt(data.pages.templates)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Vitrine Pública</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.vitrine.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.vitrine.ratedCount)} avaliadas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4"/>Rating Médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.vitrine.avgRating.toFixed(1)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.exports.done)}<span className="text-sm text-muted-foreground">/{fmt(data.exports.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.exports.totalRows)} linhas · {fmt(data.exports.failed)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Versões Publicadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.pages.versionsPublished)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Distribuição de Planos (Links)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.wl.planDistribution.map((p,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{p.plan}</td><td className="text-right">{fmt(p.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top WL Owners</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Owner</th><th className="text-right">Links</th><th className="text-right">Pontos</th></tr></thead><tbody>
          {data.wl.topOwners.map((o,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 text-xs font-mono">{o.owner_id.slice(0,12)}…</td><td className="text-right">{fmt(o.links)}</td><td className="text-right">{fmt(o.pontos)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Templates por Nicho</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.pages.templateNiches.map((t,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{t.niche}</td><td className="text-right">{fmt(t.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vitrine por Segmento</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.vitrine.segments.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.segment}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vitrine por UF</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-2">{data.vitrine.states.map((s)=>(<div key={s.state} className="p-2 rounded bg-muted/30 text-center"><div className="text-xs text-muted-foreground">{s.state}</div><div className="font-bold">{fmt(s.count)}</div></div>))}</div></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
