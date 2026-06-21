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
  Users,
  Target,
  TrendingUp,
  Flame,
  MessageCircle,
  Mail,
  Instagram,
  Sparkles,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/showroom/crm")({
  head: () => ({
    meta: [
      { title: "Showroom CRM — Pipeline por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Pipeline kanban com leads, oportunidades, lead score e cadências por canal — pronto por nicho na Impulsionando.",
      },
      { property: "og:title", content: "CRM — Impulsionando" },
      {
        property: "og:description",
        content: "Kanban de oportunidades com canal de origem e cadência por nicho.",
      },
    ],
  }),
  component: ShowroomCRM,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Channel = "whatsapp" | "email" | "instagram" | "site";

const CH_META: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, cls: "text-emerald-600" },
  email: { label: "E-mail", icon: Mail, cls: "text-sky-600" },
  instagram: { label: "Instagram", icon: Instagram, cls: "text-pink-600" },
  site: { label: "Site", icon: Sparkles, cls: "text-violet-600" },
};

type Opp = {
  name: string;
  detail: string;
  value: number;
  score: number; // 0-100
  channel: Channel;
  age: string;
};

type Pipeline = { stage: string; color: string; cards: Opp[] };

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DATA: Record<NicheSlug, Pipeline[]> = {
  clinicas: [
    {
      stage: "Novo lead",
      color: "bg-slate-500",
      cards: [
        { name: "Lucas P.", detail: "Pergunta sobre convênio Bradesco", value: 320, score: 38, channel: "instagram", age: "2h" },
        { name: "Beatriz N.", detail: "Quer avaliação dermato", value: 480, score: 55, channel: "whatsapp", age: "5h" },
        { name: "Família Lima", detail: "Pediatra para 2 crianças", value: 640, score: 62, channel: "site", age: "1d" },
      ],
    },
    {
      stage: "Qualificado",
      color: "bg-sky-500",
      cards: [
        { name: "Renata L.", detail: "Pacote laser 6 sessões", value: 2880, score: 78, channel: "whatsapp", age: "2d" },
        { name: "Sofia R.", detail: "Retorno pediatria", value: 240, score: 70, channel: "whatsapp", age: "1d" },
      ],
    },
    {
      stage: "Proposta",
      color: "bg-amber-500",
      cards: [
        { name: "Marina S.", detail: "Pacote dermato 12 sessões", value: 5760, score: 84, channel: "whatsapp", age: "3d" },
        { name: "Convênio Unimed", detail: "Renovação contrato", value: 48000, score: 72, channel: "email", age: "4d" },
      ],
    },
    {
      stage: "Fechado",
      color: "bg-emerald-500",
      cards: [
        { name: "José C.", detail: "Check-up executivo", value: 1200, score: 100, channel: "site", age: "hoje" },
        { name: "Pedro F.", detail: "Vacina + consulta", value: 380, score: 100, channel: "whatsapp", age: "ontem" },
      ],
    },
  ],
  bares: [
    {
      stage: "Novo lead",
      color: "bg-slate-500",
      cards: [
        { name: "Carla M.", detail: "Aniversário 20 pax · sábado", value: 1800, score: 48, channel: "instagram", age: "3h" },
        { name: "Casal Souza", detail: "Jantar romântico sexta", value: 320, score: 52, channel: "site", age: "6h" },
      ],
    },
    {
      stage: "Reserva confirmada",
      color: "bg-sky-500",
      cards: [
        { name: "Rafa A.", detail: "Mesa 12 · 4 pax · 21h", value: 480, score: 80, channel: "whatsapp", age: "1d" },
        { name: "Bruno T.", detail: "Mesa térreo · 4 pax", value: 380, score: 70, channel: "whatsapp", age: "2d" },
      ],
    },
    {
      stage: "Evento / B2B",
      color: "bg-amber-500",
      cards: [
        { name: "Time Acme", detail: "Confra 40 pax · sex", value: 8400, score: 76, channel: "email", age: "5d" },
        { name: "Boda Mendes", detail: "Privê 30 pax · sáb", value: 9600, score: 92, channel: "whatsapp", age: "7d" },
      ],
    },
    {
      stage: "Consumiu",
      color: "bg-emerald-500",
      cards: [
        { name: "Família Souza", detail: "Almoço 6 pax", value: 580, score: 100, channel: "site", age: "hoje" },
      ],
    },
  ],
  microcervejarias: [
    {
      stage: "Interesse",
      color: "bg-slate-500",
      cards: [
        { name: "Aniv. João V.", detail: "Tour + degustação", value: 480, score: 60, channel: "instagram", age: "4h" },
        { name: "Empório Sul", detail: "Quer revenda B2B", value: 4200, score: 55, channel: "site", age: "1d" },
      ],
    },
    {
      stage: "Clube / B2B em análise",
      color: "bg-sky-500",
      cards: [
        { name: "Tap House", detail: "Lote #248 · 3 barris", value: 2890, score: 78, channel: "whatsapp", age: "2d" },
        { name: "Casa Hop", detail: "Trial assinatura corporativa", value: 1980, score: 64, channel: "email", age: "3d" },
      ],
    },
    {
      stage: "Pedido em rota",
      color: "bg-amber-500",
      cards: [
        { name: "Empório Norte", detail: "Reposição mensal", value: 4200, score: 70, channel: "email", age: "5d" },
      ],
    },
    {
      stage: "Recorrente",
      color: "bg-emerald-500",
      cards: [
        { name: "Clube Lúpulo", detail: "412 sócios ativos", value: 61788, score: 100, channel: "whatsapp", age: "mês" },
      ],
    },
  ],
  servicos: [
    {
      stage: "Orçamento solicitado",
      color: "bg-slate-500",
      cards: [
        { name: "Aline S.", detail: "Revisão HB20", value: 980, score: 45, channel: "messenger" as Channel, age: "3h" },
        { name: "Onix prata", detail: "Óleo + filtros", value: 460, score: 50, channel: "whatsapp", age: "5h" },
      ],
    },
    {
      stage: "Orçamento enviado",
      color: "bg-sky-500",
      cards: [
        { name: "Civic 2019", detail: "Suspensão completa", value: 2840, score: 72, channel: "whatsapp", age: "2d" },
        { name: "Frota Logix", detail: "Contrato mensal 8 carros", value: 8800, score: 80, channel: "email", age: "4d" },
      ],
    },
    {
      stage: "OS em andamento",
      color: "bg-amber-500",
      cards: [
        { name: "Pedro G.", detail: "OS #4421 · revisão 30k", value: 720, score: 90, channel: "whatsapp", age: "hoje" },
        { name: "T-Cross", detail: "Polimento premium", value: 1280, score: 88, channel: "site", age: "hoje" },
      ],
    },
    {
      stage: "Concluído",
      color: "bg-emerald-500",
      cards: [
        { name: "Rodrigo F.", detail: "Alinhamento + balanceamento", value: 380, score: 100, channel: "whatsapp", age: "ontem" },
      ],
    },
  ],
  ecommerce: [
    {
      stage: "Carrinho aberto",
      color: "bg-slate-500",
      cards: [
        { name: "Mariana DM", detail: "Tênis 37 · espera estoque", value: 389, score: 40, channel: "instagram", age: "2h" },
        { name: "Bruno T.", detail: "Carrinho abandonado 2x", value: 580, score: 58, channel: "email", age: "1d" },
      ],
    },
    {
      stage: "Carrinho recuperado",
      color: "bg-sky-500",
      cards: [
        { name: "Carla Origem", detail: "Cupom VOLTA10 aplicado", value: 389, score: 78, channel: "whatsapp", age: "hoje" },
      ],
    },
    {
      stage: "Pedido em curso",
      color: "bg-amber-500",
      cards: [
        { name: "#7821 Carla", detail: "Aguardando coleta Melhor Envio", value: 389, score: 90, channel: "site", age: "hoje" },
        { name: "#7822 Felipe", detail: "Parcelado 6x Mercado Pago", value: 1280, score: 86, channel: "site", age: "hoje" },
      ],
    },
    {
      stage: "Entregue / VIP",
      color: "bg-emerald-500",
      cards: [
        { name: "Cluster Origem VIP", detail: "Recompra média 60d", value: 24800, score: 100, channel: "whatsapp", age: "30d" },
      ],
    },
  ],
};

