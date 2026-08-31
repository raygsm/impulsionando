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

const CORE_BASELINE = [
  "Área do cliente e Dashboard",
  "Impulsionito e CRM base",
  "Usuários, perfis e permissões",
  "Financeiro básico e relatórios",
  "WhatsApp, e-mail, API e webhooks",
  "LGPD, auditoria e segurança",
] as const;

const PLANS = [
  {
    name: "Essencial",
    price: "R$ 810,50",
    subtitle: "0,5 salário mínimo",
    code: "ESSENCIAL",
    highlights: ["Core Base completo incluído", "Área do cliente + Dashboard incluídos", "Até 3 módulos homologados do nicho"],
  },
  {
    name: "Ideal",
    price: "R$ 1.621,00",
    subtitle: "1 salário mínimo",
    code: "PRO",
    highlights: ["Core Base completo incluído", "Área do cliente + Dashboard incluídos", "Mais módulos, jornadas e integrações"],
  },
  {
    name: "Full",
    price: "R$ 3.242,00",
    subtitle: "2 salários mínimos",
    code: "ENTERPRISE",
    highlights: ["Core Base completo incluído", "Todos os módulos aplicáveis do nicho", "BI, automação e visão executiva avançada"],
  },
] as const;

const ECOSYSTEM = [
  [LayoutDashboard, "ERP e gestão", "Financeiro, fornecedores, pedidos, documentos, custos e indicadores em um só lugar."],
  [BarChart3, "CRM e Growth", "Captação, oportunidades, funil, conversão, retenção, LTV e inteligência comercial."],
  [Workflow, "Jornadas e automações", "Réguas, onboarding, cobrança, relacionamento e rotinas conectadas ao Core."],
  [ShieldCheck, "Governança e segurança", "Permissões granulares, auditoria, isolamento de dados e operação controlada."],
] as const;

const JOURNEYS = [
  ["Captar", "Transforme tráfego, indicação, eventos, campanhas, WhatsApp e formulários em leads identificados."],
  ["Converter", "CRM, propostas, agenda, checkout e follow-up trabalham juntos para reduzir perda de oportunidades."],
  ["Operar", "Pedidos, serviços, agenda, financeiro, estoque, documentos e tarefas ficam conectados no mesmo Core."],
  ["Relacionar", "Pós-venda, pesquisas, lembretes, reativação, suporte e retenção entram em jornadas contínuas."],
] as const;

const NICHES = [
  "Saúde e clínicas",
  "Bares e restaurantes",
  "Eventos e entretenimento",
  "Imobiliárias",
  "Serviços profissionais",
  "Educação",
  "Fornecedores e B2B",
  "Varejo e operações híbridas",
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
                <p className="mt-6 max-w-3xl text-lg text-white/85">CRM, ERP, atendimento, automações, financeiro, agenda, dashboards, jornadas e inteligência conectados no mesmo Core. A plataforma entende o nicho e adapta a operação sem criar ilhas.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90"><Link to="/planos">Conhecer os planos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  <Button size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => openImpulsionito("home-hero")}><MessageCircle className="mr-2 h-4 w-4" /> Falar com o Impulsionito</Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Área do cliente em todos os planos</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Dashboard incluído</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Evolução sem trocar de plataforma</span>
                </div>
              </div>

              <Card className="border-white/15 bg-white/10 p-6 text-white backdrop-blur">
                <Bot className="h-9 w-9" />
                <h2 className="mt-4 text-2xl font-semibold">Impulsionito</h2>
                <p className="mt-2 text-white/80">O cérebro operacional do ecossistema. Ele entende contexto, nicho, etapa da jornada e permissões para orientar pessoas e processos.</p>
                <div className="mt-5 space-y-2 text-sm text-white/80">
                  <div>• Guia comercial para leads e empresas</div>
                  <div>• Apoio contínuo para usuários e equipes</div>
                  <div>• Diagnóstico de jornada, gargalos e oportunidades</div>
                  <div>• Conexão com os módulos e dados autorizados do Core</div>
                </div>
                <Button className="mt-6 w-full bg-white text-primary hover:bg-white/90" onClick={() => openImpulsionito("home-impulsionito-card")}>Abrir Impulsionito agora</Button>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Core Impulsionando</div>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">O básico não é módulo extra. É plataforma.</h2>
            <p className="mt-3 text-muted-foreground">Área do cliente, login, Dashboard, perfis, permissões, CRM base, comunicação e segurança fazem parte do Core Base. O que varia entre os planos são profundidade, módulos especializados, integrações e automações.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_BASELINE.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm font-medium"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{item}</div>)}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="max-w-3xl"><div className="text-xs font-semibold uppercase tracking-wider text-primary">Jornadas</div><h2 className="mt-2 text-3xl font-bold">Do primeiro contato à retenção, sem quebra de contexto.</h2><p className="mt-3 text-muted-foreground">O Impulsionito e o Core conectam as etapas em vez de tratar cada ferramenta como um sistema separado.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{JOURNEYS.map(([title, text], index) => <Card key={title} className="p-5"><div className="text-xs font-semibold text-primary">0{index + 1}</div><h3 className="mt-2 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></Card>)}</div>
            <div className="mt-12 max-w-3xl"><div className="text-xs font-semibold uppercase tracking-wider text-primary">Nichos</div><h2 className="mt-2 text-3xl font-bold">Um Core, operações diferentes.</h2><p className="mt-3 text-muted-foreground">A estrutura é universal; regras, módulos, linguagem, indicadores e jornadas são especializados conforme o negócio.</p></div>
            <div className="mt-6 flex flex-wrap gap-2">{NICHES.map((niche) => <Badge key={niche} variant="secondary" className="px-3 py-2 text-sm">{niche}</Badge>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><div className="text-xs font-semibold uppercase tracking-wider text-primary">Planos oficiais 2026</div><h2 className="mt-2 text-3xl font-bold">Preço transparente, indexado ao salário mínimo vigente.</h2><p className="mt-2 max-w-3xl text-muted-foreground">Setup inicial no mesmo valor do plano. Vencimento recorrente no dia 5. Área do cliente, login e Dashboard não são vendidos separadamente: fazem parte de todos os planos.</p></div>
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
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6 sm:p-8">
                <Badge variant="secondary"><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Vitrine inicial</Badge>
                <h2 className="mt-4 text-2xl font-bold">Casos reais para demonstrar o ecossistema.</h2>
                <p className="mt-2 text-muted-foreground">Operações distintas mostram como o mesmo Core se adapta a contextos diferentes.</p>
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
                  <div className="rounded-lg border p-4"><CircleDollarSign className="h-5 w-5 text-primary" /><div className="mt-2 font-semibold">ERP financeiro</div><div className="mt-1 text-xs text-muted-foreground">Custos, receitas, projeções e governança.</div></div>
                  <div className="rounded-lg border p-4"><Building2 className="h-5 w-5 text-primary" /><div className="mt-2 font-semibold">Visão multiempresa</div><div className="mt-1 text-xs text-muted-foreground">Clientes, contratos, jornadas e operação em tempo real.</div></div>
                </div>
                <Button asChild variant="outline" className="mt-5"><Link to="/auth" search={{ persona: "admin", mode: "signin" }}>Entrar na Gestão</Link></Button>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <Rocket className="mx-auto h-10 w-10" />
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Comece pela conversa certa.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/80">Diga ao Impulsionito o que sua empresa precisa. Ele entende o contexto, identifica o nicho, organiza a jornada e leva você ao próximo passo.</p>
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
