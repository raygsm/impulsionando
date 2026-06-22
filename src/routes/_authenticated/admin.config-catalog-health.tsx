import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getConfigCatalogHealth } from "@/lib/config-catalog-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, RefreshCw, Flag, Layers, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/config-catalog-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const fn = useServerFn(getConfigCatalogHealth);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","config-catalog-health"], queryFn: () => fn() });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><SlidersHorizontal className="h-6 w-6 text-primary"/>Configuration & Catalog</h1>
          <p className="text-sm text-muted-foreground">Módulos, niches, planos, feature flags, settings, widgets, menus, compliance e SLOs.</p>
        </div>
        <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4"/>Módulos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.modules.active)}<span className="text-sm text-muted-foreground">/{fmt(data.modules.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.modules.core)} core · {fmt(data.modules.inCheckout)} no checkout · {fmt(data.modules.whiteLabel)} WL</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Catálogo de Módulos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.modules.catalogActive)}<span className="text-sm text-muted-foreground">/{fmt(data.modules.catalogTotal)}</span></div><p className="text-xs text-muted-foreground">preço médio {brl(data.modules.catalogAvgPrice)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Niches</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.niches.active)}<span className="text-sm text-muted-foreground">/{fmt(data.niches.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.niches.macros)} macros · {fmt(data.niches.subs)} subs</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Mapeamentos Nicho↔Módulo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.niches.moduleMappings)}</div><p className="text-xs text-muted-foreground">{fmt(data.niches.recommendedMappings)} recomendados · {fmt(data.niches.optionalMappings)} opcionais</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Configurações de Plano</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.plans.configurations)}</div><p className="text-xs text-muted-foreground">média {data.plans.avgChooseLimit.toFixed(1)} escolhas · {data.plans.avgModulesPerPlan.toFixed(1)} módulos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flag className="h-4 w-4"/>Feature Flags</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.flags.active)}<span className="text-sm text-muted-foreground">/{fmt(data.flags.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.flags.defaultTrue)} default ON</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Compliance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.compliance.active)}<span className="text-sm text-muted-foreground">/{fmt(data.compliance.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.compliance.blocking)} bloqueantes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4"/>SLO Targets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.slos.active)}<span className="text-sm text-muted-foreground">/{fmt(data.slos.total)}</span></div><p className="text-xs text-muted-foreground">avail {data.slos.avgAvailabilityPct.toFixed(2)}% · p95 {Math.round(data.slos.avgP95Ms)}ms</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Módulos por Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.modules.categories.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{m.category}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Readiness dos Módulos</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.modules.readiness.map((r,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{r.status}</td><td className="text-right">{fmt(r.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Status Técnico</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.modules.techStatus.map((t,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{t.status}</td><td className="text-right">{fmt(t.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Feature Flags por Módulo (top 12)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Módulo</th><th className="text-right">Flags</th></tr></thead><tbody>
          {data.flags.byModule.map((f,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{f.module}</td><td className="text-right">{fmt(f.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-3 text-xs text-muted-foreground">Categorias: {data.flags.categories.map((c)=>`${c.category}: ${fmt(c.count)}`).join(" · ")}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Niches por Macro</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.niches.byMacro.map((n,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{n.macro}</td><td className="text-right">{fmt(n.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-3 text-xs text-muted-foreground">Tiers: {data.plans.tiers.map((t)=>`${t.tier}: ${fmt(t.count)}`).join(" · ")}</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Settings por Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.settings.categories.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.category}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-2 text-xs text-muted-foreground">{fmt(data.settings.editable)}/{fmt(data.settings.total)} editáveis · {fmt(data.settings.companyEditable)}/{fmt(data.settings.definitions)} editáveis por empresa</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Widgets por Dashboard</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.widgets.byDashboard.map((w,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{w.dashboard}</td><td className="text-right">{fmt(w.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-2 text-xs text-muted-foreground">{fmt(data.widgets.visible)}/{fmt(data.widgets.total)} visíveis</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Menu / Compliance</CardTitle></CardHeader><CardContent>
          <div className="text-xs text-muted-foreground mb-1">Menu por escopo</div>
          <table className="w-full text-sm mb-3"><tbody>
            {data.menus.scopes.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{m.scope}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
          </tbody></table>
          <div className="text-xs text-muted-foreground mb-1">Compliance por tipo de documento</div>
          <table className="w-full text-sm"><tbody>
            {data.compliance.kinds.map((c,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{c.kind}</td><td className="text-right">{fmt(c.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Snapshot atual • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
