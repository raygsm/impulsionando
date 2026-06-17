import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles,
  MapPin,
  Star,
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/showroom/agendamentos-online")({
  head: () => ({
    meta: [
      { title: "Página pública de agendamento por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Página pública de agendamento online: cliente escolhe serviço, profissional, horário e paga — em 4 cliques.",
      },
      {
        property: "og:title",
        content: "Agendamento online — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demo navegável da página pública de agendamentos: catálogo de serviços, agenda inteligente, sinal/pagamento e confirmação.",
      },
    ],
  }),
  component: ShowroomAgendamentos,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type Step = 1 | 2 | 3 | 4;

type Service = {
  id: string;
  name: string;
  desc: string;
  duration: string;
  price: number;
  deposit?: number;
};
type Pro = { id: string; name: string; role: string; rating: number; reviews: number };

type Cfg = {
  brand: string;
  hero: string;
  rating: number;
  reviews: number;
  address: string;
  serviceLabel: string;
  proLabel: string;
  services: Service[];
  pros: Pro[];
  slots: string[];
  primary: string;
  ctaLabel: string;
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Clínica Vitalis",
    hero: "Agende sua consulta online em 60 segundos",
    rating: 4.9,
    reviews: 1284,
    address: "Av. Paulista, 1.578 — São Paulo",
    serviceLabel: "Especialidade",
    proLabel: "Profissional",
    primary: "from-emerald-500 to-teal-600",
    ctaLabel: "Confirmar consulta",
    services: [
      { id: "s1", name: "Cardiologia", desc: "Consulta + ECG + orientação", duration: "45 min", price: 380, deposit: 80 },
      { id: "s2", name: "Dermatologia", desc: "Avaliação completa de pele", duration: "30 min", price: 320, deposit: 80 },
      { id: "s3", name: "Nutrição", desc: "Plano alimentar + bioimpedância", duration: "60 min", price: 280, deposit: 60 },
      { id: "s4", name: "Psicologia (TCC)", desc: "Sessão individual", duration: "50 min", price: 240, deposit: 50 },
    ],
    pros: [
      { id: "p1", name: "Dra. Helena Costa", role: "Cardiologista", rating: 4.9, reviews: 384 },
      { id: "p2", name: "Dr. Rafael Lima", role: "Dermatologista", rating: 4.8, reviews: 291 },
      { id: "p3", name: "Júlia Pereira", role: "Nutricionista", rating: 4.9, reviews: 162 },
    ],
    slots: ["08:00", "09:00", "10:30", "13:00", "14:30", "16:00", "17:30", "19:00"],
  },
  bares: {
    brand: "Bar do Rei",
    hero: "Reserve sua mesa pra sexta — sem fila, sem pagar entrada",
    rating: 4.8,
    reviews: 942,
    address: "R. Aspicuelta, 412 — Vila Madalena, SP",
    serviceLabel: "Tipo de reserva",
    proLabel: "Anfitrião",
    primary: "from-amber-500 to-orange-600",
    ctaLabel: "Reservar mesa",
    services: [
      { id: "s1", name: "Mesa padrão (4 pessoas)", desc: "Salão principal + atendimento à mesa", duration: "3 horas", price: 0 },
      { id: "s2", name: "Mesa premium (4–8 pessoas)", desc: "Próxima ao palco + couvert incluso", duration: "3 horas", price: 120, deposit: 120 },
      { id: "s3", name: "Camarote (até 12 pessoas)", desc: "Privativo + bartender exclusivo", duration: "4 horas", price: 600, deposit: 300 },
      { id: "s4", name: "Open chopp 2h", desc: "Chopp à vontade por pessoa", duration: "2 horas", price: 79, deposit: 40 },
    ],
    pros: [
      { id: "p1", name: "Diego Martins", role: "Maître", rating: 4.9, reviews: 218 },
      { id: "p2", name: "Carolina Brito", role: "Hostess", rating: 4.8, reviews: 184 },
      { id: "p3", name: "Beatriz Lopes", role: "Bartender chefe", rating: 4.9, reviews: 142 },
    ],
    slots: ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
  },
  cervejarias: {
    brand: "Hops & Co.",
    hero: "Reserve seu brew tour ou taproom",
    rating: 4.9,
    reviews: 612,
    address: "R. Bocaiúva, 2.345 — Florianópolis",
    serviceLabel: "Experiência",
    proLabel: "Guia",
    primary: "from-yellow-500 to-amber-700",
    ctaLabel: "Reservar agora",
    services: [
      { id: "s1", name: "Brew Tour Clássico", desc: "Visita guiada + degustação 5 rótulos", duration: "90 min", price: 89, deposit: 30 },
      { id: "s2", name: "Brassagem Coletiva", desc: "Faça sua cerveja com nosso mestre", duration: "4 horas", price: 320, deposit: 100 },
      { id: "s3", name: "Taproom — Flight 4 doses", desc: "4 doses + harmonização", duration: "60 min", price: 42 },
      { id: "s4", name: "Tour Premium + Barrel-Aged", desc: "Tour + degustação rótulos raros", duration: "2 horas", price: 180, deposit: 60 },
    ],
    pros: [
      { id: "p1", name: "Felipe Ramos", role: "Guia oficial", rating: 4.9, reviews: 198 },
      { id: "p2", name: "Bruno Werner", role: "Mestre cervejeiro", rating: 5.0, reviews: 142 },
      { id: "p3", name: "Larissa Hoffmann", role: "Brewer", rating: 4.8, reviews: 96 },
    ],
    slots: ["11:00", "13:00", "14:30", "15:00", "16:30", "18:00", "19:30"],
  },
  servicos: {
    brand: "FixPro Serviços",
    hero: "Agende uma visita técnica gratuita",
    rating: 4.8,
    reviews: 482,
    address: "Atende toda a Grande SP",
    serviceLabel: "Tipo de serviço",
    proLabel: "Técnico responsável",
    primary: "from-blue-500 to-indigo-700",
    ctaLabel: "Agendar visita",
    services: [
      { id: "s1", name: "Vistoria elétrica residencial", desc: "Quadro, tomadas, aterramento", duration: "60 min", price: 0 },
      { id: "s2", name: "Diagnóstico de vazamento", desc: "Sem quebra, com câmera térmica", duration: "90 min", price: 180, deposit: 50 },
      { id: "s3", name: "Orçamento de reforma", desc: "Visita + projeto + cronograma", duration: "120 min", price: 0 },
      { id: "s4", name: "Manutenção preventiva", desc: "Check-list completo + relatório", duration: "120 min", price: 240, deposit: 80 },
    ],
    pros: [
      { id: "p1", name: "André Cardoso", role: "Eletricista sênior", rating: 4.9, reviews: 286 },
      { id: "p2", name: "Vinícius Tomé", role: "Encanador", rating: 4.7, reviews: 164 },
      { id: "p3", name: "Eduardo Nunes", role: "Coord. técnico", rating: 4.9, reviews: 192 },
    ],
    slots: ["07:30", "09:00", "10:30", "13:00", "14:30", "16:00", "17:30"],
  },
  ecommerce: {
    brand: "Loja Norte",
    hero: "Agende um atendimento personal shopper",
    rating: 4.9,
    reviews: 738,
    address: "R. Oscar Freire, 909 — Jardins, SP",
    serviceLabel: "Tipo de atendimento",
    proLabel: "Consultora",
    primary: "from-pink-500 to-rose-600",
    ctaLabel: "Agendar atendimento",
    services: [
      { id: "s1", name: "Personal shopper na loja", desc: "60 min com peças pré-selecionadas", duration: "60 min", price: 0 },
      { id: "s2", name: "Personal shopper por vídeo", desc: "Atendimento por WhatsApp video", duration: "45 min", price: 0 },
      { id: "s3", name: "Provador exclusivo", desc: "Sala privativa + champagne", duration: "90 min", price: 80, deposit: 80 },
      { id: "s4", name: "Look completo (visagismo)", desc: "Consultoria + 3 looks completos", duration: "120 min", price: 240, deposit: 100 },
    ],
    pros: [
      { id: "p1", name: "Pedro Marques", role: "Personal shopper", rating: 4.9, reviews: 214 },
      { id: "p2", name: "Sofia Mendes", role: "Consultora omnichannel", rating: 4.8, reviews: 168 },
      { id: "p3", name: "Camila Duarte", role: "Visagista", rating: 5.0, reviews: 92 },
    ],
    slots: ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"],
  },
};

