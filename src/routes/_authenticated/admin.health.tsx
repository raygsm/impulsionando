import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Heart, AlertTriangle, ShieldCheck, TrendingDown } from "lucide-react";
import { getTenantHealthScores } from "@/lib/health-score.functions";

export const Route = createFileRoute("/_authenticated/admin/health")({
  component: HealthPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const bandStyle: Record<string, { label: string; cls: string }> = {
  healthy: { label: "Saudável", cls: "bg-green-500/15 text-green-700 dark:text-green-300" },
  at_risk: { label: "Em risco", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  critical: { label: "Crítico", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

function HealthPage() {
  const fetchFn = useServerFn(getTenantHealthScores);
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-health-scores"],
    queryFn: () => fetchFn(),
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" /> Calculando health scores…
      </div>
    );
  }

  const { summary, scores } = data;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500" /> Health Score por Tenant
        </h1>
        <p className="text-sm text-muted-foreground">
          Previsão de churn em 60 dias. Combina pagamento, engajamento, adoção, atividade e attach Premium.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total ativos</div>
          <div className="text-2xl font-bold mt-1">{summary.total}</div>
        </Card>
        <Card className="p-4 border-green-500/30">
          <div className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Saudáveis</div>
          <div className="text-2xl font-bold mt-1">{summary.healthy}</div>
        </Card>
        <Card className="p-4 border-amber-500/30">
          <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Em risco</div>
          <div className="text-2xl font-bold mt-1">{summary.at_risk}</div>
        </Card>
        <Card className="p-4 border-red-500/40">
          <div className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Críticos</div>
          <div className="text-2xl font-bold mt-1">{summary.critical}</div>
          <div className="text-xs text-muted-foreground mt-1">MRR em risco: {fmt(summary.mrr_at_risk)}</div>
        </Card>
      </section>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Ranking (piores primeiro — agir agora)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">Tenant</th>
                <th className="text-left py-2">Score</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">MRR</th>
                <th className="text-left py-2">Sinais</th>
              </tr>
            </thead>
            <tbody>
              {scores.slice(0, 100).map((s) => {
                const b = bandStyle[s.band];
                return (
                  <tr key={s.company_id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 font-medium">{s.company_name}</td>
                    <td className="py-2 w-40">
                      <div className="flex items-center gap-2">
                        <Progress value={s.score} className="h-1.5 flex-1" />
                        <span className="text-xs font-mono">{s.score}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <Badge variant="secondary" className={b.cls}>{b.label}</Badge>
                    </td>
                    <td className="py-2 text-right font-semibold">{fmt(s.mrr)}</td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {s.signals.has_overdue && <span className="text-destructive">vencido · </span>}
                      msgs {s.signals.messages_30d} · mods {s.signals.active_modules}
                      {s.signals.premium_active > 0 && " · premium"}
                      {s.signals.last_paid_days !== null && ` · pago ${s.signals.last_paid_days}d`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
