import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getOnboardingProvisioningHealth } from "@/lib/onboarding-provisioning-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, RefreshCw, Globe, Mail, ScrollText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/onboarding-provisioning-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getOnboardingProvisioningHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","onb-prov-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Rocket className="h-6 w-6 text-primary"/>Onboarding & Tenant Provisioning</h1>
          <p className="text-sm text-muted-foreground">Checklist, domínios, e-mails, identidade DNS/SSL, migrações e contratos de adesão.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Empresas em Onboarding</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.onboarding.companies)}</div><p className="text-xs text-muted-foreground">{fmt(data.onboarding.fullyOnboarded)} 100% concluídas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conclusão Média</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(data.onboarding.avgCompletion)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4"/>Tenants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tenants.provisioned)}<span className="text-sm text-muted-foreground">/{fmt(data.tenants.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.tenants.customDomains)} c/ domínio próprio</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>SSL Expira &lt; 30d</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{fmt(data.tenants.sslExpiringSoon)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pedidos de Domínio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.domains.requests)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4"/>E-mails / Aliases</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.emails.aliasesActive)}<span className="text-sm text-muted-foreground">/{fmt(data.emails.aliases)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.emails.requests)} requests</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Migrações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.migrations.events)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4"/>Contratos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.signed)}<span className="text-sm text-muted-foreground">/{fmt(data.contracts.total)}</span></div><p className="text-xs text-muted-foreground">{data.contracts.avgSignHours.toFixed(1)}h até assinar</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Itens do Checklist (top 20)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Item</th><th className="text-right">Concluídos</th><th className="text-right">Total</th><th className="text-right">%</th></tr></thead><tbody>
          {data.onboarding.items.map((i,idx)=>(<tr key={idx} className="border-b last:border-0"><td className="py-2">{i.item}</td><td className="text-right">{fmt(i.done)}</td><td className="text-right">{fmt(i.total)}</td><td className="text-right">{pct(i.pct)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Pedidos de Domínio</CardTitle></CardHeader><CardContent>
          <div className="mb-4"><div className="text-xs text-muted-foreground mb-1">Por status</div><table className="w-full text-sm"><tbody>
            {data.domains.statusBreakdown.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table></div>
          <div><div className="text-xs text-muted-foreground mb-1">Por modo</div><table className="w-full text-sm"><tbody>
            {data.domains.modes.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{m.mode}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
          </tbody></table></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">DNS dos Tenants</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tenants.dnsBreakdown.map((d,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{d.status}</td><td className="text-right">{fmt(d.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">SSL dos Tenants</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tenants.sslBreakdown.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Aliases por Propósito</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.emails.aliasPurposes.map((a,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{a.purpose}</td><td className="text-right">{fmt(a.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Migrações por Etapa</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Etapa</th><th className="text-right">Eventos</th></tr></thead><tbody>
          {data.migrations.steps.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{m.step}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
        </tbody></table>
        <div className="mt-3 text-xs text-muted-foreground">Status: {data.migrations.statusBreakdown.map((s)=>`${s.status}: ${fmt(s.count)}`).join(" · ")}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Contratos</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Assinados</div><div className="font-bold text-green-600">{fmt(data.contracts.signed)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Enviados</div><div className="font-bold text-blue-600">{fmt(data.contracts.sent)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Pendentes</div><div className="font-bold text-amber-600">{fmt(data.contracts.pending)}</div></div>
          </div>
          <table className="w-full text-sm"><tbody>
            {data.contracts.statusBreakdown.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.status}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
          <div className="mt-3 text-xs text-muted-foreground">{fmt(data.contracts.signaturesCompleted)} de {fmt(data.contracts.signatures)} assinaturas concluídas · tempo médio {data.contracts.avgSignHours.toFixed(1)}h</div>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
