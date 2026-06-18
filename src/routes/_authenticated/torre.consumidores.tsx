/**
 * /torre/consumidores — Dashboard Consumidor Final (Super Admin).
 *
 * Centraliza tudo o que hoje "some" quando um novo Consumidor entra:
 * cadastros, diagnósticos iniciados, free × premium, nichos buscados, CEPs,
 * parceiros mais visitados, economia gerada e últimos cadastros.
 *
 * É a primeira tela da nova arquitetura orientada a entidades (Fase 1).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchConsumidorDashboard } from "@/lib/core-consumidores.functions";
import { Users, UserPlus, Crown, ClipboardCheck, MapPin, Tag, Building2, Receipt, Star, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/torre/consumidores")({
  component: TorreConsumidoresPage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PCT = (v: number) => `${v.toFixed(1)}%`;

function Trend({ trend }: { trend: { delta: number; deltaPct: number | null } }) {
  const Icon = trend.delta > 0 ? TrendingUp : trend.delta < 0 ? TrendingDown : Minus;
  const color = trend.delta > 0 ? "text-emerald-600" : trend.delta < 0 ? "text-rose-600" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      {trend.delta > 0 ? "+" : ""}{trend.delta}
      {trend.deltaPct !== null && <span className="opacity-70">({trend.deltaPct.toFixed(0)}%)</span>}
    </span>
  );
}

function Kpi({ icon: Icon, label, value, sub, trend }: { icon: typeof Users; label: string; value: string | number; sub?: string; trend?: { delta: number; deltaPct: number | null } }) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
        <span>{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {trend && <Trend trend={trend} />}
      </div>
    </Card>
  );
}

function TorreConsumidoresPage() {
  const fetchDash = useServerFn(fetchConsumidorDashboard);
  const [days, setDays] = useState(30);

  const q = useQuery({
    queryKey: ["torre-consumidores", days],
    queryFn: () => fetchDash({ data: { days } }),
    staleTime: 60_000,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Torre de Controle</div>
          <h1 className="text-2xl font-semibold">Consumidor Final</h1>
          <p className="text-sm text-muted-foreground">
            Visão executiva de todos os consumidores do Clube Impulsionando.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => q.refetch()} disabled={q.isFetching} aria-label="Atualizar">
            <RefreshCw className={`w-4 h-4 ${q.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {q.isLoading && <Card className="p-8 text-center text-muted-foreground">Carregando métricas…</Card>}
      {q.error && <Card className="p-8 text-center text-rose-600">{String((q.error as Error).message)}</Card>}

      {q.data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <Kpi icon={Users} label="Total consumidores" value={q.data.kpis.totalConsumidores.toLocaleString("pt-BR")} />
            <Kpi icon={UserPlus} label="Novos hoje" value={q.data.kpis.novosHoje} sub={`${q.data.kpis.novosNoPeriodo} no período`} trend={q.data.kpis.trendNovos} />
            <Kpi icon={ClipboardCheck} label="Diagnósticos iniciados" value={q.data.kpis.diagnosticosIniciados} sub="no período" trend={q.data.kpis.trendDiag} />
            <Kpi icon={Crown} label="Clube Premium" value={q.data.kpis.clubePremium} sub={`Free: ${q.data.kpis.clubeFree} · Conv. ${PCT(q.data.kpis.conversaoPremium)}`} />
            <Kpi icon={MapPin} label="Visitas no período" value={q.data.kpis.visitasPeriodo} sub={q.data.kpis.ratingMedia > 0 ? `★ ${q.data.kpis.ratingMedia.toFixed(2)}` : "sem avaliações"} trend={q.data.kpis.trendVisitas} />
            <Kpi icon={Tag} label="Cupons utilizados" value={q.data.kpis.cuponsUsados} sub="no período" />
            <Kpi icon={Receipt} label="Economia (período)" value={BRL(q.data.kpis.economiaCentsPeriodo)} sub={`Total: ${BRL(q.data.kpis.economiaCentsTotal)}`} />
            <Kpi icon={Star} label="Avaliações enviadas" value={q.data.kpis.avaliacoesEnviadas} sub={`Indicações OK: ${q.data.kpis.indicacoesAprovadas}`} />
          </section>

          <section className="grid lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Top nichos buscados</h2>
              {q.data.topNichos.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
              ) : (
                <ul className="space-y-1.5">
                  {q.data.topNichos.map((n) => (
                    <li key={n.tag} className="flex items-center justify-between text-sm">
                      <span className="truncate">{n.tag}</span>
                      <Badge variant="secondary">{n.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Top CEPs</h2>
              {q.data.topCeps.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
              ) : (
                <ul className="space-y-1.5">
                  {q.data.topCeps.map((c) => (
                    <li key={c.cep} className="flex items-center justify-between text-sm">
                      <span className="font-mono">{c.cep}</span>
                      <Badge variant="secondary">{c.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Top parceiros visitados</h2>
              {q.data.topParceiros.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
              ) : (
                <ul className="space-y-1.5">
                  {q.data.topParceiros.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm gap-2">
                      <Link to="/companies" search={{ focus: p.id } as never} className="truncate hover:underline">{p.name}</Link>
                      <Badge variant="secondary">{p.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Últimos cadastros</h2>
            {q.data.ultimosCadastros.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum cadastro recente.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr><th className="text-left py-2">Nome</th><th className="text-left">Cidade/UF</th><th className="text-left">CEP</th><th className="text-left">Cadastro</th></tr>
                  </thead>
                  <tbody>
                    {q.data.ultimosCadastros.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{c.full_name}</td>
                        <td>{[c.city, c.state].filter(Boolean).join("/") || "—"}</td>
                        <td className="font-mono text-xs">{c.cep ?? "—"}</td>
                        <td className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
