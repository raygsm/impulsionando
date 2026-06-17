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
  User,
  Users,
  Heart,
  TrendingUp,
  Sparkles,
  CircleDollarSign,
  Star,
  Calendar,
  MessageCircle,
  Mail,
  ShoppingBag,
  Wrench,
  Stethoscope,
  Beer,
  CalendarHeart,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/showroom/clientes")({
  head: () => ({
    meta: [
      { title: "Showroom Clientes 360° — Perfil unificado | Impulsionando" },
      {
        name: "description",
        content:
          "Cliente 360° com histórico de consumo, LTV, NPS, preferências e timeline omnichannel — pronto por nicho.",
      },
      { property: "og:title", content: "Clientes 360° — Impulsionando" },
      {
        property: "og:description",
        content: "Perfil unificado com histórico, LTV e timeline por nicho.",
      },
    ],
  }),
  component: ShowroomClientes,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Tier = "VIP" | "Ouro" | "Prata" | "Novo";
const TIER: Record<Tier, string> = {
  VIP: "bg-amber-100 text-amber-700 border-amber-300",
  Ouro: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Prata: "bg-slate-100 text-slate-700 border-slate-300",
  Novo: "bg-sky-100 text-sky-700 border-sky-300",
};

type Event = {
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  value?: number;
};

type Profile = {
  name: string;
  meta: string;
  tags: string[];
  tier: Tier;
  ltv: number;
  freq: string;
  nps: number;
  channels: { wa?: boolean; email?: boolean; phone?: boolean };
  contextIcon: React.ComponentType<{ className?: string }>;
  preferences: string[];
  timeline: Event[];
};

type Segment = { name: string; size: number; pct: number; color: string };

