import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Handshake,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  Users,
  Briefcase,
  Megaphone,
  GraduationCap,
  FileText,
  Download,
  CheckCircle2,
  Crown,
  Rocket,
  Globe2,
} from "lucide-react";

export const Route = createFileRoute("/showroom/parcerias-revenda")({
  head: () => ({
    meta: [
      {
        title:
          "Programa de Parceiros e Revenda — Impulsionando | Comissione até 40%",
      },
      {
        name: "description",
        content:
          "Torne-se parceiro Impulsionando: comissões recorrentes de até 40%, white-label, materiais prontos, treinamento gratuito e gestor de conta dedicado.",
      },
      {
        property: "og:title",
        content: "Programa de Parceiros — Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Indicação, revenda autorizada ou white-label: escolha o modelo, monetize sua base e cresça com a Impulsionando.",
      },
    ],
  }),
  component: ParceriasRevenda,
});

interface Tier {
  id: string;
  name: string;
  icon: typeof Crown;
  pitch: string;
  commission: string;
  recurrence: string;
  minClients: string;
  perks: string[];
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    id: "indica",
    name: "Indica & Ganha",
    icon: Megaphone,
    pitch: "Indique e ganhe sem se preocupar com fechamento.",
    commission: "20%",
    recurrence: "12 meses recorrentes",
    minClients: "Sem mínimo",
    perks: [
      "Link de indicação rastreável",
      "Pagamento mensal via PIX",
      "Dashboard de leads em tempo real",
      "Materiais prontos para redes sociais",
    ],
  },
  {
    id: "revenda",
    name: "Revenda Autorizada",
    icon: Briefcase,
    pitch: "Venda, implante e dê suporte de primeiro nível.",
    commission: "30%",
    recurrence: "Vitalício enquanto ativo",
    minClients: "3 clientes em 90 dias",
    perks: [
      "Selo Revenda Autorizada",
      "Co-marketing regional",
      "Acesso ao sandbox de demonstração",
      "Gestor de conta dedicado",
      "Treinamento de implantação certificado",
    ],
    highlight: true,
  },
  {
    id: "whitelabel",
    name: "White-label / OEM",
    icon: Crown,
    pitch: "Sua marca, nossa tecnologia. Construa um SaaS próprio.",
    commission: "40%",
    recurrence: "Vitalício + share de upsell",
    minClients: "Plano enterprise",
    perks: [
      "Domínio, logo e cores próprias",
      "Apps mobile com sua marca",
      "API isolada por tenant",
      "Suporte L2 24/7",
      "Roadmap conjunto trimestral",
    ],
  },
];

const RESOURCES = [
  {
    icon: FileText,
    title: "Kit comercial 2026",
    desc: "Apresentação institucional, pitch deck por nicho e propostas modelo.",
    badge: "PDF + Keynote",
  },
  {
    icon: Megaphone,
    title: "Pacote de mídia",
    desc: "Banners, posts, reels e templates do Canva prontos para customizar.",
    badge: "120+ peças",
  },
  {
    icon: GraduationCap,
    title: "Trilha de certificação",
    desc: "40h de curso, exame oficial e selo Verified Partner para LinkedIn.",
    badge: "Gratuito",
  },
  {
    icon: Globe2,
    title: "Páginas co-brand",
    desc: "Landing pages personalizadas com sua marca para captação local.",
    badge: "Setup em 24h",
  },
];

const SUCCESS = [
  {
    name: "AgênciaCRM",
    region: "Curitiba — PR",
    tier: "Revenda Autorizada",
    metric: "+R$ 48k MRR em 8 meses",
    quote:
      "Migramos 32 clientes da concorrência. O onboarding humano da Impulsionando faz a diferença.",
  },
  {
    name: "Nordeste Tech",
    region: "Recife — PE",
    tier: "White-label",
    metric: "180 contas ativas no app próprio",
    quote:
      "Lançamos nosso SaaS regional em 60 dias. Sem essa parceria, levaria 2 anos.",
  },
  {
    name: "Studio Indica",
    region: "São Paulo — SP",
    tier: "Indica & Ganha",
    metric: "R$ 7.4k/mês recorrente passivo",
    quote:
      "Compartilho o link com clientes da consultoria e a recorrência cobre meu aluguel.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Inscrição",
    desc: "Preencha o formulário em 3 minutos e escolha o modelo de parceria.",
  },
  {
    step: "02",
    title: "Aprovação",
    desc: "Análise em até 48h úteis. Reunião de boas-vindas com gestor dedicado.",
  },
  {
    step: "03",
    title: "Capacitação",
    desc: "Trilha de certificação gratuita + acesso aos materiais e sandbox.",
  },
  {
    step: "04",
    title: "Primeiros leads",
    desc: "Receba leads qualificados da sua região nos primeiros 30 dias.",
  },
  {
    step: "05",
    title: "Escalada",
    desc: "Co-marketing, eventos regionais e oportunidades enterprise compartilhadas.",
  },
];

