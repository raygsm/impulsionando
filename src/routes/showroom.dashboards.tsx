import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Building2,
  Crown,
  DollarSign,
  LineChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  CalendarCheck,
  Heart,
  Beer,
  ShoppingCart,
  Wrench,
  Stethoscope,
} from "lucide-react";

export const Route = createFileRoute("/showroom/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards simulados por perfil e nicho — Impulsionando" },
      {
        name: "description",
        content:
          "Veja como ficam os dashboards de Super Admin, White Label, Empresa e Consumidor para cada nicho atendido pela Impulsionando.",
      },
      {
        property: "og:title",
        content: "Dashboards simulados por perfil e nicho — Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demonstração navegável de KPIs coerentes para cada perfil e segmento.",
      },
    ],
  }),
  component: ShowroomDashboardsPage,
});

type NichoSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHOS: Array<{
  slug: NichoSlug;
  label: string;
  icon: typeof Heart;
  accent: string;
}> = [
  { slug: "clinicas", label: "Clínicas e Saúde", icon: Stethoscope, accent: "from-emerald-500/20 to-teal-500/20" },
  { slug: "bares", label: "Bares e Restaurantes", icon: Beer, accent: "from-amber-500/20 to-orange-500/20" },
  { slug: "microcervejarias", label: "Microcervejarias", icon: Beer, accent: "from-yellow-500/20 to-amber-600/20" },
  { slug: "servicos", label: "Serviços", icon: Wrench, accent: "from-blue-500/20 to-cyan-500/20" },
  { slug: "ecommerce", label: "E-commerce", icon: ShoppingCart, accent: "from-pink-500/20 to-rose-500/20" },
];

type Kpi = { label: string; value: string; delta?: string; icon: typeof Activity };

const COMPANY_KPIS: Record<NichoSlug, Kpi[]> = {
  clinicas: [
    { label: "Consultas hoje", value: "42", delta: "+8%", icon: CalendarCheck },
    { label: "Taxa de confirmação", value: "94%", delta: "+2pp", icon: ShieldCheck },
    { label: "Receita do dia", value: "R$ 18.420", delta: "+12%", icon: Wallet },
    { label: "Pacientes ativos", value: "1.284", delta: "+34", icon: Heart },
  ],
  bares: [
    { label: "Comandas abertas", value: "37", delta: "+5", icon: Activity },
    { label: "Ticket médio", value: "R$ 88", delta: "+R$ 6", icon: Wallet },
    { label: "Faturamento dia", value: "R$ 12.730", delta: "+9%", icon: TrendingUp },
    { label: "Reservas semana", value: "210", delta: "+18%", icon: CalendarCheck },
  ],
  microcervejarias: [
    { label: "Litros produzidos", value: "4.820 L", delta: "+6%", icon: Activity },
    { label: "Lotes em maturação", value: "12", delta: "0", icon: ShieldCheck },
    { label: "Receita PDV+B2B", value: "R$ 96.300", delta: "+14%", icon: Wallet },
    { label: "Pontos de venda", value: "38", delta: "+3", icon: Building2 },
  ],
  servicos: [
    { label: "Ordens em aberto", value: "23", delta: "-4", icon: Activity },
    { label: "SLA cumprido", value: "97%", delta: "+1pp", icon: ShieldCheck },
    { label: "Receita do mês", value: "R$ 142.800", delta: "+11%", icon: Wallet },
    { label: "Clientes ativos", value: "312", delta: "+9", icon: Users },
  ],
  ecommerce: [
    { label: "Pedidos hoje", value: "184", delta: "+22%", icon: ShoppingCart },
    { label: "Conversão", value: "3,4%", delta: "+0,3pp", icon: TrendingUp },
    { label: "Receita do dia", value: "R$ 34.920", delta: "+17%", icon: Wallet },
    { label: "Carrinho médio", value: "R$ 189", delta: "+R$ 8", icon: DollarSign },
  ],
};

const CONSUMER_KPIS: Record<NichoSlug, Kpi[]> = {
  clinicas: [
    { label: "Próxima consulta", value: "Sex 14h", icon: CalendarCheck },
    { label: "Exames pendentes", value: "1", icon: Activity },
    { label: "Receitas ativas", value: "3", icon: Heart },
    { label: "Saldo carteirinha", value: "R$ 120", icon: Wallet },
  ],
  bares: [
    { label: "Última visita", value: "há 4 dias", icon: CalendarCheck },
    { label: "Pontos fidelidade", value: "1.240", icon: Sparkles },
    { label: "Cashback disponível", value: "R$ 38", icon: Wallet },
    { label: "Reservas ativas", value: "1", icon: Activity },
  ],
  microcervejarias: [
    { label: "Clube do mês", value: "Ativo", icon: ShieldCheck },
    { label: "Caixas recebidas", value: "8", icon: ShoppingCart },
    { label: "Brindes", value: "2", icon: Sparkles },
    { label: "Próxima entrega", value: "12/07", icon: CalendarCheck },
  ],
  servicos: [
    { label: "OS em andamento", value: "1", icon: Activity },
    { label: "Próxima visita", value: "Qua 9h", icon: CalendarCheck },
    { label: "Faturas em aberto", value: "R$ 240", icon: Wallet },
    { label: "Avaliações dadas", value: "12", icon: Heart },
  ],
  ecommerce: [
    { label: "Pedidos em rota", value: "2", icon: ShoppingCart },
    { label: "Cashback", value: "R$ 56", icon: Wallet },
    { label: "Favoritos", value: "18", icon: Heart },
    { label: "Cupom ativo", value: "BV10", icon: Sparkles },
  ],
};

