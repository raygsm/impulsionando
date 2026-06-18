import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/ui/alert";
import {
  fetchAccountHealth,
  computeHealthRecommendations,
  type HealthRecommendation,
} from "@/lib/ops-cockpits.functions";
import { Activity, AlertTriangle, ArrowRight, Info, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ops/saude")({
  head: () => ({
    meta: [
      { title: "Saúde da Conta — Operações" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Erro: {error.message}</p>
        <button className="mt-2 text-xs underline" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Não encontrado.</div>,
  component: SaudePage,
});

function scoreColor(score: number | null) {
  if (score === null) return "bg-muted";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-destructive";
}

function severityIcon(s: HealthRecommendation["severity"]) {
  if (s === "critical") return <ShieldAlert className="h-4 w-4" />;
  if (s === "warning") return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function severityVariant(s: HealthRecommendation["severity"]): "default" | "destructive" {
  return s === "critical" ? "destructive" : "default";
}

function SaudePage() {
  const fn = useServerFn(fetchAccountHealth);
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "health"],
    queryFn: () => fn({ data: {} }),
  });

  const recs = data
    ? computeHealthRecommendations({
        score: data.score,
        dimensions: data.dimensions ?? [],
        signals: data.signals ?? [],
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saúde da Conta"
        description="Score consolidado, alertas e recomendações. Veja a metodologia em Saiba Mais."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Calculando score…</p>
      ) : !data?.companyId ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Selecione/impersone uma empresa para visualizar a saúde da conta.
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${scoreColor(data.score)} text-3xl font-bold text-white`}>
                {data.score}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score geral (0–100)</p>
                <p className="text-lg font-semibold">
                  {data.score! >= 80 ? "Saudável" : data.score! >= 50 ? "Atenção" : "Crítico"}
                </p>
                <Link to="/saiba-mais/saude" className="text-xs underline text-muted-foreground">
                  Como é calculado?
                </Link>
              </div>
            </div>
          </Card>

          {recs.length > 0 && (
            <Card className="p-4 space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Alertas e recomendações ({recs.length})
              </h2>
              <div className="space-y-2">
                {recs.map((r, idx) => (
                  <Alert key={idx} variant={severityVariant(r.severity)}>
                    {severityIcon(r.severity)}
                    <AlertTitle className="flex items-center gap-2">
                      {r.title}
                      <Badge variant="outline" className="text-[10px] capitalize">{r.dimension}</Badge>
                    </AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p>{r.action}</p>
                      {r.link && (
                        <Link
                          to={r.link.to}
                          className="inline-flex items-center gap-1 text-xs underline"
                        >
                          {r.link.label} <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4" /> Dimensões
            </h2>
            <ul className="space-y-3">
              {data.dimensions.map((d) => (
                <li key={d.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>
                      {d.label}{" "}
                      <span className="text-muted-foreground">({Math.round(d.weight * 100)}%)</span>
                    </span>
                    <span className="font-medium">{d.value}/100</span>
                  </div>
                  <Progress value={d.value} className="h-2" />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Sinais (últimos 30 dias)</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.signals.map((s) => (
                <li key={s.label} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span>{s.label}</span>
                  <Badge variant={s.inverse && s.value > 0 ? "destructive" : "outline"}>{s.value}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
