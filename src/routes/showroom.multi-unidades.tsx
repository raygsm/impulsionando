import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingBag,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Sparkles,
  ArrowRight,
  Layers,
  Lock,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/showroom/multi-unidades")({
  head: () => ({
    meta: [
      { title: "Gestão multi-unidades por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Consolidador de múltiplas filiais: ranking, comparativos, alertas, permissões por unidade e visão consolidada por nicho.",
      },
      { property: "og:title", content: "Multi-unidades — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Painel matricial com KPIs por filial, ranking, alertas operacionais e governança de permissões.",
      },
    ],
  }),
  component: ShowroomMulti,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type View = "consolidado" | "ranking" | "comparativo" | "alertas" | "permissoes";

type Unit = {
  id: string;
  name: string;
  city: string;
  manager: string;
  revenue: number; // R$
  target: number;
  orders: number;
  customers: number;
  satisfaction: number; // 0-100
  growth: number; // % vs período anterior
  status: "ok" | "warn" | "crit";
};

type Alert = { id: string; unit: string; severity: "info" | "warn" | "crit"; title: string; desc: string };
type Role = { id: string; role: string; people: number; scope: string; perms: string[] };

type Cfg = {
  brandLabel: string;
  unitsLabel: string;
  hero: string;
  units: Unit[];
  alerts: Alert[];
  roles: Role[];
  metricLabels: { revenue: string; orders: string; customers: string };
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brandLabel: "Rede Clínica Aurora",
    unitsLabel: "Clínicas",
    hero: "Visão consolidada da rede de clínicas, com governança clínica e financeira por unidade.",
    metricLabels: { revenue: "Faturamento", orders: "Procedimentos", customers: "Pacientes ativos" },
    units: [
      { id: "u1", name: "Aurora Jardins", city: "São Paulo · SP", manager: "Dra. Helena Reis", revenue: 184200, target: 180000, orders: 412, customers: 1820, satisfaction: 94, growth: 12.4, status: "ok" },
      { id: "u2", name: "Aurora Itaim", city: "São Paulo · SP", manager: "Dr. Marcos Lima", revenue: 152300, target: 170000, orders: 358, customers: 1410, satisfaction: 91, growth: 4.1, status: "warn" },
      { id: "u3", name: "Aurora Barra", city: "Rio de Janeiro · RJ", manager: "Dra. Camila Sá", revenue: 168900, target: 160000, orders: 389, customers: 1605, satisfaction: 93, growth: 9.8, status: "ok" },
      { id: "u4", name: "Aurora Savassi", city: "Belo Horizonte · MG", manager: "Dr. Rafael Couto", revenue: 121400, target: 150000, orders: 281, customers: 1108, satisfaction: 88, growth: -3.2, status: "crit" },
      { id: "u5", name: "Aurora Batel", city: "Curitiba · PR", manager: "Dra. Letícia Vega", revenue: 142800, target: 140000, orders: 322, customers: 1240, satisfaction: 92, growth: 7.6, status: "ok" },
    ],
    alerts: [
      { id: "a1", unit: "Aurora Savassi", severity: "crit", title: "Meta abaixo de 80%", desc: "Faturamento 19% abaixo do alvo nos últimos 14 dias." },
      { id: "a2", unit: "Aurora Itaim", severity: "warn", title: "No-show acima do limite", desc: "Taxa de no-show em 14% — meta da rede é até 8%." },
      { id: "a3", unit: "Aurora Jardins", severity: "info", title: "Capacidade próxima do teto", desc: "85% da agenda ocupada nos próximos 30 dias." },
    ],
    roles: [
      { id: "r1", role: "Diretor médico", people: 1, scope: "Toda a rede", perms: ["Todas as unidades", "Financeiro", "Prontuário (leitura)", "Permissões"] },
      { id: "r2", role: "Gerente de unidade", people: 5, scope: "Sua filial", perms: ["Agenda", "CRM", "Caixa", "Relatórios da unidade"] },
      { id: "r3", role: "Recepção", people: 18, scope: "Sua filial", perms: ["Agenda", "Check-in", "Cobrança"] },
      { id: "r4", role: "Profissional clínico", people: 32, scope: "Seus pacientes", perms: ["Prontuário", "Prescrições"] },
    ],
  },
  bares: {
    brandLabel: "Rede Esquina 47",
    unitsLabel: "Casas",
    hero: "Painel para redes de bares e restaurantes: vendas, comandas e operação por casa.",
    metricLabels: { revenue: "Vendas", orders: "Comandas", customers: "Clientes únicos" },
    units: [
      { id: "u1", name: "Esquina Vila Madalena", city: "São Paulo · SP", manager: "Tiago Reis", revenue: 312800, target: 290000, orders: 4820, customers: 2940, satisfaction: 92, growth: 14.1, status: "ok" },
      { id: "u2", name: "Esquina Pinheiros", city: "São Paulo · SP", manager: "Ana Beatriz", revenue: 268900, target: 280000, orders: 4310, customers: 2510, satisfaction: 89, growth: 2.4, status: "warn" },
      { id: "u3", name: "Esquina Leblon", city: "Rio de Janeiro · RJ", manager: "Felipe Marques", revenue: 354200, target: 310000, orders: 5120, customers: 3180, satisfaction: 91, growth: 18.7, status: "ok" },
      { id: "u4", name: "Esquina Moinhos", city: "Porto Alegre · RS", manager: "Bruna Schmidt", revenue: 198400, target: 240000, orders: 3120, customers: 1980, satisfaction: 86, growth: -5.8, status: "crit" },
    ],
    alerts: [
      { id: "a1", unit: "Esquina Moinhos", severity: "crit", title: "Ticket médio em queda", desc: "Queda de 11% no ticket médio nas últimas 3 semanas." },
      { id: "a2", unit: "Esquina Pinheiros", severity: "warn", title: "Estoque de chopp baixo", desc: "Pilsen com 2 barris — projeção de ruptura em 36h." },
      { id: "a3", unit: "Esquina Leblon", severity: "info", title: "Pico de reservas", desc: "Sex/Sáb com lista de espera acima de 30 pessoas." },
    ],
    roles: [
      { id: "r1", role: "Diretor de operações", people: 1, scope: "Toda a rede", perms: ["Todas as casas", "Financeiro", "Compras", "Permissões"] },
      { id: "r2", role: "Gerente de casa", people: 4, scope: "Sua casa", perms: ["PDV", "Estoque", "Equipe", "Relatórios da casa"] },
      { id: "r3", role: "Garçom / atendimento", people: 56, scope: "Sua casa", perms: ["Comandas", "Reservas"] },
      { id: "r4", role: "Bar manager", people: 4, scope: "Sua casa", perms: ["Cardápio", "Estoque de bar", "Mixologia"] },
    ],
  },
  cervejarias: {
    brandLabel: "Lúpulo Norte Brewing Co.",
    unitsLabel: "Fábricas & Taprooms",
    hero: "Consolidador de fábricas, taprooms e centros de distribuição.",
    metricLabels: { revenue: "Receita", orders: "Pedidos B2B", customers: "Pontos de venda" },
    units: [
      { id: "u1", name: "Fábrica Matriz — Joinville", city: "Joinville · SC", manager: "Eng. Daniel Krause", revenue: 1240000, target: 1200000, orders: 612, customers: 184, satisfaction: 95, growth: 9.4, status: "ok" },
      { id: "u2", name: "Taproom Floripa", city: "Florianópolis · SC", manager: "Marina Cruz", revenue: 142800, target: 140000, orders: 0, customers: 2840, satisfaction: 93, growth: 11.2, status: "ok" },
      { id: "u3", name: "CD São Paulo", city: "Barueri · SP", manager: "Ricardo Otto", revenue: 884000, target: 920000, orders: 481, customers: 142, satisfaction: 88, growth: 1.8, status: "warn" },
      { id: "u4", name: "Taproom Pinheiros", city: "São Paulo · SP", manager: "Júlia Kraft", revenue: 168400, target: 160000, orders: 0, customers: 3120, satisfaction: 94, growth: 12.6, status: "ok" },
      { id: "u5", name: "CD Sul — Porto Alegre", city: "Porto Alegre · RS", manager: "Henrique Faller", revenue: 412000, target: 520000, orders: 218, customers: 92, satisfaction: 82, growth: -8.4, status: "crit" },
    ],
    alerts: [
      { id: "a1", unit: "CD Sul — Porto Alegre", severity: "crit", title: "Queda de revendas", desc: "Volume de revenda 21% abaixo da meta mensal." },
      { id: "a2", unit: "CD São Paulo", severity: "warn", title: "SLA de entrega", desc: "SLA de 48h em 84% — meta da rede é 95%." },
      { id: "a3", unit: "Fábrica Matriz", severity: "info", title: "Capacidade produtiva", desc: "Linha 2 em 92% de utilização — avaliar expansão." },
    ],
    roles: [
      { id: "r1", role: "CEO / Diretoria", people: 2, scope: "Grupo todo", perms: ["Tudo", "Financeiro consolidado", "Permissões"] },
      { id: "r2", role: "Gerente industrial", people: 1, scope: "Fábricas", perms: ["Produção", "Qualidade", "Compras"] },
      { id: "r3", role: "Gerente comercial", people: 3, scope: "CDs e revendas", perms: ["Pedidos B2B", "Tabela de preços", "Crédito"] },
      { id: "r4", role: "Atendente taproom", people: 22, scope: "Seu taproom", perms: ["PDV", "Estoque do taproom"] },
    ],
  },
  servicos: {
    brandLabel: "Rede Studio Forma",
    unitsLabel: "Studios",
    hero: "Gestão de redes de academias, studios e franquias de serviço.",
    metricLabels: { revenue: "Receita recorrente", orders: "Sessões", customers: "Alunos ativos" },
    units: [
      { id: "u1", name: "Forma Vila Olímpia", city: "São Paulo · SP", manager: "Carlos Mendes", revenue: 198400, target: 190000, orders: 3240, customers: 412, satisfaction: 93, growth: 8.4, status: "ok" },
      { id: "u2", name: "Forma Moema", city: "São Paulo · SP", manager: "Renata Cruz", revenue: 164200, target: 180000, orders: 2890, customers: 358, satisfaction: 89, growth: 1.2, status: "warn" },
      { id: "u3", name: "Forma Botafogo", city: "Rio de Janeiro · RJ", manager: "Paulo Andrade", revenue: 184800, target: 170000, orders: 3120, customers: 398, satisfaction: 92, growth: 11.7, status: "ok" },
      { id: "u4", name: "Forma Asa Sul", city: "Brasília · DF", manager: "Larissa Costa", revenue: 132400, target: 160000, orders: 2480, customers: 312, satisfaction: 87, growth: -4.6, status: "crit" },
    ],
    alerts: [
      { id: "a1", unit: "Forma Asa Sul", severity: "crit", title: "Churn em alta", desc: "Churn mensal em 6.8% — meta da rede é até 4%." },
      { id: "a2", unit: "Forma Moema", severity: "warn", title: "Conversão de trial", desc: "Conversão de avaliação experimental em 28% (meta 40%)." },
      { id: "a3", unit: "Forma Botafogo", severity: "info", title: "Espera para horário nobre", desc: "Lista de espera em 18h e 19h — avaliar nova turma." },
    ],
    roles: [
      { id: "r1", role: "Diretoria", people: 2, scope: "Rede toda", perms: ["Tudo", "Financeiro", "Permissões"] },
      { id: "r2", role: "Gerente de unidade", people: 4, scope: "Seu studio", perms: ["Agenda", "Alunos", "Equipe", "Relatórios"] },
      { id: "r3", role: "Personal / Professor", people: 38, scope: "Seus alunos", perms: ["Treinos", "Avaliações"] },
      { id: "r4", role: "Recepção", people: 12, scope: "Seu studio", perms: ["Check-in", "Cobrança", "Cadastro"] },
    ],
  },
  ecommerce: {
    brandLabel: "Origem Marketplace",
    unitsLabel: "Lojas físicas + Hubs",
    hero: "Painel para redes omnichannel: lojas físicas, hubs logísticos e canal digital.",
    metricLabels: { revenue: "GMV", orders: "Pedidos", customers: "Clientes únicos" },
    units: [
      { id: "u1", name: "Origem Flagship — SP", city: "São Paulo · SP", manager: "Mariana Faro", revenue: 482000, target: 450000, orders: 1240, customers: 980, satisfaction: 94, growth: 11.8, status: "ok" },
      { id: "u2", name: "Origem Shopping RJ", city: "Rio de Janeiro · RJ", manager: "Henrique Sá", revenue: 318400, target: 340000, orders: 884, customers: 712, satisfaction: 90, growth: 2.1, status: "warn" },
      { id: "u3", name: "Hub Logístico Sul", city: "Curitiba · PR", manager: "Diego Faller", revenue: 612000, target: 600000, orders: 4180, customers: 0, satisfaction: 92, growth: 9.4, status: "ok" },
      { id: "u4", name: "Origem Salvador", city: "Salvador · BA", manager: "Tatiana Reis", revenue: 184000, target: 240000, orders: 612, customers: 498, satisfaction: 85, growth: -7.2, status: "crit" },
    ],
    alerts: [
      { id: "a1", unit: "Origem Salvador", severity: "crit", title: "Conversão de vitrine baixa", desc: "Conversão 1.9% (meta 3.4%) — visitas estáveis." },
      { id: "a2", unit: "Origem Shopping RJ", severity: "warn", title: "Ruptura de estoque (top 10)", desc: "3 SKUs do top 10 zerados — risco de perda de venda." },
      { id: "a3", unit: "Hub Logístico Sul", severity: "info", title: "Pico de pedidos", desc: "Volume 18% acima do previsto — reforçar expedição." },
    ],
    roles: [
      { id: "r1", role: "Diretor omnichannel", people: 1, scope: "Rede toda", perms: ["Tudo", "GMV consolidado", "Permissões"] },
      { id: "r2", role: "Gerente de loja", people: 8, scope: "Sua loja", perms: ["PDV", "Estoque local", "Equipe", "Relatórios"] },
      { id: "r3", role: "Gerente de hub", people: 3, scope: "Seu hub", perms: ["Expedição", "Estoque hub", "Transportadora"] },
      { id: "r4", role: "Vendedor", people: 62, scope: "Sua loja", perms: ["PDV", "CRM (próprios clientes)"] },
    ],
  },
};

