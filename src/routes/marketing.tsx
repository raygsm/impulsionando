import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowRight, CheckCircle2, Sparkles, Cpu, Megaphone, ShieldCheck,
  AlertTriangle, Building2, Workflow, Users, BarChart3, Link2, MessageCircle,
  Settings2, Target, Layers, TrendingUp, Wallet, Headset,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchImpulsionandoBrasilPages,
  submitImpulsionandoBrasilLead,
} from "@/lib/marketing-site.functions";
import { isValidEmail, isValidPhoneBR, maskPhone } from "@/lib/validators";

type ServicePage = {
  slug: string;
  name: string;
  status: string;
  content: {
    hero: { eyebrow: string; title: string; subtitle: string; cta: string; tag: string };
    benefits: string[];
    process: string[];
    priceRange: string;
    leadSource: string;
  };
};

const ORDER = ["agente-virtual", "social-media", "google-ads", "assessoria-marketing"];

const pagesQuery = queryOptions({
  queryKey: ["marketing-site", "impulsionando-brasil"],
  queryFn: () => fetchImpulsionandoBrasilPages(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Impulsionando Brasil — Marketing + Gestão Empresarial com estrutura para escalar" },
      { name: "description", content: "Marketing sem estrutura não escala. Estrutura sem marketing não cresce. Assessoria de Marketing + Assessoria Empresarial integradas à plataforma Impulsionando Tecnologia." },
      { property: "og:title", content: "Impulsionando Brasil — Marketing + Gestão Empresarial" },
      { property: "og:description", content: "Marketing, comercial, atendimento, processos e sistemas operando juntos. Resultado previsível em 90 dias." },
      { property: "og:url", content: "https://impulsionando.com.br/marketing" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/marketing" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(pagesQuery),
  component: MarketingPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-12 text-center">
      <p className="text-destructive">Erro: {String(error)}</p>
      <Button onClick={reset} className="mt-4">Tentar novamente</Button>
    </div>
  ),
});

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

function MarketingPage() {
  const { data } = useSuspenseQuery(pagesQuery);
  const services = useMemo(() => {
    const map = new Map((data.pages as ServicePage[]).map((p) => [p.slug, p]));
    return ORDER.map((s) => map.get(s)).filter(Boolean) as ServicePage[];
  }, [data]);

  const [openService, setOpenService] = useState<ServicePage | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* ========= HERO ========= */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <Badge className="bg-white/10 backdrop-blur text-white border-white/20 mb-5">
              <Sparkles className="w-3 h-3 mr-1" /> Marketing · Gestão · Tecnologia
            </Badge>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Gestão em Marketing e Gestão Empresarial para empresas que querem crescer com estrutura.
            </h1>
            <p className="mt-5 text-base sm:text-xl text-white/85 leading-relaxed max-w-3xl mx-auto">
              Marketing sem estrutura <strong>não escala</strong>. Estrutura sem marketing <strong>não cresce</strong>.
              A Impulsionando Brasil organiza processos, sistemas, atendimento, comercial e marketing
              para transformar empresas em operações <strong>previsíveis, estruturadas e escaláveis</strong>.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch justify-center gap-3 max-w-3xl mx-auto">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 flex-1 min-w-[200px]">
                <a href="#assessoria-marketing"><Megaphone className="w-4 h-4" /> Quero estruturar meu marketing</a>
              </Button>
              <Button asChild size="lg" className="bg-gradient-primary gap-2 flex-1 min-w-[200px]">
                <a href="#assessoria-empresarial"><Building2 className="w-4 h-4" /> Quero estruturar minha empresa</a>
              </Button>
              <Button asChild size="lg" className="btn-whatsapp gap-2 flex-1 min-w-[200px]">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com o Impulsionito
                </a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/75 max-w-2xl mx-auto">
              Resultado em até <strong>90 dias</strong> com painel transparente, métricas semanais e
              integração direta na plataforma Impulsionando Tecnologia.
            </p>
          </div>
        </section>

        {/* ========= O PROBLEMA ========= */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-3">
                <AlertTriangle className="w-3 h-3 mr-1" /> Diagnóstico honesto
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                O problema não é vender. É tentar vender sem estrutura.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A maioria das empresas não falha por falta de esforço. Falha porque tenta vender
                mais antes de organizar a base. Sem estrutura operacional, processual, comercial,
                contábil e estratégica, o marketing desperdiça verba, o atendimento falha,
                o comercial trava e o crescimento não sustenta.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Wallet, t: "Marketing queima verba", d: "Anúncio gera lead que o atendimento não responde a tempo." },
                { icon: Headset, t: "Atendimento perde", d: "WhatsApp e e-mails sem fila, sem SLA, sem histórico." },
                { icon: Target, t: "Comercial trava", d: "Sem CRM, sem funil, sem follow-up — venda esfria." },
                { icon: BarChart3, t: "Gestor não enxerga", d: "Sem dashboard, decisão vira achismo." },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <Card key={b.t} className="p-4">
                    <Icon className="w-5 h-5 text-destructive mb-2" />
                    <div className="font-semibold text-sm">{b.t}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.d}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========= 2 PILARES ========= */}
        <section className="bg-card/40 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Nossa atuação</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Estruturamos a empresa para o marketing funcionar. E o marketing para a empresa crescer.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Dois pilares integrados — não vendemos um sem entender o outro.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Assessoria de Marketing */}
              <Card id="assessoria-marketing" className="p-6 sm:p-7 border-primary/30 ring-1 ring-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-primary">Pilar 1</div>
                    <h3 className="text-xl font-bold">Assessoria de Marketing</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Gestão completa do marketing com integração entre tráfego, social media, atendimento,
                  automação, CRM, site, páginas e funis.
                </p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    "Tráfego pago (Google Ads, Meta, LinkedIn)",
                    "Social Media estratégico",
                    "Automação e CRM",
                    "Sites, landing pages e funis de venda",
                    "Atendimento ativo e qualificação de lead",
                    "BI semanal de campanhas e custo por venda",
                  ].map((b) => (
                    <li key={b} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild className="mt-5 w-full bg-gradient-primary">
                  <a href="#servicos">Ver serviços de marketing <ArrowRight className="ml-2 w-4 h-4" /></a>
                </Button>
              </Card>

              {/* Assessoria Empresarial */}
              <Card id="assessoria-empresarial" className="p-6 sm:p-7 border-accent/30 ring-1 ring-accent/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-accent">Pilar 2</div>
                    <h3 className="text-xl font-bold">Assessoria Empresarial</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Estruturação de processos, sistemas, atendimento, comercial, financeiro, RH e gestão
                  para que a empresa suporte o crescimento.
                </p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    "Mapeamento e desenho de processos",
                    "Implantação de sistemas (CRM, ERP, BI)",
                    "Estruturação comercial e funil de venda",
                    "Atendimento, SLA e jornada do cliente",
                    "Gestão financeira e fluxo de caixa",
                    "RH, cultura e indicadores de equipe",
                  ].map((b) => (
                    <li key={b} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="#fusao"><Workflow className="mr-2 w-4 h-4" /> Como estruturamos sua empresa</a>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* ========= POR QUE 90 DIAS ========= */}
        <section id="por-que-90-dias" className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3"><TrendingUp className="w-3 h-3 mr-1" /> Compromisso operacional</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Por que 90 dias?</h2>
              <p className="mt-3 text-muted-foreground max-w-3xl mx-auto">
                90 dias é o ciclo mínimo para uma régua comercial mostrar resultado consistente:
                tempo de aprender com seus dados, ajustar oferta e medir custo por venda real.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { d: "Dia 1 — 30", t: "Subir a operação", txt: "Briefing, integração ao Core, campanhas no ar, agente virtual treinado, processos documentados." },
                { d: "Dia 31 — 60", t: "Primeiros resultados", txt: "Leads qualificados entrando, leitura semanal de funil, ajustes de oferta e mensagem." },
                { d: "Dia 61 — 90", t: "Ciclo de aprendizado", txt: "Custo por venda mensurado, plano do próximo trimestre baseado em dados reais — não em achismo." },
              ].map((b) => (
                <Card key={b.d} className="p-6">
                  <Badge variant="secondary" className="mb-2">{b.d}</Badge>
                  <h3 className="font-semibold">{b.t}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.txt}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ========= SERVIÇOS (DB) ========= */}
        <section id="servicos" className="py-16 sm:py-20 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3">Frentes ativas</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Nossos serviços</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Quatro frentes pensadas para escalar venda com previsibilidade — pode contratar uma, algumas ou todas.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((s) => (
                <Card key={s.slug} className="p-6 sm:p-7 hover:shadow-lg transition-shadow flex flex-col">
                  <Badge variant="outline" className="mb-2 self-start">{s.content.hero.eyebrow}</Badge>
                  <h3 className="text-xl font-semibold">{s.content.hero.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.content.hero.subtitle}</p>
                  <ul className="mt-5 space-y-1.5 flex-1">
                    {s.content.benefits.slice(0, 4).map((b) => (
                      <li key={b} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t flex items-center justify-between flex-wrap gap-3">
                    <span className="text-sm font-medium">{s.content.priceRange}</span>
                    <Button onClick={() => setOpenService(s)} className="bg-gradient-primary">
                      {s.content.hero.cta} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ========= FUSÃO — DUAS MARCAS, UM TIME ========= */}
        <section id="fusao" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-primary text-primary-foreground mb-3">
                <Link2 className="w-3 h-3 mr-1" /> Duas marcas, um time
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Impulsionando Tecnologia × Impulsionando Brasil
              </h2>
              <p className="mt-3 text-muted-foreground max-w-3xl mx-auto">
                Separamos o que é <strong>produto</strong> do que é <strong>serviço</strong> para você
                entender o que está contratando — e poder usar um, outro ou os dois.{" "}
                <strong className="text-foreground">Quando vêm juntos, o cliente acompanha cada lead virar venda
                dentro do mesmo painel — em tempo real.</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 sm:p-7 border-primary/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-md bg-primary/10 p-2"><Cpu className="h-5 w-5 text-primary" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Produto · SaaS</div>
                    <h3 className="text-xl font-semibold">Impulsionando Tecnologia</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  A plataforma. CRM, agenda, financeiro, vendas, estoque, BI e módulos por nicho rodando no Core multiempresa.
                </p>
                <ul className="space-y-1.5 text-sm">
                  {["Assinatura mensal, sem fidelidade", "Trial de 7 dias", "Módulos por nicho ativáveis", "API e webhooks abertos"].map((b) => (
                    <li key={b} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-5 w-full">
                  <a href="/modulos">Ver o produto <ArrowRight className="ml-2 w-4 h-4" /></a>
                </Button>
              </Card>

              <Card className="p-6 sm:p-7 border-accent/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-md bg-accent/15 p-2"><Megaphone className="h-5 w-5 text-accent" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Serviço · Agência</div>
                    <h3 className="text-xl font-semibold">Impulsionando Brasil</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  A operação. Marketing, mídia, conteúdo, agente virtual, assessoria empresarial 360 — feito por gente, medido com a Tecnologia.
                </p>
                <ul className="space-y-1.5 text-sm">
                  {["Ciclos de 90 dias com ajuste sem custo", "Painel transparente de funil", "Time dedicado por cliente", "Integra direto no Core"].map((b) => (
                    <li key={b} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="#servicos">Ver os serviços <ArrowRight className="ml-2 w-4 h-4" /></a>
                </Button>
              </Card>
            </div>

            {/* Fluxo da fusão */}
            <Card className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
              <div className="text-center mb-6">
                <Badge variant="outline" className="mb-2"><Workflow className="w-3 h-3 mr-1" /> A fusão em prática</Badge>
                <h3 className="text-lg sm:text-xl font-bold">O lead da agência cai direto no CRM da plataforma. Sem planilha. Sem retrabalho.</h3>
              </div>
              <div className="grid sm:grid-cols-5 gap-3 text-center">
                {[
                  { i: Megaphone, t: "Campanha", s: "Brasil cria e veicula" },
                  { i: Target, t: "Lead capturado", s: "Anúncio → landing" },
                  { i: Cpu, t: "CRM Tecnologia", s: "Lead entra no Core" },
                  { i: Headset, t: "Atendimento", s: "WhatsApp + agente" },
                  { i: BarChart3, t: "BI integrado", s: "Custo por venda real" },
                ].map((s, idx) => {
                  const Icon = s.i;
                  return (
                    <div key={s.t} className="relative">
                      <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center mx-auto mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="font-semibold text-sm">{s.t}</div>
                      <div className="text-xs text-muted-foreground">{s.s}</div>
                      {idx < 4 && (
                        <ArrowRight className="hidden sm:block absolute top-3 -right-3 w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>

        {/* ========= POR QUE A IMPULSIONANDO BRASIL ========= */}
        <section className="bg-card/40 border-y border-border py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3">Diferenciais</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Por que a Impulsionando Brasil?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: Layers, t: "Visão Integrada",
                  d: "Não tratamos marketing e gestão como mundos separados. A empresa precisa funcionar como um sistema único — campanha, atendimento, comercial, financeiro e BI conversando.",
                },
                {
                  icon: Users, t: "Time Especializado",
                  d: "Cada frente é conduzida por profissionais especializados em sua área, mas todos trabalham de forma integrada dentro do mesmo painel — sem ruído entre fornecedores.",
                },
                {
                  icon: Settings2, t: "Resultado Previsível",
                  d: "Processos documentados, métricas claras, leitura semanal de funil e acompanhamento constante para garantir evolução em vez de promessa.",
                },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <Card key={b.t} className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold mb-2">{b.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.d}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========= MARCA INPI ========= */}
        <section id="marca-inpi" className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Card className="p-6 sm:p-8 flex flex-col md:flex-row gap-5 items-start md:items-center">
              <div className="rounded-md bg-primary/10 p-3 shrink-0">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">Marca registrada · INPI</Badge>
                <h3 className="text-lg sm:text-xl font-semibold">"Impulsionando" é marca depositada no INPI</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  As marcas <strong>Impulsionando Tecnologia</strong> e <strong>Impulsionando Brasil</strong> foram
                  depositadas no Instituto Nacional da Propriedade Industrial (INPI) nas classes de software e
                  serviços de marketing. Uso comercial sem autorização sujeita o infrator às penalidades da Lei 9.279/96.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Para licenciamento, parceria white-label ou autorização de uso, fale com nosso jurídico em{" "}
                  <a href="mailto:juridico@impulsionando.com.br" className="underline">juridico@impulsionando.com.br</a>.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ========= CTA FINAL ========= */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <Card className="p-8 sm:p-12 text-center bg-gradient-hero text-primary-foreground border-0">
            <Badge className="bg-white/15 text-white border-white/20 mb-4">
              <Sparkles className="w-3 h-3 mr-1" /> Pronto para o próximo passo?
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 max-w-3xl mx-auto">
              Pronto para estruturar sua empresa e escalar com previsibilidade?
            </h2>
            <p className="text-white/85 max-w-2xl mx-auto mb-6">
              Fale com o Impulsionito e entenda qual assessoria — Marketing, Empresarial ou as duas — faz mais
              sentido para o momento do seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto">
              <Button asChild size="lg" className="btn-whatsapp gap-2 flex-1">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com o Impulsionito
                </a>
              </Button>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 flex-1">
                <a href="#servicos">Ver serviços <ArrowRight className="w-4 h-4" /></a>
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <PublicFooter />

      {openService && (
        <LeadFormDialog
          service={openService}
          open={!!openService}
          onClose={() => setOpenService(null)}
        />
      )}
    </div>
  );
}

function LeadFormDialog({
  service, open, onClose,
}: { service: ServicePage; open: boolean; onClose: () => void }) {
  const submit = useServerFn(submitImpulsionandoBrasilLead);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: (payload: typeof form) =>
      submit({
        data: {
          ...payload,
          serviceSlug: service.slug,
          serviceTag: service.content.hero.tag,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Recebemos seu pedido! Em até 1 dia útil entraremos em contato.");
      onClose();
    },
    onError: (e) => toast.error(String((e as Error).message)),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 3) errs.name = "Informe seu nome completo.";
    if (!isValidEmail(form.email)) errs.email = "E-mail inválido.";
    if (form.phone && !isValidPhoneBR(form.phone)) errs.phone = "WhatsApp inválido.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Verifique os campos destacados.");
      return;
    }
    mut.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service.content.hero.cta}</DialogTitle>
          <DialogDescription>{service.name} — respondemos em até 1 dia útil.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          <div>
            <Label htmlFor="n">Nome*</Label>
            <Input id="n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="e">E-mail*</Label>
            <Input id="e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p">WhatsApp</Label>
              <Input id="p" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className={errors.phone ? "border-destructive" : ""} />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="c">Empresa</Label>
              <Input id="c" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="m">Conte um pouco</Label>
            <Textarea id="m" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary" disabled={mut.isPending}>
            {mut.isPending ? "Enviando…" : "Quero falar com a Impulsionando"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
