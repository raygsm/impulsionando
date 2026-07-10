import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCrmHealth } from "@/lib/crm-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KanbanSquare,
  RefreshCw,
  Target,
  TrendingUp,
  Activity,
  XCircle,
} from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  ErrorState,
} from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/crm-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar CRM & Pipeline"
          description={error.message}
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
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function Page() {
  const fn = useServerFn(getCrmHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "crm-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando CRM & Pipeline…" />
      </div>
    );
  }
  if (!data) return null;
  const o = data.opportunities;
  const winTone: "positive" | "warning" | "critical" =
    o.winRate >= 40 ? "positive" : o.winRate >= 25 ? "warning" : "critical";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="CRM & Pipeline"
        description="Leads, oportunidades, funil, win rate e atividades."
        actions={
          <>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-32" aria-label="Janela de análise">
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

      <CoreSection title="Indicadores do período" description={`Janela de ${data.window.days} dias.`}>
        <KpiGrid columns={4}>
          <MetricCard
            label="Novos leads"
            value={formatInt(data.leads.total)}
            hint={`${formatInt(data.leads.qualified)} qualificados · score ${data.leads.avgScore.toFixed(0)}`}
          />
          <MetricCard
            icon={<Target className="h-4 w-4" />}
            label="Pipeline aberto"
            value={formatBRL(o.pipelineValue)}
            hint={`${formatInt(o.open)} oportunidades`}
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Win rate"
            tone={winTone}
            value={
              <Badge
                variant={winTone === "positive" ? "default" : winTone === "warning" ? "secondary" : "destructive"}
                className="text-base tabular-nums"
              >
                {formatPct(o.winRate, { basis100: true })}
              </Badge>
            }
            hint={`${formatInt(o.won)} ganhas · ${formatInt(o.lost)} perdidas`}
          />
          <MetricCard
            label="Ticket médio"
            value={formatBRL(o.avgDealSize)}
            hint={`Ciclo ${o.avgCycleDays.toFixed(0)}d`}
          />
          <MetricCard
            label="Receita ganha"
            tone="positive"
            value={formatBRL(o.wonValue)}
            hint={`Perdida ${formatBRL(o.lostValue)}`}
          />
          <MetricCard
            icon={<Activity className="h-4 w-4" />}
            label="Atividades"
            value={formatInt(data.activities.total)}
            hint={`${formatInt(data.activities.done)} concluídas · ${formatInt(data.activities.overdue)} atrasadas`}
          />
          <MetricCard
            label="Pipelines"
            value={
              <>
                {formatInt(data.pipelines.active)}
                <span className="text-sm text-muted-foreground">
                  /{formatInt(data.pipelines.total)}
                </span>
              </>
            }
            hint="Ativos / cadastrados"
          />
          <MetricCard
            label="Novas no período"
            value={formatInt(o.inWindow)}
            hint="Oportunidades criadas"
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KanbanSquare className="h-4 w-4" aria-hidden="true" />
              Funil (oportunidades abertas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.funnel.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="text-right tabular-nums">{formatInt(s.count)}</td>
                    <td className="text-right font-medium tabular-nums">{formatBRL(s.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
              Motivos de perda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.lostReasons.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{r.reason}</td>
                    <td className="text-right tabular-nums">{formatInt(r.count)}</td>
                    <td className="text-right text-destructive tabular-nums">{formatBRL(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <CoreSection title="Top origens de leads">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data.leads.topSources.map((s) => (
            <div key={s.source} className="p-3 rounded-md bg-muted/30">
              <div className="text-xs text-muted-foreground">{s.source}</div>
              <div className="text-lg font-bold tabular-nums">{formatInt(s.count)}</div>
            </div>
          ))}
        </div>
      </CoreSection>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
