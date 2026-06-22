import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getExpansionEngine } from "@/lib/expansion-engine.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Rocket, TrendingUp, Sparkles, Flame, Layers, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/expansion-engine")({
  head: () => ({
    meta: [
      { title: "Expansion & Upsell Engine — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ExpansionEnginePage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function ExpansionEnginePage() {
  const fn = useServerFn(getExpansionEngine);
  const [minScore, setMinScore] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["expansion-engine", minScore],
    queryFn: () => fn({ data: { minScore } }),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );

  const { kpis, opportunities, topMissingModules } = data;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Rocket className="h-6 w-6" /> Expansion & Upsell Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            Radar de oportunidades de upgrade de plano e cross-sell de módulos por nicho.
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 40, 60, 70].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={minScore === s ? "default" : "outline"}
              onClick={() => setMinScore(s)}
            >
              {s === 0 ? "Todos" : `Score ≥ ${s}`}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Building2} label="Tenants ativos" value={kpis.totalCompanies} />
        <Kpi icon={Sparkles} label="Oportunidades" value={kpis.opportunities} />
        <Kpi icon={TrendingUp} label="Upsell pronto" value={kpis.upsellReady} />
        <Kpi icon={Layers} label="Cross-sell pronto" value={kpis.crossSellReady} />
        <Kpi icon={Flame} label="Hot leads (≥70)" value={kpis.hotLeads} accent="warn" />
        <Kpi icon={TrendingUp} label="MRR potencial" value={BRL(kpis.mrrPotentialEstimate)} accent="ok" />
        <Kpi label="Atividade mediana 30d" value={kpis.medianActivity30d} />
        <Kpi label="Com contrato" value={kpis.withContract} />
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Top módulos recomendados em falta</h2>
        {topMissingModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma lacuna identificada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topMissingModules.map((m) => (
              <div key={m.slug} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.category}</div>
                </div>
                <Badge variant="secondary">{m.tenants} tenants</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-medium mb-3">Oportunidades por tenant</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-2 pr-3">Tenant</th>
                <th className="py-2 pr-3">Nicho</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Plano atual</th>
                <th className="py-2 pr-3">MRR atual</th>
                <th className="py-2 pr-3">Módulos</th>
                <th className="py-2 pr-3">Atividade 30d</th>
                <th className="py-2 pr-3">Sugestão</th>
                <th className="py-2 pr-3">Uplift MRR</th>
                <th className="py-2">Sinais</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.companyId} className="border-t align-top">
                  <td className="py-2 pr-3 font-medium">{o.companyName}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{o.nicheName}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={o.score >= 70 ? "destructive" : o.score >= 40 ? "default" : "secondary"}>
                      {o.score}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">{o.currentPlan ?? "—"}</td>
                  <td className="py-2 pr-3">{BRL(o.currentMrr)}</td>
                  <td className="py-2 pr-3">
                    {o.enabledCount}/{o.includedCount || "∞"}
                    {o.saturation && <Badge className="ml-1" variant="outline">saturado</Badge>}
                  </td>
                  <td className="py-2 pr-3">{o.activity30d}</td>
                  <td className="py-2 pr-3">
                    {o.suggestedPlan ? (
                      <span className="text-xs">
                        {o.suggestedPlan.name}
                        <span className="text-muted-foreground"> · {BRL(o.suggestedPlan.recurring)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">topo do tier</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-emerald-600 font-medium">
                    {o.mrrUpliftEstimate > 0 ? `+${BRL(o.mrrUpliftEstimate)}` : "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {o.signals.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                      {o.missingRecommended.slice(0, 2).map((m) => (
                        <Badge key={m.slug} variant="outline" className="text-[10px]">
                          + {m.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    Nenhuma oportunidade no filtro atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: "ok" | "warn";
}) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className={`text-xl font-semibold ${
          accent === "warn" ? "text-amber-600" : accent === "ok" ? "text-emerald-600" : ""
        }`}
      >
        {value}
      </div>
    </Card>
  );
}
