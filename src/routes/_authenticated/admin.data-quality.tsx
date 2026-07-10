import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDataQuality } from "@/lib/data-quality.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ShieldCheck, Copy as CopyIcon, RefreshCw, Database } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  ErrorState,
  KeyCountTable,
} from "@/components/impulsionando";
import { formatInt, formatPct, formatDateTime } from "@/lib/format";
import type { MetricTone } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/data-quality")({
  head: () => ({
    meta: [
      { title: "Qualidade de dados — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DataQualityPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Erro ao carregar qualidade de dados"
          description="Não foi possível consultar as fontes analíticas nesta janela."
          detail={error.message}
          action={
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function DataQualityPage() {
  const [days, setDays] = useState(90);
  const fetchFn = useServerFn(getDataQuality);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["data-quality", days],
    queryFn: () => fetchFn({ data: { days } }),
  });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <LoadingState label="Consultando qualidade de dados…" />
      </div>
    );
  }

  const d = data;
  const dupTone: MetricTone =
    d.duplicates.dupRate >= 5 ? "critical" : d.duplicates.dupRate >= 2 ? "warning" : "positive";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Observabilidade de dados"
        title="Qualidade de dados & Dedupe"
        description={`Duplicidades, integridade referencial e saúde do mecanismo de dedupe — janela ${d.windowDays} dias.`}
        actions={
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="dq-window" className="sr-only">Janela de análise</label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger id="dq-window" className="w-32" aria-label="Janela de análise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
                <SelectItem value="365">365 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Atualizar qualidade de dados"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            </Button>
          </div>
        }
      />

      <KpiGrid columns={4}>
        <MetricCard
          label="Taxa de duplicidade"
          value={formatPct(d.duplicates.dupRate, { basis100: true, digits: 2 })}
          tone={dupTone}
          hint={`${formatInt(d.duplicates.totalDupRecords)} registros excedentes`}
        />
        <MetricCard
          label="Marketing leads"
          value={formatInt(d.counts.marketingLeads)}
          hint={`${d.duplicates.mlDupEmail} grupos duplicados por e-mail`}
        />
        <MetricCard
          label="CRM leads"
          value={formatInt(d.counts.crmLeads)}
          hint={`${d.duplicates.crmDupEmail + d.duplicates.crmDupPhone + d.duplicates.crmDupDoc} grupos duplicados`}
        />
        <MetricCard
          label="Clientes"
          value={formatInt(d.counts.customers)}
          hint={`${d.duplicates.custDupEmail + d.duplicates.custDupPhone + d.duplicates.custDupDoc} grupos duplicados`}
        />
        <MetricCard
          label="Leads sem origem"
          value={formatInt(d.integrity.mlNoSource + d.integrity.crmNoSource)}
          tone="warning"
          hint="Ação necessária: revisar captação"
        />
        <MetricCard
          label="Leads sem contato"
          value={formatInt(d.integrity.mlNoContact + d.integrity.crmNoContact)}
          tone="warning"
          hint="Sem e-mail nem telefone válido"
        />
        <MetricCard
          label="Clientes órfãos"
          value={formatInt(d.integrity.custOrphan)}
          tone={d.integrity.custOrphan > 0 ? "critical" : "positive"}
          hint="Sem empresa associada"
        />
        <MetricCard
          label="Consumidores sem opt-in"
          value={formatInt(d.integrity.consumerNoOptin)}
          tone="warning"
          hint="Comunicação restrita"
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <CoreSection
          title="Duplicidades por escopo"
          description="Grupos de registros com chave repetida (e-mail, telefone, documento)."
          actions={<CopyIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        >
          <KeyCountTable
            keyLabel="Escopo"
            countLabel="Grupos duplicados"
            ariaLabel="Duplicidades por escopo"
            rows={[
              { k: "Marketing — e-mail", count: d.duplicates.mlDupEmail },
              { k: "CRM — e-mail", count: d.duplicates.crmDupEmail },
              { k: "CRM — telefone", count: d.duplicates.crmDupPhone },
              { k: "CRM — documento", count: d.duplicates.crmDupDoc },
              { k: "Clientes — e-mail", count: d.duplicates.custDupEmail },
              { k: "Clientes — telefone", count: d.duplicates.custDupPhone },
              { k: "Clientes — documento", count: d.duplicates.custDupDoc },
            ]}
            emptyTitle="Sem duplicidades registradas"
            emptyDescription="Nenhum grupo repetido identificado nesta janela."
          />
        </CoreSection>

        <CoreSection
          title="Mecanismo de dedupe"
          description="Configuração ativa e últimos eventos do motor de deduplicação."
          actions={<ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        >
          <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thresholds configurados</span>
              <span className="tabular-nums">{formatInt(d.dedupeEngine.thresholds.length)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eventos recentes</span>
              <span className="tabular-nums">{formatInt(d.dedupeEngine.recentEvents.length)}</span>
            </div>
            {d.dedupeEngine.lastEvent ? (
              <div className="rounded border p-2 bg-muted/30">
                <div className="text-xs text-muted-foreground">Último evento</div>
                <div className="mt-1 flex items-center justify-between">
                  <Badge
                    variant={d.dedupeEngine.lastEvent.state === "ok" ? "secondary" : "destructive"}
                    aria-label={`Estado ${d.dedupeEngine.lastEvent.state}`}
                  >
                    {d.dedupeEngine.lastEvent.state}
                  </Badge>
                  <span className="tabular-nums">
                    {d.dedupeEngine.lastEvent.dedupe_pct?.toFixed?.(2) ?? "—"}%
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(d.dedupeEngine.lastEvent.created_at)} ·{" "}
                  {formatInt(d.dedupeEngine.lastEvent.samples ?? 0)} amostras
                </div>
              </div>
            ) : (
              <EmptyState
                variant="compact"
                title="Sem eventos de dedupe"
                description="O motor ainda não registrou execuções nesta janela."
              />
            )}
            {Object.keys(d.dedupeEngine.stateCount).length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {Object.entries(d.dedupeEngine.stateCount).map(([s, c]) => (
                  <div key={s} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s}</span>
                    <span className="tabular-nums">{formatInt(c as number)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CoreSection>
      </div>

      <CoreSection
        title="Grupos duplicados por chave"
        description="Principais chaves com maior número de ocorrências repetidas."
        actions={<AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      >
        {d.topDuplicates.length === 0 ? (
          <EmptyState
            title="Não foram identificadas inconsistências"
            description="Nenhum grupo duplicado foi detectado nesta janela — a base analisada está consistente."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <caption className="sr-only">Top grupos duplicados por escopo e chave</caption>
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th scope="col" className="py-2 px-3 font-medium">Escopo</th>
                  <th scope="col" className="py-2 px-3 font-medium">Campo</th>
                  <th scope="col" className="py-2 px-3 font-medium">Chave</th>
                  <th scope="col" className="py-2 px-3 font-medium text-right">Ocorrências</th>
                </tr>
              </thead>
              <tbody>
                {d.topDuplicates.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      <Badge variant="outline">{r.scope}</Badge>
                    </td>
                    <td className="py-2 px-3">{r.field}</td>
                    <td className="py-2 px-3 font-mono text-xs truncate max-w-[420px]">{r.key}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium">
                      {formatInt(r.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CoreSection>
    </div>
  );
}
