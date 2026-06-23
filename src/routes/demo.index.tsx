import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Layers, UserRound, ArrowRight, PlayCircle, MessageCircle,
  Calendar, Users, ShoppingCart, MessageSquare, Sparkles, Handshake,
  Ticket, Beer, Briefcase, Megaphone, Rocket, BarChart3,
} from "lucide-react";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20solicitar%20uma%20demonstra%C3%A7%C3%A3o%20da%20Impulsionando.";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Demonstrações — Hub central de demos por nicho, módulo e público | Impulsionando" },
      { name: "description", content: "Hub central de demonstrações: empresas, white label, consumidor, demos por nicho (clínicas, restaurantes, eventos, imobiliária...) e por módulo (agenda, CRM, checkout, WhatsApp)." },
      { property: "og:title", content: "Hub de Demonstrações — Impulsionando" },
      { property: "og:description", content: "Escolha por público, nicho ou módulo. Demos navegáveis, sem cadastro." },
      { property: "og:url", content: "https://impulsionando.com.br/demo" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo" }],
  }),
  component: DemoLanding,
});

type AudienceCard = {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  implantationCta?: { label: string; href: string };
  accent?: boolean;
};

const AUDIENCES: AudienceCard[] = [
  {
    icon: Building2,
    badge: "Empresas",
    title: "Demonstração para empresas",
    description: "Plataforma navegável com agenda, CRM, vendas, financeiro, WhatsApp e BI — pronta para operar no seu segmento.",
    cta: "Ver demonstração",
    to: "/demo/modulos",
    implantationCta: { label: "Solicitar implantação", href: WHATSAPP_URL },
  },
  {
    icon: Layers,
    badge: "White Label",
    title: "Demonstração da plataforma White Label",
    description: "Painel master, gestão de clientes, módulos liberados, branding próprio e faturamento — operação de revenda completa.",
    cta: "Ver demonstração",
    to: "/demo/white-label",
    implantationCta: { label: "Solicitar implantação", href: WHATSAPP_URL },
    accent: true,
  },
  {
    icon: UserRound,
    badge: "Consumidor",
    title: "Demonstração da área do consumidor",
    description: "Benefícios, fidelidade, agendas, pedidos, cupons e eventos das empresas participantes — em um só lugar.",
    cta: "Ver demonstração",
    to: "/demo/cliente-final",
  },
];

type ModuleDemo = {
  icon: React.ElementType;
  title: string;
  desc: string;
  to: string;
  status: "Ativo" | "Beta" | "Em breve";
};

const MODULE_DEMOS: ModuleDemo[] = [
  { icon: Calendar, title: "Agenda inteligente", desc: "Encaixe, lembretes, confirmação automática e bloqueios.", to: "/demo/agenda", status: "Ativo" },
  { icon: Users, title: "CRM e funil", desc: "Leads, clientes, follow-ups, oportunidades e histórico unificado.", to: "/demo/crm", status: "Ativo" },
  { icon: ShoppingCart, title: "Checkout e pagamentos", desc: "Pix, cartão, link de pagamento e recuperação automática.", to: "/demo/checkout", status: "Ativo" },
  { icon: MessageSquare, title: "WhatsApp inteligente", desc: "Atendimento, templates, multi-atendente e automações.", to: "/demo/whatsapp", status: "Ativo" },
  { icon: Sparkles, title: "Trial guiado de 14 dias", desc: "Onboarding interativo com missões e dashboards.", to: "/demo/trial", status: "Ativo" },
  { icon: Handshake, title: "Afiliados e parceiros", desc: "Links, cupons, comissões, upsell, bumps e relatórios.", to: "/demo/afiliados", status: "Ativo" },
  { icon: Ticket, title: "Eventos e ingressos", desc: "Lotes, QR code, check-in e BI por evento.", to: "/demo/eventos", status: "Ativo" },
  { icon: Briefcase, title: "Operação para advogados", desc: "Processos, prazos, clientes e financeiro.", to: "/demo/advogados", status: "Beta" },
  { icon: Megaphone, title: "Captura em feira", desc: "Lead express com e-mail automático de boas-vindas.", to: "/demo/feira", status: "Ativo" },
  { icon: Rocket, title: "Parceiros e revenda", desc: "Showroom para integradores e revendedores.", to: "/demo/parceiros", status: "Ativo" },
  { icon: BarChart3, title: "Simulador de ROI", desc: "Projeção de retorno por nicho e ticket médio.", to: "/demo/simulador", status: "Ativo" },
];

