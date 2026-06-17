import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
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
  ArrowRight,
  BarChart3,
  Download,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  FileSpreadsheet,
  FileText,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/showroom/relatorios-avancados")({
  head: () => ({
    meta: [
      { title: "Relatórios avançados (BI) por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "BI com filtros, drilldown por dimensão, comparativos período-a-período e exportação em CSV/PDF — adaptado por nicho.",
      },
      {
        property: "og:title",
        content: "BI & relatórios avançados — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demonstração navegável de inteligência de dados: filtros, drilldown, comparativos e exportação por nicho.",
      },
    ],
  }),
  component: ShowroomRelatoriosAvancados,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type PeriodKey = "7d" | "30d" | "90d" | "ytd";

type Row = {
  dim: string;
  current: number;
  previous: number;
  share?: number;
};

type Cfg = {
  label: string;
  metricLabel: string;
  unit: "currency" | "count";
  dimensions: { key: string; label: string; rows: Row[] }[];
  cohort: { week: string; new: number; ret: number }[];
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtInt = (n: number) => n.toLocaleString("pt-BR");

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas & Saúde",
    metricLabel: "Receita por especialidade",
    unit: "currency",
    dimensions: [
      {
        key: "especialidade",
        label: "Especialidade",
        rows: [
          { dim: "Dermatologia", current: 184500, previous: 152300 },
          { dim: "Cardiologia", current: 162400, previous: 148200 },
          { dim: "Ortopedia", current: 138900, previous: 142100 },
          { dim: "Nutrição", current: 78200, previous: 61400 },
          { dim: "Psicologia", current: 64800, previous: 58900 },
          { dim: "Pediatria", current: 52300, previous: 49800 },
        ],
      },
      {
        key: "convenio",
        label: "Convênio",
        rows: [
          { dim: "Particular", current: 312400, previous: 286500 },
          { dim: "Unimed", current: 184200, previous: 172800 },
          { dim: "Bradesco", current: 96400, previous: 94100 },
          { dim: "Amil", current: 64200, previous: 58300 },
          { dim: "SulAmérica", current: 38900, previous: 41200 },
        ],
      },
      {
        key: "profissional",
        label: "Profissional",
        rows: [
          { dim: "Dra. Helena Costa", current: 148200, previous: 132400 },
          { dim: "Dr. Rafael Lima", current: 162800, previous: 138900 },
          { dim: "Dr. Marcos Vieira", current: 84500, previous: 86200 },
          { dim: "Dra. Júlia Pereira", current: 92100, previous: 78400 },
          { dim: "Dr. Eduardo Tavares", current: 64900, previous: 59800 },
        ],
      },
    ],
    cohort: [
      { week: "S-5", new: 142, ret: 0 },
      { week: "S-4", new: 138, ret: 78 },
      { week: "S-3", new: 156, ret: 92 },
      { week: "S-2", new: 162, ret: 104 },
      { week: "S-1", new: 171, ret: 118 },
      { week: "S0", new: 184, ret: 127 },
    ],
  },
  bares: {
    label: "Bares & Restaurantes",
    metricLabel: "Faturamento por categoria",
    unit: "currency",
    dimensions: [
      {
        key: "categoria",
        label: "Categoria",
        rows: [
          { dim: "Chopps & cervejas", current: 142800, previous: 118200 },
          { dim: "Drinks autorais", current: 98400, previous: 84500 },
          { dim: "Petiscos", current: 78900, previous: 72400 },
          { dim: "Pratos principais", current: 64200, previous: 68900 },
          { dim: "Couvert artístico", current: 32400, previous: 24800 },
        ],
      },
      {
        key: "turno",
        label: "Turno",
        rows: [
          { dim: "Sex 20h–02h", current: 168400, previous: 142800 },
          { dim: "Sáb 18h–03h", current: 184200, previous: 162400 },
          { dim: "Qui 19h–01h", current: 84500, previous: 78200 },
          { dim: "Dom 16h–23h", current: 52800, previous: 58900 },
        ],
      },
      {
        key: "canal",
        label: "Canal de venda",
        rows: [
          { dim: "Salão", current: 268400, previous: 242800 },
          { dim: "Reserva online", current: 142800, previous: 98200 },
          { dim: "Delivery próprio", current: 64500, previous: 58400 },
          { dim: "iFood", current: 48900, previous: 52100 },
        ],
      },
    ],
    cohort: [
      { week: "S-5", new: 312, ret: 0 },
      { week: "S-4", new: 298, ret: 142 },
      { week: "S-3", new: 342, ret: 168 },
      { week: "S-2", new: 386, ret: 184 },
      { week: "S-1", new: 412, ret: 198 },
      { week: "S0", new: 458, ret: 216 },
    ],
  },
  cervejarias: {
    label: "Microcervejarias",
    metricLabel: "Receita por rótulo",
    unit: "currency",
    dimensions: [
      {
        key: "rotulo",
        label: "Rótulo",
        rows: [
          { dim: "IPA Tropical", current: 84200, previous: 68400 },
          { dim: "Pilsen Imperial", current: 72800, previous: 71200 },
          { dim: "Weiss Bávara", current: 62400, previous: 54800 },
          { dim: "Stout Café", current: 48900, previous: 38400 },
          { dim: "Session APA", current: 36500, previous: 32100 },
          { dim: "Sour Frutas Vermelhas", current: 28900, previous: 18400 },
        ],
      },
      {
        key: "canal",
        label: "Canal",
        rows: [
          { dim: "Taproom (presencial)", current: 184200, previous: 158400 },
          { dim: "Clube de assinatura", current: 142500, previous: 118200 },
          { dim: "B2B (bares parceiros)", current: 98400, previous: 84500 },
          { dim: "E-commerce", current: 64200, previous: 52800 },
          { dim: "Eventos corporativos", current: 38900, previous: 24800 },
        ],
      },
      {
        key: "estilo",
        label: "Estilo",
        rows: [
          { dim: "IPA / APA", current: 142500, previous: 118400 },
          { dim: "Lager", current: 98200, previous: 92400 },
          { dim: "Trigo", current: 72800, previous: 64500 },
          { dim: "Stout / Porter", current: 58400, previous: 42800 },
          { dim: "Sour / Especiais", current: 38900, previous: 24500 },
        ],
      },
    ],
    cohort: [
      { week: "S-5", new: 84, ret: 0 },
      { week: "S-4", new: 92, ret: 48 },
      { week: "S-3", new: 108, ret: 62 },
      { week: "S-2", new: 118, ret: 71 },
      { week: "S-1", new: 132, ret: 82 },
      { week: "S0", new: 148, ret: 94 },
    ],
  },
  servicos: {
    label: "Serviços & Reformas",
    metricLabel: "Receita por linha de serviço",
    unit: "currency",
    dimensions: [
      {
        key: "linha",
        label: "Linha de serviço",
        rows: [
          { dim: "Elétrica residencial", current: 184200, previous: 158400 },
          { dim: "Hidráulica", current: 142800, previous: 132400 },
          { dim: "Pintura completa", current: 98400, previous: 84500 },
          { dim: "Reforma de cozinha", current: 264500, previous: 198400 },
          { dim: "Manutenção predial", current: 78900, previous: 82400 },
        ],
      },
      {
        key: "origem",
        label: "Origem do lead",
        rows: [
          { dim: "Indicação", current: 264500, previous: 218400 },
          { dim: "Google Ads", current: 182400, previous: 148200 },
          { dim: "Instagram", current: 98400, previous: 84500 },
          { dim: "Site orgânico", current: 84200, previous: 68400 },
          { dim: "WhatsApp orgânico", current: 64800, previous: 58200 },
        ],
      },
      {
        key: "tecnico",
        label: "Técnico responsável",
        rows: [
          { dim: "André Cardoso", current: 148200, previous: 132400 },
          { dim: "Vinícius Tomé", current: 98400, previous: 84500 },
          { dim: "Renato Silveira", current: 72800, previous: 78400 },
          { dim: "Eduardo Nunes (coord.)", current: 124500, previous: 108400 },
        ],
      },
    ],
    cohort: [
      { week: "S-5", new: 48, ret: 0 },
      { week: "S-4", new: 54, ret: 18 },
      { week: "S-3", new: 62, ret: 24 },
      { week: "S-2", new: 71, ret: 32 },
      { week: "S-1", new: 78, ret: 38 },
      { week: "S0", new: 92, ret: 47 },
    ],
  },
  ecommerce: {
    label: "E-commerce & Varejo",
    metricLabel: "Receita por categoria",
    unit: "currency",
    dimensions: [
      {
        key: "categoria",
        label: "Categoria",
        rows: [
          { dim: "Vestidos", current: 248400, previous: 218400 },
          { dim: "Blusas & camisas", current: 184500, previous: 162800 },
          { dim: "Calçados", current: 142800, previous: 132400 },
          { dim: "Acessórios", current: 78900, previous: 64500 },
          { dim: "Bolsas", current: 92400, previous: 84500 },
        ],
      },
      {
        key: "canal",
        label: "Canal de venda",
        rows: [
          { dim: "Loja física", current: 264500, previous: 248200 },
          { dim: "Site próprio", current: 312400, previous: 268400 },
          { dim: "Instagram Shop", current: 142500, previous: 98400 },
          { dim: "WhatsApp", current: 84200, previous: 72400 },
          { dim: "Marketplace", current: 64800, previous: 78900 },
        ],
      },
      {
        key: "cupom",
        label: "Cupom usado",
        rows: [
          { dim: "Sem cupom", current: 482400, previous: 458200 },
          { dim: "DROP10", current: 184500, previous: 148200 },
          { dim: "FRETE0", current: 132400, previous: 98400 },
          { dim: "VIP15", current: 78900, previous: 64500 },
        ],
      },
    ],
    cohort: [
      { week: "S-5", new: 412, ret: 0 },
      { week: "S-4", new: 458, ret: 184 },
      { week: "S-3", new: 498, ret: 218 },
      { week: "S-2", new: 542, ret: 246 },
      { week: "S-1", new: 586, ret: 268 },
      { week: "S0", new: 642, ret: 296 },
    ],
  },
};

