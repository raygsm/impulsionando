import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listMarocasReportRuns } from "@/lib/marocas.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, RefreshCcw, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marocas/cockpit/relatorios-enviados")({
  head: () => ({ meta: [{ title: "Marocas — Histórico de relatórios enviados" }] }),
  component: ReportsHistoryPage,
});

const STATUS_TONE: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  partial: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  error: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};
const STATUS_ICON: Record<string, any> = {
  success: CheckCircle2,
  partial: AlertCircle,
  error: AlertTriangle,
};

function dt(s: string) { return new Date(s).toLocaleString("pt-BR"); }

function ReportsHistoryPage() {
  const list = useServerFn(listMarocasReportRuns);
  const [filter, setFilter] = useState<"" | "dia" | "semana">("");
  const q = useQuery({
    queryKey: ["marocas", "report-runs", filter],
    queryFn: () => list({ data: { period: filter || undefined, limit: 100 } }),
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/marocas/cockpit" className="inline-flex items-center gap-1 text-sm hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar ao cockpit
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Histórico de relatórios enviados
          </h1>
          <div className="ml-auto flex gap-2">
            <Button variant={filter === "" ? "default" : "outline"} size="sm" onClick={() => setFilter("")}>Todos</Button>
            <Button variant={filter === "dia" ? "default" : "outline"} size="sm" onClick={() => setFilter("dia")}>Diário</Button>
            <Button variant={filter === "semana" ? "default" : "outline"} size="sm" onClick={() => setFilter("semana")}>Semanal</Button>
            <Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCcw className="h-4 w-4" /></Button>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          {q.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando histórico...</p>
          ) : (q.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground italic">Nenhum envio registrado ainda. Configure em "Notificações & limiares" e clique em "Enviar agora" ou aguarde o cron.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Quando</th>
                  <th className="text-left p-3">Período</th>
                  <th className="text-left p-3">Cobertura</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Concluídos</th>
                  <th className="text-right p-3">Atrasados</th>
                  <th className="text-left p-3">Canais</th>
                  <th className="text-left p-3">Origem</th>
                  <th className="text-left p-3">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((r: any) => {
                  const Icon = STATUS_ICON[r.status] ?? AlertCircle;
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 tabular-nums">{dt(r.created_at)}</td>
                      <td className="p-3"><Badge variant="outline">{r.period}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(r.range_from).toLocaleDateString("pt-BR")} → {new Date(r.range_to).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <Badge className={STATUS_TONE[r.status] ?? ""}>
                          <Icon className="h-3 w-3 mr-1 inline" />{r.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right tabular-nums">{r.total}</td>
                      <td className="p-3 text-right tabular-nums text-emerald-700">{r.done}</td>
                      <td className="p-3 text-right tabular-nums text-rose-700">{r.late}</td>
                      <td className="p-3 text-xs">{(r.channels ?? []).join(", ")}</td>
                      <td className="p-3 text-xs">
                        <Badge variant="outline">{r.triggered_by}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={r.error ?? ""}>{r.error ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <p className="text-xs text-muted-foreground">
          O cron interno chama <code className="font-mono">/api/public/hooks/marocas-report</code> a cada hora.
          Envios efetivos por WhatsApp/email passam pela fila <code className="font-mono">message_outbox</code>; o status aqui reflete o resultado do enfileiramento.
        </p>
      </div>
    </div>
  );
}