type Cfg = {
  total: number;
  ltvAvg: number;
  retention: number;
  nps: number;
  segments: Segment[];
  profile: Profile;
  others: { name: string; tier: Tier; ltv: number; meta: string }[];
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("pt-BR");

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    total: 2840,
    ltvAvg: 1820,
    retention: 72,
    nps: 78,
    segments: [
      { name: "Estética VIP", size: 188, pct: 12, color: "bg-amber-500" },
      { name: "Recorrentes", size: 1240, pct: 48, color: "bg-emerald-500" },
      { name: "Reativar 6m+", size: 612, pct: 24, color: "bg-amber-400" },
      { name: "Novos < 30d", size: 218, pct: 16, color: "bg-sky-500" },
    ],
    profile: {
      name: "Marina Soares",
      meta: "34 anos · Pinheiros, SP · cliente desde 2022",
      tags: ["estética", "dermato", "puntual"],
      tier: "VIP",
      ltv: 12480,
      freq: "1x / mês",
      nps: 10,
      channels: { wa: true, email: true, phone: true },
      contextIcon: Stethoscope,
      preferences: ["Dra. Helena", "Quartas 14h", "Pix instantâneo"],
      timeline: [
        { date: "hoje", icon: Calendar, title: "Procedimento agendado", detail: "Dra. Helena · 14:30", value: 480 },
        { date: "ontem", icon: MessageCircle, title: "Lembrete enviado", detail: "WhatsApp template confirmado" },
        { date: "15d", icon: Star, title: "NPS 10", detail: "Atendimento impecável" },
        { date: "1m", icon: CircleDollarSign, title: "Pacote dermato 6x", detail: "Pix · à vista", value: 2880 },
        { date: "3m", icon: Calendar, title: "Avaliação inicial", detail: "Dra. Helena" },
      ],
    },
    others: [
      { name: "Renata L.", tier: "Ouro", ltv: 6240, meta: "Laser · 8 sessões" },
      { name: "Lucas P.", tier: "Prata", ltv: 1880, meta: "Convênio · 2024" },
      { name: "Beatriz N.", tier: "Novo", ltv: 480, meta: "1ª avaliação" },
    ],
  },
  bares: {
    total: 8420,
    ltvAvg: 1280,
    retention: 58,
    nps: 64,
    segments: [
      { name: "Frequentes (4+/mês)", size: 380, pct: 18, color: "bg-amber-500" },
      { name: "Ocasionais", size: 4200, pct: 50, color: "bg-emerald-500" },
      { name: "Eventos B2B", size: 96, pct: 12, color: "bg-violet-500" },
      { name: "Inativos 30d+", size: 1240, pct: 20, color: "bg-amber-400" },
    ],
    profile: {
      name: "Rafa Andrade",
      meta: "31 anos · Vila Madalena · check-in #84",
      tags: ["IPA fã", "rooftop", "sextas"],
      tier: "VIP",
      ltv: 9840,
      freq: "1x / semana",
      nps: 9,
      channels: { wa: true, email: true },
      contextIcon: CalendarHeart,
      preferences: ["Chope IPA 500ml", "Mesa 12 rooftop", "Bolinho de costela"],
      timeline: [
        { date: "sáb", icon: Calendar, title: "Reserva confirmada", detail: "Mesa 12 · 4 pax · 21h" },
        { date: "ontem", icon: MessageCircle, title: "Lembrete reserva", detail: "WhatsApp · respondeu SIM" },
        { date: "5d", icon: ShoppingBag, title: "Consumo no salão", detail: "4 chopes + bolinho", value: 168 },
        { date: "12d", icon: Star, title: "Fidelidade +80 pts", detail: "Saldo: 420 pts" },
        { date: "1m", icon: ShoppingBag, title: "Confraternização Acme", detail: "12 pax · privê", value: 2880 },
      ],
    },
    others: [
      { name: "Carla M.", tier: "Ouro", ltv: 3840, meta: "Aniversariante 06/06" },
      { name: "Time Acme RH", tier: "VIP", ltv: 18400, meta: "Confras trimestrais" },
      { name: "Bruno T.", tier: "Prata", ltv: 920, meta: "Jantares casal" },
    ],
  },
  microcervejarias: {
    total: 1840,
    ltvAvg: 2680,
    retention: 81,
    nps: 86,
    segments: [
      { name: "Clube Lúpulo", size: 412, pct: 36, color: "bg-amber-500" },
      { name: "Bares B2B", size: 38, pct: 14, color: "bg-violet-500" },
      { name: "Visitantes", size: 624, pct: 32, color: "bg-emerald-500" },
      { name: "Online esporádico", size: 766, pct: 18, color: "bg-sky-500" },
    ],
    profile: {
      name: "João Vitor",
      meta: "29 anos · Pinheiros · sócio Clube há 18 meses",
      tags: ["IPA", "stout", "tour"],
      tier: "VIP",
      ltv: 4860,
      freq: "Mensal · kit 4 rótulos",
      nps: 10,
      channels: { wa: true, email: true },
      contextIcon: Beer,
      preferences: ["West Coast IPA", "Stout Coffee", "Tour com amigos"],
      timeline: [
        { date: "hoje", icon: CircleDollarSign, title: "Renovação Clube", detail: "Mensal · MercadoPago", value: 149 },
        { date: "sáb", icon: Calendar, title: "Retirada kit junho", detail: "Loja física · 14h–18h" },
        { date: "15d", icon: ShoppingBag, title: "Compra avulsa Stout", detail: "Loja física", value: 96 },
        { date: "30d", icon: Star, title: "Tour com 4 amigos", detail: "Indicação NPS 10", value: 240 },
      ],
    },
    others: [
      { name: "Tap House (B2B)", tier: "VIP", ltv: 38400, meta: "Reposição mensal" },
      { name: "Casal Lima", tier: "Ouro", ltv: 2840, meta: "Harmonização anual" },
      { name: "Empório Norte", tier: "Prata", ltv: 8400, meta: "Pedido trimestral" },
    ],
  },
  servicos: {
    total: 3120,
    ltvAvg: 2240,
    retention: 65,
    nps: 70,
    segments: [
      { name: "Recorrentes mensal", size: 218, pct: 14, color: "bg-amber-500" },
      { name: "Manutenção anual", size: 1240, pct: 48, color: "bg-emerald-500" },
      { name: "Frota B2B", size: 12, pct: 6, color: "bg-violet-500" },
      { name: "Inativos 6m+", size: 840, pct: 32, color: "bg-amber-400" },
    ],
    profile: {
      name: "Pedro Garcia",
      meta: "Civic 2019 · 32k km · cliente desde 2021",
      tags: ["revisão", "frota familiar", "fidelidade"],
      tier: "Ouro",
      ltv: 7820,
      freq: "Trimestral",
      nps: 9,
      channels: { wa: true, phone: true },
      contextIcon: Wrench,
      preferences: ["Box 2 (André)", "Pix InfinitePay", "Retirada após 17h"],
      timeline: [
        { date: "hoje", icon: Wrench, title: "OS #4421 finalizada", detail: "Revisão 30k + pastilhas", value: 720 },
        { date: "hoje", icon: CircleDollarSign, title: "Pagamento Pix", detail: "Liquidado · NF emitida" },
        { date: "3m", icon: Wrench, title: "Alinhamento + balanceamento", detail: "Box 2", value: 380 },
        { date: "8m", icon: Wrench, title: "Troca correia", detail: "Recall preventivo", value: 1840 },
        { date: "12m", icon: Star, title: "NPS 9", detail: "Indica para amigos" },
      ],
    },
    others: [
      { name: "Frota Logix", tier: "VIP", ltv: 86400, meta: "8 carros · contrato anual" },
      { name: "Aline S.", tier: "Prata", ltv: 1280, meta: "HB20 · revisões" },
      { name: "Rodrigo F.", tier: "Novo", ltv: 380, meta: "1º atendimento" },
    ],
  },
  ecommerce: {
    total: 18400,
    ltvAvg: 940,
    retention: 48,
    nps: 72,
    segments: [
      { name: "VIP recompra <60d", size: 1240, pct: 16, color: "bg-amber-500" },
      { name: "Recorrentes", size: 5800, pct: 38, color: "bg-emerald-500" },
      { name: "Single buyer", size: 6540, pct: 30, color: "bg-sky-500" },
      { name: "Inativos 90d+", size: 4820, pct: 16, color: "bg-amber-400" },
    ],
    profile: {
      name: "Carla Origem",
      meta: "Corrida · São Paulo · 6 pedidos em 2024",
      tags: ["corrida", "VIP", "recompra"],
      tier: "VIP",
      ltv: 4280,
      freq: "Bimestral",
      nps: 10,
      channels: { wa: true, email: true },
      contextIcon: ShoppingBag,
      preferences: ["Origem Run", "Cartão InfinitePay 6x", "Entrega SP D+1"],
      timeline: [
        { date: "hoje", icon: ShoppingBag, title: "Pedido #7821 entregue", detail: "Origem Run 39 + meias", value: 389 },
        { date: "ontem", icon: MessageCircle, title: "Recuperou carrinho", detail: "Cupom VOLTA10 aplicado" },
        { date: "30d", icon: ShoppingBag, title: "Pedido #7654", detail: "Gel pós-treino 2x", value: 198 },
        { date: "60d", icon: Star, title: "Avaliou 5★", detail: "Origem Trail" },
        { date: "90d", icon: ShoppingBag, title: "Pedido #7321", detail: "Squeeze + camiseta", value: 268 },
      ],
    },
    others: [
      { name: "Bruno T.", tier: "Ouro", ltv: 2480, meta: "Troca pendente #7790" },
      { name: "Mariana DM", tier: "Prata", ltv: 580, meta: "Estoque pendente · 37" },
      { name: "Felipe N.", tier: "Novo", ltv: 320, meta: "1ª compra · InfinitePay" },
    ],
  },
};

