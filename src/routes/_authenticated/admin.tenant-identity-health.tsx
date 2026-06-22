import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTenantIdentityHealth } from "@/lib/tenant-identity-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, RefreshCw, Globe, ShieldCheck, MapPin, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tenant-identity-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getTenantIdentityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","tenant-identity-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary"/>Tenant Identity & Branding</h1>
          <p className="text-sm text-muted-foreground">Companies, identidade (domínio/DNS/SSL), aliases de email, settings, units, taxonomia e smoke por nicho.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tenants Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.companies.active)}<span className="text-sm text-muted-foreground">/{fmt(data.companies.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.companies.real)} reais · {fmt(data.companies.demo)} demo</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Consolidados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.companies.consolidated)}</div><p className="text-xs text-muted-foreground">{fmt(data.companies.master)} master · {fmt(data.companies.vitrine)} vitrine</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Branding Completo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.companies.branded)}<span className="text-sm text-muted-foreground">/{fmt(data.companies.total)}</span></div><p className="text-xs text-muted-foreground">cor + logo</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4"/>Identidades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.identity.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.identity.customDomains)} domínios próprios · {fmt(data.identity.withoutIdentity)} sem identidade</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>SSL</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.identity.provisioned)}</div><p className="text-xs text-muted-foreground">{fmt(data.identity.sslExpiringSoon)} expirando &lt;30d · {fmt(data.identity.sslExpired)} expirados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Email Aliases</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.aliases.active)}<span className="text-sm text-muted-foreground">/{fmt(data.aliases.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.aliases.defaults)} default</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4"/>Units</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.units.active)}<span className="text-sm text-muted-foreground">/{fmt(data.units.total)}</span></div><p className="text-xs text-muted-foreground">filiais ativas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4"/>Taxonomia</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.taxonomy.activeNiches)}<span className="text-sm text-muted-foreground">/{fmt(data.taxonomy.niches)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.taxonomy.macros)} macros · {fmt(data.taxonomy.subnichos)} subnichos</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Status Comercial</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.companies.statusComm.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Status Financeiro</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.companies.statusFin.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Status Técnico</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.companies.statusTech.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Companies por Nicho</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.companies.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tipos & Ambientes</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground mb-1">Kind</div><table className="w-full"><tbody>{data.companies.kinds.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
            <div><div className="text-xs text-muted-foreground mb-1">Environment / Channel</div><table className="w-full"><tbody>
              {data.companies.env.map((s,i)=>(<tr key={`e-${i}`} className="border-b last:border-0"><td className="py-1">env: {s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
              {data.companies.channels.map((s,i)=>(<tr key={`c-${i}`} className="border-b last:border-0"><td className="py-1">ch: {s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
            </tbody></table></div>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">DNS Status (identity)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.identity.dnsStatuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">SSL Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.identity.sslStatuses.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Aliases por Propósito</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.aliases.byPurpose.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Settings por Categoria</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">Total {fmt(data.settings.total)} · média {data.settings.avgPerCompany.toFixed(1)} por empresa</p>
          <table className="w-full text-sm"><tbody>
          {data.settings.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Migration Log ({data.window.days}d)</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">Total {fmt(data.migration.total)} · falhas {fmt(data.migration.failed)}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground mb-1">Step</div><table className="w-full"><tbody>{data.migration.bySteps.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
            <div><div className="text-xs text-muted-foreground mb-1">Status</div><table className="w-full"><tbody>{data.migration.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
          </div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Smoke Runs por Nicho ({data.window.days}d)</CardTitle></CardHeader><CardContent>
        <p className="text-xs text-muted-foreground mb-2">Total {fmt(data.smoke.total)} · sucesso {fmt(data.smoke.success)}</p>
        <table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Nicho</th><th className="text-right">Runs</th><th className="text-right">OK</th><th className="text-right">Sucesso</th><th className="text-right">Duração média</th></tr></thead><tbody>
          {data.smoke.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td><td className="text-right">{fmt(s.ok)}</td><td className="text-right">{s.count?((s.ok/s.count)*100).toFixed(1):"0"}%</td><td className="text-right">{Math.round(s.avgMs)}ms</td></tr>))}
        </tbody></table>
      </CardContent></Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
