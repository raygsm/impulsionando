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
  Megaphone,
  Mail,
  MessageCircle,
  Tag,
  Target,
  Users,
  TrendingUp,
  BadgePercent,
  Instagram,
  Sparkles,
  CircleDot,
} from "lucide-react";

export const Route = createFileRoute("/showroom/marketing")<{}>({
  head: () => ({
    meta: [
      { title: "Showroom Marketing — Central de campanhas por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Campanhas de WhatsApp, e-mail, push, cupons e tráfego pago segmentadas por nicho, com métricas reais de abertura, clique e ROAS.",
      },
      { property: "og:title", content: "Marketing — Impulsionando" },
      {
        property: "og:description",
        content: "Campanhas multicanal com segmentação e métricas por nicho.",
      },
    ],
  }),
  component: ShowroomMarketing,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Channel = "whatsapp" | "email" | "instagram" | "ads";
const CH: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, cls: "text-emerald-700", bg: "bg-emerald-100" },
  email: { label: "E-mail", icon: Mail, cls: "text-sky-700", bg: "bg-sky-100" },
  instagram: { label: "Instagram", icon: Instagram, cls: "text-pink-700", bg: "bg-pink-100" },
  ads: { label: "Tráfego pago", cls: "text-violet-700", bg: "bg-violet-100", icon: Target },
};