const WHITE_LABEL_KPIS: Kpi[] = [
  { label: "Clientes ativos", value: "47", delta: "+5", icon: Building2 },
  { label: "MRR repassado", value: "R$ 38.420", delta: "+12%", icon: Wallet },
  { label: "Churn 30d", value: "1,8%", delta: "-0,4pp", icon: TrendingUp },
  { label: "NPS médio", value: "72", delta: "+4", icon: Heart },
];

const SUPER_ADMIN_KPIS: Kpi[] = [
  { label: "Empresas ativas", value: "1.284", delta: "+38", icon: Building2 },
  { label: "MRR global", value: "R$ 482.300", delta: "+9%", icon: Wallet },
  { label: "Uptime 30d", value: "99,98%", icon: ShieldCheck },
  { label: "Trials abertos", value: "126", delta: "+14", icon: Sparkles },
];

function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label} className="p-4 bg-card/60 backdrop-blur border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
            {k.delta && (
              <div className="text-xs text-emerald-500 mt-1">{k.delta} vs período anterior</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function MiniChart({ label }: { label: string }) {
  // Static SVG sparkline — purely visual
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="text-xs">simulado</Badge>
      </div>
      <svg viewBox="0 0 200 60" className="w-full h-16 text-primary">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points="0,45 20,40 40,42 60,30 80,32 100,22 120,28 140,18 160,20 180,12 200,15"
        />
        <polyline
          fill="currentColor"
          fillOpacity="0.1"
          stroke="none"
          points="0,45 20,40 40,42 60,30 80,32 100,22 120,28 140,18 160,20 180,12 200,15 200,60 0,60"
        />
      </svg>
    </Card>
  );
}

function ShowroomDashboardsPage() {
  const [nicho, setNicho] = useState<NichoSlug>("clinicas");
  const [perfil, setPerfil] = useState<"super" | "wl" | "empresa" | "consumidor">("empresa");

  const nichoInfo = useMemo(() => NICHOS.find((n) => n.slug === nicho)!, [nicho]);
  const NichoIcon = nichoInfo.icon;

  const kpis = useMemo(() => {
    if (perfil === "super") return SUPER_ADMIN_KPIS;
    if (perfil === "wl") return WHITE_LABEL_KPIS;
    if (perfil === "empresa") return COMPANY_KPIS[nicho];
    return CONSUMER_KPIS[nicho];
  }, [perfil, nicho]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className={`bg-gradient-to-br ${nichoInfo.accent} border-b border-border/60`}>
          <div className="container py-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link to="/showroom" className="hover:text-foreground">Showroom</Link>
              <span>/</span>
              <span>Dashboards simulados</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Dashboards simulados por perfil e nicho
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Cada perfil — Super Admin, White Label, Empresa e Consumidor — enxerga métricas coerentes com seu papel.
              Troque o nicho e o perfil para ver como a leitura muda.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <NichoIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Nicho:</span>
            </div>
            <Select value={nicho} onValueChange={(v) => setNicho(v as NichoSlug)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NICHOS.map((n) => (
                  <SelectItem key={n.slug} value={n.slug}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={perfil} onValueChange={(v) => setPerfil(v as typeof perfil)}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="super" className="gap-2">
                <Crown className="h-4 w-4" /> Super Admin
              </TabsTrigger>
              <TabsTrigger value="wl" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> White Label
              </TabsTrigger>
              <TabsTrigger value="empresa" className="gap-2">
                <Building2 className="h-4 w-4" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="consumidor" className="gap-2">
                <User className="h-4 w-4" /> Consumidor
              </TabsTrigger>
            </TabsList>

            <TabsContent value={perfil} className="space-y-6">
              <KpiGrid kpis={kpis} />

              <div className="grid md:grid-cols-2 gap-4">
                <MiniChart
                  label={
                    perfil === "super"
                      ? "MRR global (12 meses)"
                      : perfil === "wl"
                        ? "Receita da rede"
                        : perfil === "empresa"
                          ? `Receita ${nichoInfo.label}`
                          : "Histórico de uso"
                  }
                />
                <MiniChart
                  label={
                    perfil === "super"
                      ? "Novas empresas / mês"
                      : perfil === "wl"
                        ? "Aquisição de clientes"
                        : perfil === "empresa"
                          ? "Volume operacional"
                          : "Engajamento"
                  }
                />
              </div>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <LineChart className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">O que esse perfil enxerga</h3>
                    <p className="text-sm text-muted-foreground">
                      {perfil === "super" &&
                        "Visão consolidada da plataforma: MRR, churn, uptime, trials, empresas por nicho, alertas de inadimplência e saúde de cada white label."}
                      {perfil === "wl" &&
                        "Visão da rede do parceiro white label: clientes ativos, MRR repassado, churn, NPS e funil de aquisição com sua marca."}
                      {perfil === "empresa" &&
                        `Operação diária da empresa no nicho de ${nichoInfo.label.toLowerCase()}: KPIs financeiros, operacionais e de relacionamento adaptados ao segmento.`}
                      {perfil === "consumidor" &&
                        "Área do cliente final: agendamentos, pedidos, fidelidade, cashback e histórico — tudo com a marca da empresa contratante."}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/showroom">Voltar ao showroom</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
