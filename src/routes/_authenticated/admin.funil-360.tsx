import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Magnet,
  Target,
  MessageSquare,
  Shield,
  Rocket,
} from "lucide-react";
import { getFunil360 } from "@/lib/funil-360.functions";
import {
  PageHeader,
  LoadingState,
  ErrorState,
  CoreSection,
} from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/funil-360")({
  head: () => ({
    meta: [
      { title: "Funil 360º — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Funil360Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar o funil 360º"
          description="Tente novamente em instantes."
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

function Funil360Page() {
  const fetchFn = useServerFn(getFunil360);
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["funil-360", days],
    queryFn: () => fetchFn({ data: { days } }),
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando funil 360º…" />
      </div>
    );
  }

  const { stages, conversions, bottlenecks } = data;
  const stageList = [
    {
      key: "captar",
      label: "CAPTAR",
      icon: Magnet,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      main: stages.captar.leads,
      sub: `Leads · ${stages.captar.growth_pct >= 0 ? "+" : ""}${stages.captar.growth_pct.toFixed(0)}% vs período anterior`,
    },
    {
      key: "converter",
      label: "CONVERTER",
      icon: Target,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      main: stages.converter.trials,
      sub: `${formatInt(stages.converter.opportunities)} oportunidades · ${formatInt(stages.converter.converted)} convertidos`,
    },
    {
      key: "relacionar",
      label: "RELACIONAR",
      icon: MessageSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      main: stages.relacionar.total_engagement,
      sub: `${formatInt(stages.relacionar.messages_sent)} msgs · ${formatInt(stages.relacionar.appointments_done)} atendimentos`,
    },
    {
      key: "reter",
      label: "RETER",
      icon: Shield,
      color: "text-green-500",
      bg: "bg-green-500/10",
      main: stages.reter.active_contracts,
      sub: `MRR ${formatBRL(stages.reter.mrr)}`,
    },
    {
      key: "expandir",
      label: "EXPANDIR",
      icon: Rocket,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      main: stages.expandir.premium_active,
      sub: `Premium ativos · ${formatBRL(stages.expandir.mp_revenue)} MP`,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Growth"
        title="Funil Impulsionando 360º"
        description="Captar → Converter → Relacionar → Reter → Expandir. Visão única cross-cliente."
        actions={
          <>
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                onClick={() => setDays(d)}
                aria-pressed={days === d}
              >
                {d}d
              </Button>
            ))}
          </>
        }
      />

      {/* Funil visual */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {stageList.map((s, i) => (
          <Card key={s.key} className="p-4 relative overflow-hidden">
            <div
              className={`absolute top-0 right-0 w-16 h-16 ${s.bg} rounded-bl-full opacity-60`}
              aria-hidden="true"
            />
            <div className="relative">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" aria-hidden="true" /> {i + 1}. {s.label}
              </div>
              <div className="text-3xl font-bold tabular-nums mt-2">
                {formatInt(s.main)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">{s.sub}</div>
            </div>
          </Card>
        ))}
      </section>

      {/* Taxas de conversão */}
      <CoreSection title="Taxas de conversão entre etapas">
        <div className="space-y-3">
          {[
            { label: "Lead → Oportunidade", value: conversions.lead_opp, bench: 15 },
            { label: "Oportunidade → Trial", value: conversions.opp_trial, bench: 30 },
            { label: "Trial → Contrato", value: conversions.trial_contract, bench: 25 },
          ].map((c) => {
            const healthy = c.value >= c.bench;
            return (
              <div key={c.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c.label}</span>
                  <span className={healthy ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                    {formatPct(c.value, { basis100: true })}{" "}
                    {healthy ? (
                      <TrendingUp className="inline w-3 h-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="inline w-3 h-3" aria-hidden="true" />
                    )}
                    <span className="text-muted-foreground ml-1">
                      / meta {formatPct(c.bench, { basis100: true })}
                    </span>
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (c.value / Math.max(c.bench, 1)) * 100)}
                  className="h-1.5"
                />
              </div>
            );
          })}
        </div>
      </CoreSection>

      {/* Gargalos detectados */}
      {bottlenecks.length > 0 && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold">
              Gargalos detectados ({formatInt(bottlenecks.length)})
            </h2>
          </div>
          <div className="space-y-2">
            {bottlenecks.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <div>
                  <div className="font-medium">{b.metric}</div>
                  <div className="text-xs text-muted-foreground">Etapa {b.stage}</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <Badge variant={b.severity === "high" ? "destructive" : "secondary"}>
                    {formatPct(b.value, { basis100: true })} / meta{" "}
                    {formatPct(b.benchmark, { basis100: true })}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <section className="grid gap-2 grid-cols-1 sm:grid-cols-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/marketing/leads">Captar (Leads)</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/cobrancas">Reter (Cobranças)</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/core/consumidor-premium">Expandir (Premium)</Link>
        </Button>
      </section>
    </div>
  );
}