const FAQ = [
  {
    q: "Preciso ter CNPJ para virar parceiro?",
    a: "Para Indica & Ganha, não — pagamos PJ ou PF via PIX. Revenda e White-label exigem CNPJ ativo e nota fiscal.",
  },
  {
    q: "Qual o ciclo de pagamento das comissões?",
    a: "Mensal, todo dia 10, com extrato detalhado por cliente e contrato. Pagamento via PIX, TED ou crédito na fatura.",
  },
  {
    q: "Posso revender em qualquer região?",
    a: "Sim. Não trabalhamos com exclusividade geográfica, mas oferecemos roteamento de leads por proximidade.",
  },
  {
    q: "Como funciona o suporte ao cliente final no White-label?",
    a: "Você atende L1 (dúvidas operacionais). Nós atendemos L2 e L3 (técnico e infraestrutura) 24/7 em até 1h.",
  },
];

function ParceriasRevenda() {
  const [tier, setTier] = useState<string>("revenda");
  const [clients, setClients] = useState<number[]>([15]);
  const [ticket, setTicket] = useState<number>(497);

  const selected = TIERS.find((t) => t.id === tier) ?? TIERS[1];
  const pct = parseInt(selected.commission) / 100;

  const projection = useMemo(() => {
    const monthly = clients[0] * ticket * pct;
    const yearly = monthly * 12;
    const year2 = monthly * 12 * 1.8;
    return {
      monthly: monthly.toFixed(0),
      yearly: yearly.toFixed(0),
      year2: year2.toFixed(0),
    };
  }, [clients, ticket, pct]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" /> Programa de parceiros
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Construa uma nova receita recorrente com a Impulsionando
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Indique, revenda ou crie seu próprio SaaS white-label. Comissões
              recorrentes de até 40%, materiais prontos, gestor dedicado e
              treinamento gratuito.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg">
                <Handshake className="mr-2 h-4 w-4" /> Quero ser parceiro
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/academia">Trilha de certificação</Link>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Parceiros ativos", value: "+340" },
                { label: "Estados cobertos", value: "27" },
                { label: "Comissão média", value: "R$ 6.8k/mês" },
                { label: "NPS de parceiros", value: "82" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border bg-card p-4">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Três modelos de parceria</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((t) => {
              const Icon = t.icon;
              const active = t.id === tier;
              return (
                <Card
                  key={t.id}
                  className={`p-6 cursor-pointer transition ${
                    active
                      ? "border-primary ring-2 ring-primary/20"
                      : t.highlight
                        ? "border-primary/40"
                        : ""
                  }`}
                  onClick={() => setTier(t.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {t.highlight && (
                      <Badge className="gap-1">
                        <TrendingUp className="h-3 w-3" /> Mais escolhido
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 text-xl font-semibold">{t.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.pitch}
                  </p>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">
                      {t.commission}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      de comissão
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t.recurrence} · mín. {t.minClients}
                  </div>
                  <ul className="mt-5 space-y-2 text-sm">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 w-full"
                    variant={active ? "default" : "outline"}
                  >
                    {active ? "Selecionado" : "Selecionar este modelo"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">
              Simulador de receita recorrente
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">
                    Modelo selecionado:{" "}
                    <span className="font-semibold text-primary">
                      {selected.name}
                    </span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Comissão: {selected.commission} · {selected.recurrence}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between">
                    <Label>Clientes ativos na sua base</Label>
                    <span className="text-sm font-semibold">{clients[0]}</span>
                  </div>
                  <Slider
                    value={clients}
                    onValueChange={setClients}
                    min={1}
                    max={150}
                    step={1}
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>150</span>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">
                    Ticket médio mensal (R$)
                  </Label>
                  <Input
                    type="number"
                    value={ticket}
                    onChange={(e) => setTicket(Number(e.target.value))}
                    min={197}
                    max={4997}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Faixa típica: R$ 197 a R$ 2.997
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-muted-foreground">
                Sua projeção com {selected.name}
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border bg-primary/5 p-4">
                  <div className="text-xs text-muted-foreground">
                    Comissão mensal
                  </div>
                  <div className="mt-1 text-4xl font-bold text-primary">
                    R$ {Number(projection.monthly).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">
                      Ano 1 (recorrente)
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      R$ {Number(projection.yearly).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">
                      Ano 2 (com crescimento)
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      R$ {Number(projection.year2).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Projeção considera retenção média de 92% e crescimento
                  orgânico de 80% no ano 2 baseado na média da rede.
                </p>
                <Button className="w-full" size="lg">
                  Aplicar com esta projeção
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">
              Materiais e suporte inclusos
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {RESOURCES.map((r) => (
              <Card key={r.title} className="p-5">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary inline-flex">
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="font-semibold">{r.title}</div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                <Badge variant="outline" className="mt-3 text-xs">
                  {r.badge}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">
              Da inscrição à primeira comissão
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {PROCESS_STEPS.map((s) => (
              <Card key={s.step} className="p-5">
                <div className="text-3xl font-bold text-primary/30">
                  {s.step}
                </div>
                <div className="mt-2 font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Parceiros que crescem com a gente</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SUCCESS.map((s) => (
              <Card key={s.name} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.region}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {s.tier}
                  </Badge>
                </div>
                <div className="mt-3 text-emerald-600 dark:text-emerald-400 font-medium">
                  {s.metric}
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  "{s.quote}"
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold">Perguntas frequentes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FAQ.map((f) => (
              <Card key={f.q} className="p-5">
                <div className="font-semibold">{f.q}</div>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">
            Pronto para construir receita recorrente conosco?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/85">
            Inscreva-se em 3 minutos. Aprovação em 48h úteis. Primeiros leads
            qualificados nos primeiros 30 dias.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary">
              <Handshake className="mr-2 h-4 w-4" /> Aplicar agora
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/showroom">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