const PERIODS: { key: PeriodKey; label: string; mult: number }[] = [
  { key: "7d", label: "Últimos 7 dias", mult: 0.25 },
  { key: "30d", label: "Últimos 30 dias", mult: 1 },
  { key: "90d", label: "Últimos 90 dias", mult: 2.85 },
  { key: "ytd", label: "Acumulado do ano", mult: 8.4 },
];

function ShowroomRelatoriosAvancados() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [dimIdx, setDimIdx] = useState(0);
  const [drill, setDrill] = useState<string | null>(null);
  const cfg = DATA[niche];
  const dim = cfg.dimensions[dimIdx];
  const mult = PERIODS.find((p) => p.key === period)!.mult;

  const rows = useMemo(() => {
    const arr = dim.rows.map((r) => ({
      ...r,
      current: Math.round(r.current * mult),
      previous: Math.round(r.previous * mult),
    }));
    const total = arr.reduce((a, r) => a + r.current, 0);
    return arr
      .map((r) => ({ ...r, share: total ? r.current / total : 0 }))
      .sort((a, b) => b.current - a.current);
  }, [dim, mult]);

  const totals = useMemo(() => {
    const current = rows.reduce((a, r) => a + r.current, 0);
    const previous = rows.reduce((a, r) => a + r.previous, 0);
    const delta = previous ? ((current - previous) / previous) * 100 : 0;
    return { current, previous, delta };
  }, [rows]);

  const max = Math.max(...rows.map((r) => r.current), 1);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 gap-1">
                <BarChart3 className="h-3 w-3" /> BI & Relatórios avançados
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                Decisões guiadas por dados — não por achismo
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">
                Filtre por período, mude a dimensão de análise, abra drilldown por item e exporte
                em CSV ou PDF. Tudo pronto e adaptado ao seu nicho.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={niche} onValueChange={(v) => { setNiche(v as NicheSlug); setDimIdx(0); setDrill(null); }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DATA) as NicheSlug[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {DATA[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                <SelectTrigger className="w-[200px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros + Export */}
      <section className="container mx-auto px-4 pt-8">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Dimensão:</span>
            {cfg.dimensions.map((d, i) => (
              <Button
                key={d.key}
                size="sm"
                variant={i === dimIdx ? "default" : "outline"}
                onClick={() => { setDimIdx(i); setDrill(null); }}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <FileSpreadsheet className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <Download className="h-4 w-4" /> Agendar e-mail
            </Button>
          </div>
        </Card>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">{cfg.metricLabel} • período atual</p>
            <p className="mt-2 text-2xl font-bold">{fmtBRL(totals.current)}</p>
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                totals.delta >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {totals.delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {totals.delta >= 0 ? "+" : ""}
              {totals.delta.toFixed(1)}% vs. período anterior
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="mt-2 text-2xl font-bold">
              {fmtBRL(Math.round(totals.current / Math.max(rows.length * 60, 1)))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Calculado por transação no período</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Dimensões / itens</p>
            <p className="mt-2 text-2xl font-bold">{rows.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Análise por {dim.label.toLowerCase()}
            </p>
          </Card>
        </div>
      </section>

      {/* Tabela + Drilldown */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{cfg.metricLabel}</h2>
              <Badge variant="outline" className="gap-1">
                <PieChart className="h-3 w-3" /> Participação
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2">{dim.label}</th>
                    <th className="px-3 py-2 text-right">Atual</th>
                    <th className="px-3 py-2 text-right">Anterior</th>
                    <th className="px-3 py-2 text-right">Δ %</th>
                    <th className="px-3 py-2">Share</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const delta = r.previous ? ((r.current - r.previous) / r.previous) * 100 : 0;
                    return (
                      <tr
                        key={r.dim}
                        className={`border-b last:border-0 ${drill === r.dim ? "bg-muted/40" : ""}`}
                      >
                        <td className="px-3 py-2 font-medium">{r.dim}</td>
                        <td className="px-3 py-2 text-right">{fmtBRL(r.current)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {fmtBRL(r.previous)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right text-xs font-medium ${
                            delta >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${(r.current / max) * 100}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs text-muted-foreground">
                              {((r.share ?? 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1"
                            onClick={() => setDrill(drill === r.dim ? null : r.dim)}
                          >
                            Drill <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Drilldown panel */}
          <Card className="h-fit p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">
                {drill ? `Drilldown — ${drill}` : "Selecione um item"}
              </h3>
            </div>
            {drill ? (
              <DrillView item={drill} niche={niche} period={period} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique em "Drill" em qualquer linha da tabela para ver evolução semanal, principais
                origens e o impacto no resultado do período.
              </p>
            )}
          </Card>
        </div>
      </section>

      {/* Cohort de retenção */}
      <section className="container mx-auto px-4 pb-10">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aquisição vs. retenção (últimas 6 semanas)</h2>
            <Badge variant="outline">Cohort semanal</Badge>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {cfg.cohort.map((c) => {
              const maxC = Math.max(...cfg.cohort.map((x) => x.new));
              const newPct = (c.new / maxC) * 100;
              const retPct = (c.ret / maxC) * 100;
              return (
                <div key={c.week} className="rounded-md border p-2">
                  <p className="text-[11px] font-semibold text-muted-foreground">{c.week}</p>
                  <div className="mt-2 flex h-24 items-end gap-1">
                    <div
                      className="w-1/2 rounded-t bg-primary"
                      style={{ height: `${newPct}%` }}
                      title={`Novos: ${c.new}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-emerald-500"
                      style={{ height: `${retPct}%` }}
                      title={`Retornantes: ${c.ret}`}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {fmtInt(c.new)} / {fmtInt(c.ret)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-primary" /> Novos clientes
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Retornantes
            </span>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Da pergunta à resposta em segundos
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Mais de 80 relatórios pré-prontos por nicho, com filtros, drilldown e exportação. O BI
            que sua operação merece, sem custo extra.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Quero ver na minha base</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom">
                Voltar ao hub <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function DrillView({
  item,
  niche,
  period,
}: {
  item: string;
  niche: NicheSlug;
  period: PeriodKey;
}) {
  // Deterministic pseudo-data based on item name
  const seed = item.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const series = Array.from({ length: 8 }).map((_, i) => {
    const base = 40 + ((seed * (i + 3)) % 55);
    return base;
  });
  const max = Math.max(...series);
  const origins = [
    { name: "Orgânico", pct: 38 + (seed % 12) },
    { name: "Indicação", pct: 22 + (seed % 9) },
    { name: "Pago", pct: 18 + (seed % 7) },
    { name: "Recompra", pct: 16 + (seed % 5) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">
          Evolução • {PERIODS.find((p) => p.key === period)!.label}
        </p>
        <div className="mt-2 flex h-20 items-end gap-1">
          {series.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary/80"
              style={{ height: `${(v / max) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Origem</p>
        <ul className="space-y-1.5 text-sm">
          {origins.map((o) => (
            <li key={o.name} className="flex items-center gap-2">
              <span className="w-20 text-xs">{o.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-emerald-500" style={{ width: `${o.pct}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-muted-foreground">{o.pct}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border bg-muted/40 p-3 text-xs">
        <p className="font-medium text-foreground">Insight automático</p>
        <p className="mt-1 text-muted-foreground">
          {item} cresceu acima da média do segmento <span className="font-medium">{niche}</span> no
          período. Recomendamos ampliar investimento na origem de melhor desempenho.
        </p>
      </div>
    </div>
  );
}

export default ShowroomRelatoriosAvancados;