const NICHE_LABELS: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Estética",
  bares: "Bares & Restaurantes",
  cervejarias: "Cervejarias",
  servicos: "Serviços & Studios",
  ecommerce: "E-commerce",
};

const STATUS_STYLES: Record<Unit["status"], { dot: string; label: string; cls: string }> = {
  ok: { dot: "bg-emerald-500", label: "Saudável", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  warn: { dot: "bg-amber-500", label: "Atenção", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  crit: { dot: "bg-red-500", label: "Crítico", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

const SEV_STYLES: Record<Alert["severity"], string> = {
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  crit: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ShowroomMulti() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [view, setView] = useState<View>("consolidado");
  const cfg = DATA[niche];

  const totals = useMemo(() => {
    const revenue = cfg.units.reduce((a, u) => a + u.revenue, 0);
    const target = cfg.units.reduce((a, u) => a + u.target, 0);
    const orders = cfg.units.reduce((a, u) => a + u.orders, 0);
    const customers = cfg.units.reduce((a, u) => a + u.customers, 0);
    const satisfaction = Math.round(
      cfg.units.reduce((a, u) => a + u.satisfaction, 0) / cfg.units.length,
    );
    const targetPct = Math.round((revenue / target) * 100);
    return { revenue, target, orders, customers, satisfaction, targetPct };
  }, [cfg.units]);

  const ranking = useMemo(() => [...cfg.units].sort((a, b) => b.revenue - a.revenue), [cfg.units]);
  const maxRev = Math.max(...cfg.units.map((u) => u.revenue));

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Building2 className="h-3 w-3" /> Showroom · Multi-unidades
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Governe a rede inteira em um único painel
            </h1>
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
              Consolide filiais, taprooms, hubs e franquias com ranking, comparativos, alertas e
              permissões granulares — adaptado ao seu nicho.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(Object.keys(NICHE_LABELS) as NicheSlug[]).map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant={niche === slug ? "default" : "outline"}
                  onClick={() => {
                    setNiche(slug);
                    setView("consolidado");
                  }}
                >
                  {NICHE_LABELS[slug]}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{cfg.brandLabel}</strong> · {cfg.units.length}{" "}
              {cfg.unitsLabel.toLowerCase()} · {cfg.hero}
            </p>
          </div>
        </div>
      </section>

      {/* KPIs consolidados */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-3 md:grid-cols-5">
            <ConsolidatedKPI
              icon={<DollarSign className="h-4 w-4" />}
              label={cfg.metricLabels.revenue}
              value={brl(totals.revenue)}
              hint={`${totals.targetPct}% da meta`}
            />
            <ConsolidatedKPI
              icon={<ShoppingBag className="h-4 w-4" />}
              label={cfg.metricLabels.orders}
              value={totals.orders.toLocaleString("pt-BR")}
              hint={`${cfg.units.length} unidades`}
            />
            <ConsolidatedKPI
              icon={<Users className="h-4 w-4" />}
              label={cfg.metricLabels.customers}
              value={totals.customers.toLocaleString("pt-BR")}
              hint="base ativa consolidada"
            />
            <ConsolidatedKPI
              icon={<Trophy className="h-4 w-4" />}
              label="Satisfação média"
              value={`${totals.satisfaction}/100`}
              hint="média ponderada NPS"
            />
            <ConsolidatedKPI
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Alertas ativos"
              value={`${cfg.alerts.length}`}
              hint={`${cfg.alerts.filter((a) => a.severity === "crit").length} críticos`}
              warning={cfg.alerts.some((a) => a.severity === "crit")}
            />
          </div>
        </div>
      </section>

      {/* Sub-nav */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
          {(
            [
              { id: "consolidado", label: "Consolidado", icon: <Layers className="h-3.5 w-3.5" /> },
              { id: "ranking", label: "Ranking", icon: <Trophy className="h-3.5 w-3.5" /> },
              { id: "comparativo", label: "Comparativo", icon: <TrendingUp className="h-3.5 w-3.5" /> },
              { id: "alertas", label: "Alertas", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
              { id: "permissoes", label: "Permissões", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
            ] as { id: View; label: string; icon: React.ReactNode }[]
          ).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition ${
                view === v.id ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/60"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        {view === "consolidado" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cfg.units.map((u) => {
              const pct = Math.round((u.revenue / u.target) * 100);
              const st = STATUS_STYLES[u.status];
              return (
                <Card key={u.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                        <h3 className="font-semibold leading-tight">{u.name}</h3>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {u.city}
                      </div>
                    </div>
                    <Badge className={st.cls}>{st.label}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">{cfg.metricLabels.revenue}</div>
                      <div className="font-semibold">{brl(u.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Meta</div>
                      <div className="font-semibold">{brl(u.target)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{cfg.metricLabels.orders}</div>
                      <div className="font-semibold">{u.orders.toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Crescimento</div>
                      <div
                        className={`inline-flex items-center gap-1 font-semibold ${u.growth >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {u.growth >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {u.growth >= 0 ? "+" : ""}
                        {u.growth.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Atingimento da meta</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-1.5" />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>Gerente: {u.manager}</span>
                    <Button size="sm" variant="ghost" className="h-7">
                      <Eye className="mr-1 h-3.5 w-3.5" /> Abrir
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {view === "ranking" && (
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4 text-amber-500" /> Ranking por {cfg.metricLabels.revenue.toLowerCase()}
              </div>
            </div>
            <ul className="divide-y">
              {ranking.map((u, i) => {
                const pct = Math.round((u.revenue / maxRev) * 100);
                const st = STATUS_STYLES[u.status];
                return (
                  <li key={u.id} className="grid items-center gap-3 p-4 md:grid-cols-[40px_1fr_220px_120px_140px]">
                    <div className="flex items-center gap-2 text-lg font-bold tabular-nums text-muted-foreground">
                      {i === 0 && <Crown className="h-4 w-4 text-amber-500" />}#{i + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.city} · {u.manager}</div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{brl(u.revenue)}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${u.growth >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {u.growth >= 0 ? "+" : ""}
                      {u.growth.toFixed(1)}%
                    </div>
                    <Badge className={`${st.cls} justify-self-start`}>{st.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {view === "comparativo" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3">{cfg.metricLabels.revenue}</th>
                    <th className="px-4 py-3">Meta</th>
                    <th className="px-4 py-3">% Meta</th>
                    <th className="px-4 py-3">{cfg.metricLabels.orders}</th>
                    <th className="px-4 py-3">{cfg.metricLabels.customers}</th>
                    <th className="px-4 py-3">Satisfação</th>
                    <th className="px-4 py-3">Crescimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cfg.units.map((u) => {
                    const pct = Math.round((u.revenue / u.target) * 100);
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.city}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">{brl(u.revenue)}</td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{brl(u.target)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold tabular-nums ${pct >= 100 ? "text-emerald-600" : pct >= 90 ? "text-amber-600" : "text-red-600"}`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{u.orders.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 tabular-nums">{u.customers.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${u.satisfaction}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums">{u.satisfaction}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold tabular-nums ${u.growth >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {u.growth >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {u.growth >= 0 ? "+" : ""}
                            {u.growth.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {view === "alertas" && (
          <div className="space-y-3">
            {cfg.alerts.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-md p-2 ${SEV_STYLES[a.severity]}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={SEV_STYLES[a.severity]}>{a.severity}</Badge>
                      <span className="text-sm font-medium">{a.unit}</span>
                    </div>
                    <h4 className="mt-1 font-semibold">{a.title}</h4>
                    <p className="text-sm text-muted-foreground">{a.desc}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm">Tomar ação</Button>
                    <Button size="sm" variant="ghost">
                      Marcar como visto
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Card className="border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
              Receba alertas inteligentes por WhatsApp, e-mail e Slack — disparados por regras ou
              pela IA da plataforma.
            </Card>
          </div>
        )}

        {view === "permissoes" && (
          <div className="grid gap-4 md:grid-cols-2">
            {cfg.roles.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{r.role}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.people} pessoa{r.people > 1 ? "s" : ""} · escopo: {r.scope}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {r.perms.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            <Card className="border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground md:col-span-2">
              <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-primary" />
              Permissões granulares por unidade, função e até por SKU/serviço. Trilha de auditoria
              completa, compatível com LGPD e SOC2.
            </Card>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Pronto para operar sua rede como uma só empresa?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Consolide unidades, governe permissões e reaja em tempo real. Funciona com
                  franquias, filiais próprias e operações híbridas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="lg">
                  <Link to="/trial">Começar grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/showroom">Voltar ao showroom</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function ConsolidatedKPI({
  icon,
  label,
  value,
  hint,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  warning?: boolean;
}) {
  return (
    <Card className={`p-4 ${warning ? "border-red-500/40 bg-red-500/5" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
