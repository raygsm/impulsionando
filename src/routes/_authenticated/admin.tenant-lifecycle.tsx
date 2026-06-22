import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTenantLifecycle } from "@/lib/tenant-lifecycle.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, ShieldCheck, AlertTriangle, RefreshCw, GitBranch, Sparkles, Pause } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tenant-lifecycle")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent></Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const dt = (s: string | null | undefined) => s ? new Date(s).toLocaleDateString("pt-BR") : "—";
const daysFromNow = (s: string | null | undefined) => {
  if (!s) return null;
  const d = Math.round((new Date(s).getTime() - Date.now()) / 86400000);
  return d;
};

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok"|"warn"|"bad" }) {
  const color = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "";
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </CardContent></Card>
  );
}

function Page() {
  const fetchFn = useServerFn(getTenantLifecycle);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tenant-lifecycle"],
    queryFn: () => fetchFn({ data: {} }),
  });

  if (isLoading || !data) {
    return <div className="p-6 space-y-4"><Skeleton className="h-10 w-72"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
      <Skeleton className="h-64"/></div>;
  }

  const d = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CalendarClock className="h-6 w-6"/> Tenant Lifecycle Cockpit</h1>
          <p className="text-sm text-muted-foreground">Onboarding, trials, contratos, suspensões e migrações.</p>
        </div>
        <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching?"animate-spin":""}`}/>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Tenants ativos" value={fmt(d.totals.activeTenants)} hint={`+${d.totals.newTenants30} nos últimos 30d`} />
        <Kpi label="Onboarding em curso" value={fmt(d.totals.onboardingActive)} hint={`${d.totals.onboardingCompleted} concluídos`} />
        <Kpi label="Trials ativos" value={fmt(d.totals.trialsActive)} hint={`${d.totals.trialsConverted} convertidos / ${d.totals.trialsExpired} expirados`} />
        <Kpi label="Contratos ativos" value={fmt(d.totals.contractsActive)} hint={`MRR ${brl(d.totals.mrrActive)}`} />
        <Kpi label="Vencendo em 7d" value={fmt(d.totals.dueIn7)} tone={d.totals.dueIn7>0?"warn":"ok"} hint={`${d.totals.dueIn30} em 30d`} />
        <Kpi label="Suspensões ativas" value={fmt(d.totals.suspActive)} tone={d.totals.suspActive>0?"bad":"ok"} hint={`${d.totals.reactivated30} reativados 30d`} />
        <Kpi label="Domínios pendentes" value={fmt(d.totals.domainPending)} tone={d.totals.domainPending>0?"warn":"ok"} />
        <Kpi label="E-mails pendentes" value={fmt(d.totals.emailPending)} tone={d.totals.emailPending>0?"warn":"ok"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4"/> Onboarding em progresso</CardTitle></CardHeader>
          <CardContent>
            {d.onboardingInProgress.length === 0 ? <p className="text-sm text-muted-foreground">Sem tenants em onboarding.</p> : (
              <div className="space-y-2">
                {d.onboardingInProgress.map((t) => (
                  <div key={t.companyId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="truncate">{t.companyName}</span>
                      <div className="flex items-center gap-3 text-xs tabular-nums">
                        <span className="text-muted-foreground">{t.done}/{t.total}</span>
                        <span className="font-medium w-12 text-right">{t.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Trials expirando em 7 dias</CardTitle></CardHeader>
          <CardContent>
            {d.trialsExpiringSoon.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum trial expirando em breve.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Tenant</th><th>Plano</th><th>Termina em</th><th className="text-right">Dias</th></tr>
                </thead>
                <tbody>
                  {d.trialsExpiringSoon.map((t) => {
                    const dd = daysFromNow(t.endsAt);
                    return (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="py-2 truncate max-w-[180px]">{t.companyName}</td>
                        <td><Badge variant="outline">{t.chosenPlan ?? "—"}</Badge></td>
                        <td>{dt(t.endsAt)}</td>
                        <td className={`text-right tabular-nums ${dd != null && dd <= 2 ? "text-destructive font-medium" : ""}`}>{dd != null ? `${dd}d` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4"/> Contratos vencendo em 7 dias</CardTitle></CardHeader>
        <CardContent>
          {d.dueSoonContracts.length === 0 ? <p className="text-sm text-muted-foreground">Sem vencimentos próximos.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr><th className="py-2">Tenant</th><th>Vencimento</th><th>Último pagto</th><th className="text-right">Recorrente</th></tr>
              </thead>
              <tbody>
                {d.dueSoonContracts.map((c) => {
                  const dd = daysFromNow(c.nextDueDate);
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 truncate max-w-[280px]">{c.companyName}</td>
                      <td className={dd != null && dd <= 1 ? "text-destructive font-medium" : ""}>{dt(c.nextDueDate)} {dd != null && <span className="text-xs text-muted-foreground">({dd}d)</span>}</td>
                      <td className="text-xs text-muted-foreground">{dt(c.lastPaidAt)}</td>
                      <td className="text-right tabular-nums">{brl(c.recurringAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pause className="h-4 w-4"/> Suspensões ativas</CardTitle></CardHeader>
          <CardContent>
            {d.recentSusp.length === 0 ? <p className="text-sm text-muted-foreground">Sem suspensões ativas.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Tenant</th><th>Motivo</th><th>Suspenso em</th></tr>
                </thead>
                <tbody>
                  {d.recentSusp.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 truncate max-w-[200px]">{s.companyName}</td>
                      <td className="text-xs truncate max-w-[180px]">{s.reason}</td>
                      <td>{dt(s.suspendedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4"/> Migrações em andamento (30d)</CardTitle></CardHeader>
          <CardContent>
            {d.migrationsInProgress.length === 0 ? <p className="text-sm text-muted-foreground">Sem migrações recentes.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Tenant</th><th>Steps</th><th>Status</th><th>Última atualização</th></tr>
                </thead>
                <tbody>
                  {d.migrationsInProgress.map((m) => (
                    <tr key={m.companyId} className="border-b last:border-0">
                      <td className="py-2 truncate max-w-[200px]">{m.companyName}</td>
                      <td className="tabular-nums">{m.steps}</td>
                      <td><Badge variant={m.lastStatus === "completed" || m.lastStatus === "success" ? "secondary" : "outline"}>{m.lastStatus ?? "—"}</Badge></td>
                      <td className="text-xs text-muted-foreground">{dt(m.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Solicitações de domínio</CardTitle></CardHeader>
          <CardContent>
            {d.onboardingRequests.domains.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma pendência.</p> : (
              <ul className="space-y-2 text-sm">
                {d.onboardingRequests.domains.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <div className="truncate">{r.companyName}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{r.requested_value}</div>
                    </div>
                    <Badge variant="outline">{r.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Solicitações de e-mail corporativo</CardTitle></CardHeader>
          <CardContent>
            {d.onboardingRequests.emails.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma pendência.</p> : (
              <ul className="space-y-2 text-sm">
                {d.onboardingRequests.emails.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                    <div className="min-w-0">
                      <div className="truncate">{r.companyName}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{r.full_address}</div>
                    </div>
                    <Badge variant="outline">{r.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
