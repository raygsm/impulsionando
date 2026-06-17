import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Award,
  Gift,
  Sparkles,
  Coins,
  Crown,
  Star,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
  CheckCircle2,
  Repeat,
} from "lucide-react";

export const Route = createFileRoute("/showroom/fidelidade")({
  head: () => ({
    meta: [
      { title: "Programa de fidelidade por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Pontos, níveis, recompensas e cashback adaptados por nicho. Aumente recompra e LTV com um clube de fidelidade pronto.",
      },
      {
        property: "og:title",
        content: "Fidelidade & recompensas — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demonstração navegável: níveis, regras de pontuação, catálogo de recompensas, cashback e top clientes.",
      },
    ],
  }),
  component: ShowroomFidelidade,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Tier = {
  name: string;
  min: number;
  perks: string[];
  cashback: number;
  color: string;
};
type Reward = { name: string; cost: number; stock: number; type: "desconto" | "produto" | "experiencia" };
type TopMember = { name: string; tier: string; points: number; ltv: number; visits: number };

type Cfg = {
  label: string;
  rule: string;
  tiers: Tier[];
  rewards: Reward[];
  top: TopMember[];
  stats: { members: number; active: number; redemptions: number; repeatLift: number };
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtInt = (n: number) => n.toLocaleString("pt-BR");

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas & Saúde",
    rule: "1 ponto a cada R$ 1 gasto em consultas e exames • Bônus 2x em check-ups completos",
    tiers: [
      { name: "Bem-estar", min: 0, perks: ["Lembretes de consulta", "Resultados no WhatsApp"], cashback: 0, color: "from-slate-400 to-slate-600" },
      { name: "Prata", min: 600, perks: ["5% off em exames", "Fila prioritária"], cashback: 2, color: "from-zinc-400 to-zinc-600" },
      { name: "Ouro", min: 1800, perks: ["10% off em procedimentos", "Check-up anual grátis"], cashback: 4, color: "from-amber-400 to-amber-600" },
      { name: "Diamante", min: 4500, perks: ["Especialista dedicado", "Atendimento 24h", "20% off acompanhantes"], cashback: 6, color: "from-cyan-400 to-blue-600" },
    ],
    rewards: [
      { name: "Consulta de retorno grátis", cost: 800, stock: 24, type: "experiencia" },
      { name: "Hemograma completo", cost: 1200, stock: 18, type: "experiencia" },
      { name: "R$ 50 em qualquer especialidade", cost: 500, stock: 99, type: "desconto" },
      { name: "Kit cuidados (creme + protetor)", cost: 1500, stock: 12, type: "produto" },
      { name: "Sessão de avaliação nutricional", cost: 900, stock: 16, type: "experiencia" },
      { name: "20% off cirurgia estética", cost: 3000, stock: 6, type: "desconto" },
    ],
    top: [
      { name: "Mariana Alves", tier: "Diamante", points: 5240, ltv: 18400, visits: 32 },
      { name: "Rafael Santos", tier: "Ouro", points: 3120, ltv: 9800, visits: 19 },
      { name: "Patrícia Lemos", tier: "Ouro", points: 2680, ltv: 8200, visits: 17 },
      { name: "Eduardo Tavares", tier: "Prata", points: 1340, ltv: 4200, visits: 11 },
      { name: "Camila Reis", tier: "Prata", points: 980, ltv: 3100, visits: 8 },
    ],
    stats: { members: 1842, active: 1284, redemptions: 286, repeatLift: 38 },
  },
  bares: {
    label: "Bares & Restaurantes",
    rule: "1 ponto a cada R$ 2 na conta • 3x aos domingos • Bônus de cadastro: 50 pts",
    tiers: [
      { name: "Frequentador", min: 0, perks: ["Reserva sem fila"], cashback: 0, color: "from-stone-400 to-stone-600" },
      { name: "Habitué", min: 300, perks: ["Chopp de boas-vindas grátis", "Couvert -50%"], cashback: 3, color: "from-amber-400 to-orange-500" },
      { name: "Cliente VIP", min: 900, perks: ["Camarote com prioridade", "Drink autoral grátis no aniversário"], cashback: 5, color: "from-rose-500 to-red-600" },
      { name: "Sócio Ouro", min: 2400, perks: ["Open chopp 2h/mês", "Convidado +1 sem pagar couvert", "Reserva exclusiva sexta"], cashback: 8, color: "from-yellow-400 to-amber-600" },
    ],
    rewards: [
      { name: "Chopp Pilsen 300ml", cost: 80, stock: 999, type: "produto" },
      { name: "Drink autoral", cost: 180, stock: 999, type: "produto" },
      { name: "Tábua de petiscos", cost: 320, stock: 40, type: "produto" },
      { name: "Couvert artístico grátis (2)", cost: 250, stock: 60, type: "experiencia" },
      { name: "Reserva camarote sábado", cost: 1200, stock: 4, type: "experiencia" },
      { name: "R$ 100 na conta", cost: 600, stock: 50, type: "desconto" },
    ],
    top: [
      { name: "Lucas Pinheiro", tier: "Sócio Ouro", points: 3120, ltv: 12800, visits: 64 },
      { name: "Camila Reis", tier: "Cliente VIP", points: 1840, ltv: 7400, visits: 41 },
      { name: "Diego Martins", tier: "Cliente VIP", points: 1620, ltv: 6900, visits: 38 },
      { name: "Helena Borges", tier: "Habitué", points: 720, ltv: 2900, visits: 19 },
      { name: "Rafael Reis", tier: "Habitué", points: 540, ltv: 2100, visits: 14 },
    ],
    stats: { members: 3148, active: 2102, redemptions: 612, repeatLift: 52 },
  },
  cervejarias: {
    label: "Microcervejarias",
    rule: "1 ponto por R$ 1 no taproom/e-commerce • 5x em lançamentos • Assinantes do clube ganham 2x sempre",
    tiers: [
      { name: "Curioso", min: 0, perks: ["Newsletter de lançamentos"], cashback: 0, color: "from-stone-400 to-stone-600" },
      { name: "Apreciador", min: 500, perks: ["Frete grátis acima de R$ 200", "Convite para sour day"], cashback: 3, color: "from-amber-400 to-yellow-600" },
      { name: "Beer Geek", min: 1500, perks: ["Tour com mestre cervejeiro 2x/ano", "Acesso a edições limitadas"], cashback: 5, color: "from-orange-500 to-red-600" },
      { name: "Mestre Hops", min: 3500, perks: ["Brassagem pessoal", "Rótulo com seu nome", "Garrafa magnum exclusiva"], cashback: 8, color: "from-yellow-500 to-amber-700" },
    ],
    rewards: [
      { name: "IPA Tropical 600ml", cost: 250, stock: 120, type: "produto" },
      { name: "Flight de 4 doses no taproom", cost: 320, stock: 80, type: "experiencia" },
      { name: "Brew tour individual", cost: 800, stock: 12, type: "experiencia" },
      { name: "Kit copos colecionáveis", cost: 1200, stock: 18, type: "produto" },
      { name: "Edição limitada Barrel-Aged", cost: 2000, stock: 6, type: "produto" },
      { name: "Brassagem coletiva guiada", cost: 3000, stock: 4, type: "experiencia" },
    ],
    top: [
      { name: "Tiago Ortega", tier: "Mestre Hops", points: 4180, ltv: 9800, visits: 28 },
      { name: "André Borges", tier: "Beer Geek", points: 2240, ltv: 5600, visits: 18 },
      { name: "Renata Falcão", tier: "Beer Geek", points: 1820, ltv: 4900, visits: 14 },
      { name: "Marina Schmidt", tier: "Apreciador", points: 840, ltv: 2400, visits: 9 },
      { name: "Felipe Ramos", tier: "Apreciador", points: 620, ltv: 1900, visits: 7 },
    ],
    stats: { members: 942, active: 612, redemptions: 184, repeatLift: 64 },
  },
  servicos: {
    label: "Serviços & Reformas",
    rule: "1 ponto por R$ 1 em OS • Indicações geram 500 pts ao indicador + R$ 100 off ao indicado",
    tiers: [
      { name: "Cliente", min: 0, perks: ["Garantia escrita 12 meses"], cashback: 0, color: "from-slate-400 to-slate-600" },
      { name: "Recorrente", min: 1500, perks: ["Visita técnica grátis 1x/ano", "5% off em serviços"], cashback: 3, color: "from-blue-400 to-blue-600" },
      { name: "Manutenção+", min: 5000, perks: ["Plantão prioritário", "10% off + revisão semestral"], cashback: 5, color: "from-indigo-500 to-indigo-700" },
      { name: "Concierge", min: 12000, perks: ["Atendimento 24h dedicado", "Vistoria anual", "20% off em reformas"], cashback: 8, color: "from-violet-500 to-purple-700" },
    ],
    rewards: [
      { name: "Vistoria elétrica preventiva", cost: 1000, stock: 30, type: "experiencia" },
      { name: "Pintura de 1 ambiente (até 18m²)", cost: 4500, stock: 10, type: "experiencia" },
      { name: "R$ 200 off em qualquer OS", cost: 1500, stock: 60, type: "desconto" },
      { name: "Kit lâmpadas LED (10 un)", cost: 800, stock: 25, type: "produto" },
      { name: "Hidrojateamento pia + ralos", cost: 1800, stock: 18, type: "experiencia" },
      { name: "Reforma de banheiro -15%", cost: 6000, stock: 6, type: "desconto" },
    ],
    top: [
      { name: "Família Costa", tier: "Concierge", points: 14200, ltv: 38400, visits: 11 },
      { name: "Edif. Aurora", tier: "Concierge", points: 18400, ltv: 62400, visits: 22 },
      { name: "Joana Pacheco", tier: "Manutenção+", points: 6240, ltv: 18200, visits: 7 },
      { name: "Marcelo Tavares", tier: "Recorrente", points: 2180, ltv: 7400, visits: 4 },
      { name: "Helena Borges", tier: "Recorrente", points: 1640, ltv: 5200, visits: 3 },
    ],
    stats: { members: 612, active: 384, redemptions: 92, repeatLift: 41 },
  },
  ecommerce: {
    label: "E-commerce & Varejo",
    rule: "1 ponto por R$ 1 gasto • 3x em drops • Aniversariantes ganham 200 pts + frete grátis",
    tiers: [
      { name: "Norte", min: 0, perks: ["Frete grátis acima de R$ 250"], cashback: 0, color: "from-pink-300 to-pink-500" },
      { name: "Norte+", min: 800, perks: ["Acesso 24h antes em drops", "Brindes em pedidos > R$ 350"], cashback: 3, color: "from-rose-400 to-rose-600" },
      { name: "Insider", min: 2500, perks: ["Personal shopper dedicada", "Cupom 10% vitalício"], cashback: 5, color: "from-fuchsia-500 to-pink-600" },
      { name: "Muse", min: 6000, perks: ["Peças sob medida 2x/ano", "Convite para coquetel da coleção", "Embalagem premium grátis"], cashback: 8, color: "from-purple-500 to-fuchsia-700" },
    ],
    rewards: [
      { name: "R$ 30 off + frete grátis", cost: 300, stock: 200, type: "desconto" },
      { name: "Bolsa de pano edição limitada", cost: 600, stock: 80, type: "produto" },
      { name: "Personal shopper 1h", cost: 900, stock: 40, type: "experiencia" },
      { name: "R$ 150 em qualquer peça", cost: 1500, stock: 100, type: "desconto" },
      { name: "Coleção cápsula (1 peça)", cost: 4500, stock: 15, type: "produto" },
      { name: "Convite coquetel de lançamento", cost: 2200, stock: 30, type: "experiencia" },
    ],
    top: [
      { name: "Bruna Lima", tier: "Muse", points: 8420, ltv: 18900, visits: 42 },
      { name: "Marina Torres", tier: "Insider", points: 3840, ltv: 9600, visits: 26 },
      { name: "Helena Ribeiro", tier: "Insider", points: 2960, ltv: 7400, visits: 19 },
      { name: "Camila Duarte", tier: "Norte+", points: 1240, ltv: 3600, visits: 11 },
      { name: "Sofia Mendes", tier: "Norte+", points: 920, ltv: 2800, visits: 8 },
    ],
    stats: { members: 6248, active: 3940, redemptions: 1284, repeatLift: 47 },
  },
};

const TYPE_BADGE: Record<Reward["type"], string> = {
  desconto: "bg-blue-100 text-blue-700",
  produto: "bg-emerald-100 text-emerald-700",
  experiencia: "bg-purple-100 text-purple-700",
};

const TIER_ICONS = [Star, Award, Trophy, Crown];

function ShowroomFidelidade() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const cfg = DATA[niche];

  // Simula o cliente em foco: o top 1
  const focus = cfg.top[0];
  const focusTierIdx = useMemo(() => {
    let idx = 0;
    cfg.tiers.forEach((t, i) => {
      if (focus.points >= t.min) idx = i;
    });
    return idx;
  }, [focus, cfg.tiers]);
  const nextTier = cfg.tiers[focusTierIdx + 1];
  const progressPct = nextTier
    ? Math.min(100, Math.round(((focus.points - cfg.tiers[focusTierIdx].min) / (nextTier.min - cfg.tiers[focusTierIdx].min)) * 100))
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Award className="h-3 w-3" /> Programa de fidelidade
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                Pontos, níveis e recompensas que fazem o cliente voltar
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">
                Regras de pontuação ajustadas ao seu nicho, cashback automático e catálogo de
                prêmios — tudo conectado ao CRM, ao PDV e ao checkout.
              </p>
            </div>
            <Select value={niche} onValueChange={(v) => setNiche(v as NicheSlug)}>
              <SelectTrigger className="w-[260px]">
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
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Users} label="Membros cadastrados" value={fmtInt(cfg.stats.members)} sub={`${cfg.stats.active} ativos nos últimos 90d`} />
          <KpiCard icon={Repeat} label="Lift na recompra" value={`+${cfg.stats.repeatLift}%`} sub="Membros vs. não-membros" />
          <KpiCard icon={Gift} label="Resgates no mês" value={fmtInt(cfg.stats.redemptions)} sub="Catálogo dinâmico por nicho" />
          <KpiCard icon={Coins} label="Regra de pontuação" value={cfg.tiers[2].cashback + "% cashback"} sub="No nível médio (Ouro/VIP)" />
        </div>
      </section>

      {/* Regra */}
      <section className="container mx-auto px-4">
        <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-semibold">Regra ativa</p>
              <p className="text-muted-foreground">{cfg.rule}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Editar regra
          </Button>
        </Card>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold">Níveis do programa</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cfg.tiers.map((t, i) => {
            const Icon = TIER_ICONS[i] ?? Star;
            const isFocus = i === focusTierIdx;
            return (
              <Card key={t.name} className={`overflow-hidden ${isFocus ? "ring-2 ring-primary" : ""}`}>
                <div className={`bg-gradient-to-br ${t.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6" />
                    {isFocus && (
                      <Badge className="bg-white/20 text-white hover:bg-white/20">
                        Nível atual
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-lg font-bold">{t.name}</p>
                  <p className="text-xs opacity-90">A partir de {fmtInt(t.min)} pts</p>
                </div>
                <div className="space-y-2 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cashback</span>
                    <span className="font-semibold">{t.cashback}%</span>
                  </div>
                  <ul className="space-y-1.5 pt-1">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Carteira do cliente em foco + Recompensas */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {focus.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Carteira do membro em destaque</p>
                <p className="text-base font-semibold">{focus.name}</p>
                <Badge className="mt-1 text-[11px]">{focus.tier}</Badge>
              </div>
            </div>

            <div className="mt-5 rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5" /> Saldo atual
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight">{fmtInt(focus.points)} <span className="text-base font-medium text-muted-foreground">pts</span></p>
              {nextTier ? (
                <>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Para {nextTier.name}</span>
                    <span>{fmtInt(nextTier.min - focus.points)} pts</span>
                  </div>
                  <Progress value={progressPct} className="mt-1.5" />
                </>
              ) : (
                <p className="mt-3 text-xs font-medium text-primary">Nível máximo atingido</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Wallet className="h-3 w-3" /> LTV
                </div>
                <p className="mt-1 font-semibold">{fmtBRL(focus.ltv)}</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Repeat className="h-3 w-3" /> Visitas
                </div>
                <p className="mt-1 font-semibold">{focus.visits}</p>
              </div>
            </div>

            <Button className="mt-4 w-full gap-1">
              <Gift className="h-4 w-4" /> Resgatar recompensa
            </Button>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Catálogo de recompensas</h2>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" /> Atualizado por demanda
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {cfg.rewards.map((r) => {
                const canRedeem = focus.points >= r.cost;
                return (
                  <div
                    key={r.name}
                    className="flex flex-col gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{r.name}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Estoque: {r.stock > 99 ? "ilimitado" : r.stock}
                        </p>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${TYPE_BADGE[r.type]}`}>
                        {r.type}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        <Coins className="h-3.5 w-3.5 text-amber-500" /> {fmtInt(r.cost)} pts
                      </span>
                      <Button
                        size="sm"
                        variant={canRedeem ? "default" : "outline"}
                        disabled={!canRedeem}
                        className="h-7"
                      >
                        {canRedeem ? "Resgatar" : "Insuficiente"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Top membros */}
      <section className="container mx-auto px-4 pb-12">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top membros do programa</h2>
            <Badge variant="outline">Ranking dos últimos 90 dias</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Membro</th>
                  <th className="px-3 py-2">Nível</th>
                  <th className="px-3 py-2 text-right">Pontos</th>
                  <th className="px-3 py-2 text-right">LTV</th>
                  <th className="px-3 py-2 text-right">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {cfg.top.map((m, i) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs font-bold text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">
                            {m.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="text-[11px]">
                        {m.tier}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{fmtInt(m.points)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(m.ltv)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{m.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Cliente que pontua é cliente que volta
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Lance o programa em horas com regras, níveis e catálogo prontos para o seu nicho —
            integrado ao PDV, ao checkout e ao WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Quero lançar meu programa</Link>
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

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export default ShowroomFidelidade;
