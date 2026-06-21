import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { fetchN8nConsole, requeueFailedDispatch } from "@/lib/n8n-console.functions";

export const Route = createFileRoute("/_authenticated/admin/n8n-console")({
  head: () => ({ meta: [{ title: "Console N8N — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: N8nConsolePage,
});

function N8nConsolePage() {
  const fetchFn = useServerFn(fetchN8nConsole);
  const requeueFn = useServerFn(requeueFailedDispatch);
  const [workflow, setWorkflow] = useState("");
  const [status, setStatus] = useState("");
  const [days, setDays] = useState(7);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["n8n-console", workflow, status, days],
    queryFn: () => fetchFn({ data: { workflow: workflow || undefined, status: status || undefined, days } }),
    staleTime: 30_000,
  });

  async function retry(id: string) {
    try { await requeueFn({ data: { id } }); toast.success("Reenfileirado"); refetch(); }
    catch (e: any) { toast.error(e.message); }
  }

  const d = data as any;
  const totals = d?.summary?.reduce((a: any, r: any) => ({
    total: a.total + r.total, ok: a.ok + r.ok, failed: a.failed + r.failed, retry: a.retry + r.retry,
  }), { total: 0, ok: 0, failed: 0, retry: 0 }) ?? { total: 0, ok: 0, failed: 0, retry: 0 };
  const okRate = totals.total ? ((100 * totals.ok) / totals.total).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Console N8N" description="Telemetria de execução de workflows N8N e retry de disparos do funil que falharam." />

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs space-y-1">Workflow<Input value={workflow} onChange={(e) => setWorkflow(e.target.value)} placeholder="ex: bar.aniversario" className="w-56" /></label>
        <label className="text-xs space-y-1">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-32">
            <option value="">todos</option><option>ok</option><option>failed</option><option>retry</option><option>skipped</option><option>received</option>
          </select>
        </label>
        <label className="text-xs space-y-1">Janela (dias)<Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value) || 7)} className="w-24" /></label>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar"}</Button>
      </Card>

      {isLoading || !d ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>
      ) : error ? (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Execuções" value={totals.total} hint={`Janela ${days}d`} />
            <KpiCard label="Sucesso" value={totals.ok} hint={`Taxa ${okRate}%`} />
            <KpiCard label="Falhas" value={totals.failed} />
            <KpiCard label="Retry" value={totals.retry} />
          </div>

          <Card className="p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Por workflow</h3>
            {d.summary.length === 0 ? <p className="text-xs text-muted-foreground">Sem execuções no período.</p> : (
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground"><tr>
                  <th className="py-1">Workflow</th><th className="text-right">Total</th><th className="text-right">OK</th><th className="text-right">Fail</th><th className="text-right">Retry</th><th className="text-right">Skip</th><th className="text-right">Latência (ms)</th><th>Última</th>
                </tr></thead>
                <tbody>
                  {d.summary.map((r: any) => (
                    <tr key={r.workflow} className="border-t">
                      <td className="py-1.5 font-mono">{r.workflow}</td>
                      <td className="text-right">{r.total}</td>
                      <td className="text-right text-emerald-700">{r.ok}</td>
                      <td className="text-right text-rose-700">{r.failed}</td>
                      <td className="text-right">{r.retry}</td>
                      <td className="text-right text-muted-foreground">{r.skipped}</td>
                      <td className="text-right font-mono">{r.avgLatency}</td>
                      <td className="text-muted-foreground">{String(r.lastSeen).slice(0,16).replace("T"," ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Execuções recentes (200)</h3>
            {d.runs.length === 0 ? <p className="text-xs text-muted-foreground">Sem execuções.</p> : (
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground"><tr>
                  <th className="py-1">Quando</th><th>Workflow</th><th>Step</th><th>Status</th><th>HTTP</th><th>Canal</th><th className="text-right">Latência</th><th>Erro</th>
                </tr></thead>
                <tbody>
                  {d.runs.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1.5 text-muted-foreground">{String(r.created_at).slice(11,19)}</td>
                      <td className="font-mono truncate max-w-[200px]">{r.workflow_name}</td>
                      <td className="text-muted-foreground">{r.step}</td>
                      <td><Badge variant={r.status === "ok" ? "secondary" : r.status === "failed" ? "destructive" : "outline"}>{r.status}</Badge></td>
                      <td className="font-mono">{r.http_status ?? "—"}</td>
                      <td className="text-muted-foreground">{r.channel ?? "—"}</td>
                      <td className="text-right font-mono">{r.latency_ms ?? "—"}</td>
                      <td className="text-rose-700 truncate max-w-[260px]">{r.error ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Disparos do funil com falha (retry disponível)</h3>
            {d.failedDispatches.length === 0 ? <p className="text-xs text-muted-foreground">Sem disparos pendentes de retry.</p> : (
              <ul className="space-y-1 text-xs">
                {d.failedDispatches.map((f: any) => (
                  <li key={f.id} className="flex items-center justify-between border-b py-1.5 gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <Badge variant="destructive">{f.stage}</Badge>
                      <Badge variant="secondary" className="font-mono">{f.niche_slug ?? "global"}</Badge>
                      <span className="font-mono truncate">{f.workflow_name}</span>
                      <span className="text-muted-foreground truncate">{f.last_error}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">×{f.attempts}</span>
                      <Button size="sm" variant="outline" onClick={() => retry(f.id)}><RotateCw className="h-3 w-3 mr-1" /> Reenfileirar</Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
