import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getConversionFunnel } from "@/lib/conversion-funnel.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Filter, Clock } from "lucide-react";
import {
  PageHeader,
  LoadingState,
  ErrorState,
  StatusBanner,
  CoreSection,
  EmptyState,
} from "@/components/impulsionando";
import { formatInt, formatPct, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/conversion-funnel")({
  head: () => ({
    meta: [
      { title: "Conversion Funnel — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ConversionFunnelPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar o funil de conversão"
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

function ConversionFunnelPage() {
  const fn = useServerFn(getConversionFunnel);
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["conversion-funnel", days],
    queryFn: () => fn({ data: { days } }),
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando funil de conversão…" />
      </div>
    );
  }

  const maxStage = Math.max(...data.stages.map((s) => s.value), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <PageHeader
        eyebrow="Analytics"
        title="Conversion Funnel"
        description={`Visitas → Leads → Trials → Convertidos → Retidos (últimos ${formatInt(data.days)} dias).`}
        actions={
          <>
            {[7, 30, 60, 90].map((d) => (
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

      {data.kpis.bottleneck && (
        <StatusBanner
          tone="warning"
          title={`Gargalo detectado: ${data.kpis.bottleneck.stage}`}
          description={
            <>
              taxa {formatPct(data.kpis.bottleneck.rate, { basis100: true })} vs benchmark{" "}
              {formatPct(data.kpis.bottleneck.benchmark, { basis100: true })} (gap −
              {data.kpis.bottleneck.gap}pp).
            </>
          }
        />
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4" aria-hidden="true" /> Funil principal
        </h2>
        <div className="space-y-3">
          {data.stages.map((s, i) => {
            const width = (s.value / maxStage) * 100;
            const trendKey = (["visitas", "leads", "trials", null, null] as const)[i];
            const trendVal = trendKey ? (data.trend as any)[trendKey] : null;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium">{s.label}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {s.rateFromPrev !== null && (
                      <Badge variant="outline" className="text-xs">
                        {formatPct(s.rateFromPrev, { basis100: true })} conv
                      </Badge>
                    )}
                    {trendVal !== null && trendVal !== undefined && (
                      <span
                        className={`flex items-center gap-1 ${
                          trendVal >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        }`}
                      >
                        {trendVal >= 0 ? (
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <TrendingDown className="h-3 w-3" aria-hidden="true" />
                        )}
                        {trendVal > 0 ? "+" : ""}
                        {trendVal}%
                      </span>
                    )}
                    <span className="font-bold tabular-nums w-20 text-right">
                      {formatInt(s.value)}
                    </span>
                  </div>
                </div>
                <div
                  className="h-6 bg-muted rounded overflow-hidden"
                  role="progressbar"
                  aria-valuenow={s.value}
                  aria-valuemin={0}
                  aria-valuemax={maxStage}
                  aria-label={`${s.label}: ${formatInt(s.value)}`}
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.max(2, width)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Lead → Trial"
            value={
              data.kpis.avgLeadToTrialDays === null
                ? "—"
                : `${data.kpis.avgLeadToTrialDays}d`
            }
          />
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Trial → Pago"
            value={
              data.kpis.avgTrialToPaidDays === null
                ? "—"
                : `${data.kpis.avgTrialToPaidDays}d`
            }
          />
          <Stat
            icon={<Filter className="h-4 w-4" />}
            label="Conversão total"
            value={formatPct(data.kpis.overallConversion, { basis100: true })}
          />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <CoreSection title="Por UTM source">
          {data.byUtm.length === 0 ? (
            <EmptyState variant="compact" title="Sem dados nesta janela" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Conversão por UTM source</caption>
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="text-left p-2">Source</th>
                    <th scope="col" className="text-right p-2">Leads</th>
                    <th scope="col" className="text-right p-2">Trials</th>
                    <th scope="col" className="text-right p-2">Conv.</th>
                    <th scope="col" className="text-right p-2">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byUtm.map((u) => (
                    <tr key={u.source} className="border-b last:border-0">
                      <td className="p-2 font-mono text-xs truncate max-w-[140px]">{u.source}</td>
                      <td className="p-2 text-right tabular-nums">{formatInt(u.leads)}</td>
                      <td className="p-2 text-right tabular-nums">{formatInt(u.trials)}</td>
                      <td className="p-2 text-right tabular-nums">{formatInt(u.converted)}</td>
                      <td className="p-2 text-right tabular-nums">
                        <span
                          className={
                            u.conversion >= 10
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : ""
                          }
                        >
                          {formatPct(u.conversion, { basis100: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CoreSection>

        <CoreSection title="Por nicho">
          {data.byNiche.length === 0 ? (
            <EmptyState variant="compact" title="Sem dados nesta janela" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Conversão por nicho</caption>
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="text-left p-2">Nicho</th>
                    <th scope="col" className="text-right p-2">Visitas</th>
                    <th scope="col" className="text-right p-2">Leads</th>
                    <th scope="col" className="text-right p-2">V→L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byNiche.map((n) => (
                    <tr key={n.niche} className="border-b last:border-0">
                      <td className="p-2 font-medium">{n.niche}</td>
                      <td className="p-2 text-right tabular-nums">{formatInt(n.visitas)}</td>
                      <td className="p-2 text-right tabular-nums">{formatInt(n.leads)}</td>
                      <td className="p-2 text-right tabular-nums">
                        {formatPct(n.conversion, { basis100: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CoreSection>
      </div>

      <p className="text-xs text-muted-foreground">
        Gerado em {formatDateTime(data.generatedAt)}. Benchmarks SaaS B2B: V→L 5% · L→T 15% ·
        T→C 20% · C→R 70%. Lead→Trial usa <code>trial.lead_id</code>; Trial→Pago usa{" "}
        <code>converted_at − created_at</code>.
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
