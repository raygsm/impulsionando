import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCrmFunnelHealth } from "@/lib/crm-funnel-health.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  KanbanSquare,
  RefreshCw,
  Megaphone,
  UserPlus,
  GitBranch,
  Trophy,
  Activity,
  Banknote,
  Clock,
} from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  ErrorState,
  KeyCountTable,
} from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/crm-funnel-health")({
  head: () => ({
    meta: [
      { title: "CRM & Funil — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar o funil de CRM"
          description="Tente novamente em instantes. Se persistir, avise a equipe de operações."
          detail={error.message}
          action={
            <Button
              size="sm"
              onClick={() => {
                reset();
                router.invalidate();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

function Page() {
  const fn = useServerFn(getCrmFunnelHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "crm-funnel", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando saúde do funil de CRM…" />
      </div>
    );
  }
  if (!data) return null;

  const m = data.marketingLeads;
  const l = data.crmLeads;
  const p = data.pipelines;
  const o = data.opportunities;
  const a = data.activities;

  const winTone =
    o.winRate >= 25 ? "positive" : o.winRate >= 15 ? "warning" : "critical";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="CRM & Funil"
        title="CRM & Funil de Conversão"
        description="Captação → Conversão do funil Impulsionando: leads de marketing, leads CRM, pipelines, oportunidades e atividades."
        actions={
          <>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-32" aria-label="Janela em dias">
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
              aria-label="Atualizar dados"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </>
        }
      />

      <KpiGrid columns={4}>
        <MetricCard
          label="Marketing leads"
          icon={<Megaphone className="h-4 w-4" />}
          value={formatInt(m.total)}
          hint={`conv. ${formatPct(m.convRate, { basis100: true })} (${formatInt(m.converted)})`}
        />
        <MetricCard
          label="CRM leads"
          icon={<UserPlus className="h-4 w-4" />}
          value={formatInt(l.total)}
          hint={`conv. ${formatPct(l.convRate, { basis100: true })} · score ${l.avgScore.toFixed(1)}`}
        />
        <MetricCard
          label="Pipelines"
          icon={<GitBranch className="h-4 w-4" />}
          value={`${formatInt(p.active)}/${formatInt(p.total)}`}
          hint={`${formatInt(p.stagesTotal)} estágios (${formatInt(p.stagesWon)}W / ${formatInt(p.stagesLost)}L)`}
        />
        <MetricCard
          label="Oportunidades"
          icon={<KanbanSquare className="h-4 w-4" />}
          value={formatInt(o.total)}
          hint={`${formatInt(o.companies)} clientes · ${formatInt(o.open)} abertas`}
        />
        <MetricCard
          label="Win-rate"
          icon={<Trophy className="h-4 w-4" />}
          value={formatPct(o.winRate, { basis100: true })}
          hint={`${formatInt(o.won)}W / ${formatInt(o.lost)}L`}
          tone={winTone}
        />
        <MetricCard
          label="Valor ganho"
          icon={<Banknote className="h-4 w-4" />}
          value={formatBRL(o.wonValueBRL)}
          hint={`ticket médio ${formatBRL(o.avgTicketBRL)}`}
          tone="positive"
        />
        <MetricCard
          label="Ciclo médio"
          icon={<Clock className="h-4 w-4" />}
          value={`${o.avgCycleDays.toFixed(1)}d`}
          hint={`pipeline ativo ${formatBRL(o.grossValueBRL)}`}
        />
        <MetricCard
          label="Atividades"
          icon={<Activity className="h-4 w-4" />}
          value={`${formatInt(a.completed)}/${formatInt(a.total)}`}
          hint={`conclusão ${formatPct(a.completionRate, { basis100: true })} · ${formatInt(a.overdue)} atrasadas`}
          tone={a.overdue > 0 ? "warning" : "default"}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CoreSection title="Marketing leads por fonte">
          <KeyCountTable rows={m.bySource} keyLabel="Fonte" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="Marketing leads por status">
          <KeyCountTable rows={m.byStatus} keyLabel="Status" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="Marketing leads por nicho">
          <KeyCountTable rows={m.byNiche} keyLabel="Nicho" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="Marketing — UTM source">
          <KeyCountTable rows={m.byUtmSource} keyLabel="UTM source" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="Marketing — UTM campaign">
          <KeyCountTable rows={m.byUtmCampaign} keyLabel="UTM campaign" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="CRM leads por status">
          <KeyCountTable rows={l.byStatus} keyLabel="Status" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="CRM leads por fonte">
          <KeyCountTable rows={l.bySource} keyLabel="Fonte" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="CRM leads por responsável">
          <KeyCountTable rows={l.byOwner} keyLabel="Responsável" countLabel="Leads" />
        </CoreSection>
        <CoreSection title="Oportunidades por estágio">
          <KeyCountTable rows={o.byStage} keyLabel="Estágio" countLabel="Oportunidades" />
        </CoreSection>
        <CoreSection title="Oportunidades por pipeline">
          <KeyCountTable rows={o.byPipeline} keyLabel="Pipeline" countLabel="Oportunidades" />
        </CoreSection>
        <CoreSection title="Oportunidades por responsável">
          <KeyCountTable rows={o.byOwner} keyLabel="Responsável" countLabel="Oportunidades" />
        </CoreSection>
        <CoreSection title="Oportunidades por status">
          <KeyCountTable rows={o.byStatus} keyLabel="Status" countLabel="Oportunidades" />
        </CoreSection>
        <CoreSection title="Atividades por tipo">
          <KeyCountTable rows={a.byKind} keyLabel="Tipo" countLabel="Atividades" />
        </CoreSection>
        <CoreSection title="Atividades por status">
          <KeyCountTable rows={a.byStatus} keyLabel="Status" countLabel="Atividades" />
        </CoreSection>
        <CoreSection title="Atividades por responsável">
          <KeyCountTable rows={a.byOwner} keyLabel="Responsável" countLabel="Atividades" />
        </CoreSection>
      </div>
    </div>
  );
}