function ShowroomCRM() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");
  const pipeline = DATA[nicho];

  const stats = useMemo(() => {
    const all = pipeline.flatMap((p) => p.cards);
    const total = all.length;
    const pipelineValue = all.reduce((a, c) => a + c.value, 0);
    const closed = pipeline[pipeline.length - 1].cards.reduce((a, c) => a + c.value, 0);
    const conv = Math.round(
      (pipeline[pipeline.length - 1].cards.length / Math.max(total, 1)) * 100,
    );
    const hot = all.filter((c) => c.score >= 80).length;
    return { total, pipelineValue, closed, conv, hot };
  }, [pipeline]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Target className="h-3 w-3" /> Showroom CRM
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Pipeline organizado, time vendendo mais
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Kanban de oportunidades com canal de origem, lead score e cadência automática — com
              estágios pensados para o seu nicho.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Funil de vendas</h2>
            <p className="mt-1 text-muted-foreground">Pipeline atual · valores simulados</p>
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

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Oportunidades
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" /> Valor pipeline
            </p>
            <p className="mt-1 text-2xl font-bold">{fmt(stats.pipelineValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Fechado
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(stats.closed)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Conversão
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{stats.conv}%</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3" /> Leads quentes
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{stats.hot}</p>
          </Card>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-[920px] gap-4">
            {pipeline.map((col) => {
              const colValue = col.cards.reduce((a, c) => a + c.value, 0);
              return (
                <div key={col.stage} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                      <p className="text-sm font-semibold">{col.stage}</p>
                      <Badge variant="secondary" className="h-5">
                        {col.cards.length}
                      </Badge>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {fmt(colValue)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2">
                    {col.cards.map((c, i) => {
                      const Ch = CH_META[c.channel] ?? CH_META.site;
                      const Icon = Ch.icon;
                      const scoreCls =
                        c.score >= 80
                          ? "bg-rose-100 text-rose-700"
                          : c.score >= 60
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700";
                      return (
                        <Card key={i} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">{c.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${scoreCls}`}>
                              {c.score}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {c.detail}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className={`flex items-center gap-1 ${Ch.cls}`}>
                              <Icon className="h-3 w-3" /> {Ch.label}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {c.age}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold tabular-nums">{fmt(c.value)}</p>
                        </Card>
                      );
                    })}
                    {col.cards.length === 0 && (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        Vazio
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Cadência automática rodando
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada estágio dispara mensagens, tarefas e SLA para o time — sem deixar lead esfriar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/showroom/whatsapp">Ver mensagens</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/showroom/automacoes">Ver automações</Link>
            </Button>
          </div>
        </Card>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">CRM que o time realmente usa</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Pipeline pronto por nicho, com automações, lead score e métricas que aparecem nos
            dashboards e relatórios.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
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
