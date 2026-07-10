import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRevenueQuality } from "@/lib/revenue-quality.functions";
import { Badge } from "@/components/ui/badge";
import { Gauge, DollarSign, Users, Layers, TrendingUp } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  StatusBanner,
} from "@/components/impulsionando";
import type { MetricTone, BannerTone } from "@/components/impulsionando";
import { formatBRL, formatInt, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/revenue-quality")({
  head: () => ({
    meta: [
      { title: "Qualidade da receita — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RevenueQualityPage,
});

const ALERT_TONE: Record<string, BannerTone> = {
  info: "info",
  warn: "warning",
  danger: "critical",
};

function RevenueQualityPage() {
  const fn = useServerFn(getRevenueQuality);
  const { data, isLoading } = useQuery({
    queryKey: ["revenue-quality"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <LoadingState label="Consultando qualidade da receita…" />
      </div>
    );
  }

  const k = data.kpis;
  const concentrationTone: MetricTone =
    k.top10Share >= 70 ? "critical" : k.top10Share >= 50 ? "warning" : "positive";
  const recurringTone: MetricTone =
    k.recurringShare >= 80 ? "positive" : k.recurringShare >= 60 ? "warning" : "critical";
  const maxTop = Math.max(...data.top10.map((t) => t.mrr), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <PageHeader
        eyebrow="Qualidade financeira"
        title="Qualidade da receita"
        description="Recorrência, concentração e diversificação da base de contratos ativos."
        actions={<Gauge className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
      />

      {data.alerts.length > 0 && (
        <div className="space-y-2" role="region" aria-label="Alertas de qualidade da receita">
          {data.alerts.map((a, i) => (
            <StatusBanner
              key={i}
              tone={ALERT_TONE[a.severity] ?? "info"}
              title={a.message}
            />
          ))}
        </div>
      )}

      <KpiGrid columns={3}>
        <MetricCard
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          label="MRR recorrente"
          value={formatBRL(k.recurringMRR)}
          hint={`${formatInt(k.activeContracts)} contratos ativos`}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          label="Recorrência (90d)"
          value={`${k.recurringShare}%`}
          tone={recurringTone}
          hint={`${k.oneOffShare}% avulso`}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          label="Clientes únicos"
          value={formatInt(k.uniqueCustomers)}
          hint={`Maior cliente = ${k.top1Share}%`}
        />
        <MetricCard
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
          label="Top 10 share"
          value={`${k.top10Share}%`}
          tone={concentrationTone}
          hint={`HHI ${k.hhi}`}
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          label="Receita paga (90d)"
          value={formatBRL(k.paid90)}
        />
        <MetricCard
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
          label="Idade média de contrato"
          value={`${k.avgContractAgeMonths}m`}
          hint={`${k.matureShare}% com 12 meses ou mais`}
        />
      </KpiGrid>

      <CoreSection title="Top 10 clientes por MRR" description="Ordenado por receita recorrente atribuída.">
        {data.top10.length === 0 ? (
          <EmptyState
            title="Sem contratos ativos"
            description="Nenhum cliente possui contrato recorrente ativo no momento."
          />
        ) : (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            {data.top10.map((t, i) => (
              <div key={t.company_id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 text-sm">
                <span className="text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.company_name}</div>
                  <div
                    className="h-1.5 bg-muted rounded mt-1 overflow-hidden"
                    role="img"
                    aria-label={`Participação de ${t.company_name}: ${((t.mrr / maxTop) * 100).toFixed(0)}% do maior cliente`}
                  >
                    <div className="h-full bg-primary" style={{ width: `${(t.mrr / maxTop) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{formatBRL(t.mrr)}</div>
                  <div className="text-xs text-muted-foreground">
                    {k.recurringMRR > 0 ? ((t.mrr / k.recurringMRR) * 100).toFixed(1) : 0}% · {t.niche}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CoreSection>

      <div className="grid gap-4 md:grid-cols-2">
        <CoreSection title="Receita por nicho" description="Distribuição do MRR por segmento de cliente.">
          {data.byNiche.length === 0 ? (
            <EmptyState variant="compact" title="Sem receita por nicho" />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <caption className="sr-only">Receita recorrente por nicho</caption>
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left p-2 font-medium">Nicho</th>
                    <th scope="col" className="text-right p-2 font-medium">Clientes</th>
                    <th scope="col" className="text-right p-2 font-medium">MRR</th>
                    <th scope="col" className="text-right p-2 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byNiche.map((n) => (
                    <tr key={n.niche} className="border-b last:border-0">
                      <td className="p-2 font-medium">{n.niche}</td>
                      <td className="p-2 text-right tabular-nums">{formatInt(n.tenants)}</td>
                      <td className="p-2 text-right tabular-nums">{formatBRL(n.mrr)}</td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">
                        {k.recurringMRR > 0 ? ((n.mrr / k.recurringMRR) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CoreSection>

        <CoreSection title="Receita por plano" description="Contratos ativos e MRR por plano contratado.">
          {data.byPlan.length === 0 ? (
            <EmptyState variant="compact" title="Sem receita por plano" />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <caption className="sr-only">Receita recorrente por plano</caption>
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left p-2 font-medium">Plano</th>
                    <th scope="col" className="text-left p-2 font-medium">Tier</th>
                    <th scope="col" className="text-right p-2 font-medium">Contratos</th>
                    <th scope="col" className="text-right p-2 font-medium">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPlan.map((p) => (
                    <tr key={p.plan} className="border-b last:border-0">
                      <td className="p-2 font-medium">{p.plan}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">{p.tier}</Badge>
                      </td>
                      <td className="p-2 text-right tabular-nums">{formatInt(p.contratos)}</td>
                      <td className="p-2 text-right tabular-nums">{formatBRL(p.mrr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CoreSection>
      </div>

      <p className="text-xs text-muted-foreground">
        Gerado em {formatDateTime(data.generatedAt)}. HHI &gt; 2500 = altamente concentrado ·
        &gt; 1500 = moderado · &lt; 1500 = saudável. Top 10 &gt; 70% indica dependência
        crítica de poucos clientes.
      </p>
    </div>
  );
}
