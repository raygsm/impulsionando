import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAuditSecurityHealth } from "@/lib/audit-security-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCw, KeyRound, Webhook, AlertTriangle, History as HistoryIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit-security-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Page() {
  const fn = useServerFn(getAuditSecurityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","audit-security-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  const maxDaily = Math.max(1, ...data.audit.daily.map((d) => d.count));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary"/>Audit & Security</h1>
          <p className="text-sm text-muted-foreground">Auditoria sensível, RBAC, overrides, webhooks, dedupe thresholds e abuso de trial.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><HistoryIcon className="h-4 w-4"/>Audit Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.audit.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.audit.uniqueUsers)} usuários · {fmt(data.audit.uniqueCompanies)} empresas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><KeyRound className="h-4 w-4"/>RBAC Roles</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.rbac.roles)}</div><p className="text-xs text-muted-foreground">{fmt(data.rbac.uniqueUsersWithRole)} usuários com role</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Permissions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.rbac.permissions)}</div><p className="text-xs text-muted-foreground">{data.rbac.avgPermsPerProfile.toFixed(1)} por perfil · {fmt(data.rbac.profiles)} perfis</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Overrides</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.rbac.overrides)}</div><p className="text-xs text-muted-foreground"><span className="text-green-600">{fmt(data.rbac.allow)} allow</span> · <span className="text-red-600">{fmt(data.rbac.deny)} deny</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Webhook className="h-4 w-4"/>Webhook Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.webhooks.failed)} falhas · {fmt(data.webhooks.replayed)} replayed</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dedupe Thresholds</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.dedupe.users)}</div><p className="text-xs text-muted-foreground">média {data.dedupe.avgMin.toFixed(1)}–{data.dedupe.avgMax.toFixed(1)}% · {fmt(data.dedupe.transitions)} transições</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Trial Abuse</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.trialAbuse.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.trialAbuse.uniqueEmail)} emails · {fmt(data.trialAbuse.uniqueDoc)} docs</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Notif. Retention</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.retention.total)}</div><p className="text-xs text-muted-foreground">mudanças de política</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Audit — Eventos por Dia ({data.window.days}d)</CardTitle></CardHeader>
        <CardContent>
          {data.audit.daily.length === 0 ? <p className="text-xs text-muted-foreground">Sem eventos no período</p> : (
            <div className="flex items-end gap-1 h-32">
              {data.audit.daily.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.d}: ${d.count}`}>
                  <div className="w-full bg-primary/70 rounded-t" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: "2px" }} />
                  <div className="text-[9px] text-muted-foreground mt-1">{d.d.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Audit — Top Ações</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.audit.byAction.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Audit — Top Entidades</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.audit.byEntity.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Audit — Top Usuários</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.audit.byUser.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 text-xs">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Roles Distribuídas</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.rbac.byRole.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Permissions por Módulo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.rbac.byModule.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Webhooks por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.webhooks.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Webhooks por Origem</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.webhooks.bySource.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Dedupe — Estados</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.dedupe.events)} eventos · {fmt(data.dedupe.auditChanges)} mudanças manuais</p>
          <table className="w-full text-sm"><tbody>
          {data.dedupe.byState.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Últimas Mudanças de Retenção</CardTitle></CardHeader><CardContent>
          {data.retention.last.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
          <ul className="text-sm space-y-2">
            {data.retention.last.map((r) => (
              <li key={r.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{r.email}</span><span className="text-xs">{new Date(r.at).toLocaleString("pt-BR")}</span></div>
                <div><strong>{r.previous}d</strong> → <strong>{r.next}d</strong> {r.reason ? <span className="text-xs text-muted-foreground">— {r.reason}</span> : null}</div>
              </li>
            ))}
          </ul>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Agent Logs por Evento</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.agents.logs)} logs no período</p>
          <table className="w-full text-sm"><tbody>
          {data.agents.byEvent.length === 0 && <tr><td className="py-2 text-muted-foreground">—</td></tr>}
          {data.agents.byEvent.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