const STATUS_VARIANT: Record<ModuleDemo["status"], string> = {
  Ativo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Beta: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Em breve": "bg-muted text-muted-foreground border-border",
};

function DemoLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />

      <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge className="bg-gradient-primary mb-4">Acesso livre · sem cadastro</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Hub central de demonstrações
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Escolha por <strong>público</strong>, por <strong>nicho</strong> ou por <strong>módulo</strong>.
            Cada demo mostra apenas o que importa, sem misturar contextos.
          </p>
        </div>

        {/* 1) Por público */}
        <section className="mb-14">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">1. Por público</h2>
            <span className="text-xs text-muted-foreground">3 jornadas</span>
          </div>
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {AUDIENCES.map(({ icon: Icon, badge, title, description, cta, to, implantationCta, accent }) => (
              <Card
                key={badge}
                className={`p-6 sm:p-7 flex flex-col ${accent ? "ring-1 ring-accent/40 shadow-elegant" : ""}`}
              >
                <div className={`w-12 h-12 rounded-xl ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"} inline-flex items-center justify-center mb-4 shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="self-start mb-3">{badge}</Badge>
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{description}</p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button asChild className={`gap-2 w-full ${accent ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-gradient-primary"}`}>
                    <Link to={to}>
                      <PlayCircle className="w-4 h-4 shrink-0" /> {cta}
                    </Link>
                  </Button>
                  {implantationCta && (
                    <Button asChild variant="outline" size="sm" className="gap-1.5 w-full">
                      <a href={implantationCta.href} target="_blank" rel="noopener noreferrer">
                        {implantationCta.label} <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 2) Por nicho */}
        <section className="mb-14">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">2. Por nicho</h2>
            <span className="text-xs text-muted-foreground">{NICHO_DETAILS.length} segmentos</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NICHO_DETAILS.map((n) => {
              const Icon = n.icon;
              return (
                <Card key={n.slug} className="p-5 flex flex-col hover:shadow-elegant transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-tight">{n.shortLabel}</h3>
                      <Badge variant="outline" className={`mt-1 text-[10px] ${STATUS_VARIANT.Ativo}`}>
                        Demo ativa
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{n.cardDesc}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button asChild size="sm" className="bg-gradient-primary gap-1.5 w-full">
                      <Link to="/demo/nicho/$slug" params={{ slug: n.slug }}>
                        <PlayCircle className="w-3.5 h-3.5" /> Abrir demo do nicho
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 w-full">
                      <Link to="/nichos/$slug" params={{ slug: n.slug }}>
                        Saber mais <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 3) Por módulo / recurso */}
        <section className="mb-14">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">3. Por módulo</h2>
            <span className="text-xs text-muted-foreground">{MODULE_DEMOS.length} demos</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULE_DEMOS.map(({ icon: Icon, title, desc, to, status }) => (
              <Card key={to} className="p-5 flex flex-col hover:shadow-elegant transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent inline-flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base leading-tight">{title}</h3>
                    <Badge variant="outline" className={`mt-1 text-[10px] ${STATUS_VARIANT[status]}`}>
                      {status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
                <Button asChild size="sm" variant="outline" className="mt-4 gap-1.5 w-full">
                  <Link to={to}>
                    <PlayCircle className="w-3.5 h-3.5" /> Abrir demo
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Beer house */}
        <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-primary/5 p-6 sm:p-8 mb-6">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <Badge variant="outline" className="mb-2 gap-1"><Beer className="w-3 h-3" /> Demo em forma de história</Badge>
              <h3 className="font-semibold text-lg tracking-tight">Beer House: uma sexta-feira, do QR Code ao dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                6 capítulos curtos mostram a operação real de uma cervejaria fictícia —
                pedido, pagamento, notificação multi-canal e BI conversando entre si.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/demo/beer-house"><PlayCircle className="w-4 h-4" /> Ler a história</Link>
            </Button>
          </div>
        </div>

        {/* Feira */}
        <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:p-8 mb-6">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <Badge className="bg-gradient-primary mb-2">
                <PlayCircle className="w-3 h-3 mr-1" /> Modo Feira
              </Badge>
              <h3 className="font-semibold text-lg tracking-tight">Está em uma feira ou reunião agora?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Acesso imediato à demonstração no seu nicho com captura rápida (nome + WhatsApp + e-mail)
                e disparo automático de e-mail de boas-vindas.
              </p>
            </div>
            <Button asChild size="lg" className="bg-gradient-primary gap-2">
              <Link to="/demo/feira"><PlayCircle className="w-4 h-4" /> Abrir demo de feira</Link>
            </Button>
          </div>
        </div>

        {/* Planos — etapa final da demonstração */}
        <section className="mb-6 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 sm:p-8">
          <div className="text-center mb-6">
            <Badge className="bg-gradient-primary mb-3 gap-1"><Sparkles className="w-3 h-3" /> Pronto para contratar</Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Escolha o plano ideal</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
              Todas as soluções demonstradas estão disponíveis nos planos abaixo — para empresas, white label e consumidor final (Clube).
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { code: "essencial-mensal", name: "Essencial", price: "R$ 759", desc: "Até 3 módulos. Ideal para começar.", cta: "Contratar", featured: false },
              { code: "completo-mensal", name: "Completo", price: "R$ 1.518", desc: "Até 6 módulos. Operação completa.", cta: "Contratar", featured: true },
              { code: "full", name: "Full", price: "Sob consulta", desc: "Todos os módulos liberados.", cta: "Falar com vendas", featured: false },
              { code: "sob-medida", name: "Sob Medida", price: "Sob proposta", desc: "Multi-unidade, white label, integrações.", cta: "Solicitar proposta", featured: false },
              { code: "clube_premium", name: "Clube Premium", price: "R$ 9,99/mês", desc: "Consumidor final — benefícios em toda a rede.", cta: "Assinar Clube", featured: false },
            ].map((p) => (
              <Card key={p.code} className={`p-5 flex flex-col ${p.featured ? "border-2 border-primary shadow-elegant" : ""}`}>
                {p.featured && <Badge className="self-start mb-2 bg-gradient-primary text-[10px]">Mais escolhido</Badge>}
                <h3 className="font-semibold text-base">{p.name}</h3>
                <div className="text-2xl font-bold mt-1">{p.price}</div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex-1">{p.desc}</p>
                <Button asChild size="sm" variant={p.featured ? "default" : "outline"} className="mt-4">
                  <Link to="/planos" search={{ plano: p.code } as never}>{p.cta} <ArrowRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button asChild size="lg" className="bg-gradient-primary gap-2">
              <Link to="/planos"><BarChart3 className="w-4 h-4" /> Ver comparativo completo dos planos</Link>
            </Button>
          </div>
        </section>

        {/* Especialista */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 sm:p-8">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <h3 className="font-semibold text-lg tracking-tight">Prefere falar com alguém antes?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Um especialista monta uma apresentação direcionada ao seu cenário e responde dúvidas
                de implantação, integrações e planos.
              </p>
            </div>
            <Button asChild size="lg" className="btn-whatsapp gap-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Falar com especialista
              </a>
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