const NICHE_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  cervejarias: "Microcervejarias",
  servicos: "Serviços & Reformas",
  ecommerce: "E-commerce & Varejo",
};

function ShowroomAgendamentos() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const cfg = DATA[niche];

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<Service | null>(null);
  const [pro, setPro] = useState<Pro | null>(null);
  const [day, setDay] = useState<number>(2);
  const [slot, setSlot] = useState<string | null>(null);
  const [pay, setPay] = useState<"pix" | "card" | "boleto">("pix");

  const reset = () => {
    setStep(1);
    setService(null);
    setPro(null);
    setSlot(null);
    setPay("pix");
    setDay(2);
  };

  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        idx: i,
        dow: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        dom: d.getDate(),
        full: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }),
      };
    });
  }, []);

  const canNext =
    (step === 1 && !!service) ||
    (step === 2 && !!pro && !!slot) ||
    (step === 3 && !!pay);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className={`bg-gradient-to-br ${cfg.primary} text-white`}>
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 gap-1 border-0 bg-white/15 text-white hover:bg-white/15">
                <CalendarDays className="h-3 w-3" /> Página pública de agendamento
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                {cfg.brand}
              </h1>
              <p className="mt-2 text-pretty text-base opacity-95">{cfg.hero}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" /> {cfg.rating} •{" "}
                  <span className="opacity-90">{cfg.reviews} avaliações</span>
                </span>
                <span className="inline-flex items-center gap-1 opacity-90">
                  <MapPin className="h-4 w-4" /> {cfg.address}
                </span>
                <span className="inline-flex items-center gap-1 opacity-90">
                  <ShieldCheck className="h-4 w-4" /> Confirmação imediata
                </span>
              </div>
            </div>
            <Select
              value={niche}
              onValueChange={(v) => {
                setNiche(v as NicheSlug);
                reset();
              }}
            >
              <SelectTrigger className="w-[260px] border-white/30 bg-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHE_LABEL) as NicheSlug[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {NICHE_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Stepper */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto flex items-center gap-2 overflow-x-auto px-4 py-4 text-sm">
          {[
            { n: 1, label: cfg.serviceLabel },
            { n: 2, label: `${cfg.proLabel} & horário` },
            { n: 3, label: "Pagamento" },
            { n: 4, label: "Confirmação" },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step >= s.n
                    ? "bg-foreground text-background"
                    : "border bg-background text-muted-foreground"
                }`}
              >
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </span>
              <span
                className={
                  step >= s.n ? "font-medium" : "text-muted-foreground"
                }
              >
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <span className="mx-2 hidden h-px w-12 bg-border sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Conteúdo */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold">Escolha {cfg.serviceLabel.toLowerCase()}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preços e duração já considerando sua localidade.
                </p>
                <ul className="mt-4 space-y-3">
                  {cfg.services.map((s) => {
                    const active = service?.id === s.id;
                    return (
                      <li
                        key={s.id}
                        onClick={() => setService(s)}
                        className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-4 transition ${
                          active ? "border-foreground bg-muted/40" : "hover:bg-muted/30"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {s.duration}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {s.price === 0 ? "Grátis" : fmtBRL(s.price)}
                          </p>
                          {s.deposit && (
                            <p className="text-[11px] text-muted-foreground">
                              Sinal: {fmtBRL(s.deposit)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Escolha {cfg.proLabel.toLowerCase()} e horário</h2>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {cfg.proLabel}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {cfg.pros.map((p) => {
                      const active = pro?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPro(p)}
                          className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                            active ? "border-foreground bg-muted/40" : "hover:bg-muted/30"
                          }`}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-[11px]">
                              {p.name
                                .split(" ")
                                .map((x) => x[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {p.role}
                            </p>
                            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-amber-600">
                              <Star className="h-3 w-3 fill-current" /> {p.rating} ({p.reviews})
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Próximos dias
                  </p>
                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                    {days.map((d) => {
                      const active = day === d.idx;
                      return (
                        <button
                          key={d.idx}
                          onClick={() => setDay(d.idx)}
                          className={`flex min-w-[58px] flex-col items-center rounded-lg border p-2 text-center text-xs transition ${
                            active ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
                          }`}
                        >
                          <span className="uppercase opacity-80">{d.dow}</span>
                          <span className="mt-0.5 text-base font-bold">{d.dom}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Horários disponíveis
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cfg.slots.map((h) => {
                      const active = slot === h;
                      return (
                        <button
                          key={h}
                          onClick={() => setSlot(h)}
                          className={`rounded-md border px-3 py-1.5 text-sm transition ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "hover:bg-muted"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold">Pagamento</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {service?.deposit
                    ? `Cobramos um sinal de ${fmtBRL(service.deposit)} para garantir sua reserva.`
                    : service?.price === 0
                      ? "Esse atendimento não exige pagamento online."
                      : `Pague agora ${fmtBRL(service?.price ?? 0)} ou no local.`}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "pix", label: "Pix", desc: "5% de desconto", icon: Smartphone },
                    { id: "card", label: "Cartão", desc: "Até 3x sem juros", icon: CreditCard },
                    { id: "boleto", label: "Boleto", desc: "Vence em 1 dia útil", icon: Building2 },
                  ].map((p) => {
                    const Icon = p.icon;
                    const active = pay === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPay(p.id as typeof pay)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition ${
                          active ? "border-foreground bg-muted/40" : "hover:bg-muted/30"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <p className="text-sm font-semibold">{p.label}</p>
                        <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Nome completo" />
                  <Input placeholder="CPF" />
                  <Input placeholder="WhatsApp" />
                  <Input placeholder="E-mail" />
                </div>

                <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> Pagamento seguro processado pela InfinitePay.
                </p>
              </>
            )}

            {step === 4 && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-2xl font-bold">Reserva confirmada!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enviamos os detalhes no seu WhatsApp e e-mail.
                </p>

                <div className="mx-auto mt-6 max-w-md rounded-lg border bg-muted/30 p-4 text-left text-sm">
                  <p className="font-semibold">{service?.name}</p>
                  <p className="mt-1 text-muted-foreground">
                    {pro?.name} • {days[day].full} às {slot}
                  </p>
                  <p className="mt-1 text-muted-foreground">{cfg.address}</p>
                  <div className="my-3 border-t" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">
                      {service?.price === 0 ? "Grátis" : fmtBRL(service?.price ?? 0)}
                    </span>
                  </div>
                  {service?.deposit && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sinal pago via {pay}</span>
                      <span className="font-medium text-emerald-700">
                        {fmtBRL(service.deposit)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button className="gap-1">
                    <MessageCircle className="h-4 w-4" /> Abrir conversa no WhatsApp
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Fazer outra reserva
                  </Button>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(1, (s - 1) as Step))}
                  disabled={step === 1}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  disabled={!canNext}
                  onClick={() => setStep((s) => Math.min(4, (s + 1) as Step))}
                  className="gap-1"
                >
                  {step === 3 ? cfg.ctaLabel : "Continuar"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Resumo */}
          <Card className="h-fit p-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Resumo da reserva
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <Row label={cfg.serviceLabel} value={service?.name ?? "—"} />
              <Row label={cfg.proLabel} value={pro?.name ?? "—"} />
              <Row label="Data" value={service && pro ? days[day].full : "—"} />
              <Row label="Horário" value={slot ?? "—"} />
              <div className="my-2 border-t" />
              <Row
                label="Valor"
                value={service ? (service.price === 0 ? "Grátis" : fmtBRL(service.price)) : "—"}
              />
              {service?.deposit && (
                <Row
                  label="Sinal"
                  value={fmtBRL(service.deposit)}
                  highlight
                />
              )}
            </div>

            <div className="mt-5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1 font-medium text-foreground">
                <Sparkles className="h-3 w-3" /> Lembretes automáticos
              </p>
              <p className="mt-1">
                Enviamos confirmação 24h e 2h antes pelo WhatsApp. Reagendar é em 1 toque.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Seu link público de agendamento, sem fricção
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Catálogo, agenda em tempo real, sinal pago no Pix e lembretes automáticos — tudo
            integrado ao CRM, ao financeiro e ao calendário da equipe.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Quero meu link de agendamento</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom">
                Ver outros showrooms <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right ${highlight ? "font-semibold text-emerald-700" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

export default ShowroomAgendamentos;