type Status = "running" | "scheduled" | "draft" | "done";
const ST: Record<Status, { label: string; cls: string; dot: string }> = {
  running: { label: "rodando", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  scheduled: { label: "agendada", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  draft: { label: "rascunho", cls: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  done: { label: "encerrada", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

type Campaign = {
  name: string;
  channel: Channel;
  segment: string;
  status: Status;
  sent: number;
  open: number; // %
  ctr: number; // %
  conv: number; // count
  revenue: number;
};

type Coupon = { code: string; desc: string; usage: number; cap: number };

type Cfg = {
  audience: number;
  campaigns: Campaign[];
  coupons: Coupon[];
  segments: { name: string; size: number; tag: string }[];
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const num = (n: number) => n.toLocaleString("pt-BR");

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    audience: 2840,
    campaigns: [
      { name: "Pós-consulta NPS", channel: "whatsapp", segment: "Pacientes atendidos · 7d", status: "running", sent: 184, open: 96, ctr: 62, conv: 84, revenue: 0 },
      { name: "Pacote dermato (-15%)", channel: "email", segment: "Lead score ≥ 70", status: "running", sent: 612, open: 41, ctr: 18, conv: 22, revenue: 24800 },
      { name: "Vacinação infantil", channel: "instagram", segment: "Mães · bairro", status: "scheduled", sent: 0, open: 0, ctr: 0, conv: 0, revenue: 0 },
      { name: "Recuperação no-show", channel: "whatsapp", segment: "No-show últimos 30d", status: "running", sent: 38, open: 92, ctr: 55, conv: 14, revenue: 4480 },
    ],
    coupons: [
      { code: "DERMA15", desc: "15% em pacotes dermato", usage: 38, cap: 100 },
      { code: "PRIMEIRA", desc: "1ª consulta R$ 99", usage: 22, cap: 50 },
    ],
    segments: [
      { name: "Pacientes ativos", size: 1840, tag: "ouro" },
      { name: "Inativos > 6 meses", size: 612, tag: "reativar" },
      { name: "Estética premium", size: 188, tag: "VIP" },
    ],
  },
  bares: {
    audience: 8420,
    campaigns: [
      { name: "Happy hour sex 18h", channel: "whatsapp", segment: "Clientes frequentes", status: "running", sent: 1240, open: 88, ctr: 36, conv: 142, revenue: 18800 },
      { name: "Brunch domingo", channel: "instagram", segment: "Bairro · stories", status: "running", sent: 0, open: 0, ctr: 0, conv: 86, revenue: 9400 },
      { name: "Aniversariantes (-20%)", channel: "email", segment: "Bday do mês", status: "scheduled", sent: 0, open: 0, ctr: 0, conv: 0, revenue: 0 },
      { name: "Meta Ads · Confras", channel: "ads", segment: "RH · 5km", status: "running", sent: 0, open: 0, ctr: 0, conv: 12, revenue: 28400 },
    ],
    coupons: [
      { code: "HORA18", desc: "Chope em dobro 18h–20h", usage: 218, cap: 500 },
      { code: "BDAY20", desc: "20% off no aniversário", usage: 42, cap: 200 },
    ],
    segments: [
      { name: "Frequentes (4+/mês)", size: 380, tag: "VIP" },
      { name: "Reservas eventos", size: 96, tag: "B2B" },
      { name: "Não vêm há 30d", size: 1240, tag: "reativar" },
    ],
  },
  microcervejarias: {
    audience: 1840,
    campaigns: [
      { name: "Clube · lançamento Stout", channel: "whatsapp", segment: "Sócios Clube Lúpulo", status: "running", sent: 412, open: 94, ctr: 71, conv: 218, revenue: 14600 },
      { name: "Tour guiado sábado", channel: "instagram", segment: "Seguidores · região", status: "running", sent: 0, open: 0, ctr: 0, conv: 36, revenue: 2880 },
      { name: "B2B lote #248", channel: "email", segment: "Bares parceiros", status: "running", sent: 84, open: 78, ctr: 44, conv: 12, revenue: 38400 },
      { name: "Black Beer (esboço)", channel: "ads", segment: "Lookalike compradores", status: "draft", sent: 0, open: 0, ctr: 0, conv: 0, revenue: 0 },
    ],
    coupons: [
      { code: "CLUBE5", desc: "5% off sócios", usage: 318, cap: 1000 },
      { code: "TOUR2X1", desc: "Tour 2x1 sábado", usage: 28, cap: 80 },
    ],
    segments: [
      { name: "Sócios Clube ativos", size: 412, tag: "VIP" },
      { name: "Bares B2B", size: 38, tag: "B2B" },
      { name: "Visitantes tour", size: 624, tag: "warm" },
    ],
  },
  servicos: {
    audience: 3120,
    campaigns: [
      { name: "Revisão 30k programada", channel: "whatsapp", segment: "Carros 25–30k km", status: "running", sent: 188, open: 91, ctr: 48, conv: 36, revenue: 17280 },
      { name: "Detalhamento de primavera", channel: "email", segment: "Clientes ativos", status: "scheduled", sent: 0, open: 0, ctr: 0, conv: 0, revenue: 0 },
      { name: "Frota Logix renovação", channel: "email", segment: "Contas B2B", status: "running", sent: 12, open: 100, ctr: 92, conv: 4, revenue: 35200 },
      { name: "Meta Ads · Oficina bairro", channel: "ads", segment: "5km · interesse auto", status: "running", sent: 0, open: 0, ctr: 0, conv: 22, revenue: 12800 },
    ],
    coupons: [
      { code: "REVISA10", desc: "10% revisão completa", usage: 62, cap: 150 },
      { code: "FROTA12", desc: "Mensalidade frota -12%", usage: 4, cap: 20 },
    ],
    segments: [
      { name: "Recorrentes mensal", size: 218, tag: "ouro" },
      { name: "Contas B2B frota", size: 12, tag: "B2B" },
      { name: "Inativos 6m+", size: 840, tag: "reativar" },
    ],
  },
  ecommerce: {
    audience: 18400,
    campaigns: [
      { name: "Carrinho abandonado 1h", channel: "whatsapp", segment: "Abandono < 24h", status: "running", sent: 1840, open: 92, ctr: 38, conv: 312, revenue: 84200 },
      { name: "Lançamento Origem Trail", channel: "email", segment: "Compradores corrida", status: "running", sent: 6800, open: 38, ctr: 14, conv: 188, revenue: 96400 },
      { name: "Stories · drop semanal", channel: "instagram", segment: "Seguidores ativos", status: "running", sent: 0, open: 0, ctr: 0, conv: 142, revenue: 38800 },
      { name: "Meta Ads · ROAS 4.2x", channel: "ads", segment: "Lookalike 1% VIP", status: "running", sent: 0, open: 0, ctr: 0, conv: 612, revenue: 184000 },
    ],
    coupons: [
      { code: "VOLTA10", desc: "10% recuperação carrinho", usage: 312, cap: 1000 },
      { code: "FRETEFREE", desc: "Frete grátis SP", usage: 1842, cap: 5000 },
    ],
    segments: [
      { name: "VIP recompra <60d", size: 1240, tag: "VIP" },
      { name: "Carrinho aberto", size: 384, tag: "warm" },
      { name: "Sem compra 90d", size: 4820, tag: "reativar" },
    ],
  },
};

function ShowroomMarketing() {
  const [nicho, setNicho] = useState<NicheSlug>("ecommerce");
  const d = DATA[nicho];

  const stats = useMemo(() => {
    const running = d.campaigns.filter((c) => c.status === "running").length;
    const revenue = d.campaigns.reduce((a, c) => a + c.revenue, 0);
    const conv = d.campaigns.reduce((a, c) => a + c.conv, 0);
    const sent = d.campaigns.reduce((a, c) => a + c.sent, 0);
    return { running, revenue, conv, sent };
  }, [d]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Megaphone className="h-3 w-3" /> Showroom Marketing
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Central de campanhas multicanal
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              WhatsApp, e-mail, Instagram e tráfego pago num só lugar — com segmentação, cupons e
              métricas reais por nicho.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Campanhas ativas</h2>
            <p className="mt-1 text-muted-foreground">
              Base de {num(d.audience)} contatos · valores simulados
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
              <CircleDot className="h-3 w-3" /> Em execução
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.running}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Disparos (mês)
            </p>
            <p className="mt-1 text-2xl font-bold">{num(stats.sent)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" /> Conversões
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{num(stats.conv)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Receita atribuída
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(stats.revenue)}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4">
              <h3 className="text-lg font-semibold">Campanhas</h3>
              <p className="text-xs text-muted-foreground">
                Cliques, conversões e receita atualizados em tempo real.
              </p>
            </div>
            <ul className="divide-y">
              {d.campaigns.map((c, i) => {
                const Ch = CH[c.channel];
                const Icon = Ch.icon;
                const st = ST[c.status];
                return (
                  <li key={i} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${Ch.bg} ${Ch.cls}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Ch.label} · {c.segment}
                          </p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${st.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <Metric label="Enviados" value={num(c.sent)} muted={c.sent === 0} />
                      <Metric label="Abertura" value={c.open ? `${c.open}%` : "—"} />
                      <Metric label="CTR" value={c.ctr ? `${c.ctr}%` : "—"} />
                      <Metric label="Conversões" value={num(c.conv)} />
                      <Metric label="Receita" value={fmt(c.revenue)} highlight />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="flex flex-col gap-6">
            {/* Cupons */}
            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <BadgePercent className="h-4 w-4 text-primary" /> Cupons ativos
              </h3>
              <ul className="mt-3 space-y-3">
                {d.coupons.map((c) => {
                  const pct = Math.min(100, Math.round((c.usage / c.cap) * 100));
                  return (
                    <li key={c.code} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                          {c.code}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {c.usage}/{c.cap}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Segmentos */}
            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Tag className="h-4 w-4 text-primary" /> Segmentos
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {d.segments.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 rounded-md border p-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{num(s.size)} contatos</p>
                    </div>
                    <Badge variant="outline">{s.tag}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Segmentos são atualizados em tempo real conforme CRM, vendas e comportamento.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Marketing que mede receita</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Campanhas multicanal já com templates aprovados, segmentação automática e atribuição
            de receita — prontas por nicho.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/whatsapp">Ver WhatsApp</Link>
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

function Metric({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          highlight ? "text-emerald-600" : muted ? "text-muted-foreground" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
