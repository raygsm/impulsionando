import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listReliabilityAlerts,
  triggerReliabilitySweep,
  type ReliabilityAlertRow,
} from "@/lib/reliability-alerts.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCircle2, RefreshCw, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reliability-alerts")({
  head: () => ({ meta: [{ title: "Alertas de Confiabilidade — Impulsionando" }] }),
  component: Page,
});

function statusBadge(s: ReliabilityAlertRow["status"]) {
  return s === "open" ? (
    <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
      <AlertOctagon className="h-3 w-3 mr-1" /> Aberto
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
      <CheckCircle2 className="h-3 w-3 mr-1" /> Resolvido
    </Badge>
  );
}

function fmt(dt: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("pt-BR");
  } catch {
    return dt;
  }
}

function Page() {
  const listFn = useServerFn(listReliabilityAlerts);
  const sweepFn = useServerFn(triggerReliabilitySweep);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reliability-alerts"],
    queryFn: () => listFn(),
  });

  const sweep = useMutation({
    mutationFn: () => sweepFn(),
    onSuccess: (res: any) => {
      toast.success(
        `Sweep concluído: ${res?.opened ?? 0} aberto(s), ${res?.resolved ?? 0} resolvido(s).`,
      );
      qc.invalidateQueries({ queryKey: ["reliability-alerts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao executar sweep"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Confiabilidade"
        description="Disparados automaticamente quando o score de um tenant cai abaixo de 70. Resolvem quando volta a ≥ 80."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/reliability">Abrir Scorecard</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => sweep.mutate()}
              disabled={sweep.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${sweep.isPending ? "animate-spin" : ""}`} />
              Executar sweep
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <Kpi
          icon={<BellRing className="h-4 w-4 text-destructive" />}
          label="Alertas abertos"
          value={data?.kpis.open ?? "—"}
        />
        <Kpi
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Resolvidos (histórico)"
          value={data?.kpis.resolved ?? "—"}
        />
        <Kpi
          icon={<AlertOctagon className="h-4 w-4" />}
          label="Total"
          value={data?.kpis.total ?? "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos alertas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
          ) : !data?.rows.length ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhum alerta registrado. O sweep roda a cada 30 minutos via cron.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2">Tenant</th>
                    <th>Status</th>
                    <th className="text-right">Score disparo</th>
                    <th className="text-right">Score resolução</th>
                    <th className="text-right">N8N falhas</th>
                    <th className="text-right">Webhook falhas</th>
                    <th className="text-right">Incidentes</th>
                    <th>Aberto em</th>
                    <th>Resolvido em</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-2 truncate max-w-[220px]">{r.company_name ?? r.company_id}</td>
                      <td>{statusBadge(r.status)}</td>
                      <td className="text-right tabular-nums">
                        {r.triggered_score}{" "}
                        <span className="text-xs text-muted-foreground">({r.triggered_grade})</span>
                      </td>
                      <td className="text-right tabular-nums">
                        {r.resolved_score !== null ? (
                          <>
                            {r.resolved_score}{" "}
                            <span className="text-xs text-muted-foreground">({r.resolved_grade})</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">{r.n8n_failed}</td>
                      <td className="text-right tabular-nums">{r.webhook_failed}</td>
                      <td className="text-right tabular-nums">{r.open_incidents}</td>
                      <td className="text-xs">{fmt(r.created_at)}</td>
                      <td className="text-xs">{fmt(r.resolved_at)}</td>
                      <td className="text-right pr-4">
                        {r.public_slug && (
                          <Link
                            to="/admin/clientes/$slug"
                            params={{ slug: r.public_slug }}
                            className="text-xs text-primary hover:underline"
                          >
                            Abrir 360
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
