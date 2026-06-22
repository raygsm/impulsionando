import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getJobsQueuesReliabilityHealth } from "@/lib/jobs-queues-reliability-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workflow, RefreshCw, Clock, AlertTriangle, ClipboardList, Flag, Send, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/jobs-queues-reliability-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const sec = (n: number) => n >= 60 ? `${(n/60).toFixed(1)} min` : `${n.toFixed(1)}s`;

function Page() {
  const fn = useServerFn(getJobsQueuesReliabilityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","jobs-queues-reliability-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Workflow className="h-6 w-6 text-primary"/>Jobs, Queues & Reliability</h1>
          <p className="text-sm text-muted-foreground">Filas do funil, cron jobs, runs de relatórios, tarefas operacionais, incidents, SLOs e feature flags.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4"/>Fila do Funil</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.queue.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.queue.sent)} enviados · <span className="text-red-600">{fmt(data.queue.failed)} falhas</span> · {fmt(data.queue.pending)} pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4"/>Latência Média</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sec(data.queue.avgLatencySeconds)}</div><p className="text-xs text-muted-foreground">{fmt(data.queue.highAttempts)} com 3+ tentativas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4"/>Cron Runs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.cron.runs)}</div><p className="text-xs text-muted-foreground"><span className="text-green-600">{fmt(data.cron.success)} ok</span> · <span className="text-red-600">{fmt(data.cron.error)} erro</span> · {sec(data.cron.avgDurationSec)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Relatórios Marocas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.reports.runs)}</div><p className="text-xs text-muted-foreground">{fmt(data.reports.sent)} entregues · {fmt(data.reports.late)} atrasados · {fmt(data.reports.errors)} erros</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Tarefas Contábeis</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.tasks.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.tasks.done)} concluídas · <span className="text-red-600">{fmt(data.tasks.overdue)} atrasadas</span></p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.exports.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.exports.rows)} linhas exportadas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Incidents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.incidents.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.incidents.resolved)} resolvidos · MTTR {sec(data.incidents.mttrMinutes*60)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flag className="h-4 w-4"/>Feature Flags</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.flags.active)}/{fmt(data.flags.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.flags.overrides)} overrides ({fmt(data.flags.overridesEnabled)} on / {fmt(data.flags.overridesDisabled)} off)</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Fila — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.queue.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Fila — Por Estágio</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.queue.byStage.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Fila — Top Nichos</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.queue.byNiche.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">View v_funnel_dispatch_stats</CardTitle></CardHeader>
        <CardContent>
          {data.queue.viewStats.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr className="border-b"><th className="text-left py-2">Stage</th><th className="text-left">Niche</th><th className="text-left">Workflow</th><th className="text-right">Total</th><th className="text-right">Enviados</th><th className="text-right">Falhas</th><th className="text-right">Entrega %</th><th className="text-right">Latência</th></tr></thead>
              <tbody>
              {data.queue.viewStats.map((r: any, i: number) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{r.stage}</td><td>{r.niche_slug ?? "—"}</td><td className="text-xs">{r.workflow_name ?? "—"}</td>
                  <td className="text-right">{fmt(r.total ?? 0)}</td><td className="text-right">{fmt(r.sent ?? 0)}</td>
                  <td className="text-right text-red-600">{fmt(r.failed ?? 0)}</td>
                  <td className="text-right">{r.delivery_rate_pct != null ? Number(r.delivery_rate_pct).toFixed(1) + "%" : "—"}</td>
                  <td className="text-right">{r.avg_latency_seconds != null ? sec(Number(r.avg_latency_seconds)) : "—"}</td>
                </tr>
              ))}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Cron — Top Jobs</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.cron.enqueued)} itens enfileirados no total</p>
          <table className="w-full text-sm"><tbody>
            {data.cron.byJob.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Cron — Últimas Execuções</CardTitle></CardHeader><CardContent>
          <ul className="text-sm space-y-2">
            {data.cron.latest.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {data.cron.latest.map((r) => (
              <li key={r.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between"><strong className="text-xs">{r.job}</strong><span className={`text-xs ${(r.errors ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>{r.status}</span></div>
                <div className="text-xs text-muted-foreground">{r.startedAt ? new Date(r.startedAt).toLocaleString("pt-BR") : "—"} · {fmt(r.enqueued ?? 0)} itens · {fmt(r.errors ?? 0)} erros</div>
                {r.error && <div className="text-xs text-red-600 truncate">{r.error}</div>}
              </li>
            ))}
          </ul>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Relatórios — Status</CardTitle></CardHeader><CardContent>
          <p className="text-xs text-muted-foreground mb-2">{fmt(data.reports.schedulesEnabled)}/{fmt(data.reports.schedules)} schedules ativos</p>
          <table className="w-full text-sm"><tbody>
            {data.reports.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
          </tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tarefas — Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tasks.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tarefas — Prioridade</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.tasks.byPriority.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Exports — Por Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.exports.byKind.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Feature Flags — Categoria</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.flags.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Incidents — Severidade / Status</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <table className="w-full"><tbody>{data.incidents.bySeverity.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table>
            <table className="w-full"><tbody>{data.incidents.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Incidents — Últimos</CardTitle></CardHeader><CardContent>
          <ul className="text-sm space-y-2">
            {data.incidents.latest.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
            {data.incidents.latest.map((r) => (
              <li key={r.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between"><strong className="text-xs">{r.title ?? r.scope}</strong><span className="text-xs">{r.severity} · {r.status}</span></div>
                <div className="text-xs text-muted-foreground">{r.detectedAt ? new Date(r.detectedAt).toLocaleString("pt-BR") : "—"}{r.resolvedAt ? ` → ${new Date(r.resolvedAt).toLocaleString("pt-BR")}` : ""} · {fmt(r.events ?? 0)} eventos</div>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">SLO Targets ({fmt(data.slo.active)}/{fmt(data.slo.total)} ativos)</CardTitle></CardHeader>
        <CardContent>
          {data.slo.targets.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr className="border-b"><th className="text-left py-2">Nome</th><th className="text-left">Escopo</th><th className="text-right">Avail. target (bps)</th><th className="text-right">p95 alvo (ms)</th><th className="text-right">Janela (d)</th><th className="text-right">Ativo</th></tr></thead>
              <tbody>
              {data.slo.targets.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2">{r.name}</td><td className="text-xs">{r.scope}</td>
                  <td className="text-right">{fmt(r.availability_target_bps ?? 0)}</td>
                  <td className="text-right">{fmt(r.latency_p95_target_ms ?? 0)}</td>
                  <td className="text-right">{fmt(r.window_days ?? 0)}</td>
                  <td className="text-right">{r.active ? "✓" : "—"}</td>
                </tr>
              ))}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
