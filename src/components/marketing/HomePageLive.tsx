import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  LayoutDashboard,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

const PLANS = [
  {
    name: "Essencial",
    price: "R$ 810,50",
    subtitle: "0,5 salário mínimo",
    code: "ESSENCIAL",
    highlights: ["Core + Impulsionito", "Até 3 módulos homologados", "CRM e operação integrada"],
  },
  {
    name: "Ideal",
    price: "R$ 1.621,00",
    subtitle: "1 salário mínimo",
    code: "PRO",
    highlights: ["Mais integrações", "Jornadas e automações", "Evolução para até 6 módulos conforme homologação"],
  },
  {
    name: "Full",
    price: "R$ 3.242,00",
    subtitle: "2 salários mínimos",
    code: "ENTERPRISE",
    highlights: ["Ecossistema completo aplicável", "BI e automação avançada", "Operação multiárea e visão executiva"],
  },
] as const;

const ECOSYSTEM = [
  [LayoutDashboard, "ERP e gestão", "Financeiro, fornecedores, pedidos, documentos, custos e indicadores em um só lugar."],
  [BarChart3, "CRM e Growth", "Captação, oportunidades, funil, conversão, retenção, LTV e inteligência comercial."],
  [Workflow, "Jornadas e automações", "Réguas, onboarding, cobrança, relacionamento e rotinas conectadas ao Core."],
  [ShieldCheck, "Governança e segurança", "Permissões granulares, auditoria, isolamento de dados e operação controlada."],
] as const;

function openImpulsionito(origin: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin } }));
}

export function HomePageLive() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <Badge className="border-white/20 bg-white/10 text-white"><Sparkles className="mr-1 h-3.5 w-3.5" /> Impulsionando Tecnologia</Badge>
            <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
              <div>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">Um ecossistema para vender, operar e crescer — com o Impulsionito no centro de tudo.</h1>
                <p className="mt-6 max-w-3xl text-lg text-white/85">CRM, ERP, atendimento, automações, financeiro, agenda, dashboards, jornadas e inteligência conectados no mesmo Core. O Impulsionito guia leads, empresas, assinantes, parceiros, candidatos e equipes em cada etapa.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90"><Link to="/planos">Conhecer os planos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  <Button size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => openImpulsionito("home-hero")}><MessageCircle className="mr-2 h-4 w-4" /> Falar com o Impulsionito</Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Contratação direta</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Onboarding guiado</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Evolução sem trocar de plataforma</span>
                </div>
              </div>

              <Card className="border-white/15 bg-white/10 p-6 text-white backdrop-blur">
                <Bot className="h-9 w-9" />
                <h2 className="mt-4 text-2xl font-semibold">Impulsionito</h2>
                <p className="mt-2 text-white/80">Mais que um chatbot: o concierge do ecossistema. Ele entende contexto, direciona jornadas, responde dúvidas e conecta cada pessoa ao recurso certo.</p>
                <div className="mt-5 space-y-2 text-sm text-white/80">
                  <div>• Guia comercial para leads e empresas</div>
                  <div>• Apoio contínuo para usuários e equipes</div>
                  <div>• Orientação para Clube, parceiros e candidatos</div>
                  <div>• Acesso pelo chat do próprio front Impulsionando</div>
                </div>
                <Button className="mt-6 w-full bg-white text-primary hover:bg-white/90" onClick={() => openImpulsionito("home-impulsionito-card")}>Abrir Impulsionito agora</Button>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Core Impulsionando</div>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Front simples. Back-end completo.</h2>
            <p className="mt-3 text-muted-foreground">Tudo que aparece na experiência comercial precisa existir com consistência na operação. Por isso o Core conecta os módulos em vez de criar ilhas.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ECOSYSTEM.map(([Icon, title, text]) => (
              <Card key={title} className="p-5">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div><div className="text-xs font-semibold uppercase tracking-wider text-primary">Planos oficiais 2026</div><h2 className="mt-2 text-3xl font-bold">Preço transparente, indexado ao salário mínimo vigente.</h2><p className="mt-2 max-w-2xl text-muted-foreground">Setup inicial no mesmo valor do plano. Vencimento recorrente no dia 5. Mudanças de plano seguem cálculo proporcional.</p></div>
              <Button asChild variant="outline"><Link to="/planos">Ver condições completas</Link></Button>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <Card key={plan.code} className={plan.code === "PRO" ? "relative border-primary p-6 shadow-lg" : "p-6"}>
                  {plan.code === "PRO" ? <Badge className="mb-3">Mais equilibrado</Badge> : null}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="mt-4"><span className="text-3xl font-bold">{plan.price}</span><span className="text-muted-foreground"> / mês</span></div>
                  <div className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</div>
                  <div className="mt-5 space-y-2">{plan.highlights.map((item) => <div key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span></div>)}</div>
                  <Button asChild size="lg" className="mt-6 w-full"><Link to="/auth" search={{ persona: "empresa", mode: "signup", next: `/onboarding/empresa?plano=${plan.code}` }}>Contratar {plan.name} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <Badge variant="secondary"><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Vitrine inicial</Badge>
              <h2 className="mt-4 text-2xl font-bold">Casos reais para demonstrar o ecossistema.</h2>
              <p className="mt-2 text-muted-foreground">A vitrine mínima inicial foi construída com três operações que mostram contextos diferentes do Core.</p>
              <div className="mt-5 space-y-3 text-sm">
                <a className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50" href="https://chrismed.impulsionando.com.br" target="_blank" rel="noreferrer"><span>CHRISMED</span><ArrowRight className="h-4 w-4" /></a>
                <a className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50" href="https://colorssaude.impulsionando.com.br" target="_blank" rel="noreferrer"><span>Colors Saúde</span><ArrowRight className="h-4 w-4" /></a>
                <a className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50" href="https://wmp.impulsionando.com.br" target="_blank" rel="noreferrer"><span>WMP — Wagner Miller Produções</span><ArrowRight className="h-4 w-4" /></a>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <Badge variant="secondary"><LayoutDashboard className="mr-1 h-3.5 w-3.5" /> Gestão</Badge>
              <h2 className="mt-4 text-2xl font-bold">Dashboard executivo e ERP no mesmo ecossistema.</h2>
              <p className="mt-2 text-muted-foreground">Gestão financeira, carteira de clientes, billing, CRM, fornecedores, custos recorrentes, automações e indicadores conectados ao Core.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4"><CircleDollarSign className="h-5 w-5 text-primary" /><div className="mt-2 font-semibold">ERP financeiro</div><div className="mt-1 text-xs text-muted-foreground">Custos e projeções com evidência e classificação.</div></div>
                <div className="rounded-lg border p-4"><Building2 className="h-5 w-5 text-primary" /><div className="mt-2 font-semibold">Visão multiempresa</div><div className="mt-1 text-xs text-muted-foreground">Clientes, contratos, jornadas e operação.</div></div>
              </div>
              <Button asChild variant="outline" className="mt-5"><Link to="/auth">Entrar no Core</Link></Button>
            </Card>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <Rocket className="mx-auto h-10 w-10" />
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Comece pela conversa certa.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/80">Diga ao Impulsionito o que sua empresa precisa. Ele ajuda a entender o cenário, indicar o caminho e levar você para o próximo passo do ecossistema.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => openImpulsionito("home-final")}>Falar com o Impulsionito</Button>
              <Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><a href="https://wa.me/5521993075000" target="_blank" rel="noreferrer">WhatsApp (21) 99307-5000</a></Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
