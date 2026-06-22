import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAdoptionUsage } from "@/lib/adoption-usage.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Bot, Workflow, Flag, RefreshCw, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/adoption-usage")({
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
const pct = (n: number) => `${n.toFixed(1)}%`;

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

function Bar({ pct: p }: { pct: number }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${Math.min(100, p)}%` }} />
    </div>
  );
}

function Page() {
  const [days, setDays] = useState(30);
  const fetchFn = useServerFn(getAdoptionUsage);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["adoption-usage", days],
    queryFn: () => fetchFn({ data: { days } }),
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
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Rocket className="h-6 w-6"/> Adoption & Feature Usage</h1>
          <p className="text-sm text-muted-foreground">Adoção de módulos, flags, IA e N8N por tenant — janela {d.windowDays}d.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="365">365 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching?"animate-spin":""}`}/>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Tenants ativos" value={fmt(d.totals.tenants)} />
        <Kpi label="Módulos catalogados" value={fmt(d.totals.modules)} />
        <Kpi label="Módulos / tenant (média)" value={d.totals.avgModulesPerTenant.toFixed(1)} />
        <Kpi label="Tenants sem módulos" value={fmt(d.totals.tenantsWithoutModules)} tone={d.totals.tenantsWithoutModules>0?"warn":"ok"} />
        <Kpi label="N8N runs" value={fmt(d.totals.n8nRuns)} hint={`${d.totals.n8nActiveTenants} tenants ativos`} />
        <Kpi label="N8N falhas" value={pct(d.totals.n8nFailureRate)} tone={d.totals.n8nFailureRate>=10?"bad":d.totals.n8nFailureRate>=3?"warn":"ok"} />
        <Kpi label="Gerações de IA" value={fmt(d.totals.aiGenerations)} hint={`${d.totals.aiActiveTenants} tenants usando IA`} />
        <Kpi label="Feature flags ativas" value={fmt(d.totals.flagsActive)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4"/> Adoção por módulo (Top 30)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.moduleAdoption.map((m) => (
              <div key={m.slug} className="space-y-1">
                <div className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {m.isCore && <Badge variant="secondary" className="text-[10px]">core</Badge>}
                    <span className="truncate">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                    <span>{m.tenants}</span>
                    <span className="w-12 text-right font-medium text-foreground">{pct(m.adoptionPct)}</span>
                  </div>
                </div>
                <Bar pct={m.adoptionPct} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flag className="h-4 w-4"/> Feature flags mais ativadas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.flagsUsage.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma flag em uso.</p> :
              d.flagsUsage.map((f) => (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="truncate font-mono text-xs">{f.label || f.key}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                      <span>{f.tenants}</span>
                      <span className="w-12 text-right font-medium text-foreground">{pct(f.adoptionPct)}</span>
                    </div>
                  </div>
                  <Bar pct={f.adoptionPct} />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Workflow className="h-4 w-4"/> Top workflows N8N</CardTitle></CardHeader>
          <CardContent>
            {d.topWorkflows.length === 0 ? <p className="text-sm text-muted-foreground">Sem execuções.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Workflow</th><th className="text-right">Runs</th><th className="text-right">Falhas</th><th className="text-right">Erro %</th></tr>
                </thead>
                <tbody>
                  {d.topWorkflows.map((w) => (
                    <tr key={w.workflow} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs truncate max-w-[260px]">{w.workflow}</td>
                      <td className="text-right tabular-nums">{w.runs}</td>
                      <td className="text-right tabular-nums text-destructive">{w.failures}</td>
                      <td className="text-right tabular-nums">{pct(w.failureRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4"/> Uso de IA</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Por modelo</div>
              {Object.keys(d.aiByModel).length === 0 ? <p className="text-xs text-muted-foreground">Sem gerações.</p> :
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(d.aiByModel).map(([m,c]) => (
                    <div key={m} className="flex justify-between"><span className="text-muted-foreground truncate">{m}</span><span className="tabular-nums">{c}</span></div>
                  ))}
                </div>}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Por status</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(d.aiByStatus).map(([s,c]) => (
                  <div key={s} className="flex justify-between"><span className="text-muted-foreground">{s}</span><span className="tabular-nums">{c}</span></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top tenants por engajamento</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b">
              <tr><th className="py-2">Tenant</th><th className="text-right">Módulos</th><th className="text-right">N8N runs</th><th className="text-right">Falhas</th><th className="text-right">Latência média</th></tr>
            </thead>
            <tbody>
              {d.topTenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 truncate max-w-[280px]">{t.name}</td>
                  <td className="text-right tabular-nums">{t.modules}</td>
                  <td className="text-right tabular-nums">{t.n8nRuns}</td>
                  <td className="text-right tabular-nums text-destructive">{t.n8nFailures}</td>
                  <td className="text-right tabular-nums">{t.avgLatencyMs != null ? `${t.avgLatencyMs}ms` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
