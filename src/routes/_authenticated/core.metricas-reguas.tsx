import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import {
  fetchReguasMetrics,
  fetchReguasFailures,
} from "@/lib/reguas-metrics.functions";

export const Route = createFileRoute("/_authenticated/core/metricas-reguas")({
  head: () => ({
    meta: [
      { title: "Métricas das Réguas — Core" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MetricasReguasPage,
});

const RANGES = [
  { label: "7 d", days: 7 },
  { label: "30 d", days: 30 },
  { label: "90 d", days: 90 },
  { label: "180 d", days: 180 },
];

const REGUA_LABEL: Record<string, { label: string; tone: string }> = {
  captacao: { label: "Captação", tone: "bg-blue-500/10 text-blue-700" },
  conversao: { label: "Conversão", tone: "bg-emerald-500/10 text-emerald-700" },
  relacionamento: { label: "Relacionamento", tone: "bg-purple-500/10 text-purple-700" },
  retencao: { label: "Retenção", tone: "bg-amber-500/10 text-amber-700" },
  outro: { label: "Outro", tone: "bg-muted text-muted-foreground" },
};

function MetricasReguasPage() {
  const [days, setDays] = useState(30);
  const fetchMetrics = useServerFn(fetchReguasMetrics);
  const fetchFailures = useServerFn(fetchReguasFailures);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reguas-metrics", days],
    queryFn: () => fetchMetrics({ data: { days } }) as ReturnType<typeof fetchReguasMetrics>,
  });

  const { data: failures } = useQuery({
    queryKey: ["reguas-failures"],
    queryFn: () => fetchFailures({ data: { limit: 50 } }) as ReturnType<typeof fetchReguasFailures>,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Métricas das Réguas"
        description="Captação · Conversão · Relacionamento · Retenção — agregado de N8N + funil interno."
      />

      <div className="flex items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.days}
            variant={days === r.days ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      ) : null}

      {isLoading || !data ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
      ) : (
        <>
          {/* Funil consolidado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Leads (captação)" value={data.capacao.leads.toLocaleString("pt-BR")} />
            <KpiCard
              label="Trial → pago"
              value={`${data.conversao.trialConvRate}%`}
              hint={`${data.conversao.trialsConverted}/${data.conversao.trialsStarted}`}
            />
            <KpiCard
              label="Faturas pagas"
              value={data.conversao.invoicesPaid.toLocaleString("pt-BR")}
              hint={`R$ ${(data.conversao.paidRevenueCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            />
            <KpiCard
              label="Churn no período"
              value={`${data.retencao.churnRate}%`}
              hint={`${data.retencao.cancelledSubs} cancel · ${data.retencao.activeSubs} ativas`}
              tone={data.retencao.churnRate > 5 ? "warn" : "ok"}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Faturas em aberto"
              value={data.conversao.invoicesOpen.toLocaleString("pt-BR")}
            />
            <KpiCard
              label="Faturas vencidas"
              value={data.conversao.invoicesOverdue.toLocaleString("pt-BR")}
              tone={data.conversao.invoicesOverdue > 0 ? "warn" : "ok"}
            />
            <KpiCard label="Trials perdidos" value={data.conversao.trialsLost.toLocaleString("pt-BR")} />
            <KpiCard
              label="Eventos N8N"
              value={data.n8n.totalEvents.toLocaleString("pt-BR")}
            />
          </div>

          {/* Por régua */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Réguas N8N — saúde por jornada</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Régua</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">OK</th>
                    <th className="py-2 text-right">Retry</th>
                    <th className="py-2 text-right">Failed</th>
                    <th className="py-2 text-right">Taxa sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.n8n.byRegua).map(([regua, m]) => {
                    const rate = m.total > 0 ? Math.round((m.ok / m.total) * 1000) / 10 : 0;
                    const meta = REGUA_LABEL[regua] ?? REGUA_LABEL.outro;
                    return (
                      <tr key={regua} className="border-t border-border">
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-2 text-right">{m.total}</td>
                        <td className="py-2 text-right text-emerald-600">{m.ok}</td>
                        <td className="py-2 text-right text-amber-600">{m.retry}</td>
                        <td className="py-2 text-right text-destructive">{m.failed}</td>
                        <td className="py-2 text-right font-medium">{rate}%</td>
                      </tr>
                    );
                  })}
                  {Object.keys(data.n8n.byRegua).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground text-xs">
                        Nenhum evento de N8N registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Por workflow */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Workflows — por nome</h3>
            <div className="space-y-2">
              {Object.entries(data.n8n.byWorkflow)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 20)
                .map(([name, m]) => {
                  const rate = m.total > 0 ? Math.round((m.ok / m.total) * 1000) / 10 : 0;
                  const meta = REGUA_LABEL[m.regua] ?? REGUA_LABEL.outro;
                  return (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.tone}`}>
                          {meta.label}
                        </span>
                        <span className="truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{m.total} eventos</span>
                        {m.failed > 0 && (
                          <Badge variant="destructive">{m.failed} falhas</Badge>
                        )}
                        <span className="font-medium text-foreground">{rate}%</span>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(data.n8n.byWorkflow).length === 0 && (
                <p className="text-xs text-muted-foreground">Sem workflows registrados.</p>
              )}
            </div>
          </Card>

          {/* Falhas recentes */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Falhas recentes (últimas 50)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(failures?.items ?? []).map((f) => (
                <div
                  key={f.id}
                  className="text-xs p-2 rounded border border-destructive/30 bg-destructive/5"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{f.workflow_name} · {f.step}</span>
                    <span className="text-muted-foreground">
                      {new Date(f.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {f.contact_email ? `${f.contact_email} · ` : ""}
                    {f.channel ?? "—"}
                  </div>
                  {f.error ? (
                    <div className="mt-1 text-destructive font-mono break-all">{f.error}</div>
                  ) : null}
                </div>
              ))}
              {(failures?.items ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma falha registrada. 🎉</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5"
      : tone === "ok"
        ? "border-emerald-500/30"
        : "";
  return (
    <Card className={`p-4 ${toneCls}`}>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground mt-0.5">{hint}</div> : null}
    </Card>
  );
}
