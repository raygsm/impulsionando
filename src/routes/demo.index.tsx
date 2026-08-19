import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Beer,
  Briefcase,
  Building2,
  Calendar,
  Handshake,
  Layers,
  Megaphone,
  MessageCircle,
  MessageSquare,
  PlayCircle,
  Rocket,
  ShoppingCart,
  Sparkles,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { getDemoNichoLink } from "@/lib/demoResolver";
import { trackFunnelCta } from "@/lib/funnelTracking";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Demonstrações por público, nicho e módulo | Impulsionando" },
      { name: "description", content: "Hub vivo de demonstrações da Impulsionando organizado por público, nicho e módulo, conectado ao catálogo oficial do ecossistema." },
      { property: "og:title", content: "Hub de Demonstrações — Impulsionando" },
      { property: "og:description", content: "Escolha sua jornada e veja o Core aplicado ao seu segmento." },
      { property: "og:url", content: "https://impulsionando.com.br/demo" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo" }],
  }),
  component: DemoLanding,
});

const AUDIENCES = [
  { icon: Building2, badge: "Empresas", title: "Demonstração para empresas", description: "CRM, ERP, atendimento, agenda, vendas, financeiro, automações e BI conectados ao mesmo Core.", to: "/demo/modulos" },
  { icon: Layers, badge: "White Label", title: "Demonstração White Label", description: "Marca própria, clientes próprios, módulos, provisionamento e operação multiempresa.", to: "/demo/white-label" },
  { icon: UserRound, badge: "Consumidor", title: "Área do consumidor", description: "Benefícios, fidelidade, agenda, pedidos, cupons, eventos e relacionamento em uma jornada única.", to: "/demo/cliente-final" },
] as const;

const MODULES = [
  { icon: Calendar, title: "Agenda inteligente", desc: "Agenda, confirmações, encaixes, lembretes e bloqueios.", to: "/demo/agenda", status: "Ativo" },
  { icon: Users, title: "CRM e funil", desc: "Leads, oportunidades, follow-ups, clientes e histórico unificado.", to: "/demo/crm", status: "Ativo" },
  { icon: ShoppingCart, title: "Checkout e pagamentos", desc: "Pix, cartão, links e recuperação conforme integrações homologadas.", to: "/demo/checkout", status: "Ativo" },
  { icon: MessageSquare, title: "Atendimento conversacional", desc: "WhatsApp, templates, atendimento humano e automações.", to: "/demo/whatsapp", status: "Ativo" },
  { icon: Handshake, title: "Afiliados e parceiros", desc: "Links, comissões, indicação, upsell, order bump e relatórios.", to: "/demo/afiliados", status: "Ativo" },
  { icon: Ticket, title: "Eventos e ingressos", desc: "Lotes, QR Code, check-in, jornadas e BI por evento.", to: "/demo/eventos", status: "Ativo" },
  { icon: Briefcase, title: "Operação jurídica", desc: "Processos, prazos, clientes, documentos e financeiro.", to: "/demo/advogados", status: "Beta" },
  { icon: Megaphone, title: "Captação em feira", desc: "Lead express, origem, boas-vindas e entrada automática no CRM.", to: "/demo/feira", status: "Ativo" },
  { icon: Rocket, title: "Parceiros e revenda", desc: "Jornada para integradores, parceiros e canais comerciais.", to: "/demo/parceiros", status: "Ativo" },
  { icon: BarChart3, title: "Simulador de ROI", desc: "Projeções de eficiência para apoiar o diagnóstico comercial.", to: "/demo/simulador", status: "Ativo" },
] as const;