function ShowroomClientes() {
  const [nicho, setNicho] = useState<NicheSlug>("ecommerce");
  const d = DATA[nicho];
  const p = d.profile;
  const ContextIcon = p.contextIcon;

  const initials = useMemo(
    () =>
      p.name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join(""),
    [p.name],
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Users className="h-3 w-3" /> Showroom Clientes 360°
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Conheça cada cliente como se fosse o primeiro
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Perfil unificado, histórico de consumo, LTV, NPS e timeline omnichannel — adaptados
              ao seu nicho.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Base de clientes</h2>
            <p className="mt-1 text-muted-foreground">
              {num(d.total)} clientes ativos · valores simulados
            </p>
          </div>
          <div className="w-full sm:w-80">
            <Select value={nicho} onValueChange={(v) => setNicho(v as NicheSlug)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NicheSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {NICHO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Clientes ativos
            </p>
            <p className="mt-1 text-2xl font-bold">{num(d.total)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CircleDollarSign className="h-3 w-3" /> LTV médio
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{fmt(d.ltvAvg)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" /> Retenção 90d
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{d.retention}%</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3" /> NPS
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{d.nps}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Perfil 360 */}
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b bg-gradient-to-br from-primary/10 to-background p-5 sm:flex-row sm:items-start">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {initials}
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card text-primary">
                  <ContextIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <Badge className={`border ${TIER[p.tier]}`} variant="outline">
                    {p.tier}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.meta}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 sm:self-start">
                {p.channels.wa && (
                  <Button size="icon" variant="outline" className="h-9 w-9 text-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                {p.channels.email && (
                  <Button size="icon" variant="outline" className="h-9 w-9 text-sky-600">
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                {p.channels.phone && (
                  <Button size="icon" variant="outline" className="h-9 w-9 text-amber-600">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 border-b">
              <Kpi label="LTV" value={fmt(p.ltv)} accent />
              <Kpi label="Frequência" value={p.freq} />
              <Kpi label="NPS" value={String(p.nps)} muted />
            </div>

            <div className="border-b px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preferências
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.preferences.map((pr) => (
                  <span
                    key={pr}
                    className="rounded-md border bg-card px-2 py-1 text-xs"
                  >
                    {pr}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Timeline
              </p>
              <ol className="relative mt-3 space-y-4 border-l-2 border-muted pl-5">
                {p.timeline.map((e, i) => {
                  const Icon = e.icon;
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{e.title}</p>
                        <span className="text-xs text-muted-foreground">{e.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{e.detail}</p>
                      {typeof e.value === "number" && (
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-600">
                          {fmt(e.value)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Segmentação</h3>
              <p className="text-xs text-muted-foreground">
                Atualizada em tempo real com base em compras, agenda e CRM.
              </p>
              <ul className="mt-4 space-y-3">
                {d.segments.map((s) => (
                  <li key={s.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {num(s.size)} · {s.pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Cada segmento dispara automações de marketing prontas.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold">Outros clientes</h3>
              <ul className="mt-3 space-y-2">
                {d.others.map((o) => (
                  <li
                    key={o.name}
                    className="flex items-center gap-3 rounded-md border p-3 text-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {o.name
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{o.name}</p>
                        <Badge className={`border ${TIER[o.tier]}`} variant="outline">
                          {o.tier}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{o.meta}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {fmt(o.ltv)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Atenda como uma marca grande</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Cada interação alimenta o perfil do cliente — agenda, vendas, suporte, marketing,
            financeiro — tudo num só lugar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/crm">Ver CRM</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="border-r px-4 py-3 last:border-r-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`text-base font-bold tabular-nums ${
          accent ? "text-primary" : muted ? "text-amber-600" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
