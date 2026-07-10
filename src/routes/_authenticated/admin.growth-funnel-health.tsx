import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGrowthFunnelHealth } from "@/lib/growth-funnel-health.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw, TrendingUp, Megaphone, Workflow, FlaskConical } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  ErrorState,
  KeyCountTable,
} from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/growth-funnel-health")({
  head: () => ({
    meta: [
      { title: "Funil de crescimento — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Erro ao carregar funil de crescimento"
          description="Não foi possível consultar as etapas do funil nesta janela."
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

function Page() {
  const fn = useServerFn(getGrowthFunnelHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "growth-funnel-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Consultando funil de crescimento…" />
      </div>
    );
  }
  if (!data) return null;

  const f = data.funnel;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Growth"
        title="Funil de crescimento"
        description="Funil Impulsionando: captar → converter → relacionar → reter → expandir."
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="gf-window" className="sr-only">Janela de análise</label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger id="gf-window" className="w-32" aria-label="Janela de análise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Atualizar funil"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        }
      />

      <CoreSection
        title="Funil consolidado"
        description="Etapas do funil de vendas na janela selecionada."
        actions={<TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      >
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <FunnelStep label="Captação" value={formatInt(f.captacaoTotal)} hint="marketing + demo" />
            <FunnelStep label="CRM leads" value={formatInt(f.crmLeads)} />
            <FunnelStep label="Oportunidades" value={formatInt(f.opportunities)} />
            <FunnelStep label="Ganhas" value={formatInt(f.won)} tone="positive" />
            <FunnelStep label="Perdidas" value={formatInt(f.lost)} tone="critical" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
            <ConvChip label="Visitante → Lead" value={formatPct(f.convVisitToLead)} />
            <ConvChip label="Lead → Oportunidade" value={formatPct(f.convLeadToOpp)} />
            <ConvChip label="Win rate" value={formatPct(f.winRate)} />
            <ConvChip
              label="GMV (ganhas / abertas)"
              value={`${formatBRL(f.gmvWon)} · ${formatBRL(f.gmvOpen)}`}
            />
          </div>
        </div>
      </CoreSection>

      <KpiGrid columns={4}>
        <MetricCard
          icon={<Megaphone className="h-4 w-4" aria-hidden="true" />}
          label="Marketing leads"
          value={formatInt(data.marketing.total)}
          hint={`${formatInt(data.marketing.assigned)} atribuídos`}
        />
        <MetricCard
          label="CRM leads"
          value={formatInt(data.crm.leads)}
          hint={`score médio ${data.crm.avgScore.toFixed(1)} · ${formatInt(data.crm.owned)} com owner`}
        />
        <MetricCard
          label="Pipelines"
          value={`${formatInt(data.crm.activePipelines)} / ${formatInt(data.crm.pipelines)}`}
          hint={`${formatInt(data.crm.stages)} stages`}
        />
        <MetricCard
          label="Atividades CRM"
          value={`${formatInt(data.activities.done)} / ${formatInt(data.activities.total)}`}
          hint={`${formatInt(data.activities.pending)} pendentes`}
        />
        <MetricCard
          icon={<Workflow className="h-4 w-4" aria-hidden="true" />}
          label="Regras de funil"
          value={`${formatInt(data.funnelRules.active)} / ${formatInt(data.funnelRules.total)}`}
          hint="Regras ativas na janela"
        />
        <MetricCard
          label="Fila de disparo"
          value={`${formatInt(data.funnelQueue.sent)} / ${formatInt(data.funnelQueue.total)}`}
          tone={data.funnelQueue.failed > 0 ? "warning" : "default"}
          hint={`${formatInt(data.funnelQueue.pending)} pendentes · ${formatInt(data.funnelQueue.failed)} falhas`}
        />
        <MetricCard
          icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
          label="Visitas de demo"
          value={formatInt(data.demo.visits)}
          hint={`${formatInt(data.demo.converted)} convertidas · ${formatInt(data.demo.abandoned)} abandono`}
        />
        <MetricCard
          label="Sessões de demo"
          value={formatInt(data.demo.sessions)}
          hint={`score ${data.demo.avgScore.toFixed(1)} · ${Math.round(data.demo.avgSessionSec)}s médios`}
        />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <CoreSection title="Marketing leads por status">
          <KeyCountTable
            keyLabel="Status"
            countLabel="Leads"
            ariaLabel="Marketing leads por status"
            rows={data.marketing.statuses}
            emptyTitle="Sem leads na janela"
          />
        </CoreSection>
        <CoreSection title="Origens (source / UTM source)">
          <div className="grid grid-cols-2 gap-3">
            <KeyCountTable
              keyLabel="Source"
              countLabel="Leads"
              ariaLabel="Origem por source"
              rows={data.marketing.sources}
              emptyTitle="Sem origens"
            />
            <KeyCountTable
              keyLabel="UTM source"
              countLabel="Leads"
              ariaLabel="Origem por UTM source"
              rows={data.marketing.utmSources}
              emptyTitle="Sem UTM"
            />
          </div>
        </CoreSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CoreSection title="CRM — status de leads">
          <KeyCountTable
            keyLabel="Status"
            countLabel="Leads"
            ariaLabel="CRM leads por status"
            rows={data.crm.leadStatuses}
            emptyTitle="Sem leads"
          />
        </CoreSection>
        <CoreSection title="CRM — status de oportunidades">
          <KeyCountTable
            keyLabel="Status"
            countLabel="Oportunidades"
            ariaLabel="CRM oportunidades por status"
            rows={data.crm.opportunityStatuses}
            emptyTitle="Sem oportunidades"
          />
        </CoreSection>
        <CoreSection title="Motivos de perda">
          <KeyCountTable
            keyLabel="Motivo"
            countLabel="Ocorrências"
            ariaLabel="Motivos de perda"
            rows={data.crm.lostReasons}
            emptyTitle="Nenhuma perda registrada"
            emptyDescription="Não há motivos de perda registrados no CRM nesta janela."
          />
        </CoreSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CoreSection title="Regras de funil por stage">
          <KeyCountTable
            keyLabel="Stage"
            countLabel="Regras"
            ariaLabel="Regras de funil por stage"
            rows={data.funnelRules.byStage}
            emptyTitle="Sem regras cadastradas"
          />
        </CoreSection>
        <CoreSection title="Fila de disparo por status">
          <KeyCountTable
            keyLabel="Status"
            countLabel="Itens"
            ariaLabel="Fila de disparo por status"
            rows={data.funnelQueue.byStatus}
            emptyTitle="Fila vazia"
          />
        </CoreSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CoreSection title="Visitas de demo por nicho">
          <KeyCountTable
            keyLabel="Nicho"
            countLabel="Visitas"
            ariaLabel="Visitas por nicho"
            rows={data.demo.byNiche}
            emptyTitle="Sem visitas na janela"
          />
        </CoreSection>
        <CoreSection title="Ações de demo por módulo">
          <KeyCountTable
            keyLabel="Módulo"
            countLabel="Ações"
            ariaLabel="Ações por módulo"
            rows={data.demo.actionsByModule}
            emptyTitle="Sem interações"
          />
        </CoreSection>
        <CoreSection title="Interesse de plano (survey)">
          <KeyCountTable
            keyLabel="Plano"
            countLabel="Respostas"
            ariaLabel="Interesse de plano"
            rows={data.demo.surveyByPlan}
            emptyTitle="Sem respostas"
            emptyDescription="Nenhuma survey de interesse foi respondida na janela."
          />
        </CoreSection>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "critical";
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "critical"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="p-3 rounded bg-muted/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ConvChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