function DemoLanding() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />
      <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <header className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="bg-gradient-primary mb-4">Hub vivo · sem cadastro</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Veja o ecossistema pelo seu contexto</h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">Escolha por público, por nicho ou por módulo. As demonstrações não mantêm tabela de preços própria: condições comerciais são sempre lidas no catálogo oficial do Core.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/apresentacao">Abrir apresentação viva <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/planos">Ver planos oficiais</Link></Button>
          </div>
        </header>

        <section className="mb-14">
          <div className="mb-5 flex items-end justify-between"><div><div className="text-xs font-semibold uppercase tracking-wider text-primary">Por público</div><h2 className="text-2xl font-semibold">Comece pela sua relação com a plataforma</h2></div><span className="text-xs text-muted-foreground">3 jornadas</span></div>
          <div className="grid gap-5 md:grid-cols-3">
            {AUDIENCES.map(({ icon: Icon, badge, title, description, to }) => (
              <Card key={badge} className="p-6 flex flex-col hover:shadow-elegant transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon className="h-5 w-5" /></div>
                <Badge variant="outline" className="self-start mt-4">{badge}</Badge>
                <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground flex-1">{description}</p>
                <Button asChild className="mt-5"><Link to={to}><PlayCircle className="mr-2 h-4 w-4" />Abrir demonstração</Link></Button>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-5 flex items-end justify-between"><div><div className="text-xs font-semibold uppercase tracking-wider text-primary">Macro e micro nichos</div><h2 className="text-2xl font-semibold">Demonstrações adaptadas à realidade do setor</h2></div><span className="text-xs text-muted-foreground">{NICHO_DETAILS.length} segmentos</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NICHO_DETAILS.map((n) => {
              const Icon = n.icon;
              const link = getDemoNichoLink(n.slug);
              return (
                <Card key={n.slug} className="p-5 flex flex-col hover:shadow-elegant transition-shadow">
                  <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0"><Icon className="h-5 w-5" /></div><div><h3 className="font-semibold">{n.shortLabel}</h3><Badge variant="outline" className="mt-1 text-[10px]">Demo disponível</Badge></div></div>
                  <p className="mt-3 text-sm text-muted-foreground flex-1">{n.cardDesc}</p>
                  <Button asChild size="sm" className="mt-4"><Link to={link.to} params={link.params} onClick={() => trackFunnelCta({ cta: "hub-demo-abrir-nicho", origem: "hub-demo", nicho_pedido: n.slug, alias_resolvido: link.slug, isFallback: link.isFallback, rotaDestino: `/demo/nicho/${link.slug}` })}><PlayCircle className="mr-2 h-3.5 w-3.5" />Abrir demo</Link></Button>
                </Card>
              );
            })}
          </div>
          <div className="mt-5 text-center"><Button asChild variant="outline"><Link to="/nichos">Ver arquitetura completa de nichos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
        </section>

        <section className="mb-14">
          <div className="mb-5 flex items-end justify-between"><div><div className="text-xs font-semibold uppercase tracking-wider text-primary">Por recurso</div><h2 className="text-2xl font-semibold">Entre direto no módulo que quer avaliar</h2></div><span className="text-xs text-muted-foreground">{MODULES.length} demos</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ icon: Icon, title, desc, to, status }) => <Card key={to} className="p-5 flex flex-col"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-accent/10 text-accent grid place-items-center"><Icon className="h-5 w-5" /></div><div><h3 className="font-semibold">{title}</h3><Badge variant="outline" className="mt-1 text-[10px]">{status}</Badge></div></div><p className="mt-3 text-sm text-muted-foreground flex-1">{desc}</p><Button asChild size="sm" variant="outline" className="mt-4"><Link to={to}>Abrir módulo</Link></Button></Card>)}
          </div>
        </section>

        <section className="mb-8 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center"><div><Badge variant="outline" className="mb-2"><Beer className="mr-1 h-3 w-3" />Story demo</Badge><h2 className="text-xl font-semibold">Beer House: operação contada de ponta a ponta</h2><p className="mt-2 text-sm text-muted-foreground">Uma narrativa navegável ligando QR Code, pedido, pagamento, CRM, fidelização, estoque e BI.</p></div><Button asChild variant="outline"><Link to="/demo/beer-house">Ler a história</Link></Button></div>
        </section>

        <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center"><div><Badge className="mb-2 bg-gradient-primary"><Sparkles className="mr-1 h-3 w-3" />Próximo passo</Badge><h2 className="text-2xl font-semibold">Uma demonstração, uma apresentação e um catálogo comercial</h2><p className="mt-2 text-sm text-muted-foreground max-w-2xl">A demonstração explica a experiência. A apresentação viva consolida capacidades e evidências. O catálogo oficial define preços e condições. Cada responsabilidade tem uma única fonte da verdade.</p></div><div className="flex flex-col gap-2"><Button asChild><Link to="/planos">Planos oficiais <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button type="button" variant="outline" onClick={() => openImpulsionito("demo-hub-final") }><MessageCircle className="mr-2 h-4 w-4" />Falar com Impulsionito</Button></div></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
