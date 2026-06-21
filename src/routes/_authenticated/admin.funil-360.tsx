import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Magnet, Target, MessageSquare, Shield, Rocket } from "lucide-react";
import { getFunil360 } from "@/lib/funil-360.functions";

export const Route = createFileRoute("/_authenticated/admin/funil-360")({
  component: Funil360Page,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${v.toFixed(1)}%`;

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
      <div className="p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" /> Carregando funil…
      </div>
    );
  }

  const { stages, conversions, bottlenecks } = data;
  const stageList = [
    { key: "captar", label: "CAPTAR", icon: Magnet, color: "text-blue-500", bg: "bg-blue-500/10", main: stages.captar.leads, sub: `Leads · ${stages.captar.growth_pct >= 0 ? "+" : ""}${stages.captar.growth_pct.toFixed(0)}% vs período anterior` },
    { key: "converter", label: "CONVERTER", icon: Target, color: "text-amber-500", bg: "bg-amber-500/10", main: stages.converter.trials, sub: `${stages.converter.opportunities} oportunidades · ${stages.converter.converted} convertidos` },
    { key: "relacionar", label: "RELACIONAR", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10", main: stages.relacionar.total_engagement, sub: `${stages.relacionar.messages_sent} msgs · ${stages.relacionar.appointments_done} atendimentos` },
    { key: "reter", label: "RETER", icon: Shield, color: "text-green-500", bg: "bg-green-500/10", main: stages.reter.active_contracts, sub: `MRR ${fmt(stages.reter.mrr)}` },
    { key: "expandir", label: "EXPANDIR", icon: Rocket, color: "text-pink-500", bg: "bg-pink-500/10", main: stages.expandir.premium_active, sub: `Premium ativos · ${fmt(stages.expandir.mp_revenue)} MP` },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil Impulsionando 360º</h1>
          <p className="text-sm text-muted-foreground">
            Captar → Converter → Relacionar → Reter → Expandir. Visão única cross-tenant.
          </p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </header>

      {/* Funil visual */}
      <section className="grid gap-3 md:grid-cols-5">
        {stageList.map((s, i) => (
          <Card key={s.key} className="p-4 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 ${s.bg} rounded-bl-full opacity-60`} />
            <div className="relative">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" /> {i + 1}. {s.label}
              </div>
              <div className="text-3xl font-bold mt-2">{s.main.toLocaleString("pt-BR")}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">{s.sub}</div>
            </div>
          </Card>
        ))}
      </section>

      {/* Taxas de conversão */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Taxas de Conversão entre Etapas</h2>
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
                  <span className={healthy ? "text-green-600" : "text-amber-600"}>
                    {pct(c.value)} {healthy ? <TrendingUp className="inline w-3 h-3" /> : <TrendingDown className="inline w-3 h-3" />}
                    <span className="text-muted-foreground ml-1">/ meta {pct(c.bench)}</span>
                  </span>
                </div>
                <Progress value={Math.min(100, (c.value / Math.max(c.bench, 1)) * 100)} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Gargalos detectados */}
      {bottlenecks.length > 0 && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold">Gargalos detectados ({bottlenecks.length})</h2>
          </div>
          <div className="space-y-2">
            {bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="font-medium">{b.metric}</div>
                  <div className="text-xs text-muted-foreground">Etapa {b.stage}</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <Badge variant={b.severity === "high" ? "destructive" : "secondary"}>
                    {pct(b.value)} / meta {pct(b.benchmark)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <section className="grid gap-2 sm:grid-cols-3">
        <Button asChild variant="outline" size="sm"><Link to="/marketing/leads">Captar (Leads)</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/cobrancas">Reter (Cobranças)</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/core/consumidor-premium">Expandir (Premium)</Link></Button>
      </section>
    </div>
  );
}
